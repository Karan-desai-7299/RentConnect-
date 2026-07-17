import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import { LogIn, Mail, Lock, AlertCircle } from "lucide-react";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (!email || !password) {
      setError("Please fill in all fields.");
      setLoading(false);
      return;
    }

    try {
      const response = await api.post("/api/v1/auth/login", {
        email,
        password,
      });

      if (response.data && response.data.success && response.data.data?.token) {
        login(response.data.data);
        const role = response.data.data.role;
        
        // Redirect based on role
        if (role === "admin") {
          navigate("/admin");
        } else if (role === "owner") {
          navigate("/owner");
        } else {
          navigate("/dashboard");
        }
      } else {
        setError("Invalid response from server.");
      }
    } catch (err) {
      console.error(err);
      setError(
        err.response?.data?.message || "Login failed. Check your credentials and try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page" style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "75vh" }}>
      <div className="glass-card" style={{ width: "100%", maxWidth: "440px" }}>
        <div style={{ textAlign: "center", marginBottom: "28px" }}>
          <div className="brand-mark" style={{ margin: "0 auto 16px" }}>RC</div>
          <h2 style={{ fontSize: "1.75rem", fontWeight: "800" }}>Welcome Back</h2>
          <p style={{ color: "var(--muted)", fontSize: "0.9rem", marginTop: "4px" }}>
            Sign in to connect with rental owners & tenants
          </p>
        </div>

        {error && (
          <div className="toast toast-error" style={{ position: "static", width: "100%", marginBottom: "20px", display: "flex", boxShadow: "none" }}>
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Email Address</label>
            <div style={{ position: "relative" }}>
              <Mail size={18} style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "var(--muted)" }} />
              <input
                type="email"
                placeholder="name@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="form-input"
                style={{ paddingLeft: "44px" }}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <div style={{ position: "relative" }}>
              <Lock size={18} style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "var(--muted)" }} />
              <input
                type="password"
                placeholder="&bull;&bull;&bull;&bull;&bull;&bull;&bull;&bull;"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="form-input"
                style={{ paddingLeft: "44px" }}
                required
              />
            </div>
          </div>

          <div style={{ textAlign: "right", marginBottom: "4px" }}>
            <Link to="/forgot-password" style={{ fontSize: "0.85rem", color: "var(--accent)", fontWeight: "600" }}>
              Forgot password?
            </Link>
          </div>

          <button type="submit" disabled={loading} className="btn btn-primary" style={{ width: "100%", padding: "14px", marginTop: "12px" }}>
            {loading ? (
              <span>Signing In...</span>
            ) : (
              <>
                <LogIn size={18} />
                <span>Sign In</span>
              </>
            )}
          </button>
        </form>

        <div style={{ textAlign: "center", marginTop: "24px", fontSize: "0.9rem", color: "var(--muted)" }}>
          Don't have an account?{" "}
          <Link to="/register" style={{ color: "var(--accent)", fontWeight: "600" }}>
            Create one free
          </Link>
        </div>
      </div>
    </div>
  );
}
