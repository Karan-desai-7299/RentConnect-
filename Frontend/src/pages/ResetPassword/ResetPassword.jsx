import { useState } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { api } from "../../services/api";
import { useToast } from "../../hooks/useToast";
import { Lock, Eye, EyeOff, CheckCircle } from "lucide-react";

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const showToast = useToast();

  const token = searchParams.get("token");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!token) {
      showToast("Invalid or missing reset token.", "error");
      return;
    }
    if (password.length < 6) {
      showToast("Password must be at least 6 characters.", "error");
      return;
    }
    if (password !== confirmPassword) {
      showToast("Passwords do not match.", "error");
      return;
    }

    setLoading(true);
    api
      .post(`/api/v1/auth/reset-password/${token}`, { password })
      .then((res) => {
        if (res.data?.success) {
          setSuccess(true);
          showToast("Password reset successfully!");
        }
      })
      .catch((err) => {
        showToast(err.response?.data?.message || "Failed to reset password.", "error");
      })
      .finally(() => setLoading(false));
  };

  if (!token && !success) {
    return (
      <div className="page flex-center" style={{ minHeight: "80vh" }}>
        <div className="glass-card" style={{ width: "100%", maxWidth: "440px", padding: "32px", textAlign: "center" }}>
          <p style={{ color: "var(--danger)", fontWeight: "700" }}>Invalid or missing reset token.</p>
          <Link to="/login" className="btn btn-primary" style={{ marginTop: "20px", width: "100%", justifyContent: "center" }}>
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="page flex-center" style={{ minHeight: "80vh" }}>
      <div className="glass-card" style={{ width: "100%", maxWidth: "440px", padding: "32px" }}>
        <h2 style={{ fontSize: "1.4rem", fontWeight: "800", marginBottom: "6px", textAlign: "center" }}>
          Reset Password
        </h2>
        <p style={{ color: "var(--muted)", fontSize: "0.9rem", textAlign: "center", marginBottom: "24px" }}>
          Enter your new password below.
        </p>

        {success ? (
          <div style={{ textAlign: "center", padding: "20px 0" }}>
            <CheckCircle size={48} style={{ color: "var(--success)", margin: "0 auto 16px" }} />
            <p style={{ fontWeight: "700", marginBottom: "8px" }}>Password Updated!</p>
            <p style={{ color: "var(--muted)", fontSize: "0.85rem", marginBottom: "20px" }}>
              You can now sign in with your new password.
            </p>
            <Link to="/login" className="btn btn-primary" style={{ width: "100%", justifyContent: "center" }}>
              Sign In
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">New Password</label>
              <div style={{ position: "relative" }}>
                <Lock size={18} style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "var(--muted)" }} />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="form-input"
                  placeholder="Enter new password"
                  style={{ paddingLeft: "44px", paddingRight: "44px" }}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "var(--muted)" }}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Confirm Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="form-input"
                placeholder="Confirm new password"
                required
              />
            </div>

            <button type="submit" disabled={loading} className="btn btn-primary" style={{ width: "100%", padding: "14px", marginTop: "12px" }}>
              {loading ? "Resetting..." : "Reset Password"}
            </button>
          </form>
        )}

        <div style={{ textAlign: "center", marginTop: "20px", fontSize: "0.85rem", color: "var(--muted)" }}>
          <Link to="/login" style={{ color: "var(--accent)", fontWeight: "600" }}>Back to Sign In</Link>
        </div>
      </div>
    </div>
  );
}
