import { useEffect, useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { api } from "../services/api";
import {
  Building,
  Search,
  Heart,
  MessageSquare,
  User,
  LogOut,
  Shield,
  Home,
  PlusCircle,
  Mail,
  ExternalLink,
  Sparkles,
  Sun,
  Moon,
  Menu,
  X
} from "lucide-react";

export default function MainLayout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem("rentconnect_theme") || "light";
  });
  const displayName = typeof user?.name === "string" && user.name.trim()
    ? user.name.trim().split(/\s+/)[0]
    : "User";

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("rentconnect_theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === "light" ? "dark" : "light");
  };

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  useEffect(() => {
    if (!user?._id || !["user", "owner"].includes(user.role)) {
      setUnreadMessages(0);
      return undefined;
    }

    let active = true;

    const loadUnread = async () => {
      try {
        const res = await api.get("/api/v1/chat/unread-count");
        if (!active || !res.data?.success) return;
        setUnreadMessages(res.data.data.total || 0);
      } catch (err) {
        if (active) console.error("Failed to load unread messages:", err);
      }
    };

    const handleNotification = () => {
      loadUnread();
    };

    loadUnread();
    window.addEventListener("rentconnect:message-notification", handleNotification);
    window.addEventListener("rentconnect:messages-read", handleNotification);

    return () => {
      active = false;
      window.removeEventListener("rentconnect:message-notification", handleNotification);
      window.removeEventListener("rentconnect:messages-read", handleNotification);
    };
  }, [user?._id, user?.role]);

  return (
    <div className="app-shell">
      <header className="topbar">
        <Link to="/" className="brand">
          <span className="brand-mark">RC</span>
          <span>RentConnect</span>
        </Link>

        <button
          className="hamburger-btn"
          onClick={() => setMobileMenuOpen(open => !open)}
          aria-label="Toggle menu"
          aria-expanded={mobileMenuOpen}
        >
          {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>

        <nav className="nav">
          <NavLink to="/" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
            <Home size={16} />
            <span>Home</span>
          </NavLink>
          <NavLink to="/search" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
            <Search size={16} />
            <span>Explore</span>
          </NavLink>

          {user && user.role === "user" && (
            <>
              <NavLink to="/dashboard" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                <Building size={16} />
                <span>Dashboard</span>
              </NavLink>
              <NavLink to="/favorites" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                <Heart size={16} />
                <span>Favorites</span>
              </NavLink>
              <NavLink to="/chat" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                <MessageSquare size={16} />
                <span>Chat</span>
                {unreadMessages > 0 && (
                  <span className="notification-badge">
                    {unreadMessages}
                  </span>
                )}
              </NavLink>
            </>
          )}

          {user && user.role === "owner" && (
            <>
              <NavLink to="/owner" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                <Building size={16} />
                <span>Dashboard</span>
              </NavLink>
              <NavLink to="/chat" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                <MessageSquare size={16} />
                <span>Messages</span>
                {unreadMessages > 0 && (
                  <span className="notification-badge">
                    {unreadMessages}
                  </span>
                )}
              </NavLink>
            </>
          )}

          {user && user.role === "admin" && (
            <NavLink to="/admin" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              <Shield size={16} />
              <span>Admin Panel</span>
            </NavLink>
          )}
        </nav>

        <div className="nav-actions" style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <button onClick={toggleTheme} className="btn btn-secondary btn-icon" title="Toggle Theme" style={{ minHeight: "44px" }}>
            {theme === "light" ? <Moon size={16} /> : <Sun size={16} />}
          </button>

          {user ? (
            <div className="nav-actions" style={{ display: "flex", alignItems: "center", gap: "14px" }}>
              <Link to="/profile" className="user-menu-btn">
                {user.profileImage ? (
                  <img 
                    src={user.profileImage} 
                    alt={displayName} 
                    className="avatar" 
                  />
                ) : (
                  <span className="avatar" style={{ display: "grid", placeItems: "center", fontSize: "0.75rem", fontWeight: "800", color: "var(--text)", background: "var(--accent-light)" }}>
                    {displayName.slice(0, 2).toUpperCase()}
                  </span>
                )}
                <span style={{ fontSize: "0.85rem", fontWeight: "600" }}>{displayName}</span>
                <span className={`chip ${user.role === 'admin' ? 'chip-danger' : user.role === 'owner' ? 'chip-accent' : 'chip-accent'}`} style={{ padding: '2px 8px', fontSize: '0.65rem' }}>
                  {user.role}
                </span>
              </Link>
              <button onClick={handleLogout} className="btn btn-secondary btn-icon" title="Log Out">
                <LogOut size={16} />
              </button>
            </div>
          ) : (
            <div className="nav-actions" style={{ gap: "10px" }}>
              <Link to="/login" className="btn btn-secondary">
                <span>Login</span>
              </Link>
              <Link to="/register" className="btn btn-primary">
                <span>Register</span>
              </Link>
              <Link to="/register?owner=true" className="nav-link" style={{ fontSize: "0.85rem", color: "var(--accent-2)" }}>
                <PlusCircle size={16} />
                <span>Become Owner</span>
              </Link>
            </div>
          )}
        </div>
      </header>

      {/* Mobile slide-down panel for items with no bottom-nav equivalent (Profile, Logout, theme) */}
      {mobileMenuOpen && (
        <div className="mobile-menu-panel is-open">
          {user ? (
            <>
              <Link
                to="/profile"
                className="sidebar-nav-item"
                onClick={() => setMobileMenuOpen(false)}
                style={{ padding: "10px 12px", minHeight: "44px" }}
              >
                <User size={16} style={{ color: "var(--accent)" }} />
                <span style={{ fontSize: "0.9rem" }}>Profile</span>
              </Link>
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  toggleTheme();
                }}
                className="sidebar-nav-item"
                style={{ padding: "10px 12px", minHeight: "44px", cursor: "pointer", background: "none", border: "none", width: "100%", textAlign: "left" }}
              >
                {theme === "light" ? <Moon size={16} style={{ color: "var(--accent)" }} /> : <Sun size={16} style={{ color: "var(--accent-2)" }} />}
                <span style={{ fontSize: "0.9rem" }}>{theme === "light" ? "Dark Mode" : "Light Mode"}</span>
              </button>
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  handleLogout();
                }}
                className="sidebar-nav-item"
                style={{ padding: "10px 12px", minHeight: "44px", cursor: "pointer", background: "none", border: "none", width: "100%", textAlign: "left", color: "var(--danger)" }}
              >
                <LogOut size={16} />
                <span style={{ fontSize: "0.9rem" }}>Logout</span>
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  toggleTheme();
                }}
                className="sidebar-nav-item"
                style={{ padding: "10px 12px", minHeight: "44px", cursor: "pointer", background: "none", border: "none", width: "100%", textAlign: "left" }}
              >
                {theme === "light" ? <Moon size={16} style={{ color: "var(--accent)" }} /> : <Sun size={16} style={{ color: "var(--accent-2)" }} />}
                <span style={{ fontSize: "0.9rem" }}>{theme === "light" ? "Dark Mode" : "Light Mode"}</span>
              </button>
              <Link
                to="/login"
                className="btn btn-secondary"
                onClick={() => setMobileMenuOpen(false)}
                style={{ width: "100%", justifyContent: "center", minHeight: "44px" }}
              >
                <span>Login</span>
              </Link>
              <Link
                to="/register"
                className="btn btn-primary"
                onClick={() => setMobileMenuOpen(false)}
                style={{ width: "100%", justifyContent: "center", minHeight: "44px" }}
              >
                <span>Register</span>
              </Link>
            </>
          )}
        </div>
      )}

      <main>{children}</main>

      <nav className="mobile-bottom-nav" aria-label="Primary mobile navigation">
        <NavLink to="/" className={({ isActive }) => `mobile-bottom-nav-item ${isActive ? "active" : ""}`}>
          <Home size={18} />
          <span>Home</span>
        </NavLink>
        <NavLink to="/search" className={({ isActive }) => `mobile-bottom-nav-item ${isActive ? "active" : ""}`}>
          <Search size={18} />
          <span>Search</span>
        </NavLink>
        {user?.role === "owner" ? (
          <NavLink to="/owner" className={({ isActive }) => `mobile-bottom-nav-item ${isActive ? "active" : ""}`}>
            <Building size={18} />
            <span>Dashboard</span>
          </NavLink>
        ) : (
          <NavLink to="/favorites" className={({ isActive }) => `mobile-bottom-nav-item ${isActive ? "active" : ""}`}>
            <Heart size={18} />
            <span>Saved</span>
          </NavLink>
        )}
        <NavLink to="/chat" className={({ isActive }) => `mobile-bottom-nav-item ${isActive ? "active" : ""}`}>
          <MessageSquare size={18} />
          <span>Messages</span>
          {unreadMessages > 0 && <span className="mobile-bottom-badge">{unreadMessages}</span>}
        </NavLink>
        <NavLink to="/profile" className={({ isActive }) => `mobile-bottom-nav-item ${isActive ? "active" : ""}`}>
          <User size={18} />
          <span>Profile</span>
        </NavLink>
      </nav>

      <footer style={{ marginTop: "64px", paddingTop: "24px", borderTop: "1px solid var(--line)", color: "var(--muted)" }}>
        <div className="footer-grid">
          <div className="footer-card footer-card-main">
            <div className="chip chip-accent" style={{ marginBottom: "12px" }}>
              <Sparkles size={14} />
              <span>About Creator</span>
            </div>
            <strong className="footer-title">Karansinh Desai</strong>
            <p className="footer-copy">RentConnect is built to remove brokerage friction and make finding or listing rentals feel direct, modern, and trustworthy.</p>

            <div className="footer-contact-list">
              <a href="mailto:karansinhdesai91@gmail.com" className="footer-contact-row">
                <span className="footer-contact-icon"><Mail size={15} /></span>
                <span className="footer-contact-text">karansinhdesai91@gmail.com</span>
              </a>
              <a href="https://www.linkedin.com/in/karansinh-desai-a249a0289" target="_blank" rel="noreferrer" className="footer-contact-row">
                <span className="footer-contact-icon footer-contact-icon-linkedin"><ExternalLink size={15} /></span>
                <span className="footer-contact-text">LinkedIn Profile</span>
                <span className="footer-contact-open">Open</span>
              </a>
            </div>
          </div>

          <div className="footer-card footer-card-side">
            <strong className="footer-title footer-title-small">Quick Links</strong>
            <div className="footer-links">
              <Link to="/search">Explore</Link>
              <Link to="/about">About Us</Link>
              <Link to="/register?owner=true">Become Owner</Link>
              <Link to="/login">Login</Link>
            </div>
            <p className="footer-copy footer-copy-small">Built for Indian cities with direct owner-tenant communication.</p>
            <div className="footer-meta">&copy; {new Date().getFullYear()} RentConnect. Built for Indian Cities.</div>
          </div>
        </div>
      </footer>
    </div>
  );
}
