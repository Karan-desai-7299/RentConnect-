import { createContext, useContext, useEffect, useState } from "react";
import { io } from "socket.io-client";
import { useAuth } from "./AuthContext";

const SocketContext = createContext(null);

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

export function SocketProvider({ children }) {
  const { user } = useAuth();
  const [socket, setSocket] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState([]);

  useEffect(() => {
    if (!user?._id) {
      if (socket) {
        socket.disconnect();
        setSocket(null);
      }
      return undefined;
    }

    const token = localStorage.getItem("rentconnect_token");
    const socketInstance = io(API_BASE, {
      withCredentials: true,
      transports: ["websocket"],
      auth: { token },
    });

    setSocket(socketInstance);

    socketInstance.on("getOnlineUsers", (users) => {
      setOnlineUsers(users);
    });

    socketInstance.on("receiveMessage", () => {
      // Dispatch a global event so that MainLayout and others can update unread count
      window.dispatchEvent(new Event("rentconnect:message-notification"));
    });

    return () => {
      socketInstance.disconnect();
    };
  }, [user?._id]);

  return (
    <SocketContext.Provider value={{ socket, onlineUsers }}>
      {children}
    </SocketContext.Provider>
  );
}

export const useSocket = () => useContext(SocketContext);
