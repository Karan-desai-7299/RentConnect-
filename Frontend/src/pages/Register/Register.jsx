import { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { api } from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import { UserPlus, User, Building2, Mail, Lock, Phone, AlertCircle, ImagePlus, CircleUserRound } from "lucide-react";

export default function Register() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { login } = useAuth();

  // Prefill owner role if URL query has ?owner=true
  const isOwnerQuery = searchParams.get("owner") === "true";

  const [role, setRole] = useState("user"); // "user" | "owner"
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");
  const [password, setPassword] = useState("");
  const [profileImage, setProfileImage] = useState(null);
  const [profileImagePreview, setProfileImagePreview] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOwnerQuery) {
      setRole("owner");
    }
  }, [isOwnerQuery]);

  const handleProfileImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) {
      setProfileImage(null);
      setProfileImagePreview("");
      return;
    }

    setProfileImage(file);
    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result || "");
      setProfileImagePreview(result);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (!name || !email || !phone || !password) {
      setError("Please fill in all required fields.");
      setLoading(false);
      return;
    }

    try {
      const formData = new FormData();
      formData.append("name", name);
      formData.append("email", email);
      formData.append("phone", phone);
      formData.append("city", String(city).trim());
      formData.append("password", password);
      formData.append("role", role);
      if (profileImage) {
        formData.append("profileImage", profileImage);
      }

      const response = await api.post("/api/v1/auth/register", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (response.data && response.data.success && response.data.data?.token) {
        login(response.data.data);
        
        // Redirect based on role
        if (role === "owner") {
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
        err.response?.data?.message || "Registration failed. Please check details and try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page" style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "85vh", padding: "20px 0" }}>
      <div className="glass-card" style={{ width: "100%", maxWidth: "480px" }}>
        <div style={{ textAlign: "center", marginBottom: "24px" }}>
          <h2 style={{ fontSize: "1.75rem", fontWeight: "800" }}>Create Account</h2>
          <p style={{ color: "var(--muted)", fontSize: "0.9rem", marginTop: "4px" }}>
            Join RentConnect to list properties or find broker-free rentals
          </p>
        </div>

        {error && (
          <div className="toast toast-error" style={{ position: "static", width: "100%", marginBottom: "20px", display: "flex", boxShadow: "none" }}>
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        {/* Role Selector Cards */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "24px" }}>
          <div 
            onClick={() => setRole("user")}
            className="category-card" 
            style={{ 
              padding: "16px", 
              borderColor: role === "user" ? "var(--accent)" : "var(--glass-border)",
              background: role === "user" ? "var(--accent-light)" : "rgba(255,255,255,0.01)",
              opacity: role === "user" ? 1 : 0.6
            }}
          >
            <User size={24} style={{ color: "var(--accent)" }} />
            <h4 style={{ fontSize: "0.95rem", fontWeight: "700" }}>I'm a Tenant</h4>
            <span style={{ fontSize: "0.75rem", color: "var(--muted)" }}>Looking for flats & rooms</span>
          </div>
          <div 
            onClick={() => setRole("owner")}
            className="category-card" 
            style={{ 
              padding: "16px", 
              borderColor: role === "owner" ? "var(--accent-2)" : "var(--glass-border)",
              background: role === "owner" ? "var(--accent-2-light)" : "rgba(255,255,255,0.01)",
              opacity: role === "owner" ? 1 : 0.6
            }}
          >
            <Building2 size={24} style={{ color: "var(--accent-2)" }} />
            <h4 style={{ fontSize: "0.95rem", fontWeight: "700" }}>I'm an Owner</h4>
            <span style={{ fontSize: "0.75rem", color: "var(--muted)" }}>Listing houses & PGs</span>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Avatar Preview */}
          {profileImagePreview ? (
            <div style={{ display: "flex", justifyContent: "center", alignItems: "center", flexDirection: "column", gap: "6px", marginBottom: "16px" }}>
              <img src={profileImagePreview} alt="Profile Preview" className="avatar" style={{ width: "56px", height: "56px", border: "2px solid var(--accent)" }} />
              <span style={{ fontSize: "0.75rem", color: "var(--muted)" }}>Profile Photo Preview</span>
            </div>
          ) : (
            <div style={{ display: "flex", justifyContent: "center", alignItems: "center", flexDirection: "column", gap: "6px", marginBottom: "16px" }}>
              <CircleUserRound size={60} style={{ color: "var(--muted)" }} />
              <span style={{ fontSize: "0.75rem", color: "var(--muted)" }}>No profile photo selected</span>
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Full Name</label>
            <div style={{ position: "relative" }}>
              <User size={18} style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "var(--muted)" }} />
              <input
                type="text"
                placeholder="Rahul Kumar"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="form-input"
                style={{ paddingLeft: "44px" }}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Email Address</label>
            <div style={{ position: "relative" }}>
              <Mail size={18} style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "var(--muted)" }} />
              <input
                type="email"
                placeholder="rahul@gmail.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="form-input"
                style={{ paddingLeft: "44px" }}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">City</label>
            <input
              type="text"
              placeholder="Type your city name (e.g. Surat, Nagpur…)"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="form-input"
              required
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Phone Number</label>
              <div style={{ position: "relative" }}>
                <Phone size={18} style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "var(--muted)" }} />
                <input
                  type="tel"
                  placeholder="9876543210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
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
                  placeholder="Min 6 chars"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="form-input"
                  style={{ paddingLeft: "44px" }}
                  required
                />
              </div>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Profile Photo</label>
            <label className="form-input" style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer" }}>
              <ImagePlus size={18} style={{ color: "var(--accent)" }} />
              <span style={{ color: "var(--muted)" }}>
                {profileImage ? "Change selected photo" : "Upload your photo (optional)"}
              </span>
              <input
                type="file"
                accept="image/*"
                onChange={handleProfileImageChange}
                style={{ display: "none" }}
              />
            </label>
          </div>

          <button type="submit" disabled={loading} className="btn btn-primary" style={{ width: "100%", padding: "14px", marginTop: "12px" }}>
            {loading ? (
              <span>Creating Account...</span>
            ) : (
              <>
                <UserPlus size={18} />
                <span>Create Account</span>
              </>
            )}
          </button>
        </form>

        <div style={{ textAlign: "center", marginTop: "24px", fontSize: "0.9rem", color: "var(--muted)" }}>
          Already have an account?{" "}
          <Link to="/login" style={{ color: "var(--accent)", fontWeight: "600" }}>
            Sign in instead
          </Link>
        </div>
      </div>
    </div>
  );
}
