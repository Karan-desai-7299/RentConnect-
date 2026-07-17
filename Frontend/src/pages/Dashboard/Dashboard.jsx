import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import { formatMoney, formatCity } from "../../utils/formatters";
import { 
  MapPin, 
  Bed, 
  Search, 
  Heart, 
  MessageSquare, 
  Phone, 
  Navigation, 
  SlidersHorizontal,
  PlusCircle,
  Clock,
  ThumbsUp,
  Bookmark,
  Compass
} from "lucide-react";

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Search/Filter states
  const [search, setSearch] = useState("");
  const [city, setCity] = useState("");
  const [maxRent, setMaxRent] = useState("");
  const [bedrooms, setBedrooms] = useState("all");
  const [furnishedStatus, setFurnishedStatus] = useState("all");
  const [maxDistance, setMaxDistance] = useState(25);

  // Data lists
  const [nearby, setNearby] = useState([]);
  const [recommended, setRecommended] = useState([]);
  const [recentlyAdded, setRecentlyAdded] = useState([]);
  const [recentlyViewed, setRecentlyViewed] = useState([]);
  
  // Geolocation states
  const [coords, setCoords] = useState(null);
  const [geoLoading, setGeoLoading] = useState(false);
  const [geoError, setGeoError] = useState(false);

  // Favorites tracking
  const [favorites, setFavorites] = useState([]);
  
  // Booked visits
  const [bookings, setBookings] = useState([]);

  // Loadings
  const [loading, setLoading] = useState(true);

  const getBookingStatusMeta = (status) => {
    if (status === "completed") return { label: "Completed", chipClass: "chip-success" };
    if (status === "confirmed") return { label: "Confirmed", chipClass: "chip-warning" };
    if (status === "cancelled") return { label: "Cancelled", chipClass: "chip-danger" };
    return { label: "Scheduled", chipClass: "chip-accent-2" };
  };



  // Request browser geolocation
  const requestLocation = () => {
    if (navigator.geolocation) {
      setGeoLoading(true);
      setGeoError(false);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          setCoords({ lat, lng });
          setGeoLoading(false);
        },
        (err) => {
          console.error("Geolocation error:", err);
          setGeoError(true);
          setGeoLoading(false);
        }
      );
    }
  };

  // Fetch lists
  useEffect(() => {
    setLoading(true);
    
    const p1 = api.get(`/api/v1/property?limit=6&sort=latest`)
      .then(res => {
        if (res.data?.success && Array.isArray(res.data.data.properties)) {
          setRecentlyAdded(res.data.data.properties);
        }
      })
      .catch(err => console.error(err));

    const p2 = api.get(`/api/v1/property?city=${city}&limit=6`)
      .then(res => {
        if (res.data?.success && Array.isArray(res.data.data.properties)) {
          setRecommended(res.data.data.properties);
        }
      })
      .catch(err => console.error(err));

    const p3 = api.get(`/api/v1/property/user/favorites`)
      .then(res => {
        if (res.data?.success && Array.isArray(res.data.data)) {
          setFavorites(res.data.data.map(item => item._id));
        }
      })
      .catch(err => console.error(err));

    const p4 = api.get(`/api/v1/property/user/bookings`)
      .then(res => {
        if (res.data?.success) {
          setBookings(res.data.data || []);
        }
      })
      .catch(err => console.error(err));

    Promise.all([p1, p2, p3, p4]).finally(() => {
      setLoading(false);
    });
  }, [city]);

  // Fetch nearby properties when coordinates change
  useEffect(() => {
    if (coords) {
      api.get(`/api/v1/property?lat=${coords.lat}&lng=${coords.lng}&maxDistance=${maxDistance}&sort=nearest`)
        .then(res => {
          if (res.data?.success && Array.isArray(res.data.data.properties)) {
            setNearby(res.data.data.properties);
          }
        })
        .catch(err => console.error(err));
    }
  }, [coords, maxDistance]);

  // Fetch Recently Viewed
  useEffect(() => {
    const key = "rentconnect_recently_viewed";
    let list = [];
    try {
      list = JSON.parse(localStorage.getItem(key)) || [];
    } catch {
      console.warn("Failed to parse recently viewed from localStorage");
    }
    if (list.length > 0) {
      Promise.all(
        list.map(id => 
          api.get(`/api/v1/property/${id}`)
            .then(res => res.data?.success ? res.data.data : null)
            .catch(() => null)
        )
      ).then(results => {
        setRecentlyViewed(results.filter(Boolean));
      });
    }
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    let query = `?city=${encodeURIComponent(city.toLowerCase())}`;
    if (search) query += `&search=${encodeURIComponent(search)}`;
    if (maxRent) query += `&maxRent=${maxRent}`;
    if (bedrooms !== "all") query += `&bedrooms=${bedrooms}`;
    if (furnishedStatus !== "all") query += `&furnishedStatus=${furnishedStatus}`;
    navigate(`/search${query}`);
  };

  const toggleFavorite = (propertyId) => {
    api.post(`/api/v1/property/user/favorites/${propertyId}`)
      .then((res) => {
        if (res.data?.success) {
          if (res.data.data.favorited) {
            setFavorites(prev => [...prev, propertyId]);
          } else {
            setFavorites(prev => prev.filter(id => id !== propertyId));
          }
        }
      })
      .catch(err => console.error(err));
  };

  const handleDirectChat = (ownerId) => {
    if (!ownerId) return;
    navigate("/chat", { state: { startChatWith: ownerId } });
  };

  // Render dashboard skeleton cards
  const renderSkeletons = () => (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))", gap: "16px" }}>
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="property-card glass-card" style={{ padding: "0" }}>
          <div className="skeleton skeleton-card" style={{ height: "180px", borderBottomLeftRadius: 0, borderBottomRightRadius: 0 }}></div>
          <div style={{ padding: "14px" }}>
            <div className="skeleton skeleton-line" style={{ width: "70%" }}></div>
            <div className="skeleton skeleton-line" style={{ width: "40%" }}></div>
            <div className="skeleton skeleton-line" style={{ width: "100%", marginTop: "12px" }}></div>
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="page">
      {/* Welcome banner */}
      <div className="glass-card" style={{ marginBottom: "28px", padding: "24px 32px", background: "linear-gradient(135deg, rgba(13, 148, 136, 0.1) 0%, rgba(17, 24, 39, 0.8) 100%)" }}>
        <h2 style={{ fontSize: "1.75rem", fontWeight: "800" }}>Hello, {user?.name}!</h2>
        <p style={{ color: "var(--muted)", fontSize: "0.95rem", marginTop: "4px" }}>
          Find flatmates, rooms, PGs, and houses. Talk to owners directly without middle-men.
        </p>
      </div>

      <div className="dashboard-layout">
        {/* Sidebar Filters */}
        <aside className="dashboard-sidebar glass-card" style={{ height: "fit-content", padding: "20px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", borderBottom: "1px solid var(--line)", paddingBottom: "12px", marginBottom: "16px" }}>
            <SlidersHorizontal size={18} style={{ color: "var(--accent)" }} />
            <h3 style={{ fontSize: "1.1rem", fontWeight: "700" }}>Search & Filter</h3>
          </div>

          <form onSubmit={handleSearchSubmit}>
            <div className="form-group">
              <label className="form-label">City Hub</label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="form-input"
                placeholder="Type any city name…"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Max Rent Budget (₹)</label>
              <input 
                type="number" 
                placeholder="e.g. 20000" 
                value={maxRent} 
                onChange={(e) => setMaxRent(e.target.value)} 
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Bedrooms</label>
              <select value={bedrooms} onChange={(e) => setBedrooms(e.target.value)} className="form-select">
                <option value="all">Any BHK</option>
                <option value="1">1 BHK</option>
                <option value="2">2 BHK</option>
                <option value="3">3 BHK</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Furnishing</label>
              <select value={furnishedStatus} onChange={(e) => setFurnishedStatus(e.target.value)} className="form-select">
                <option value="all">Any Status</option>
                <option value="unfurnished">Unfurnished</option>
                <option value="semi-furnished">Semi-Furnished</option>
                <option value="fully-furnished">Fully-Furnished</option>
              </select>
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: "100%", justifyContent: "center", marginTop: "8px", minHeight: "44px" }}>
              <Search size={16} />
              <span>Apply Filters</span>
            </button>
          </form>

          {/* Quick Stats wishlist / bookings */}
          <div style={{ marginTop: "24px", paddingTop: "20px", borderTop: "1px solid var(--line)", display: "flex", flexDirection: "column", gap: "12px" }}>
            <Link to="/favorites" className="sidebar-nav-item" style={{ padding: "8px 12px", minHeight: "44px" }}>
              <Heart size={16} style={{ color: "#ef4444" }} />
              <span style={{ fontSize: "0.85rem" }}>Wishlist ({favorites.length})</span>
            </Link>
            <div className="sidebar-nav-item" style={{ padding: "8px 12px", cursor: "default", minHeight: "44px" }}>
              <Clock size={16} style={{ color: "var(--accent)" }} />
              <span style={{ fontSize: "0.85rem" }}>Booked Visits ({bookings.length})</span>
            </div>
          </div>
        </aside>

        {/* Main Dash area */}
        <div style={{ display: "flex", flexDirection: "column", gap: "36px" }}>
          {/* Top Search bar */}
          <form onSubmit={handleSearchSubmit} className="glass-card" style={{ padding: "16px", display: "flex", gap: "10px" }}>
            <input
              type="text"
              placeholder="Search society, landmark, flat name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="form-input"
              style={{ flexGrow: 1 }}
            />
            <button type="submit" className="btn btn-primary" style={{ minHeight: "44px" }}>
              <Search size={16} />
              <span>Search</span>
            </button>
          </form>

          {/* Nearby Rentals Section */}
          <div className="glass-card" style={{ padding: "24px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", flexWrap: "wrap", gap: "12px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <Navigation size={20} style={{ color: "var(--accent-2)" }} />
                <h3 style={{ fontSize: "1.2rem", fontWeight: "700" }}>Nearby Rentals</h3>
              </div>
              {!coords ? (
                <button 
                  onClick={requestLocation} 
                  disabled={geoLoading} 
                  className="btn btn-secondary btn-small"
                  style={{ borderColor: "var(--accent-2)", minHeight: "36px" }}
                >
                  {geoLoading ? "Acquiring GPS..." : "Find Nearby Houses"}
                </button>
              ) : (
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <span style={{ fontSize: "0.8rem", color: "var(--muted)" }}>Range: {maxDistance}km</span>
                  <input 
                    type="range" 
                    min="5" 
                    max="50" 
                    step="5"
                    value={maxDistance} 
                    onChange={(e) => setMaxDistance(Number(e.target.value))}
                    style={{ width: "100px", accentColor: "var(--accent-2)" }}
                  />
                </div>
              )}
            </div>

            {coords ? (
              nearby.length > 0 ? (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))", gap: "16px" }}>
                  {nearby.map(prop => (
                    <DashboardCard 
                      key={prop._id} 
                      property={prop} 
                      isFavorited={favorites.includes(prop._id)} 
                      onFavoriteToggle={toggleFavorite}
                      onChatClick={handleDirectChat}
                    />
                  ))}
                </div>
              ) : (
                <p style={{ color: "var(--muted)", textAlign: "center", padding: "20px 0" }}>No properties listed within {maxDistance}km of your location.</p>
              )
            ) : (
              <div style={{ textAlign: "center", padding: "24px", color: "var(--muted)" }}>
                {geoError ? (
                  <p style={{ color: "var(--danger)" }}>Location access denied. Please enable location permissions in your browser to view nearby listings.</p>
                ) : (
                  <p>Click "Find Nearby Houses" to unlock direct distance measurements to properties around you.</p>
                )}
              </div>
            )}
          </div>

          {/* Recommended Section */}
          <div className="glass-card" style={{ padding: "24px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px" }}>
              <ThumbsUp size={20} style={{ color: "var(--accent)" }} />
              <h3 style={{ fontSize: "1.2rem", fontWeight: "700" }}>Recommended in {formatCity(city).toUpperCase()}</h3>
            </div>
            
            {loading ? (
              renderSkeletons()
            ) : recommended.length > 0 ? (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))", gap: "16px" }}>
                {recommended.map(prop => (
                  <DashboardCard 
                    key={prop._id} 
                    property={prop} 
                    isFavorited={favorites.includes(prop._id)} 
                    onFavoriteToggle={toggleFavorite}
                    onChatClick={handleDirectChat}
                  />
                ))}
              </div>
            ) : (
              <p style={{ color: "var(--muted)", textAlign: "center", padding: "20px 0" }}>No recommended properties in this city yet.</p>
            )}
          </div>

          {/* Scheduled Visits */}
          <div className="glass-card" style={{ padding: "24px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px" }}>
              <Clock size={20} style={{ color: "var(--warning)" }} />
              <h3 style={{ fontSize: "1.2rem", fontWeight: "700" }}>My Scheduled Visits</h3>
            </div>
            
            {bookings.length > 0 ? (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "16px" }}>
                {bookings.map((booking) => {
                  const prop = booking.propertyId;
                  if (!prop) return null;
                  const img = prop.images?.[0] || "/placeholder-property.jpg";
                  
                  return (
                    <div key={booking._id} style={{ display: "flex", gap: "12px", padding: "12px", border: "1px solid var(--line)", borderRadius: "var(--radius-md)", background: "rgba(255,255,255,0.01)" }}>
                      <img 
                        src={img} 
                        alt={prop.title} 
                        style={{ width: "70px", height: "70px", objectFit: "cover", borderRadius: "var(--radius-sm)" }} 
                        loading="lazy"
                        onError={(e) => { e.target.src = '/placeholder-property.jpg' }}
                      />
                      <div style={{ flexGrow: 1, minWidth: 0 }}>
                        <Link to={`/property/${prop._id}`} style={{ fontWeight: "700", fontSize: "0.85rem", display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {prop.title}
                        </Link>
                        <span style={{ fontSize: "0.75rem", color: "var(--muted)", display: "block" }}>📍 {prop.area}, {prop.city}</span>
                        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginTop: "4px" }}>
                          <span className="chip chip-success" style={{ fontSize: "0.6rem", padding: "2px 6px" }}>
                            📅 {new Date(booking.visitDate).toLocaleDateString()}
                          </span>
                          <span className="chip chip-accent" style={{ fontSize: "0.6rem", padding: "2px 6px" }}>
                            ⏰ {booking.visitTime}
                          </span>
                          <span className={`chip ${getBookingStatusMeta(booking.status).chipClass}`} style={{ fontSize: "0.6rem", padding: "2px 6px" }}>
                            {getBookingStatusMeta(booking.status).label}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div style={{ textAlign: "center", padding: "32px 16px" }}>
                <Clock size={36} style={{ color: "var(--muted)", margin: "0 auto 12px" }} />
                <p style={{ color: "var(--muted)", fontSize: "0.9rem", marginBottom: "16px" }}>No visits scheduled yet.</p>
                <Link to="/search" className="btn btn-primary" style={{ margin: "0 auto", display: "inline-flex", minHeight: "44px" }}>Find a Property</Link>
              </div>
            )}
          </div>

          {/* Recently Viewed Section */}
          {recentlyViewed.length > 0 && (
            <div className="glass-card" style={{ padding: "24px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px" }}>
                <Bookmark size={20} style={{ color: "var(--accent-2)" }} />
                <h3 style={{ fontSize: "1.2rem", fontWeight: "700" }}>Recently Viewed</h3>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))", gap: "16px" }}>
                {recentlyViewed.map(prop => (
                  <DashboardCard 
                    key={prop._id} 
                    property={prop} 
                    isFavorited={favorites.includes(prop._id)} 
                    onFavoriteToggle={toggleFavorite}
                    onChatClick={handleDirectChat}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Recently Added Section */}
          <div className="glass-card" style={{ padding: "24px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px" }}>
              <Clock size={20} style={{ color: "var(--accent)" }} />
              <h3 style={{ fontSize: "1.2rem", fontWeight: "700" }}>Recently Added Listings</h3>
            </div>
            
            {loading ? (
              renderSkeletons()
            ) : recentlyAdded.length > 0 ? (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))", gap: "16px" }}>
                {recentlyAdded.map(prop => (
                  <DashboardCard 
                    key={prop._id} 
                    property={prop} 
                    isFavorited={favorites.includes(prop._id)} 
                    onFavoriteToggle={toggleFavorite}
                    onChatClick={handleDirectChat}
                  />
                ))}
              </div>
            ) : (
              <p style={{ color: "var(--muted)", textAlign: "center", padding: "20px 0" }}>No rental properties listed yet.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Sub-component for dashboard cards
function DashboardCard({ property, isFavorited, onFavoriteToggle, onChatClick }) {
  const img = property.images?.[0] || "/placeholder-property.jpg";

  return (
    <div className={`property-card ${property.listingStatus === 'rented' ? 'rented' : ''}`} style={{ borderRadius: "var(--radius-md)" }}>
      <div className="card-image-container" style={{ aspectRatio: "4 / 3" }}>
        <img 
          src={img} 
          alt={property.title} 
          className="card-image" 
          loading="lazy"
          onError={(e) => { e.target.src = '/placeholder-property.jpg' }}
        />
        <span className="chip chip-accent card-badge" style={{ padding: "2px 8px", fontSize: "0.65rem" }}>
          {property.propertyType}
        </span>
        {property.listingStatus && property.listingStatus !== "available" && (
          <span className={`chip ${property.listingStatus === "hidden" ? "chip-danger" : "chip-accent-2"}`} style={{ position: "absolute", top: "8px", right: "8px", zIndex: 2, fontSize: "0.65rem", padding: "2px 8px" }}>
            {property.listingStatus}
          </span>
        )}
        {property.isVerifiedProperty && (
          <span className="chip chip-success" style={{ position: "absolute", bottom: "8px", left: "8px", zIndex: 2, fontSize: "0.65rem", padding: "2px 8px" }}>
            Verified
          </span>
        )}
        {property.listingStatus !== "rented" && (
          <button 
            onClick={() => onFavoriteToggle(property._id)} 
            className={`card-favorite-btn ${isFavorited ? 'favorited' : ''}`}
            style={{ width: "30px", height: "30px", minHeight: "30px" }}
          >
            <Heart size={14} fill={isFavorited ? "currentColor" : "none"} />
          </button>
        )}
        {property.distanceKm !== undefined && (
          <span className="chip chip-accent-2" style={{ position: "absolute", bottom: "8px", left: "8px", zIndex: 2, fontSize: "0.65rem", padding: "2px 8px" }}>
            📍 {property.distanceKm} km
          </span>
        )}
      </div>

      <div className="property-card-body" style={{ padding: "14px" }}>
        <h3 style={{ fontSize: "0.95rem", fontWeight: "700" }}>{property.title}</h3>
        <span style={{ fontSize: "0.8rem", color: "var(--muted)", display: "block", marginBottom: "8px" }}>
          📍 {property.area}, {formatCity(property.city).toUpperCase()}
        </span>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid var(--line)", paddingTop: "10px", marginTop: "auto" }}>
          <div>
            <strong style={{ fontSize: "1.1rem", color: "var(--accent-2)", display: "block" }}>₹{formatMoney(property.rent)}</strong>
            <span style={{ fontSize: "0.7rem", color: "var(--muted)" }}>Deposit: ₹{formatMoney(property.deposit)}</span>
          </div>
          <div style={{ display: "flex", gap: "6px" }}>
            {property.ownerId?._id && (
              <button onClick={() => onChatClick(property.ownerId?._id)} className="btn btn-secondary btn-icon btn-small" title="Message Owner" style={{ minHeight: "32px", width: "32px", height: "32px" }}>
                <MessageSquare size={12} />
              </button>
            )}
            <Link to={`/property/${property._id}`} className="btn btn-primary btn-small" style={{ fontSize: "0.75rem", padding: "6px 10px", minHeight: "32px" }}>
              View
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
