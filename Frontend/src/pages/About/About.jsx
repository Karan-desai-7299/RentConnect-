import { Mail, ExternalLink, UserCircle2, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";

export default function About() {
  return (
    <div className="page">
      <section className="glass-card" style={{ padding: "32px", marginTop: "24px", background: "linear-gradient(135deg, rgba(13,148,136,0.08), rgba(249,115,22,0.06))" }}>
        <div className="chip chip-accent" style={{ marginBottom: "14px" }}>
          <Sparkles size={14} />
          <span>About the Creator</span>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1.2fr 0.8fr", gap: "24px", alignItems: "center" }}>
          <div>
            <h1 style={{ fontSize: "clamp(2rem, 4vw, 3.2rem)", lineHeight: 1.05, marginBottom: "12px", fontWeight: 900 }}>
              Karansinh Desai
            </h1>
            <p style={{ color: "var(--muted)", fontSize: "1.05rem", maxWidth: "60ch", marginBottom: "20px" }}>
              Building RentConnect as a broker-free rental platform to make property discovery simpler, cleaner, and more direct for tenants and owners.
            </p>

            <div style={{ display: "grid", gap: "12px" }}>
              <a href="mailto:karansinhdesai91@gmail.com" className="stat-card" style={{ flexDirection: "row", alignItems: "center", gap: "14px" }}>
                <Mail size={18} style={{ color: "var(--accent)" }} />
                <div>
                  <strong style={{ display: "block", fontSize: "0.95rem" }}>karansinhdesai91@gmail.com</strong>
                  <span style={{ fontSize: "0.8rem", color: "var(--muted)" }}>Email me for project collaboration or feedback</span>
                </div>
              </a>

              <a
                href="https://www.linkedin.com/in/karansinh-desai-a249a0289"
                target="_blank"
                rel="noreferrer"
                className="stat-card"
                style={{ flexDirection: "row", alignItems: "center", gap: "14px" }}
              >
                <ExternalLink size={18} style={{ color: "#0a66c2" }} />
                <div>
                  <strong style={{ display: "block", fontSize: "0.95rem" }}>LinkedIn Profile</strong>
                  <span style={{ fontSize: "0.8rem", color: "var(--muted)" }}>www.linkedin.com/in/karansinh-desai-a249a0289</span>
                </div>
              </a>
            </div>
          </div>

          <div className="glass-card" style={{ padding: "22px", background: "rgba(255,255,255,0.75)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px" }}>
              <div className="brand-mark" style={{ width: "54px", height: "54px", borderRadius: "18px" }}>
                <UserCircle2 size={28} />
              </div>
              <div>
                <strong style={{ display: "block", fontSize: "1rem" }}>RentConnect Creator</strong>
                <span style={{ color: "var(--muted)", fontSize: "0.85rem" }}>Designing rental discovery with clarity</span>
              </div>
            </div>

            <div style={{ display: "grid", gap: "12px" }}>
              <div className="stat-card" style={{ padding: "16px" }}>
                <span style={{ color: "var(--muted)", fontSize: "0.8rem" }}>Focus</span>
                <strong style={{ fontSize: "1rem" }}>Broker-free rental experience</strong>
              </div>
              <div className="stat-card" style={{ padding: "16px" }}>
                <span style={{ color: "var(--muted)", fontSize: "0.8rem" }}>Location</span>
                <strong style={{ fontSize: "1rem" }}>India-wide city rentals</strong>
              </div>
              <div className="stat-card" style={{ padding: "16px" }}>
                <span style={{ color: "var(--muted)", fontSize: "0.8rem" }}>Contact</span>
                <strong style={{ fontSize: "1rem" }}>Direct owner-tenant communication</strong>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section style={{ marginTop: "24px", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "16px" }}>
        <div className="stat-card">
          <span style={{ color: "var(--muted)", fontSize: "0.8rem" }}>What RentConnect does</span>
          <strong>Connects owners and tenants directly</strong>
        </div>
        <div className="stat-card">
          <span style={{ color: "var(--muted)", fontSize: "0.8rem" }}>Built with</span>
          <strong>MERN, Socket.io, Maps, ImageKit</strong>
        </div>
        <div className="stat-card">
          <span style={{ color: "var(--muted)", fontSize: "0.8rem" }}>Next step</span>
          <strong>Explore listings or list a property</strong>
        </div>
      </section>

      <div style={{ marginTop: "20px" }}>
        <Link to="/" className="btn btn-primary">Back to Home</Link>
      </div>
    </div>
  );
}
