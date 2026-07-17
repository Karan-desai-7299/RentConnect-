import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { api } from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../hooks/useToast";
import { formatMoney, formatCity } from "../../utils/formatters";
import { 
  MapPin, 
  Bed, 
  Bath, 
  MessageSquare, 
  Phone, 
  User, 
  AlertTriangle, 
  Heart,
  Share2,
  ChevronRight,
  ShieldCheck,
  CheckCircle,
  Building,
  Star,
  Calendar
} from "lucide-react";

export default function PropertyDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const showToast = useToast();

  // State definitions
  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeImage, setActiveImage] = useState("");
  const [similar, setSimilar] = useState([]);
  const [favorited, setFavorited] = useState(false);
  
  // Listing reporting form
  const [reportReason, setReportReason] = useState("");
  const [reportSuccess, setReportSuccess] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);

  // Visit booking state
  const [visitBooked, setVisitBooked] = useState(false);
  const [visitDate, setVisitDate] = useState("");
  const [visitTime, setVisitTime] = useState("");

  // Reviews state
  const [reviews, setReviews] = useState([]);
  const [avgRating, setAvgRating] = useState(0);
  const [reviewCount, setReviewCount] = useState(0);
  const [hasCompletedBooking, setHasCompletedBooking] = useState(false);
  const [ratingInput, setRatingInput] = useState(5);
  const [commentInput, setCommentInput] = useState("");
  const [reviewPosted, setReviewPosted] = useState(false);

  // Fetch listing data
  const fetchPropertyData = () => {
    setLoading(true);
    api.get(`/api/v1/property/${id}`)
      .then((res) => {
        if (res.data?.success) {
          const data = res.data.data;
          setProperty(data);
          setActiveImage(data.images?.[0] || "/placeholder-property.jpg");
          setAvgRating(data.rating?.average || 0);
          setReviewCount(data.rating?.count || 0);
          setLoading(false);

          // Fetch similar properties in the same city
          api.get(`/api/v1/property?city=${data.city.toLowerCase()}`)
            .then((simRes) => {
              if (simRes.data?.success && Array.isArray(simRes.data.data.properties)) {
                setSimilar(simRes.data.data.properties.filter(item => item._id !== id).slice(0, 3));
              }
            })
            .catch(err => console.error(err));
        }
      })
      .catch((err) => {
        console.error("Error fetching property:", err);
        setLoading(false);
        showToast("Error loading property details.", "error");
      });
  };

  // Check if current property is favorited by tenant
  const checkFavorite = () => {
    if (!user || user.role !== "user") return;
    api.get(`/api/v1/property/user/favorites`)
      .then((res) => {
        if (res.data?.success && Array.isArray(res.data.data)) {
          setFavorited(res.data.data.some(item => item._id === id));
        }
      })
      .catch(err => console.error(err));
  };

  // Fetch reviews
  const fetchReviews = () => {
    api.get(`/api/v1/property/${id}/reviews`)
      .then((res) => {
        if (res.data?.success) {
          setReviews(res.data.data.reviews || []);
          setAvgRating(res.data.data.averageRating || 0);
          setReviewCount(res.data.data.total || 0);
        }
      })
      .catch(err => console.error(err));
  };

  // Check completed bookings for review capability
  const checkCompletedBooking = () => {
    if (!user || user.role !== "user") return;
    api.get("/api/v1/property/user/bookings")
      .then((res) => {
        if (res.data?.success && Array.isArray(res.data.data)) {
          const completed = res.data.data.some(
            (b) => b.propertyId?._id === id && b.status === "completed"
          );
          setHasCompletedBooking(completed);
        }
      })
      .catch(err => console.error(err));
  };

  useEffect(() => {
    fetchPropertyData();
    checkFavorite();
    fetchReviews();
    checkCompletedBooking();
    setVisitBooked(false);
    setReportSuccess(false);
    setReviewPosted(false);
  }, [id, user]);

  // Track recently viewed in LocalStorage FIFO (keep last 10 unique IDs)
  useEffect(() => {
    if (!property?._id) return;
    const key = "rentconnect_recently_viewed";
    let list = [];
    try {
      list = JSON.parse(localStorage.getItem(key)) || [];
    } catch {
      console.warn("Failed to parse recently viewed from localStorage");
    }
    list = [property._id, ...list.filter(item => item !== property._id)].slice(0, 10);
    localStorage.setItem(key, JSON.stringify(list));
  }, [property?._id]);

  // Load interactive Leaflet map dynamically
  useEffect(() => {
    if (!property || !property.location?.coordinates) return;
    const [lng, lat] = property.location.coordinates;
    
    // Check and append leaflet style sheet
    let cssLink = document.getElementById("leaflet-css");
    if (!cssLink) {
      cssLink = document.createElement("link");
      cssLink.id = "leaflet-css";
      cssLink.rel = "stylesheet";
      cssLink.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      document.head.appendChild(cssLink);
    }

    // Check and append leaflet javascript library
    let jsScript = document.getElementById("leaflet-js");
    if (!jsScript) {
      jsScript = document.createElement("script");
      jsScript.id = "leaflet-js";
      jsScript.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
      document.body.appendChild(jsScript);
    }

    const initMap = () => {
      if (window.L && document.getElementById(`map-${property._id}`)) {
        if (window.mapInstance) {
          window.mapInstance.remove();
        }
        const map = window.L.map(`map-${property._id}`).setView([lat, lng], 14);
        window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© OpenStreetMap contributors'
        }).addTo(map);
        window.L.marker([lat, lng]).addTo(map)
          .bindPopup(property.title)
          .openPopup();
        window.mapInstance = map;
      }
    };

    if (window.L) {
      initMap();
    } else {
      jsScript.addEventListener("load", initMap);
    }

    return () => {
      if (window.mapInstance) {
        window.mapInstance.remove();
        window.mapInstance = null;
      }
    };
  }, [property]);

  // Toggle favorite status
  const handleToggleFavorite = () => {
    if (!user) {
      showToast("Please login to save favorites.", "error");
      return;
    }
    if (user.role !== "user") {
      showToast("Only tenant accounts can save properties.", "error");
      return;
    }

    api.post(`/api/v1/property/user/favorites/${id}`)
      .then((res) => {
        if (res.data?.success) {
          setFavorited(res.data.data.favorited);
          showToast(res.data.data.message);
        }
      })
      .catch(err => {
        console.error(err);
        showToast("Failed to update favorites.", "error");
      });
  };

  // Report property
  const handleReportProperty = (e) => {
    e.preventDefault();
    if (!user) {
      showToast("Please login to report fake listings.", "error");
      return;
    }
    if (!reportReason) {
      showToast("Please specify a reason.", "error");
      return;
    }

    api.post(`/api/v1/property/${id}/report`, {
      reason: reportReason,
    })
      .then(() => {
        setReportSuccess(true);
        setReportReason("");
        showToast("Report submitted successfully!");
        setTimeout(() => setShowReportModal(false), 2000);
      })
      .catch(err => {
        console.error("Error reporting listing:", err);
        showToast("Failed to submit report.", "error");
      });
  };

  // Submit review
  const handlePostReview = (e) => {
    e.preventDefault();
    if (!commentInput) {
      showToast("Please write a comment.", "error");
      return;
    }

    api.post(`/api/v1/property/${id}/reviews`, {
      rating: ratingInput,
      comment: commentInput,
    })
      .then(() => {
        showToast("Review submitted successfully!");
        setReviewPosted(true);
        setCommentInput("");
        fetchReviews();
      })
      .catch((err) => {
        showToast(err.response?.data?.message || "Failed to submit review.", "error");
      });
  };

  // Start chat with owner
  const handleStartChat = () => {
    if (!user) {
      showToast("Please login to message the property owner.", "error");
      return;
    }
    if (user._id === property.ownerId?._id) {
      showToast("This is your own listing!", "error");
      return;
    }
    // Navigate to chat and pass selected owner id in state
    navigate("/chat", {
      state: {
        startChatWith: property.ownerId?._id,
        ownerName: property.ownerId?.name,
        ownerImage: property.ownerId?.profileImage,
        ownerRole: property.ownerId?.role || "owner",
      },
    });
  };

  const handleShare = async () => {
    const shareData = {
      title: property?.title || "RentConnect Listing",
      text: `Check out this rental listing in ${formatCity(property?.city).toUpperCase()}`,
      url: window.location.href,
    };
    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        console.error("Share failed:", err);
      }
      return;
    }
    try {
      await navigator.clipboard.writeText(window.location.href);
      showToast("Listing link copied to clipboard.");
    } catch {
      showToast("Failed to copy link.", "error");
    }
  };

  // Schedule a visit booking
  const handleBookVisit = (e) => {
    e.preventDefault();
    if (!user) {
      showToast("Please login to schedule a visit.", "error");
      return;
    }
    if (user.role !== "user") {
      showToast("Only tenant accounts can schedule visits.", "error");
      return;
    }
    if (!visitDate || !visitTime) {
      showToast("Please select both date and time.", "error");
      return;
    }
    if (new Date(visitDate) <= new Date()) {
      showToast("Visit date must be in the future.", "error");
      return;
    }

    api.post(`/api/v1/property/${id}/book`, { visitDate, visitTime })
      .then((res) => {
        if (res.data?.success) {
          setVisitBooked(true);
          showToast("Visit scheduled successfully! The owner has been notified.");
        }
      })
      .catch((err) => {
        const msg = err.response?.data?.message || "Failed to schedule visit.";
        showToast(msg, "error");
      });
  };

  if (loading) {
    return (
      <div className="page" style={{ padding: "20px 0" }}>
        <div className="property-detail-layout">
          <div>
            <div className="skeleton" style={{ height: "400px", borderRadius: "var(--radius-lg)" }}></div>
            <div className="glass-card" style={{ marginTop: "24px", padding: "28px" }}>
              <div className="skeleton skeleton-line" style={{ width: "20%", height: "20px" }}></div>
              <div className="skeleton skeleton-line" style={{ width: "60%", height: "32px", marginTop: "12px" }}></div>
              <div className="skeleton skeleton-line" style={{ width: "40%", height: "16px", marginTop: "12px" }}></div>
              <div className="stats-grid-3" style={{ margin: "24px 0" }}>
                <div className="skeleton" style={{ height: "60px" }}></div>
                <div className="skeleton" style={{ height: "60px" }}></div>
                <div className="skeleton" style={{ height: "60px" }}></div>
              </div>
              <div className="skeleton skeleton-line" style={{ height: "16px" }}></div>
              <div className="skeleton skeleton-line" style={{ height: "16px" }}></div>
            </div>
          </div>
          <aside className="sidebar-panel" style={{ width: "100%" }}>
            <div className="skeleton" style={{ height: "150px", borderRadius: "var(--radius-lg)", marginBottom: "20px" }}></div>
            <div className="skeleton" style={{ height: "200px", borderRadius: "var(--radius-lg)" }}></div>
          </aside>
        </div>
      </div>
    );
  }

  if (!property) {
    return (
      <div className="glass-card" style={{ textAlign: "center", padding: "48px 24px", marginTop: "24px" }}>
        <h3>Property not found</h3>
        <Link to="/search" className="btn btn-primary" style={{ marginTop: "16px" }}>Return to Explore</Link>
      </div>
    );
  }

  const images = property.images && property.images.length > 0 ? property.images : [activeImage];

  return (
    <div className="page">
      {/* Breadcrumb navigation */}
      <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.85rem", color: "var(--muted)", marginBottom: "20px" }}>
        <Link to="/">Home</Link>
        <ChevronRight size={14} />
        <Link to={`/search?city=${property.city}`}>{formatCity(property.city).toUpperCase()}</Link>
        <ChevronRight size={14} />
        <span style={{ color: "var(--text)" }}>{property.title}</span>
      </div>

      <div className="property-detail-layout">
        {/* Main Details Panel */}
        <div>
          {/* Gallery Component */}
          <div className="details-gallery">
            <div className="gallery-viewer">
              <img 
                src={activeImage} 
                alt={property.title} 
                loading="lazy"
                onError={(e) => { e.target.src = '/placeholder-property.jpg' }}
              />
            </div>
            
            {images.length > 1 && (
              <div className="gallery-thumbnails">
                {images.map((imgUrl, idx) => (
                  <button 
                    key={idx} 
                    onClick={() => setActiveImage(imgUrl)}
                    className={`thumbnail-btn ${activeImage === imgUrl ? 'active' : ''}`}
                  >
                    <img 
                      src={imgUrl} 
                      alt={`Thumbnail ${idx + 1}`} 
                      loading="lazy"
                      onError={(e) => { e.target.src = '/placeholder-property.jpg' }}
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Heading Info */}
          <div className="glass-card" style={{ marginTop: "24px", padding: "28px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "12px", alignItems: "flex-start" }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                  <span className="chip chip-accent">{property.propertyType}</span>
                  {avgRating > 0 && (
                    <span className="chip chip-accent-2" style={{ textTransform: "none", display: "flex", alignItems: "center", gap: "3px" }}>
                      <Star size={12} fill="currentColor" />
                      {avgRating} ({reviewCount})
                    </span>
                  )}
                </div>
                <h1 style={{ fontSize: "1.8rem", fontWeight: "800", marginBottom: "8px" }}>{property.title}</h1>
                <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "var(--muted)", fontSize: "0.95rem" }}>
                  <MapPin size={16} />
                  <span>{property.address}, {property.area}, {formatCity(property.city).toUpperCase()} - {property.pinCode}</span>
                </div>
                <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginTop: "12px" }}>
                  <span className={`chip ${property.listingStatus === "hidden" ? "chip-danger" : property.listingStatus === "rented" ? "chip-accent-2" : "chip-success"}`} style={{ padding: "2px 8px", fontSize: "0.65rem" }}>
                    {property.listingStatus || "available"}
                  </span>
                  {property.isVerifiedProperty && <span className="chip chip-success" style={{ padding: "2px 8px", fontSize: "0.65rem" }}>Verified Property</span>}
                  {property.ownerId?.isVerified && <span className="chip chip-accent" style={{ padding: "2px 8px", fontSize: "0.65rem" }}>Verified Owner</span>}
                </div>
              </div>
              <div style={{ display: "flex", gap: "10px" }}>
                {user && user.role === "user" && (
                  <button 
                    onClick={handleToggleFavorite} 
                    className={`btn btn-secondary btn-icon ${favorited ? 'card-favorite-btn favorited' : ''}`}
                    title={favorited ? "Saved in Wishlist" : "Save Listing"}
                    style={{ background: favorited ? "rgba(239, 68, 68, 0.1)" : "rgba(255,255,255,0.03)", borderRadius: "50%" }}
                  >
                    <Heart size={18} fill={favorited ? "currentColor" : "none"} />
                  </button>
                )}
                <button 
                  onClick={() => setShowReportModal(true)} 
                  className="btn btn-secondary btn-icon"
                  style={{ color: "var(--danger)", background: "rgba(239, 68, 68, 0.05)", borderRadius: "50%" }}
                  title="Report Listing"
                >
                  <AlertTriangle size={18} />
                </button>
              </div>
            </div>

            {/* Quick Specs Strip */}
            <div className="stats-grid-3" style={{ padding: "20px 0", borderTop: "1px solid var(--line)", borderBottom: "1px solid var(--line)", margin: "24px 0", textAlign: "center" }}>
              <div>
                <span style={{ display: "block", fontSize: "0.8rem", color: "var(--muted)", textTransform: "uppercase" }}>Bedrooms</span>
                <strong style={{ fontSize: "1.2rem", color: "var(--accent)" }}>{property.bedrooms} BHK</strong>
              </div>
              <div>
                <span style={{ display: "block", fontSize: "0.8rem", color: "var(--muted)", textTransform: "uppercase" }}>Bathrooms</span>
                <strong style={{ fontSize: "1.2rem", color: "var(--accent)" }}>{property.bathrooms} Bath</strong>
              </div>
              <div>
                <span style={{ display: "block", fontSize: "0.8rem", color: "var(--muted)", textTransform: "uppercase" }}>Furnished</span>
                <strong style={{ fontSize: "1.2rem", color: "var(--accent)" }}>{property.furnishedStatus}</strong>
              </div>
            </div>

            {/* Description */}
            <div style={{ marginBottom: "28px" }}>
              <h3 style={{ fontSize: "1.15rem", fontWeight: "700", marginBottom: "10px" }}>Property Description</h3>
              <p style={{ color: "var(--muted)", lineHeight: "1.6", whiteSpace: "pre-line" }}>
                {property.description}
              </p>
            </div>

            {/* Amenities Checklist */}
            <div>
              <h3 style={{ fontSize: "1.15rem", fontWeight: "700", marginBottom: "10px" }}>Amenities</h3>
              <div className="amenities-list">
                {property.amenities && property.amenities.length > 0 ? (
                  property.amenities.map((amenity, idx) => (
                    <div key={idx} className="amenity-item">
                      <CheckCircle size={14} style={{ color: "var(--success)" }} />
                      <span>{amenity}</span>
                    </div>
                  ))
                ) : (
                  <span style={{ color: "var(--muted)", fontSize: "0.9rem" }}>No amenities specified.</span>
                )}
              </div>
            </div>
          </div>

          {/* Leaflet Map Interactive Panel */}
          <div className="glass-card" style={{ marginTop: "24px", padding: "28px" }}>
            <h3 style={{ fontSize: "1.15rem", fontWeight: "700", marginBottom: "14px" }}>Property Location</h3>
            <div id={`map-${property._id}`} className="leaflet-container-sim" style={{ height: "300px" }}>
              <span style={{ color: "var(--muted)" }}>Loading interactive location coordinates map...</span>
            </div>
          </div>

          {/* Reviews & Ratings Section */}
          <div className="glass-card" style={{ marginTop: "24px", padding: "28px" }}>
            <h3 style={{ fontSize: "1.15rem", fontWeight: "700", marginBottom: "20px" }}>Reviews & Ratings</h3>
            
            {/* Review form for users with completed bookings */}
            {hasCompletedBooking && !reviewPosted && (
              <form onSubmit={handlePostReview} style={{ marginBottom: "28px", paddingBottom: "24px", borderBottom: "1px solid var(--line)" }}>
                <h4 style={{ fontSize: "0.95rem", fontWeight: "700", marginBottom: "12px" }}>Share your experience</h4>
                <div className="form-group">
                  <label className="form-label">Rating</label>
                  <select 
                    value={ratingInput} 
                    onChange={(e) => setRatingInput(Number(e.target.value))}
                    className="form-select"
                    style={{ maxWidth: "120px" }}
                  >
                    <option value="5">5 Stars</option>
                    <option value="4">4 Stars</option>
                    <option value="3">3 Stars</option>
                    <option value="2">2 Stars</option>
                    <option value="1">1 Star</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Comment</label>
                  <textarea 
                    value={commentInput} 
                    onChange={(e) => setCommentInput(e.target.value)}
                    className="form-textarea"
                    rows="3"
                    placeholder="Write a descriptive review about the property condition, surroundings, and landlord..."
                    required
                  ></textarea>
                </div>
                <button type="submit" className="btn btn-primary">Submit Review</button>
              </form>
            )}

            {/* Reviews list */}
            {reviews.length > 0 ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                {reviews.map((rev) => (
                  <div key={rev._id} style={{ display: "flex", gap: "12px", borderBottom: "1px solid var(--line)", paddingBottom: "16px" }}>
                    <img 
                      src={rev.userId?.profileImage || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(rev.userId?.name || "User")}`}
                      alt={rev.userId?.name}
                      className="avatar"
                      style={{ width: "36px", height: "36px" }}
                    />
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "6px" }}>
                        <strong style={{ fontSize: "0.95rem" }}>{rev.userId?.name}</strong>
                        <span style={{ fontSize: "0.8rem", color: "var(--muted)" }}>
                          {new Date(rev.createdAt).toLocaleDateString("en-IN", { day: 'numeric', month: 'short', year: 'numeric' })}
                        </span>
                      </div>
                      <div style={{ display: "flex", color: "#f59e0b", gap: "2px", margin: "4px 0 8px" }}>
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star key={i} size={14} fill={i < rev.rating ? "currentColor" : "none"} stroke="currentColor" />
                        ))}
                      </div>
                      <p style={{ fontSize: "0.9rem", color: "var(--muted)", lineHeight: "1.5" }}>{rev.comment}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ color: "var(--muted)", fontSize: "0.9rem" }}>No reviews posted yet.</p>
            )}
          </div>
        </div>

        {/* Sidebar Actions Panel */}
        <aside className="sidebar-panel">
          {/* Pricing Box */}
          <div className="glass-card" style={{ background: "linear-gradient(135deg, rgba(13, 148, 136, 0.08) 0%, rgba(17, 24, 39, 0.8) 100%)", padding: "28px" }}>
            <span style={{ fontSize: "0.85rem", color: "var(--muted)" }}>Monthly Rent</span>
            <div style={{ display: "flex", alignItems: "baseline", gap: "6px", marginBottom: "12px" }}>
              <strong style={{ fontSize: "2.2rem", color: "var(--accent-2)", fontWeight: "900" }}>₹{formatMoney(property.rent)}</strong>
              <span style={{ fontSize: "0.85rem", color: "var(--muted)" }}>/ month</span>
            </div>
            
            <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderTop: "1px solid var(--line)", fontSize: "0.9rem" }}>
              <span style={{ color: "var(--muted)" }}>Security Deposit:</span>
              <strong style={{ color: "var(--text)" }}>₹{formatMoney(property.deposit)}</strong>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderTop: "1px solid var(--line)", fontSize: "0.9rem", marginBottom: "10px" }}>
              <span style={{ color: "var(--muted)" }}>Available From:</span>
              <strong style={{ color: "var(--text)" }}>{new Date(property.availableFrom).toLocaleDateString("en-IN", { day: 'numeric', month: 'short', year: 'numeric' })}</strong>
            </div>
          </div>

          {/* Schedule Visit Booking Card */}
          <div className="glass-card" data-booking-card style={{ padding: "24px" }}>
            <h4 style={{ fontSize: "1rem", fontWeight: "700", marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
              <Calendar size={18} style={{ color: "var(--accent-2)" }} />
              <span>Schedule a Visit</span>
            </h4>

            {visitBooked ? (
              <div style={{ textAlign: "center", padding: "16px 0" }}>
                <CheckCircle size={36} style={{ color: "var(--success)", margin: "0 auto 12px" }} />
                <strong style={{ display: "block", marginBottom: "4px" }}>Visit Scheduled!</strong>
                <p style={{ color: "var(--muted)", fontSize: "0.85rem" }}>
                  {new Date(visitDate).toLocaleDateString("en-IN", { day: 'numeric', month: 'short', year: 'numeric' })} at {visitTime}
                </p>
                <p style={{ color: "var(--muted)", fontSize: "0.8rem", marginTop: "8px" }}>
                  The owner has been notified. Check your Dashboard for visit details.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setVisitBooked(false);
                    setVisitDate("");
                    setVisitTime("");
                  }}
                  className="btn btn-secondary btn-small"
                  style={{ marginTop: "12px" }}
                >
                  Book Another Slot
                </button>
              </div>
            ) : user && user.role === "user" ? (
              <form onSubmit={handleBookVisit}>
                {property.listingStatus === "rented" && (
                  <p style={{ color: "var(--danger)", fontSize: "0.85rem", marginBottom: "12px" }}>
                    This property is currently marked as rented.
                  </p>
                )}
                <div className="form-group">
                  <label className="form-label">Visit Date</label>
                  <input
                    type="date"
                    value={visitDate}
                    onChange={(e) => setVisitDate(e.target.value)}
                    className="form-input"
                    min={new Date(Date.now() + 86400000).toISOString().split("T")[0]}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Preferred Time</label>
                  <select
                    value={visitTime}
                    onChange={(e) => setVisitTime(e.target.value)}
                    className="form-select"
                    required
                  >
                    <option value="">Select a time slot</option>
                    <option value="09:00 AM - 10:00 AM">09:00 AM - 10:00 AM</option>
                    <option value="10:00 AM - 11:00 AM">10:00 AM - 11:00 AM</option>
                    <option value="11:00 AM - 12:00 PM">11:00 AM - 12:00 PM</option>
                    <option value="12:00 PM - 01:00 PM">12:00 PM - 01:00 PM</option>
                    <option value="03:00 PM - 04:00 PM">03:00 PM - 04:00 PM</option>
                    <option value="04:00 PM - 05:00 PM">04:00 PM - 05:00 PM</option>
                    <option value="05:00 PM - 06:00 PM">05:00 PM - 06:00 PM</option>
                    <option value="06:00 PM - 07:00 PM">06:00 PM - 07:00 PM</option>
                  </select>
                </div>
                <button type="submit" className="btn btn-primary" style={{ width: "100%", justifyContent: "center" }}>
                  <Calendar size={16} />
                  <span>Book Visit Appointment</span>
                </button>
              </form>
            ) : !user ? (
              <div style={{ textAlign: "center" }}>
                <p style={{ color: "var(--muted)", fontSize: "0.85rem", marginBottom: "12px" }}>
                  Login as a tenant to schedule a property visit.
                </p>
                <Link to="/login" className="btn btn-primary" style={{ width: "100%", justifyContent: "center" }}>
                  Login to Book Visit
                </Link>
              </div>
            ) : (
              <p style={{ color: "var(--muted)", fontSize: "0.85rem", textAlign: "center" }}>
                Visit booking is available for tenant accounts only.
              </p>
            )}
          </div>

          {/* Owner details card */}
          <div className="glass-card" style={{ padding: "24px" }}>
            <h4 style={{ fontSize: "1rem", fontWeight: "700", marginBottom: "16px" }}>Listed by Owner</h4>
            <div className="owner-card">
              <img 
                src={property.ownerId?.profileImage || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(property.ownerId?.name || "Owner")}`} 
                alt={property.ownerId?.name} 
                className="avatar" 
                style={{ width: "42px", height: "42px" }}
                loading="lazy"
                onError={(e) => { e.target.src = '/placeholder-property.jpg' }}
              />
              <div>
                <strong style={{ display: "block", fontSize: "0.95rem" }}>{property.ownerId?.name || "Property Owner"}</strong>
                <span className="chip chip-success" style={{ padding: "2px 8px", fontSize: "0.65rem", marginTop: "4px" }}>Verified Owner</span>
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              <button onClick={handleStartChat} className="btn btn-primary" style={{ width: "100%", justifyContent: "center" }}>
                <MessageSquare size={16} />
                <span>Chat with Owner</span>
              </button>
              
              {user && property.contactNumber ? (
                <>
                  <a href={`tel:${property.contactNumber}`} className="btn btn-secondary" style={{ width: "100%", justifyContent: "center" }}>
                    <Phone size={16} />
                    <span>Call Owner (+91 {property.contactNumber})</span>
                  </a>
                  
                  {/* WhatsApp contact button */}
                  <a 
                    href={`https://wa.me/91${property.contactNumber}?text=Hi, I found your listing on RentConnect: ${encodeURIComponent(window.location.href)}`} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="btn btn-primary" 
                    style={{ width: "100%", justifyContent: "center", background: "#25D366", borderColor: "#25D366" }}
                  >
                    <span>WhatsApp Owner</span>
                  </a>
                </>
              ) : (
                <Link to="/login" className="btn btn-secondary" style={{ width: "100%", justifyContent: "center" }}>
                  <Phone size={16} />
                  <span>Login to View Contact</span>
                </Link>
              )}
            </div>
          </div>

        </aside>
      </div>

      <div className="mobile-detail-actionbar">
        {user && property.contactNumber ? (
          <a href={`tel:${property.contactNumber}`} className="btn btn-secondary">
            <Phone size={16} />
            <span>Call</span>
          </a>
        ) : (
          <Link to="/login" className="btn btn-secondary">
            <Phone size={16} />
            <span>Login to Call</span>
          </Link>
        )}
        <button onClick={handleStartChat} className="btn btn-primary">
          <MessageSquare size={16} />
          <span>Chat</span>
        </button>
        {user?.role === "user" && (
          <button
            onClick={() => {
              const el = document.querySelector('[data-booking-card]');
              if (el) {
                el.scrollIntoView({ behavior: "smooth", block: "center" });
                el.style.transition = "box-shadow 0.4s ease";
                el.style.boxShadow = "0 0 0 2px var(--accent-2)";
                setTimeout(() => (el.style.boxShadow = ""), 1500);
              }
            }}
            className="btn btn-secondary"
          >
            <Calendar size={16} />
            <span>Book Visit</span>
          </button>
        )}
        {user?.role === "user" && (
          <button onClick={handleToggleFavorite} className={`btn btn-secondary ${favorited ? "chip-danger" : ""}`}>
            <Heart size={16} fill={favorited ? "currentColor" : "none"} />
            <span>{favorited ? "Saved" : "Save"}</span>
          </button>
        )}
        <button onClick={handleShare} className="btn btn-secondary">
          <Share2 size={16} />
          <span>Share</span>
        </button>
      </div>

      {/* Similar Properties Section */}
      {similar.length > 0 && (
        <section className="section" style={{ marginTop: "64px" }}>
          <h2 style={{ fontSize: "1.5rem", fontWeight: "800", marginBottom: "18px" }}>Similar Listings in {formatCity(property.city).toUpperCase()}</h2>
          <div className="grid-3">
            {similar.map((prop) => {
              const simImages = prop.images && prop.images.length > 0 
                ? prop.images 
                : ["/placeholder-property.jpg"];
              return (
                <div key={prop._id} className="property-card">
                  <div className="card-image-container">
                    <img 
                      src={simImages[0]} 
                      alt={prop.title} 
                      className="card-image" 
                      loading="lazy"
                      onError={(e) => { e.target.src = '/placeholder-property.jpg' }}
                    />
                    <span className="chip chip-accent card-badge">
                      {prop.propertyType}
                    </span>
                  </div>

                  <div className="property-card-body">
                    <h3>{prop.title}</h3>
                    <div className="property-card-location">
                      <MapPin size={14} />
                      <span>{prop.area}, {formatCity(prop.city).toUpperCase()}</span>
                    </div>

                    <div className="property-card-price-row">
                      <div className="property-card-price">
                        <strong>₹{formatMoney(prop.rent)}</strong>
                        <span>Deposit: ₹{formatMoney(prop.deposit)}</span>
                      </div>
                      <Link to={`/property/${prop._id}`} className="btn btn-secondary btn-small">
                        View details
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Report Modal */}
      {showReportModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <AlertTriangle size={20} style={{ color: "var(--danger)" }} />
                <span>Report Fake/Broker Listing</span>
              </h3>
              <button onClick={() => setShowReportModal(false)} style={{ cursor: "pointer", fontSize: "1.2rem" }}>&times;</button>
            </div>
            <div className="modal-body">
              {reportSuccess ? (
                <div style={{ textAlign: "center", padding: "16px 0", color: "var(--success)" }}>
                  <CheckCircle size={36} style={{ margin: "0 auto 12px" }} />
                  <strong>Thank You!</strong>
                  <p style={{ color: "var(--muted)", fontSize: "0.85rem", marginTop: "4px" }}>
                    Your report has been submitted to the Admin Panel for verification.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleReportProperty}>
                  <p style={{ color: "var(--muted)", fontSize: "0.9rem", marginBottom: "14px" }}>
                    Please explain why this listing is problematic. Admins will review details (e.g., spam, broker listings, fake pictures).
                  </p>
                  <div className="form-group">
                    <label className="form-label">Reason for reporting</label>
                    <textarea 
                      value={reportReason} 
                      onChange={(e) => setReportReason(e.target.value)} 
                      rows="4" 
                      placeholder="e.g. This is a broker listing, or photos are fake, or owner is asking for pre-payment scam." 
                      className="form-textarea"
                      required
                    ></textarea>
                  </div>
                  <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
                    <button type="button" onClick={() => setShowReportModal(false)} className="btn btn-secondary">Cancel</button>
                    <button type="submit" className="btn btn-danger">Submit Report</button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
