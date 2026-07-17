import { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { api } from "../../services/api";
import { useToast } from "../../hooks/useToast";
import { CheckCircle, XCircle, Loader } from "lucide-react";

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const showToast = useToast();

  const token = searchParams.get("token");
  const [status, setStatus] = useState("loading"); // loading | success | error
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage("Invalid or missing verification token.");
      return;
    }

    api
      .get(`/api/v1/auth/verify-email/${token}`)
      .then((res) => {
        if (res.data?.success) {
          setStatus("success");
          setMessage(res.data.message || "Email verified successfully!");
          showToast("Email verified successfully!");
        }
      })
      .catch((err) => {
        setStatus("error");
        setMessage(err.response?.data?.message || "Verification failed. The link may have expired.");
      });
  }, [token]);

  return (
    <div className="page flex-center" style={{ minHeight: "80vh" }}>
      <div className="glass-card" style={{ width: "100%", maxWidth: "440px", padding: "32px", textAlign: "center" }}>
        <h2 style={{ fontSize: "1.4rem", fontWeight: "800", marginBottom: "6px" }}>
          Email Verification
        </h2>

        {status === "loading" && (
          <div style={{ padding: "32px 0" }}>
            <Loader size={36} style={{ color: "var(--accent)", margin: "0 auto 16px", animation: "spin 1s linear infinite" }} />
            <p style={{ color: "var(--muted)" }}>Verifying your email...</p>
          </div>
        )}

        {status === "success" && (
          <div style={{ padding: "20px 0" }}>
            <CheckCircle size={48} style={{ color: "var(--success)", margin: "0 auto 16px" }} />
            <p style={{ fontWeight: "700", marginBottom: "8px" }}>Email Verified!</p>
            <p style={{ color: "var(--muted)", fontSize: "0.85rem", marginBottom: "20px" }}>{message}</p>
            <Link to="/login" className="btn btn-primary" style={{ width: "100%", justifyContent: "center" }}>
              Sign In
            </Link>
          </div>
        )}

        {status === "error" && (
          <div style={{ padding: "20px 0" }}>
            <XCircle size={48} style={{ color: "var(--danger)", margin: "0 auto 16px" }} />
            <p style={{ fontWeight: "700", marginBottom: "8px", color: "var(--danger)" }}>Verification Failed</p>
            <p style={{ color: "var(--muted)", fontSize: "0.85rem", marginBottom: "20px" }}>{message}</p>
            <Link to="/login" className="btn btn-primary" style={{ width: "100%", justifyContent: "center" }}>
              Go to Login
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
