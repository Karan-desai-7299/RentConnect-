import { createContext, useContext, useEffect, useState } from "react";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const saved = localStorage.getItem("rentconnect_user");
    if (saved) {
      try {
        setUser(JSON.parse(saved));
      } catch (err) {
        console.error("Failed to parse saved user", err);
      }
    }
    setLoading(false);
  }, []);

  const login = (payload) => {
    setUser(payload);
    localStorage.setItem("rentconnect_user", JSON.stringify(payload));
    if (payload?.token) {
      localStorage.setItem("rentconnect_token", payload.token);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("rentconnect_user");
    localStorage.removeItem("rentconnect_token");
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
