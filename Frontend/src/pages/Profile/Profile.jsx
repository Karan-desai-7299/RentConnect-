import { useState } from "react";
import { api } from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import { User, Phone, Mail, Lock, CheckCircle, AlertCircle, ImagePlus, CircleUserRound } from "lucide-react";

export default function Profile() {
  const { user, login } = useAuth();

  // State definitions
  const [name, setName] = useState(user?.name || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [city, setCity] = useState(user?.city || "");
  const [profileImage, setProfileImage] = useState(null);
  const [profileImagePreview, setProfileImagePreview] = useState(user?.profileImage || "");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleProfileImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) {
      setProfileImage(null);
      setProfileImagePreview(user?.profileImage || "");
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

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess(false);

    if (!name || !phone) {
      setError("Name and Phone number are required.");
      setLoading(false);
      return;
    }

    try {
      const formData = new FormData();
      formData.append("name", name);
      formData.append("phone", phone);
      formData.append("city", city);
      if (password) {
        formData.append("password", password);
      }
      if (profileImage) {
        formData.append("profileImage", profileImage);
      }

      const response = await api.put("/api/v1/user/profile", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (response.data && response.data.success && response.data.data) {
        login(response.data.data);
        setSuccess(true);
        setPassword("");
      }
    } catch (err) {
      console.error(err);
      setError(
        err.response?.data?.message || "Failed to update profile. Please verify credentials."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page" style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "75vh" }}>
      <div className="glass-card" style={{ width: "100%", maxWidth: "560px" }}>
        <div style={{ textAlign: "center", marginBottom: "28px" }}>
          {profileImagePreview ? (
            <img 
              src={profileImagePreview} 
              alt={name} 
              className="avatar-large" 
              style={{ margin: "0 auto 16px" }}
            />
          ) : (
            <div className="avatar-large" style={{ margin: "0 auto 16px", display: "grid", placeItems: "center", background: "var(--accent-light)", color: "var(--text)", fontWeight: "800", fontSize: "1.5rem" }}>
              {name ? name.slice(0, 2).toUpperCase() : "RC"}
            </div>
          )}
          <h2 style={{ fontSize: "1.5rem", fontWeight: "800" }}>Manage Account Profile</h2>
          <p style={{ color: "var(--muted)", fontSize: "0.85rem", marginTop: "4px" }}>
            Update your personal contact details or password
          </p>
        </div>

        {success && (
          <div className="toast toast-success" style={{ position: "static", width: "100%", marginBottom: "20px", display: "flex", boxShadow: "none" }}>
            <CheckCircle size={16} />
            <span>Profile details updated successfully!</span>
          </div>
        )}

        {error && (
          <div className="toast toast-error" style={{ position: "static", width: "100%", marginBottom: "20px", display: "flex", boxShadow: "none" }}>
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleUpdateProfile}>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <div style={{ position: "relative" }}>
                <User size={18} style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "var(--muted)" }} />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="form-input"
                  style={{ paddingLeft: "44px" }}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Phone Number</label>
              <div style={{ position: "relative" }}>
                <Phone size={18} style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "var(--muted)" }} />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="form-input"
                  style={{ paddingLeft: "44px" }}
                  required
                />
              </div>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Email Address (Read-only)</label>
            <div style={{ position: "relative" }}>
              <Mail size={18} style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "rgba(255,255,255,0.25)" }} />
              <input
                type="email"
                value={user?.email || ""}
                className="form-input"
                style={{ paddingLeft: "44px", background: "rgba(255, 255, 255, 0.01)", color: "var(--muted)", cursor: "not-allowed" }}
                disabled
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">City</label>
            <input
              type="text"
              placeholder="Type your city name…"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Profile Photo</label>
            <label className="form-input" style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer" }}>
              <ImagePlus size={18} style={{ color: "var(--accent)" }} />
              <span style={{ color: "var(--muted)" }}>
                {profileImagePreview ? "Change photo" : "Upload a photo (optional)"}
              </span>
              <input
                type="file"
                accept="image/*"
                onChange={handleProfileImageChange}
                style={{ display: "none" }}
              />
            </label>
          </div>

          <div className="form-group" style={{ borderTop: "1px solid var(--line)", paddingTop: "18px", marginTop: "18px" }}>
            <label className="form-label">Update Password (Leave blank to keep current)</label>
            <div style={{ position: "relative" }}>
              <Lock size={18} style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "var(--muted)" }} />
              <input
                type="password"
                placeholder="Enter new password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="form-input"
                style={{ paddingLeft: "44px" }}
              />
            </div>
          </div>

          <button type="submit" disabled={loading} className="btn btn-primary" style={{ width: "100%", padding: "14px", marginTop: "12px", justifyContent: "center" }}>
            {loading ? <span>Saving changes...</span> : <span>Save Profile Changes</span>}
          </button>
        </form>
      </div>
    </div>
  );
}
