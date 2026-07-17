import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../../services/api";
import { useToast } from "../../hooks/useToast";
import { MapPin, Bed, Heart, Bookmark, Compass } from "lucide-react";
import { formatMoney, formatCity } from "../../utils/formatters";

export default function Favorites() {
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const showToast = useToast();

  const fetchFavorites = () => {
    setLoading(true);
    api.get(`/api/v1/property/user/favorites`)
      .then((res) => {
        if (res.data?.success && Array.isArray(res.data.data)) {
          setFavorites(res.data.data);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching favorites list:", err);
        setLoading(false);
        showToast("Failed to fetch favorites.", "error");
      });
  };

  useEffect(() => {
    fetchFavorites();
  }, []);

  const handleRemoveFavorite = (propertyId, e) => {
    e.preventDefault();
    api.post(`/api/v1/property/user/favorites/${propertyId}`)
      .then((res) => {
        if (res.data?.success) {
          setFavorites(prev => prev.filter(item => item._id !== propertyId));
          showToast("Removed from favorites.");
        }
      })
      .catch((err) => {
        console.error(err);
        showToast("Failed to remove from favorites.", "error");
      });
  };

  const renderSkeletons = () => (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(290px, 1fr))", gap: "20px" }}>
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="property-card glass-card" style={{ padding: "0" }}>
          <div className="skeleton skeleton-card" style={{ height: "180px", borderBottomLeftRadius: 0, borderBottomRightRadius: 0 }}></div>
          <div style={{ padding: "20px" }}>
            <div className="skeleton skeleton-line" style={{ width: "70%" }}></div>
            <div className="skeleton skeleton-line" style={{ width: "40%" }}></div>
            <div className="skeleton skeleton-line" style={{ width: "100%", marginTop: "16px" }}></div>
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="page">
      <div style={{ marginBottom: "28px" }}>
        <h1 style={{ fontSize: "1.75rem", fontWeight: "800", display: "flex", alignItems: "center", gap: "10px" }}>
          <Bookmark size={26} style={{ color: "#ef4444" }} />
          <span>My Saved Wishlist</span>
        </h1>
        <p style={{ color: "var(--muted)", fontSize: "0.85rem" }}>Shortlisted rental listings to review or schedule visits</p>
      </div>

      {loading ? (
        renderSkeletons()
      ) : favorites.length > 0 ? (
        <div className="grid-3">
          {favorites.map((property) => {
            const images = property.images && property.images.length > 0 
              ? property.images 
              : ["/placeholder-property.jpg"];

            return (
              <div key={property._id} className={`property-card ${property.listingStatus === 'rented' ? 'rented' : ''}`}>
                <div className="card-image-container" style={{ aspectRatio: "4 / 3" }}>
                  <img 
                    src={images[0]} 
                    alt={property.title} 
                    className="card-image" 
                    loading="lazy"
                    onError={(e) => { e.target.src = '/placeholder-property.jpg' }}
                  />
                  <span className="chip chip-accent card-badge">
                    {property.propertyType}
                  </span>
                  
                  {property.isVerifiedProperty && (
                    <span className="chip chip-success" style={{ position: "absolute", bottom: "10px", left: "10px", zIndex: 2, fontSize: "0.65rem", padding: "2px 8px" }}>
                      Verified
                    </span>
                  )}
                  
                  {property.listingStatus === "rented" && (
                    <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.5)", display: "grid", placeItems: "center", zIndex: 3 }}>
                      <span className="chip chip-danger" style={{ fontSize: "0.9rem", padding: "8px 16px" }}>Rented</span>
                    </div>
                  )}

                  {property.listingStatus !== "rented" && (
                    <button 
                      onClick={(e) => handleRemoveFavorite(property._id, e)} 
                      className="card-favorite-btn favorited"
                      style={{ minHeight: "36px" }}
                    >
                      <Heart size={16} fill="currentColor" />
                    </button>
                  )}
                </div>

                <div className="property-card-body">
                  <h3 style={{ fontSize: "1.15rem", fontWeight: "700" }}>{property.title}</h3>
                  <div className="property-card-location">
                    <MapPin size={14} />
                    <span>{property.area}, {formatCity(property.city).toUpperCase()}</span>
                  </div>

                  <div className="property-card-specs">
                    <span><Bed size={14} /> {property.bedrooms} BHK</span>
                    <span>🛋️ {property.furnishedStatus}</span>
                  </div>

                  <div className="property-card-price-row">
                    <div className="property-card-price">
                      <strong style={{ fontSize: "1.3rem", color: "var(--accent-2)", fontWeight: "800" }}>₹{formatMoney(property.rent)}</strong>
                      <span>Deposit: ₹{formatMoney(property.deposit)}</span>
                    </div>
                    <Link to={`/property/${property._id}`} className="btn btn-secondary btn-small" style={{ minHeight: "32px", padding: "0 12px" }}>
                      View details
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="glass-card" style={{ textAlign: "center", padding: "64px 24px" }}>
          <Compass size={48} style={{ color: "var(--muted)", marginBottom: "16px" }} />
          <h3>You haven't saved any properties yet.</h3>
          <p style={{ color: "var(--muted)", marginTop: "6px", fontSize: "0.95rem", marginBottom: "18px" }}>
            Explore properties and click the heart icon on any card to save listings here.
          </p>
          <Link to="/search" className="btn btn-primary" style={{ marginTop: "16px", display: "inline-flex", minHeight: "44px" }}>Start exploring</Link>
        </div>
      )}
    </div>
  );
}
