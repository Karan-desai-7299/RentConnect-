import { useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../../services/api";
import { useToast } from "../../hooks/useToast";
import { Mail, ArrowLeft, CheckCircle } from "lucide-react";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const showToast = useToast();

  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true);
    api
      .post("/api/v1/auth/forgot-password", { email })
      .then((res) => {
        if (res.data?.success) {
          setSent(true);
          showToast(res.data.message || "Password reset link sent.");
        }
      })
      .catch((err) => {
        showToast(err.response?.data?.message || "Failed to send reset link.", "error");
      })
      .finally(() => setLoading(false));
  };

  return (
    <div className="page flex-center" style={{ minHeight: "80vh" }}>
      <div className="glass-card" style={{ width: "100%", maxWidth: "440px", padding: "32px" }}>
        <h2 style={{ fontSize: "1.4rem", fontWeight: "800", marginBottom: "6px", textAlign: "center" }}>
          Forgot Password?
        </h2>
        <p style={{ color: "var(--muted)", fontSize: "0.9rem", textAlign: "center", marginBottom: "24px" }}>
          Enter your email address and we'll send you a link to reset your password.
        </p>

        {sent ? (
          <div style={{ textAlign: "center", padding: "20px 0" }}>
            <CheckCircle size={48} style={{ color: "var(--success)", margin: "0 auto 16px" }} />
            <p style={{ fontWeight: "700", marginBottom: "8px" }}>Check your inbox</p>
            <p style={{ color: "var(--muted)", fontSize: "0.85rem" }}>
              If an account exists with <strong>{email}</strong>, you will receive a password reset link.
            </p>
            <Link to="/login" className="btn btn-primary" style={{ marginTop: "20px", width: "100%", justifyContent: "center" }}>
              <ArrowLeft size={16} />
              <span>Back to Login</span>
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <div style={{ position: "relative" }}>
                <Mail size={18} style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "var(--muted)" }} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="form-input"
                  placeholder="you@example.com"
                  style={{ paddingLeft: "44px" }}
                  required
                />
              </div>
            </div>

            <button type="submit" disabled={loading} className="btn btn-primary" style={{ width: "100%", padding: "14px", marginTop: "12px" }}>
              {loading ? "Sending..." : "Send Reset Link"}
            </button>
          </form>
        )}

        <div style={{ textAlign: "center", marginTop: "20px", fontSize: "0.85rem", color: "var(--muted)" }}>
          Remember your password?{" "}
          <Link to="/login" style={{ color: "var(--accent)", fontWeight: "600" }}>Sign in</Link>
        </div>
      </div>
    </div>
  );
}
