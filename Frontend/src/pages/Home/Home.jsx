import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../../services/api";
import { formatMoney, formatCity } from "../../utils/formatters";
import { 
  MapPin, 
  Search as SearchIcon, 
  Home as HomeIcon, 
  Bed, 
  Map, 
  ArrowRight,
  TrendingUp,
  Compass,
  Star
} from "lucide-react";

export default function Home() {
  const navigate = useNavigate();
  const [city, setCity] = useState("");
  const [area, setArea] = useState("");
  const [maxRent, setMaxRent] = useState("");
  const [featured, setFeatured] = useState([]);
  const [nearby, setNearby] = useState([]);
  const [recentlyViewed, setRecentlyViewed] = useState([]);



  // Fetch featured properties on mount
  useEffect(() => {
    api.get(`/api/v1/property?limit=3`)
      .then((res) => {
        if (res.data?.success && Array.isArray(res.data.data.properties)) {
          setFeatured(res.data.data.properties.slice(0, 3));
        }
      })
      .catch((err) => console.error("Error fetching featured properties:", err));
  }, []);

  // Request location for nearby properties
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;

          // Fetch nearest properties from API
          api.get(`/api/v1/property?lat=${lat}&lng=${lng}&maxDistance=50&sort=nearest&limit=3`)
            .then((res) => {
              if (res.data?.success && Array.isArray(res.data.data.properties)) {
                setNearby(res.data.data.properties.slice(0, 3));
              }
            })
            .catch((err) => {
              console.error("Error fetching nearby properties:", err);
            });
        },
        (error) => {
          console.log("Geolocation permission denied or error:", error);
        }
      );
    }
  }, []);

  // Fetch Recently Viewed properties details from LocalStorage list of IDs
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
    if (area) query += `&search=${encodeURIComponent(area)}`;
    if (maxRent) query += `&maxRent=${maxRent}`;
    navigate(`/search${query}`);
  };

  const handleQuickCategory = (type) => {
    navigate(`/search?propertyType=${type}`);
  };

  const handlePopularCity = (cityName) => {
    navigate(`/search?city=${encodeURIComponent(cityName.toLowerCase())}`);
  };

  return (
    <div className="page">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-content">
          <h1>Direct broker-free rentals made easy</h1>
          <p>
            Connect directly with flat owners, PG operators, and roommates in major Indian cities.
          </p>

          <form onSubmit={handleSearchSubmit} className="hero-search-bar glass-card">
            <div className="search-input-group">
              <MapPin size={18} style={{ color: "var(--accent)" }} />
              <input
                type="text"
                placeholder="Type your city (e.g. Surat, Nagpur…)"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="form-input"
                required
              />
            </div>
            
            <div className="search-input-group">
              <SearchIcon size={18} style={{ color: "var(--accent-2)" }} />
              <input 
                type="text" 
                placeholder="Search area or locality..." 
                value={area} 
                onChange={(e) => setArea(e.target.value)}
                className="form-input"
              />
            </div>

            <div className="search-input-group">
              <span style={{ fontSize: "1rem", color: "var(--accent)" }}>₹</span>
              <input 
                type="number" 
                placeholder="Max Rent" 
                value={maxRent} 
                onChange={(e) => setMaxRent(e.target.value)}
                className="form-input"
              />
            </div>

            <button type="submit" className="btn btn-primary" style={{ padding: "14px 28px", borderTopLeftRadius: 0, borderBottomLeftRadius: 0, minHeight: "44px" }}>
              <span>Search</span>
            </button>
          </form>
        </div>

        <div className="hero-graphic mobile-hide" style={{ position: "relative" }}>
          <div className="glass-card" style={{ display: "flex", flexDirection: "column", gap: "16px", padding: "32px", width: "100%", height: "360px", background: "linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.02) 100%)" }}>
            <div className="chip chip-accent" style={{ alignSelf: "start" }}>
              <TrendingUp size={14} />
              <span>Direct Mapped Platform</span>
            </div>
            <h2 style={{ fontSize: "2rem", fontWeight: "900", lineHeight: "1.2" }}>No Brokers.<br />No Spams.<br />Just Real Listings.</h2>
            <p style={{ color: "var(--muted)" }}>RentConnect matches tenants with verified owners, ensuring full security and transparency in real-time communication.</p>
            <div style={{ display: "flex", gap: "10px", marginTop: "auto" }}>
              <Link to="/search" className="btn btn-primary" style={{ minHeight: "44px" }}>Start Exploring</Link>
              <Link to="/about" className="btn btn-secondary" style={{ minHeight: "44px" }}>Learn More</Link>
            </div>
          </div>
        </div>
      </section>

      {/* Category Strip */}
      <section className="category-strip">
        {[
          { type: "flat", label: "Flats & Apartments", icon: "🏢" },
          { type: "room", label: "Private Rooms", icon: "🔑" },
          { type: "pg", label: "PGs & Hostels", icon: "🤝" },
          { type: "house", label: "Independent Houses", icon: "🏡" }
        ].map((cat) => (
          <div key={cat.type} onClick={() => handleQuickCategory(cat.type)} className="category-card glass-card">
            <div className="category-icon">{cat.icon}</div>
            <strong style={{ fontSize: "0.95rem" }}>{cat.label}</strong>
          </div>
        ))}
      </section>

      {/* Geolocation Nearest Section */}
      {nearby.length > 0 && (
        <section className="section" style={{ marginTop: "56px" }}>
          <div className="section-head">
            <div>
              <h2 style={{ fontSize: "1.75rem", fontWeight: "800" }}>Nearest Rentals to You</h2>
              <p style={{ color: "var(--muted)" }}>Automatically calculated using your current coordinates</p>
            </div>
            <Link to="/search?sort=nearest" className="btn btn-secondary btn-small" style={{ minHeight: "36px" }}>
              <span>View All Nearby</span> <ArrowRight size={14} />
            </Link>
          </div>
          <div className="grid-3">
            {nearby.map((property) => (
              <PropertyCard key={property._id} property={property} />
            ))}
          </div>
        </section>
      )}

      {/* Featured Properties Section */}
      <section className="section" style={{ marginTop: "56px" }}>
        <div className="section-head">
          <div>
            <h2 style={{ fontSize: "1.75rem", fontWeight: "800" }}>Featured Properties</h2>
            <p style={{ color: "var(--muted)" }}>Handpicked rental listings across top hubs</p>
          </div>
          <Link to="/search" className="btn btn-secondary btn-small" style={{ minHeight: "36px" }}>
            <span>Explore All</span> <ArrowRight size={14} />
          </Link>
        </div>
        
        {featured.length > 0 ? (
          <div className="grid-3">
            {featured.map((property) => (
              <PropertyCard key={property._id} property={property} />
            ))}
          </div>
        ) : (
          <div className="glass-card" style={{ textAlign: "center", padding: "48px 24px" }}>
            <p style={{ color: "var(--muted)", marginBottom: "16px" }}>No properties listed yet.</p>
            <Link to="/register?owner=true" className="btn btn-primary" style={{ minHeight: "44px" }}>List Your Property Now</Link>
          </div>
        )}
      </section>

      {/* Recently Viewed Section */}
      {recentlyViewed.length > 0 && (
        <section className="section" style={{ marginTop: "56px" }}>
          <h2 style={{ fontSize: "1.75rem", fontWeight: "800", marginBottom: "8px" }}>Recently Viewed</h2>
          <p style={{ color: "var(--muted)", marginBottom: "24px" }}>Pick up right where you left off</p>
          <div className="grid-3">
            {recentlyViewed.map((property) => (
              <PropertyCard key={property._id} property={property} />
            ))}
          </div>
        </section>
      )}

      {/* Popular Cities */}
      <section className="section" style={{ marginTop: "56px" }}>
        <h2 style={{ fontSize: "1.75rem", fontWeight: "800", marginBottom: "8px" }}>Explore Popular Cities</h2>
        <p style={{ color: "var(--muted)", marginBottom: "24px" }}>Find premium verified broker-free rentals in top tech & education hubs</p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px" }}>
          {[
            { name: "Pune", count: "IT & Education Hub", img: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=400&q=80" },
            { name: "Mumbai", count: "Financial Capital", img: "https://images.unsplash.com/photo-1570129477492-45c003edd2be?auto=format&fit=crop&w=400&q=80" },
            { name: "Bangalore", count: "Silicon Valley", img: "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=400&q=80" },
            { name: "Delhi", count: "Capital City", img: "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=400&q=80" },
          ].map((cityItem) => (
            <div 
              key={cityItem.name} 
              onClick={() => handlePopularCity(cityItem.name)} 
              className="property-card" 
              style={{ cursor: "pointer", height: "160px" }}
            >
              <div style={{ width: "100%", height: "100%", position: "relative" }}>
                <img src={cityItem.img} alt={cityItem.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                <div style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, background: "linear-gradient(0deg, rgba(11,15,25,0.9) 0%, rgba(11,15,25,0.2) 100%)", display: "flex", flexDirection: "column", justifyContent: "flex-end", padding: "16px" }}>
                  <h4 style={{ fontSize: "1.2rem", fontWeight: "800" }}>{cityItem.name}</h4>
                  <span style={{ fontSize: "0.8rem", color: "var(--muted)" }}>{cityItem.count}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

// PropertyCard helper component
function PropertyCard({ property }) {
  const images = property.images && property.images.length > 0 
    ? property.images 
    : ["/placeholder-property.jpg"];

  return (
    <div className="property-card">
      <div className="card-image-container">
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
            View Details
          </Link>
        </div>
      </div>
    </div>
  );
}
