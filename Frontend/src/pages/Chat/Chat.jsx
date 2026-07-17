import { useEffect, useState, useRef } from "react";
import { useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useSocket } from "../../context/SocketContext";
import { api } from "../../services/api";
import { useToast } from "../../hooks/useToast";
import { Send, Smile, Circle, ArrowLeft, Check, CheckCheck, MessageSquare, Clock } from "lucide-react";

export default function Chat() {
  const { user } = useAuth();
  const { socket, onlineUsers } = useSocket();
  const location = useLocation();
  const showToast = useToast();

  // Conversations & Messages states
  const [conversations, setConversations] = useState([]);
  const [activeContact, setActiveContact] = useState(null); // Contact object
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [hasMoreMessages, setHasMoreMessages] = useState(true);

  // Typing status
  const [isTyping, setIsTyping] = useState(false);
  const [otherUserTyping, setOtherUserTyping] = useState(false);
  const [sending, setSending] = useState(false);
  
  // Ref for scroll behavior
  const messagesEndRef = useRef(null);
  const activeContactRef = useRef(null);
  const pollRef = useRef(null);
  const lastMessageIdRef = useRef(null);

  useEffect(() => {
    activeContactRef.current = activeContact;
  }, [activeContact]);

  // Fetch Conversations summary list
  function fetchConversations(selectContactId = null) {
    api.get("/api/v1/chat/conversations")
      .then((res) => {
        if (res.data?.success && Array.isArray(res.data.data)) {
          const list = res.data.data;
          setConversations(list);

          // Auto-select if requested
          const toSelectId = selectContactId || location.state?.startChatWith || location.state?.contactId;
          if (toSelectId) {
            const found = list.find((c) => String(c.contact?._id) === String(toSelectId));
            if (found) {
              setActiveContact(found.contact);
            } else if (location.state?.ownerName) {
              setActiveContact({
                _id: toSelectId,
                name: location.state.ownerName,
                profileImage: location.state.ownerImage || "",
                role: location.state.ownerRole || "owner",
              });
            } else {
              // If not in conversations summary, fetch user profile to start chat
              api.get(`/api/v1/user/${toSelectId}`)
                .then((profileRes) => {
                  if (profileRes.data?.success) {
                    setActiveContact(profileRes.data.data);
                  }
                })
                .catch(() => null);
            }
          }
        }
      })
      .catch((err) => {
        console.error("Failed to fetch conversations:", err);
      });
  }

  // Auto scroll messages to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (messages.length > 0 && !loadingHistory) {
      scrollToBottom();
    }
  }, [messages, otherUserTyping]);

  // Socket listeners
  useEffect(() => {
    if (!socket) return undefined;

    const handleReceiveMessage = (message) => {
      // Append if message sender is the active contact
      if (activeContactRef.current && String(message.sender) === String(activeContactRef.current._id)) {
        setMessages((prev) => [...prev, message]);
        // Emit seen status immediately
        socket.emit("messageSeen", {
          messageId: message._id,
          senderId: message.sender,
          receiverId: user._id
        });
      } else {
        // Increment unread count or reload conversations list
        window.dispatchEvent(new Event("rentconnect:message-notification"));
        fetchConversations();
      }
    };

    const handleTypingStatus = ({ senderId, isTyping: otherTyping }) => {
      if (activeContactRef.current && String(senderId) === String(activeContactRef.current._id)) {
        setOtherUserTyping(otherTyping);
      }
    };

    const handleMessageSeenUpdate = ({ messageId }) => {
      setMessages((prev) => 
        prev.map(msg => msg._id === messageId ? { ...msg, seen: true } : msg)
      );
    };

    socket.on("receiveMessage", handleReceiveMessage);
    socket.on("typingStatus", handleTypingStatus);
    socket.on("messageSeenUpdate", handleMessageSeenUpdate);

    return () => {
      socket.off("receiveMessage", handleReceiveMessage);
      socket.off("typingStatus", handleTypingStatus);
      socket.off("messageSeenUpdate", handleMessageSeenUpdate);
    };
  }, [socket, user?._id]);

  useEffect(() => {
    fetchConversations();
  }, [location.state]);

  // Fetch chat history between users with cursor pagination
  const fetchChatHistory = (beforeId = null) => {
    if (!activeContact) return;
    if (!beforeId) {
      setLoadingHistory(true);
      setOtherUserTyping(false);
    }

    let url = `/api/v1/chat/history/${activeContact._id}?limit=50`;
    if (beforeId) {
      url += `&before=${beforeId}`;
    }

    api.get(url)
      .then((res) => {
        if (res.data?.success && Array.isArray(res.data.data)) {
          const fetched = res.data.data;
          if (beforeId) {
            setMessages((prev) => [...fetched, ...prev]);
            setHasMoreMessages(fetched.length === 50);
          } else {
            setMessages(fetched);
            setHasMoreMessages(fetched.length === 50);
            setTimeout(scrollToBottom, 50);
          }
        }
        if (!beforeId) setLoadingHistory(false);
        // Reload conversations to update unread badge
        api.get("/api/v1/chat/conversations")
          .then(convRes => {
            if (convRes.data?.success && Array.isArray(convRes.data.data)) {
              setConversations(convRes.data.data);
            }
          })
          .catch(err => console.error(err));
      })
      .catch((err) => {
        console.error(err);
        if (!beforeId) setLoadingHistory(false);
        showToast("Failed to fetch chat history.", "error");
      });
  };

  useEffect(() => {
    fetchChatHistory();
  }, [activeContact]);

  // Poll for new messages when socket is not available (Vercel serverless)
  useEffect(() => {
    if (!activeContact) {
      if (pollRef.current) clearInterval(pollRef.current);
      return;
    }
    if (socket?.connected) return; // Socket handles updates, no need to poll

    // Poll every 3 seconds for new messages
    pollRef.current = setInterval(() => {
      api.get(`/api/v1/chat/history/${activeContact._id}?limit=50`)
        .then((res) => {
          if (res.data?.success && Array.isArray(res.data.data)) {
            const fetched = res.data.data;
            setMessages((prev) => {
              // Only update if there are actually new messages
              if (fetched.length !== prev.length) {
                setTimeout(scrollToBottom, 50);
                return fetched;
              }
              return prev;
            });
          }
        })
        .catch(() => {});
    }, 3000);

    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [activeContact, socket]);

  useEffect(() => {
    window.dispatchEvent(new Event("rentconnect:messages-read"));
  }, [activeContact, messages.length]);

  // Send message — REST API primary (works on Vercel), socket as enhancement
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!text.trim() || !activeContact || sending) return;

    const messageText = text.trim();
    setText("");
    setSending(true);

    // Optimistic update — show message immediately in UI
    const optimisticMsg = {
      _id: `temp-${Date.now()}`,
      sender: user._id,
      receiver: activeContact._id,
      text: messageText,
      seen: false,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimisticMsg]);
    setTimeout(scrollToBottom, 50);

    try {
      // Always use REST API to persist the message
      const res = await api.post("/api/v1/chat/send", {
        receiverId: activeContact._id,
        text: messageText,
      });

      if (res.data?.success) {
        const savedMsg = res.data.data;
        // Replace optimistic message with real one from server
        setMessages((prev) =>
          prev.map((m) => (m._id === optimisticMsg._id ? savedMsg : m))
        );
        fetchConversations();

        // If socket is connected, also emit for real-time delivery to receiver
        if (socket?.connected) {
          socket.emit("sendMessage", {
            receiverId: activeContact._id,
            text: messageText,
          });
          socket.emit("typing", { receiverId: activeContact._id, isTyping: false });
          setIsTyping(false);
        }
      }
    } catch (err) {
      // Remove optimistic message on failure
      setMessages((prev) => prev.filter((m) => m._id !== optimisticMsg._id));
      setText(messageText); // Restore text
      showToast("Failed to send message. Please try again.", "error");
    } finally {
      setSending(false);
    }
  };

  // Handle local socket confirmation that message was sent
  useEffect(() => {
    if (!socket) return;

    const handleSentConfirmation = (message) => {
      if (
        activeContactRef.current &&
        (String(message.receiver) === String(activeContactRef.current._id) ||
          String(message.sender) === String(activeContactRef.current._id))
      ) {
        setMessages((prev) => [...prev, message]);
      }
      fetchConversations();
    };

    socket.on("messageSent", handleSentConfirmation);

    return () => {
      socket.off("messageSent", handleSentConfirmation);
    };
  }, [socket, activeContact]);

  // Emit typing indicator (only when socket connected)
  const handleInputChange = (e) => {
    setText(e.target.value);

    if (!socket?.connected || !activeContact) return;

    if (!isTyping && e.target.value.length > 0) {
      setIsTyping(true);
      socket.emit("typing", { receiverId: activeContact._id, isTyping: true });
    } else if (isTyping && e.target.value.length === 0) {
      setIsTyping(false);
      socket.emit("typing", { receiverId: activeContact._id, isTyping: false });
    }
  };

  const loadMoreMessages = () => {
    if (messages.length > 0) {
      const oldestId = messages[0]._id;
      fetchChatHistory(oldestId);
    }
  };

  // Only show online status when socket is actually connected
  const socketConnected = socket?.connected;
  const isOnline = socketConnected && activeContact ? onlineUsers.includes(String(activeContact._id)) : false;
  const activeContactId = activeContact?._id ? String(activeContact._id) : "";

  return (
    <div className="page" style={{ height: "calc(100vh - 160px)" }}>
      <div className="chat-container">
        {/* Sidebar Conversations */}
        <div className={`chat-sidebar ${activeContact ? 'mobile-hide' : 'mobile-show'}`}>
          <div className="chat-sidebar-header">
            <h3 style={{ fontSize: "1.1rem", fontWeight: "800" }}>Messages</h3>
          </div>
          <div className="conversations-list">
            {conversations.length > 0 ? (
              conversations.map((conv) => {
                const contactId = String(conv.contact._id);
                const isSelected = activeContactId === contactId;
                const contactOnline = onlineUsers.includes(contactId);
                const avatar = conv.contact.profileImage || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(conv.contact.name)}`;

                return (
                  <div 
                    key={conv.contact._id} 
                    onClick={() => setActiveContact(conv.contact)}
                    className={`conversation-item ${isSelected ? 'active' : ''}`}
                  >
                    <div style={{ position: "relative" }}>
                      <img 
                        src={avatar} 
                        alt={conv.contact.name} 
                        className="avatar" 
                        style={{ width: "38px", height: "38px" }} 
                        loading="lazy"
                        onError={(e) => { e.target.src = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(conv.contact.name)}` }}
                      />
                      {contactOnline && (
                        <Circle size={10} fill="var(--success)" style={{ position: "absolute", bottom: 0, right: 0, color: "var(--success)" }} />
                      )}
                    </div>
                    <div className="conversation-item-info">
                      <div className="conversation-item-name">
                        <span style={{ fontSize: "0.9rem" }}>{conv.contact.name}</span>
                        <span style={{ fontSize: "0.7rem", color: "var(--muted)", fontWeight: "normal" }}>
                          {conv.lastMessageTime ? new Date(conv.lastMessageTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ""}
                        </span>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span className="conversation-item-last">{conv.lastMessage}</span>
                        {conv.unreadCount > 0 && (
                          <div className="unread-badge" style={{ background: "var(--accent-2)", color: "white", borderRadius: "50%", minWidth: "18px", height: "18px", fontSize: "0.65rem", display: "grid", placeItems: "center", fontWeight: "700" }}>
                            {conv.unreadCount}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div style={{ textAlign: "center", padding: "64px 16px" }}>
                <MessageSquare size={36} style={{ color: "var(--muted)", margin: "0 auto 12px" }} />
                <p style={{ color: "var(--muted)", fontSize: "0.85rem" }}>
                  No messages yet. Find a property and contact the owner to get started.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Message Window */}
        <div className={`chat-window ${!activeContact ? 'mobile-hide' : ''}`}>
          {activeContact ? (
            <>
              {/* Header */}
              <div className="chat-window-header">
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <button onClick={() => setActiveContact(null)} className="btn btn-secondary btn-icon mobile-show" style={{ border: "none", background: "transparent", width: "32px", height: "32px" }}>
                    <ArrowLeft size={18} />
                  </button>
                  <img 
                    src={activeContact.profileImage || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(activeContact.name)}`} 
                    alt={activeContact.name} 
                    className="avatar" 
                    style={{ width: "36px", height: "36px" }}
                    loading="lazy"
                    onError={(e) => { e.target.src = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(activeContact.name)}` }}
                  />
                  <div>
                    <strong style={{ fontSize: "0.95rem", display: "block" }}>{activeContact.name}</strong>
                    <span style={{ fontSize: "0.75rem", color: isOnline ? 'var(--success)' : 'var(--muted)', display: "flex", alignItems: "center", gap: "4px" }}>
                      <Circle size={6} fill={isOnline ? 'var(--success)' : 'var(--muted)'} />
                      <span>{isOnline ? "Online" : "Offline"}</span>
                    </span>
                  </div>
                </div>
              </div>

              {/* Chat Thread */}
              <div className="chat-messages" style={{ display: "flex", flexDirection: "column" }}>
                {loadingHistory ? (
                  <div style={{ display: "grid", placeItems: "center", height: "100%" }}>
                    <div className="spinner" style={{ fontSize: "0.85rem" }}>Fetching chat thread...</div>
                  </div>
                ) : (
                  <>
                    {hasMoreMessages && messages.length >= 50 && (
                      <button 
                        onClick={loadMoreMessages} 
                        className="btn btn-secondary" 
                        style={{ margin: "10px auto", fontSize: "0.75rem", minHeight: "32px", padding: "4px 12px" }}
                      >
                        <Clock size={12} />
                        <span>Load previous messages</span>
                      </button>
                    )}

                    {messages.length > 0 ? (
                      messages.map((msg) => {
                        const isSent = String(msg.sender) === String(user._id);
                        return (
                          <div 
                            key={msg._id} 
                            className={`message-bubble ${isSent ? 'sent' : 'received'}`}
                          >
                            <p>{msg.text}</p>
                            <span className="message-meta">
                              {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              {isSent && (
                                <span style={{ marginLeft: "4px" }}>
                                  {msg.seen ? <CheckCheck size={12} style={{ display: "inline" }} /> : <Check size={12} style={{ display: "inline" }} />}
                                </span>
                              )}
                            </span>
                          </div>
                        );
                      })
                    ) : (
                      <div style={{ margin: "auto", textAlign: "center", color: "var(--muted)", fontSize: "0.85rem" }}>
                        Send a message to start conversation with the owner.
                      </div>
                    )}
                    
                    {/* Other User Typing Status */}
                    {otherUserTyping && (
                      <div className="message-bubble received" style={{ opacity: 0.8, padding: "8px 12px" }}>
                        <span style={{ fontSize: "0.8rem", color: "var(--muted)" }}>Typing message...</span>
                      </div>
                    )}
                    
                    <div ref={messagesEndRef} />
                  </>
                )}
              </div>

              {/* Chat Input */}
              <form onSubmit={handleSendMessage} className="chat-input-area">
                <div className="chat-input-wrapper">
                  <input
                    type="text"
                    placeholder="Type your message..."
                    value={text}
                    onChange={handleInputChange}
                    disabled={sending}
                  />
                </div>
                <button
                  type="submit"
                  className="btn btn-primary btn-icon"
                  style={{ borderRadius: "10px", minHeight: "44px", opacity: sending ? 0.6 : 1 }}
                  disabled={sending || !text.trim()}
                >
                  <Send size={16} />
                </button>
              </form>
            </>
          ) : (
            <div style={{ display: "grid", placeItems: "center", height: "100%", color: "var(--muted)", fontSize: "0.95rem" }}>
              Select a conversation to start messaging.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
