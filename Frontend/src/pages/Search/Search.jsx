import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { api } from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../hooks/useToast";
import { formatMoney, formatCity } from "../../utils/formatters";
import { 
  MapPin, 
  Bed, 
  Bath, 
  Search as SearchIcon, 
  SlidersHorizontal, 
  Navigation, 
  Compass, 
  Heart,
  Phone,
  MessageSquare,
  Sparkles,
  Calendar,
  Check,
  Filter,
  X
} from "lucide-react";

const AMENITY_OPTIONS = [
  "WiFi",
  "AC",
  "Parking",
  "Gym",
  "Lift",
  "Power Backup",
  "Security",
  "Washing Machine"
];

export default function Search() {
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const showToast = useToast();

  // Search parameters prefill
  const queryCity = searchParams.get("city") || "";
  const querySearch = searchParams.get("search") || "";
  const queryType = searchParams.get("propertyType") || "all";
  const queryMaxRent = searchParams.get("maxRent") || "";

  // State definitions
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
  // Filter States
  const [city, setCity] = useState(queryCity.trim());
  const [search, setSearch] = useState(querySearch);
  const [propertyType, setPropertyType] = useState(queryType);
  const [minRent, setMinRent] = useState("");
  const [maxRent, setMaxRent] = useState(queryMaxRent);
  const [bedrooms, setBedrooms] = useState("all");
  const [furnishedStatus, setFurnishedStatus] = useState("all");
  const [sort, setSort] = useState("latest");
  const [genderPreference, setGenderPreference] = useState("all");
  const [isVerifiedOnly, setIsVerifiedOnly] = useState(false);
  const [availableFrom, setAvailableFrom] = useState("");
  const [selectedAmenities, setSelectedAmenities] = useState([]);

  // Mobile filters panel toggle
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  // Geolocation
  const [useGeo, setUseGeo] = useState(false);
  const [lat, setLat] = useState(null);
  const [lng, setLng] = useState(null);
  const [maxDistance, setMaxDistance] = useState(25);
  
  // Favorites tracking
  const [favoritedIds, setFavoritedIds] = useState([]);





  // Toggle user geolocation
  const handleGeoToggle = () => {
    if (!useGeo) {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            setLat(position.coords.latitude);
            setLng(position.coords.longitude);
            setUseGeo(true);
            setSort("nearest");
            showToast("Geolocation activated.");
          },
          (err) => {
            showToast("Unable to fetch location: " + err.message, "error");
          }
        );
      } else {
        showToast("Geolocation is not supported by your browser.", "error");
      }
    } else {
      setUseGeo(false);
      setLat(null);
      setLng(null);
      if (sort === "nearest") {
        setSort("latest");
      }
      showToast("Geolocation disabled.");
    }
  };

  // Fetch properties from backend based on filters
  const fetchProperties = (targetPage = 1) => {
    setLoading(true);
    let url = `/api/v1/property?city=${encodeURIComponent(city.toLowerCase())}&sort=${sort}&page=${targetPage}&limit=12`;
    
    if (search) url += `&search=${encodeURIComponent(search)}`;
    if (propertyType !== "all") url += `&propertyType=${propertyType}`;
    if (minRent) url += `&minRent=${minRent}`;
    if (maxRent) url += `&maxRent=${maxRent}`;
    if (bedrooms !== "all") url += `&bedrooms=${bedrooms}`;
    if (furnishedStatus !== "all") url += `&furnishedStatus=${furnishedStatus}`;
    if (genderPreference !== "all") url += `&genderPreference=${genderPreference}`;
    if (isVerifiedOnly) url += `&isVerifiedOnly=true`;
    if (availableFrom) url += `&availableFrom=${availableFrom}`;
    if (selectedAmenities.length > 0) url += `&amenities=${selectedAmenities.join(",")}`;
    
    if (useGeo && lat && lng) {
      url += `&lat=${lat}&lng=${lng}&maxDistance=${maxDistance}`;
    }

    api.get(url)
      .then((res) => {
        if (res.data?.success) {
          const { properties: list, page: p, totalPages: tp } = res.data.data;
          setProperties(list || []);
          setPage(p || 1);
          setTotalPages(tp || 1);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching search properties:", err);
        setLoading(false);
        showToast("Failed to fetch properties.", "error");
      });
  };

  // Fetch user favorites
  const fetchFavorites = () => {
    if (!user || user.role !== "user") return;
    api.get(`/api/v1/property/user/favorites`)
      .then((res) => {
        if (res.data?.success && Array.isArray(res.data.data)) {
          setFavoritedIds(res.data.data.map(item => item._id));
        }
      })
      .catch((err) => console.error("Error fetching favorites:", err));
  };

  useEffect(() => {
    fetchProperties(1);
  }, [
    city, propertyType, minRent, maxRent, bedrooms, furnishedStatus, sort, 
    useGeo, lat, lng, maxDistance, genderPreference, isVerifiedOnly, availableFrom, selectedAmenities
  ]);

  useEffect(() => {
    fetchFavorites();
  }, [user]);

  // Handle Search Input submit
  const handleTextSearchSubmit = (e) => {
    e.preventDefault();
    fetchProperties(1);
  };

  // Favorite button toggle
  const toggleFavorite = (propertyId, e) => {
    e.preventDefault();
    if (!user) {
      showToast("Please login as a tenant to save favorites.", "error");
      return;
    }
    if (user.role !== "user") {
      showToast("Only tenant accounts can save favorites.", "error");
      return;
    }

    api.post(`/api/v1/property/user/favorites/${propertyId}`)
      .then((res) => {
        if (res.data?.success) {
          if (res.data.data.favorited) {
            setFavoritedIds(prev => [...prev, propertyId]);
            showToast("Added to favorites.");
          } else {
            setFavoritedIds(prev => prev.filter(id => id !== propertyId));
            showToast("Removed from favorites.");
          }
        }
      })
      .catch((err) => {
        console.error("Error toggling favorite:", err);
        showToast("Failed to toggle favorite.", "error");
      });
  };

  // Clear all filters
  const handleClearFilters = () => {
    setSearch("");
    setPropertyType("all");
    setMinRent("");
    setMaxRent("");
    setBedrooms("all");
    setFurnishedStatus("all");
    setGenderPreference("all");
    setIsVerifiedOnly(false);
    setAvailableFrom("");
    setSelectedAmenities([]);
    setUseGeo(false);
    setLat(null);
    setLng(null);
    setSort("latest");
    showToast("Filters cleared.");
  };

  // Handle amenity change
  const handleAmenityChange = (amenity) => {
    if (selectedAmenities.includes(amenity)) {
      setSelectedAmenities(prev => prev.filter(item => item !== amenity));
    } else {
      setSelectedAmenities(prev => [...prev, amenity]);
    }
  };

  // Render Skeleton Cards
  const renderSkeletons = () => (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "20px" }}>
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="property-card glass-card" style={{ padding: "0", minHeight: "360px" }}>
          <div className="skeleton skeleton-card" style={{ borderBottomLeftRadius: 0, borderBottomRightRadius: 0 }}></div>
          <div style={{ padding: "20px" }}>
            <div className="skeleton skeleton-line" style={{ width: "80%" }}></div>
            <div className="skeleton skeleton-line" style={{ width: "40%" }}></div>
            <div className="skeleton skeleton-line" style={{ width: "100%", marginTop: "16px" }}></div>
            <div className="skeleton skeleton-line" style={{ width: "60%" }}></div>
          </div>
        </div>
      ))}
    </div>
  );

  // Filters Content Component (reusable for sidebar & mobile panel)
  const FiltersContent = () => (
    <>
      <div className="form-group">
        <label className="form-label">City</label>
        <input
          type="text"
          value={city}
          onChange={(e) => setCity(e.target.value)}
          className="form-input"
          placeholder="Type any city name…"
        />
      </div>

      <div className="form-group">
        <label className="form-label">Property Type</label>
        <select value={propertyType} onChange={(e) => setPropertyType(e.target.value)} className="form-select">
          <option value="all">All Types</option>
          <option value="flat">Flat / Apartment</option>
          <option value="room">Private Room</option>
          <option value="pg">PG / Hostel</option>
          <option value="house">Independent House</option>
        </select>
      </div>

      <div className="form-group">
        <label className="form-label">Monthly Rent (₹)</label>
        <div style={{ display: "flex", gap: "8px" }}>
          <input 
            type="number" 
            placeholder="Min" 
            value={minRent} 
            onChange={(e) => setMinRent(e.target.value)} 
            className="form-input" 
            style={{ padding: "8px 12px" }}
          />
          <input 
            type="number" 
            placeholder="Max" 
            value={maxRent} 
            onChange={(e) => setMaxRent(e.target.value)} 
            className="form-input" 
            style={{ padding: "8px 12px" }}
          />
        </div>
      </div>

      <div className="form-group">
        <label className="form-label">Bedrooms</label>
        <select value={bedrooms} onChange={(e) => setBedrooms(e.target.value)} className="form-select">
          <option value="all">Any BHK</option>
          <option value="1">1 BHK</option>
          <option value="2">2 BHK</option>
          <option value="3">3 BHK</option>
          <option value="4">4+ BHK</option>
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

      <div className="form-group">
        <label className="form-label">Preferred Gender</label>
        <select value={genderPreference} onChange={(e) => setGenderPreference(e.target.value)} className="form-select">
          <option value="all">Any Preference</option>
          <option value="any">Co-living / Any</option>
          <option value="male">Boys Only</option>
          <option value="female">Girls Only</option>
        </select>
      </div>

      <div className="form-group">
        <label className="form-label">Available From (On/Before)</label>
        <input 
          type="date"
          value={availableFrom}
          onChange={(e) => setAvailableFrom(e.target.value)}
          className="form-input"
        />
      </div>

      <div className="form-group" style={{ display: "flex", alignItems: "center", gap: "10px", padding: "6px 0" }}>
        <input 
          type="checkbox"
          id="verified-only"
          checked={isVerifiedOnly}
          onChange={(e) => setIsVerifiedOnly(e.target.checked)}
          style={{ width: "18px", height: "18px", accentColor: "var(--accent)" }}
        />
        <label htmlFor="verified-only" style={{ fontSize: "0.85rem", fontWeight: "600", cursor: "pointer" }}>
          Verified Properties Only
        </label>
      </div>

      <div className="form-group" style={{ marginTop: "12px" }}>
        <label className="form-label">Amenities</label>
        <div style={{ display: "flex", flexDirection: "column", gap: "6px", maxHeight: "150px", overflowY: "auto", padding: "4px" }}>
          {AMENITY_OPTIONS.map(amenity => (
            <label key={amenity} style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "0.82rem", cursor: "pointer" }}>
              <input 
                type="checkbox" 
                checked={selectedAmenities.includes(amenity)}
                onChange={() => handleAmenityChange(amenity)}
                style={{ accentColor: "var(--accent)" }}
              />
              <span>{amenity}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Geolocation Filter */}
      <div className="form-group" style={{ borderTop: "1px solid var(--line)", paddingTop: "16px", marginTop: "16px" }}>
        <button 
          type="button" 
          onClick={handleGeoToggle}
          className={`btn ${useGeo ? 'btn-primary' : 'btn-secondary'}`}
          style={{ width: "100%", justifyContent: "center" }}
        >
          <Navigation size={16} />
          <span>{useGeo ? "Disable Geolocation" : "Use Geolocation"}</span>
        </button>
        
        {useGeo && (
          <div style={{ marginTop: "12px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.8rem", color: "var(--muted)", marginBottom: "4px" }}>
              <span>Max Distance:</span>
              <span style={{ fontWeight: "700" }}>{maxDistance} km</span>
            </div>
            <input 
              type="range" 
              min="5" 
              max="100" 
              step="5"
              value={maxDistance} 
              onChange={(e) => setMaxDistance(Number(e.target.value))}
              style={{ width: "100%", accentColor: "var(--accent)" }}
            />
          </div>
        )}
      </div>

      <button 
        type="button" 
        onClick={handleClearFilters}
        className="btn btn-secondary"
        style={{ width: "100%", justifyContent: "center", marginTop: "12px", color: "var(--danger)" }}
      >
        Clear All Filters
      </button>
    </>
  );

  return (
    <div className="page">
      {/* Search Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "28px", flexWrap: "wrap", gap: "12px" }}>
        <div>
          <h1 style={{ fontSize: "2rem", fontWeight: "800" }}>Explore Rentals</h1>
          <p style={{ color: "var(--muted)", fontSize: "0.95rem" }}>
            Find broker-free rental houses, flats, PGs, and rooms directly from verified owners
          </p>
        </div>
        
        {/* Mobile Filters trigger button */}
        <button 
          onClick={() => setShowMobileFilters(true)}
          className="btn btn-secondary mobile-only"
          style={{ display: "none", alignItems: "center", gap: "8px", minHeight: "44px" }}
        >
          <Filter size={16} />
          <span>Filters</span>
        </button>
      </div>

      <div className="dashboard-layout">
        {/* Filter Sidebar (Desktop-only below 960px) */}
        <aside className="dashboard-sidebar glass-card desktop-filters" style={{ height: "fit-content", padding: "20px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", borderBottom: "1px solid var(--line)", paddingBottom: "12px", marginBottom: "16px" }}>
            <SlidersHorizontal size={18} style={{ color: "var(--accent)" }} />
            <h3 style={{ fontSize: "1.1rem", fontWeight: "700" }}>Search Filters</h3>
          </div>
          {FiltersContent()}
        </aside>

        {/* Main Content Area */}
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          {/* Top Search bar & Sort */}
          <div className="glass-card" style={{ padding: "16px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
            <form onSubmit={handleTextSearchSubmit} style={{ display: "flex", flexGrow: 1, maxWidth: "500px", gap: "10px" }}>
              <input
                type="text"
                placeholder="Search description, address, area..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="form-input"
                style={{ padding: "8px 14px", fontSize: "0.9rem" }}
              />
              <button type="submit" className="btn btn-secondary btn-icon" style={{ borderRadius: "var(--radius-md)", minHeight: "44px" }}>
                <SearchIcon size={16} />
              </button>
            </form>

            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <span style={{ fontSize: "0.85rem", color: "var(--muted)" }}>Sort by</span>
              <select value={sort} onChange={(e) => setSort(e.target.value)} className="form-select" style={{ width: "160px", padding: "8px 12px" }}>
                <option value="latest">Latest Added</option>
                <option value="lowestPrice">Price: Low to High</option>
                {useGeo && <option value="nearest">Nearest Proximity</option>}
              </select>
            </div>
          </div>

          {/* Properties Grid */}
          {loading ? (
            renderSkeletons()
          ) : properties.length > 0 ? (
            <>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "20px" }}>
                {properties.map((property) => {
                  const images = property.images && property.images.length > 0 
                    ? property.images 
                    : ["/placeholder-property.jpg"];
                  const isFavorited = favoritedIds.includes(property._id);
                  const imageCount = property.images?.length || 1;

                  return (
                    <div key={property._id} className={`property-card ${property.listingStatus === 'rented' ? 'rented' : ''}`}>
                      <div className="card-image-container">
                        <img 
                          src={images[0]} 
                          alt={property.title} 
                          className="card-image" 
                          loading="lazy"
                          onError={(e) => { e.target.src = '/placeholder-property.jpg' }}
                        />
                        
                        {/* Verified badge overlay */}
                        {property.isVerifiedProperty && (
                          <span className="chip chip-success card-badge" style={{ textTransform: "none", fontSize: "0.65rem", padding: "2px 8px" }}>
                            Verified
                          </span>
                        )}

                        {/* Image count indicator overlay */}
                        <span className="chip" style={{ position: "absolute", bottom: "10px", right: "10px", zIndex: 2, background: "rgba(0,0,0,0.6)", color: "#fff", borderColor: "transparent", fontSize: "0.65rem", padding: "2px 6px" }}>
                          1/{imageCount} photos
                        </span>

                        {/* Rented status badge overlay */}
                        {property.listingStatus === "rented" && (
                          <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.5)", display: "grid", placeItems: "center", zIndex: 3 }}>
                            <span className="chip chip-danger" style={{ fontSize: "0.9rem", padding: "8px 16px" }}>Rented</span>
                          </div>
                        )}

                        {user && user.role === "user" && property.listingStatus !== "rented" && (
                          <button 
                            onClick={(e) => toggleFavorite(property._id, e)} 
                            className={`card-favorite-btn ${isFavorited ? 'favorited' : ''}`}
                            style={{ minHeight: "36px" }}
                          >
                            <Heart size={16} fill={isFavorited ? "currentColor" : "none"} />
                          </button>
                        )}

                        {property.distanceKm !== undefined && (
                          <span className="chip chip-accent-2" style={{ position: "absolute", bottom: "10px", left: "10px", zIndex: 2 }}>
                            📍 {property.distanceKm} km
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
                            {/* Price-per-month prominent label */}
                            <strong style={{ fontSize: "1.5rem", color: "var(--accent-2)", fontWeight: "800" }}>
                              ₹{formatMoney(property.rent)}
                              <span style={{ fontSize: "0.75rem", color: "var(--muted)", fontWeight: "500" }}> /mo</span>
                            </strong>
                            <span>Deposit: ₹{formatMoney(property.deposit)}</span>
                          </div>
                          
                          <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", justifyContent: "flex-end" }}>
                            {user && property.contactNumber ? (
                              <a href={`tel:${property.contactNumber}`} className="btn btn-secondary btn-icon btn-small" title="Call Owner" style={{ minHeight: "32px", width: "32px", height: "32px" }}>
                                <Phone size={12} />
                              </a>
                            ) : null}
                            
                            {property.ownerId?._id && user && user._id !== property.ownerId._id && (
                              <button 
                                onClick={() => navigate("/chat", { state: { startChatWith: property.ownerId._id } })} 
                                className="btn btn-secondary btn-icon btn-small" 
                                title="Message Owner"
                                style={{ minHeight: "32px", width: "32px", height: "32px" }}
                              >
                                <MessageSquare size={12} />
                              </button>
                            )}
                            <Link to={`/property/${property._id}`} className="btn btn-primary btn-small" style={{ minHeight: "32px", padding: "0 12px" }}>
                              View
                            </Link>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "14px", marginTop: "32px" }}>
                  <button 
                    disabled={page === 1} 
                    onClick={() => fetchProperties(page - 1)}
                    className="btn btn-secondary"
                    style={{ minHeight: "40px" }}
                  >
                    Previous
                  </button>
                  <span style={{ fontSize: "0.9rem", color: "var(--muted)" }}>
                    Page <strong>{page}</strong> of {totalPages}
                  </span>
                  <button 
                    disabled={page === totalPages} 
                    onClick={() => fetchProperties(page + 1)}
                    className="btn btn-secondary"
                    style={{ minHeight: "40px" }}
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="glass-card" style={{ textAlign: "center", padding: "64px 24px" }}>
              <Compass size={48} style={{ color: "var(--muted)", marginBottom: "16px" }} />
              <h3>No properties found in {formatCity(city)}</h3>
              <p style={{ color: "var(--muted)", marginTop: "6px", fontSize: "0.95rem", marginBottom: "18px" }}>
                Try adjusting your search criteria, clearing rent limits, or selecting another city.
              </p>
              <button onClick={handleClearFilters} className="btn btn-primary" style={{ margin: "0 auto" }}>
                Clear Filters
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Filters Panel (Collapsible Slide-in Bottom Sheet) */}
      {showMobileFilters && (
        <div className="modal-overlay" style={{ display: "flex", alignItems: "flex-end", justifyContent: "center", padding: "0" }}>
          <div 
            className="glass-card" 
            style={{ 
              width: "100%", 
              borderBottomLeftRadius: "0", 
              borderBottomRightRadius: "0", 
              maxHeight: "85vh", 
              overflowY: "auto", 
              animation: "slideIn 0.3s ease-out",
              padding: "24px"
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--line)", paddingBottom: "12px", marginBottom: "16px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <SlidersHorizontal size={18} style={{ color: "var(--accent)" }} />
                <strong style={{ fontSize: "1.1rem", fontWeight: "700" }}>Filters</strong>
              </div>
              <button 
                onClick={() => setShowMobileFilters(false)} 
                className="btn btn-secondary btn-icon"
                style={{ minHeight: "36px", width: "36px", height: "36px", borderRadius: "50%" }}
              >
                <X size={16} />
              </button>
            </div>
            
            <div style={{ display: "flex", flexDirection: "column", gap: "12px", paddingBottom: "32px" }}>
              {FiltersContent()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
