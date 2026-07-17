import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../hooks/useToast";
import { formatMoney, formatCity } from "../../utils/formatters";
import { 
  Building2, 
  Eye, 
  MessageSquare, 
  Calendar, 
  Plus, 
  Trash2, 
  Edit, 
  MapPin, 
  LayoutDashboard, 
  ClipboardList, 
  Settings, 
  Check, 
  AlertCircle, 
  Compass,
  ArrowRight,
  User,
  ThumbsUp,
  X
} from "lucide-react";

export default function Owner() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const showToast = useToast();

  // Tab State: "overview" | "add" | "properties" | "bookings"
  const [activeTab, setActiveTab] = useState("overview");

  // Owner data states
  const [properties, setProperties] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState({
    totalListings: 0,
    statusCounts: { available: 0, hidden: 0, rented: 0, draft: 0 },
    totalViews: 0,
    scheduledVisits: 0,
    unreadBookings: 0
  });

  // Add Property Form States
  const [title, setTitle] = useState("");
  const [propertyType, setPropertyType] = useState("flat");
  const [listingStatus, setListingStatus] = useState("available");
  const [rent, setRent] = useState("");
  const [deposit, setDeposit] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState(user?.city || "");
  const [area, setArea] = useState("");
  const [pinCode, setPinCode] = useState("");
  const [latitude, setLatitude] = useState("18.5204");
  const [longitude, setLongitude] = useState("73.8567");
  const [bedrooms, setBedrooms] = useState("2");
  const [bathrooms, setBathrooms] = useState("2");
  const [furnishedStatus, setFurnishedStatus] = useState("semi-furnished");
  const [availableFrom, setAvailableFrom] = useState("");
  const [contactNumber, setContactNumber] = useState(user?.phone || "");
  const [description, setDescription] = useState("");
  
  // Amenities checklists
  const availableAmenities = [
    "WiFi", "AC", "Parking", "Gym", "Lift", 
    "Power Backup", "Security", "Washing Machine"
  ];

  const [selectedAmenities, setSelectedAmenities] = useState([]);
  const [imageFiles, setImageFiles] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState(false);

  // Edit Property Inline State
  const [editingId, setEditingId] = useState(null);
  const [editRent, setEditRent] = useState("");
  const [editDeposit, setEditDeposit] = useState("");
  const mapRef = useRef(null);
  const markerRef = useRef(null);

  const getBookingStatusMeta = (status) => {
    if (status === "completed") return { label: "Completed", chipClass: "chip-success" };
    if (status === "confirmed") return { label: "Confirmed", chipClass: "chip-warning" };
    if (status === "cancelled") return { label: "Cancelled", chipClass: "chip-danger" };
    return { label: "Scheduled", chipClass: "chip-accent-2" };
  };

  const geocodeWithNominatim = async (query) => {
    if (!query?.trim()) return null;
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&q=${encodeURIComponent(query)}`,
      {
        headers: {
          Accept: "application/json",
        },
      }
    );
    const data = await res.json();
    if (!Array.isArray(data) || !data.length) return null;
    const item = data[0];
    return {
      formatted_address: item.display_name,
      geometry: { location: { lat: Number(item.lat), lng: Number(item.lon) } },
      address_components: [],
    };
  };

  const reverseGeocodeWithNominatim = async (lat, lng) => {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`,
      {
        headers: {
          Accept: "application/json",
        },
      }
    );
    const data = await res.json();
    if (!data?.display_name) return null;
    return {
      formatted_address: data.display_name,
      geometry: { location: { lat: Number(lat), lng: Number(lng) } },
      address_components: [],
    };
  };

  const geocodeAddress = async (query) => {
    return geocodeWithNominatim(query).catch(() => null);
  };

  const geocodeAddressCandidates = async () => {
    const candidates = [
      [address, area, city, pinCode, "India"],
      [address, area, city, "India"],
      [area, city, pinCode, "India"],
      [area, city, "India"],
      [city, pinCode, "India"],
    ]
      .map((parts) => parts.map((part) => String(part || "").trim()).filter(Boolean).join(", "))
      .filter(Boolean);

    for (const candidate of [...new Set(candidates)]) {
      const result = await geocodeAddress(candidate);
      if (result) return result;
    }
    return null;
  };

  const reverseGeocode = async (lat, lng) => {
    return reverseGeocodeWithNominatim(lat, lng).catch(() => null);
  };

  useEffect(() => {
    if (user?.city) setCity(String(user.city).trim());
  }, [user?.city]);

  const applyGeocodedAddress = (result, { updateTextFields = false } = {}) => {
    if (!result) return;
    const formattedAddress = result.formatted_address || "";
    const mappedLat = result.geometry?.location?.lat;
    const mappedLng = result.geometry?.location?.lng;

    if (updateTextFields && formattedAddress) {
      setAddress(formattedAddress);
      const chunks = formattedAddress.split(",").map((part) => part.trim()).filter(Boolean);
      if (!area && chunks[0]) setArea(chunks[0]);
      if (!city && chunks[1]) setCity(chunks[1]);
      if (!pinCode) {
        const pinMatch = formattedAddress.match(/\b\d{6}\b/);
        if (pinMatch) setPinCode(pinMatch[0]);
      }
    }
    if (typeof mappedLat === "number" && typeof mappedLng === "number") {
      setLatitude(mappedLat.toFixed(6));
      setLongitude(mappedLng.toFixed(6));
    }
  };

  const movePickerMarker = (lat, lng, zoom = 15) => {
    setLatitude(lat.toFixed(6));
    setLongitude(lng.toFixed(6));

    if (mapRef.current && markerRef.current && window.L) {
      const nextLatLng = window.L.latLng(lat, lng);
      markerRef.current.setLatLng(nextLatLng);
      mapRef.current.setView(nextLatLng, zoom, { animate: true });
      setTimeout(() => {
        try {
          mapRef.current?.invalidateSize();
        } catch (err) {
          console.error("Map resize failed:", err);
        }
      }, 0);
    }
  };

  const syncLocationFromMap = async (lat, lng) => {
    movePickerMarker(lat, lng, 15);

    try {
      const geocoded = await reverseGeocode(lat, lng);
      applyGeocodedAddress(geocoded, { updateTextFields: false });
    } catch (err) {
      console.error("Reverse geocode failed:", err);
    }
  };

  const handleAddressAutoMark = async () => {
    if (!address.trim()) {
      setFormError("Please enter an address first.");
      return;
    }

    try {
      const geocoded = await geocodeAddressCandidates();
      if (!geocoded) {
        setFormError("Could not find that address. Try a more specific address or use current location.");
        return;
      }

      const mappedLat = geocoded.geometry?.location?.lat;
      const mappedLng = geocoded.geometry?.location?.lng;
      if (typeof mappedLat === "number" && typeof mappedLng === "number") {
        movePickerMarker(mappedLat, mappedLng, 16);
        applyGeocodedAddress(geocoded, { updateTextFields: false });
        setFormError("");
      }
    } catch (err) {
      console.error("Address geocode failed:", err);
      setFormError("Failed to auto-mark the address on map.");
    }
  };

  const useCurrentLocation = () => {
    if (!navigator.geolocation) {
      setFormError("Your browser does not support location access.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
          const nextLat = position.coords.latitude;
          const nextLng = position.coords.longitude;

        try {
          movePickerMarker(nextLat, nextLng, 16);
          const geocoded = await reverseGeocode(nextLat, nextLng);
          if (geocoded) {
            applyGeocodedAddress(geocoded, { updateTextFields: false });
            setFormError("");
          }
        } catch (err) {
          console.error("Reverse geocode failed:", err);
        }
      },
      (err) => {
        setFormError(err.message || "Unable to read your current location.");
      },
      { enableHighAccuracy: true, timeout: 15000 }
    );
  };

  // Fetch listings, bookings, and analytics
  const fetchData = () => {
    setLoading(true);
    
    // 1. Fetch properties
    const p1 = api.get(`/api/v1/property?ownerId=${user._id}`)
      .then((res) => {
        if (res.data?.success && Array.isArray(res.data.data.properties)) {
          setProperties(res.data.data.properties);
        }
      })
      .catch(err => console.error(err));

    // 2. Fetch bookings
    const p2 = api.get(`/api/v1/property/user/bookings`)
      .then((res) => {
        if (res.data?.success) {
          setBookings(res.data.data);
        }
      })
      .catch(err => console.error(err));

    // 3. Fetch analytics
    const p3 = api.get(`/api/v1/property/owner/analytics`)
      .then((res) => {
        if (res.data?.success) {
          setAnalytics(res.data.data);
        }
      })
      .catch(err => console.error(err));

    Promise.all([p1, p2, p3]).finally(() => {
      setLoading(false);
    });
  };

  useEffect(() => {
    fetchData();
  }, [user]);

  // Load Leaflet Map Picker dynamically for Add Property Form
  useEffect(() => {
    if (activeTab !== "add") return;

    let cssLink = document.getElementById("leaflet-css");
    if (!cssLink) {
      cssLink = document.createElement("link");
      cssLink.id = "leaflet-css";
      cssLink.rel = "stylesheet";
      cssLink.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      document.head.appendChild(cssLink);
    }

    let jsScript = document.getElementById("leaflet-js");
    if (!jsScript) {
      jsScript = document.createElement("script");
      jsScript.id = "leaflet-js";
      jsScript.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
      document.body.appendChild(jsScript);
    }

    const initPickerMap = () => {
      if (window.L && document.getElementById("picker-map")) {
        if (window.pickerMapInstance) {
          window.pickerMapInstance.remove();
        }
        const defaultLat = Number(latitude) || 18.5204;
        const defaultLng = Number(longitude) || 73.8567;
        
        const map = window.L.map("picker-map").setView([defaultLat, defaultLng], 12);
        window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© OpenStreetMap contributors'
        }).addTo(map);

        const marker = window.L.marker([defaultLat, defaultLng], { draggable: true }).addTo(map);
        mapRef.current = map;
        markerRef.current = marker;
        window.pickerMapInstance = map;

        marker.on("dragend", async () => {
          const latLng = marker.getLatLng();
          await syncLocationFromMap(latLng.lat, latLng.lng);
        });

        map.on("click", async (e) => {
          await syncLocationFromMap(e.latlng.lat, e.latlng.lng);
        });
      }
    };

    if (window.L) {
      initPickerMap();
    } else {
      jsScript.addEventListener("load", initPickerMap);
    }

    return () => {
      if (window.pickerMapInstance) {
        window.pickerMapInstance.remove();
        window.pickerMapInstance = null;
      }
    };
  }, [activeTab]);

  // Handle image upload input selection
  const handleImageFileChange = (e) => {
    const files = Array.from(e.target.files || []);
    setImageFiles(files);
    setImagePreviews(files.map((file) => URL.createObjectURL(file)));
  };

  useEffect(() => {
    return () => {
      imagePreviews.forEach((src) => URL.revokeObjectURL(src));
    };
  }, [imagePreviews]);

  // Toggle checklist checkbox
  const handleAmenityToggle = (amenity) => {
    if (selectedAmenities.includes(amenity)) {
      setSelectedAmenities(prev => prev.filter(item => item !== amenity));
    } else {
      setSelectedAmenities(prev => [...prev, amenity]);
    }
  };

  // Handle Add Property submit
  const handleAddPropertySubmit = async (e) => {
    e.preventDefault();
    setFormError("");
    setFormSuccess(false);
    setFormLoading(true);

    if (!title || !rent || !deposit || !address || !area || !pinCode || !description) {
      setFormError("Please fill in all required fields.");
      setFormLoading(false);
      return;
    }

    if (imageFiles.length < 1) {
      setFormError("Please upload at least 1 property image.");
      setFormLoading(false);
      return;
    }

    try {
      const formData = new FormData();
      formData.append("title", title);
      formData.append("propertyType", propertyType);
      formData.append("listingStatus", listingStatus);
      formData.append("rent", rent);
      formData.append("deposit", deposit);
      formData.append("address", address);
      formData.append("city", city.trim());
      formData.append("area", area);
      formData.append("pinCode", pinCode);
      formData.append("lat", latitude);
      formData.append("lng", longitude);
      formData.append("latitude", latitude);
      formData.append("longitude", longitude);
      formData.append("bedrooms", bedrooms);
      formData.append("bathrooms", bathrooms);
      formData.append("furnishedStatus", furnishedStatus);
      formData.append("availableFrom", availableFrom || new Date().toISOString());
      formData.append("contactNumber", contactNumber);
      formData.append("description", description);
      
      formData.append("amenities", selectedAmenities.join(","));

      imageFiles.forEach(file => {
        formData.append("images", file);
      });

      const response = await api.post(`/api/v1/property`, formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });

      if (response.status === 201) {
        setFormSuccess(true);
        showToast("Property listed successfully!");
        setTitle("");
        setListingStatus("available");
        setRent("");
        setDeposit("");
        setAddress("");
        setArea("");
        setPinCode("");
        setDescription("");
        setSelectedAmenities([]);
        setImageFiles([]);
        setImagePreviews([]);
        fetchData();
        setTimeout(() => {
          setActiveTab("properties");
          setFormSuccess(false);
        }, 1500);
      }
    } catch (err) {
      console.error(err);
      const validationMessage = err.response?.data?.errors?.[0]?.message;
      const nextError = validationMessage || err.response?.data?.message || "Failed to create listing. Verify parameters.";
      setFormError(nextError);
      showToast(nextError, "error");
    } finally {
      setFormLoading(false);
    }
  };

  // Delete listing
  const handleDeleteListing = (idVal) => {
    if (!window.confirm("Are you sure you want to permanently delete this listing?")) return;

    api.delete(`/api/v1/property/${idVal}`)
      .then(() => {
        showToast("Property deleted successfully.");
        fetchData();
      })
      .catch(err => {
        console.error(err);
        showToast("Failed to delete property.", "error");
      });
  };

  // Trigger inline Edit Mode
  const startEditing = (prop) => {
    setEditingId(prop._id);
    setEditRent(prop.rent);
    setEditDeposit(prop.deposit);
  };

  // Save inline Edit changes
  const saveInlineEdit = (propId) => {
    api.put(`/api/v1/property/${propId}`, {
      rent: Number(editRent),
      deposit: Number(editDeposit)
    })
      .then(() => {
        showToast("Pricing updated.");
        setEditingId(null);
        fetchData();
      })
      .catch(err => {
        console.error(err);
        showToast("Failed to update pricing.", "error");
      });
  };

  // Dropdown status toggle
  const handleUpdateStatus = (propId, nextStatus) => {
    api.put(`/api/v1/property/${propId}`, { listingStatus: nextStatus })
      .then(() => {
        showToast(`Listing status updated to ${nextStatus}.`);
        fetchData();
      })
      .catch(err => {
        console.error(err);
        showToast("Failed to update listing status.", "error");
      });
  };

  // Owner booking actions: confirm visit
  const handleConfirmVisit = (bookingId) => {
    api.put(`/api/v1/property/bookings/${bookingId}/confirm`)
      .then(() => {
        showToast("Visit scheduled status confirmed.");
        fetchData();
      })
      .catch(err => {
        console.error(err);
        showToast("Failed to confirm visit.", "error");
      });
  };

  // Owner booking actions: cancel visit
  const handleCancelVisit = (bookingId) => {
    const reason = window.prompt("Reason for cancellation (optional):") || "";
    api.put(`/api/v1/property/bookings/${bookingId}/cancel`, { reason })
      .then(() => {
        showToast("Visit schedule cancelled.");
        fetchData();
      })
      .catch(err => {
        console.error(err);
        showToast("Failed to cancel visit.", "error");
      });
  };

  // Owner booking actions: delete/remove visit
  const handleDeleteBooking = (bookingId) => {
    if (!window.confirm("Are you sure you want to remove this visit booking record?")) return;
    api.delete(`/api/v1/property/bookings/${bookingId}`)
      .then(() => {
        showToast("Visit booking removed successfully.");
        fetchData();
      })
      .catch(err => {
        console.error(err);
        showToast("Failed to remove visit booking.", "error");
      });
  };


  // Mark all bookings read
  const handleMarkBookingsRead = () => {
    api.put("/api/v1/property/user/bookings/read")
      .then(() => {
        showToast("Marked all visits read.");
        fetchData();
      })
      .catch(err => console.error(err));
  };

  // Render Skeletons for properties list
  const renderSkeletons = () => (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "20px" }}>
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
      <div className="dashboard-layout" style={{ marginTop: "24px" }}>
        {/* Left Navigation Sidebar */}
        <aside className="dashboard-sidebar glass-card" style={{ height: "fit-content", padding: "16px" }}>
          <div style={{ padding: "10px 14px", borderBottom: "1px solid var(--line)", marginBottom: "14px" }}>
            <span style={{ fontSize: "0.8rem", color: "var(--muted)", textTransform: "uppercase", fontWeight: "700" }}>Dashboard Software</span>
          </div>

          <div 
            onClick={() => setActiveTab("overview")} 
            className={`sidebar-nav-item ${activeTab === "overview" ? "active" : ""}`}
            style={{ minHeight: "44px" }}
          >
            <LayoutDashboard size={18} />
            <span>Overview</span>
          </div>

          <div 
            onClick={() => setActiveTab("properties")} 
            className={`sidebar-nav-item ${activeTab === "properties" ? "active" : ""}`}
            style={{ minHeight: "44px" }}
          >
            <ClipboardList size={18} />
            <span>My Listings ({analytics.totalListings})</span>
          </div>

          <div 
            onClick={() => setActiveTab("add")} 
            className={`sidebar-nav-item ${activeTab === "add" ? "active" : ""}`}
            style={{ minHeight: "44px" }}
          >
            <Plus size={18} />
            <span>Add Property</span>
          </div>

          <div 
            onClick={() => setActiveTab("bookings")} 
            className={`sidebar-nav-item ${activeTab === "bookings" ? "active" : ""}`}
            style={{ minHeight: "44px" }}
          >
            <Calendar size={18} />
            <span>Visit Bookings ({bookings.length})</span>
          </div>

          <div 
            onClick={() => navigate("/chat")} 
            className="sidebar-nav-item"
            style={{ minHeight: "44px" }}
          >
            <MessageSquare size={18} />
            <span>Messages inbox</span>
          </div>
        </aside>

        {/* Main Panel Content Area */}
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          {/* Overview / Stats Screen */}
          {activeTab === "overview" && (
            <>
              {/* Stats Row */}
              <div className="stats-grid-3">
                <div className="stat-card">
                  <span style={{ display: "block", fontSize: "0.85rem", color: "var(--muted)" }}>Total Properties</span>
                  <strong>{analytics.totalListings} Listings</strong>
                  <span style={{ fontSize: "0.75rem", color: "var(--success)" }}>
                    {analytics.statusCounts?.available || 0} active, {analytics.statusCounts?.rented || 0} rented
                  </span>
                </div>
                <div className="stat-card">
                  <span style={{ display: "block", fontSize: "0.85rem", color: "var(--muted)" }}>Listing Views</span>
                  <strong>{analytics.totalViews} Hits</strong>
                  <span style={{ fontSize: "0.75rem", color: "var(--accent)" }}>Total traffic across listings</span>
                </div>
                <div className="stat-card">
                  <span style={{ display: "block", fontSize: "0.85rem", color: "var(--muted)" }}>Visit Bookings</span>
                  <strong>{analytics.scheduledVisits} Active</strong>
                  {analytics.unreadBookings > 0 ? (
                    <span onClick={handleMarkBookingsRead} style={{ fontSize: "0.75rem", color: "var(--danger)", cursor: "pointer", fontWeight: "600" }}>
                      {analytics.unreadBookings} unread bookings (Mark read)
                    </span>
                  ) : (
                    <span style={{ fontSize: "0.75rem", color: "var(--muted)" }}>All bookings read</span>
                  )}
                </div>
              </div>

              {/* Booking Visit Schedules list */}
              <div className="glass-card" style={{ padding: "24px" }}>
                <h3 style={{ fontSize: "1.15rem", fontWeight: "700", marginBottom: "16px" }}>Upcoming Visits Scheduled</h3>
                {bookings.length > 0 ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                    {bookings.slice(0, 5).map((booking) => (
                      <div 
                        key={booking._id} 
                        style={{ 
                          display: "flex", 
                          alignItems: "center", 
                          justifyContent: "space-between", 
                          padding: "14px 20px", 
                          border: "1px solid var(--line)", 
                          borderRadius: "var(--radius-md)", 
                          background: "rgba(255, 255, 255, 0.01)",
                          flexWrap: "wrap",
                          gap: "12px"
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                          <img 
                            src={booking.userId?.profileImage || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(booking.userId?.name || "Tenant")}`} 
                            alt={booking.userId?.name} 
                            className="avatar" 
                          />
                          <div>
                            <strong style={{ fontSize: "0.95rem" }}>{booking.userId?.name}</strong>
                            <span style={{ display: "block", fontSize: "0.75rem", color: "var(--muted)" }}>Phone: {booking.userId?.phone} &bull; Email: {booking.userId?.email}</span>
                          </div>
                        </div>

                        <div>
                          <span style={{ fontSize: "0.8rem", color: "var(--muted)" }}>Property:</span>
                          <Link to={`/property/${booking.propertyId?._id}`} style={{ display: "block", fontWeight: "700", fontSize: "0.85rem", color: "var(--accent)" }}>
                            {booking.propertyId?.title || "Property"}
                          </Link>
                        </div>

                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                          <div style={{ textAlign: "right" }}>
                            <span className="chip chip-success" style={{ fontSize: "0.65rem", padding: "2px 8px" }}>
                              📅 {new Date(booking.visitDate).toLocaleDateString()}
                            </span>
                            <span className="chip chip-accent" style={{ fontSize: "0.65rem", padding: "2px 8px", marginLeft: "6px" }}>
                              ⏰ {booking.visitTime}
                            </span>
                            <span className={`chip ${getBookingStatusMeta(booking.status).chipClass}`} style={{ fontSize: "0.65rem", padding: "2px 8px", marginLeft: "6px" }}>
                              {getBookingStatusMeta(booking.status).label}
                            </span>
                          </div>
                          <button 
                            onClick={() => handleDeleteBooking(booking._id)}
                            className="btn btn-secondary btn-icon"
                            style={{ minHeight: "32px", width: "32px", height: "32px", padding: "0", display: "grid", placeItems: "center", borderColor: "rgba(239, 68, 68, 0.15)", color: "var(--danger)" }}
                            title="Remove visit record"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ textAlign: "center", padding: "32px", color: "var(--muted)" }}>
                    No tenants have scheduled visits to your properties yet.
                  </div>
                )}
              </div>
            </>
          )}

          {/* Visit Bookings tab */}
          {activeTab === "bookings" && (
            <div className="glass-card" style={{ padding: "24px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "18px", gap: "12px", flexWrap: "wrap" }}>
                <h3 style={{ fontSize: "1.15rem", fontWeight: "700" }}>Visit Bookings ({bookings.length})</h3>
                {analytics.unreadBookings > 0 && (
                  <button onClick={handleMarkBookingsRead} className="btn btn-secondary btn-small">
                    Mark All Read
                  </button>
                )}
              </div>

              {bookings.length > 0 ? (
                <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                  {bookings.map((booking) => (
                    <div 
                      key={booking._id} 
                      style={{ 
                        display: "flex", 
                        alignItems: "center", 
                        justifyContent: "space-between", 
                        gap: "16px",
                        padding: "14px 20px", 
                        border: "1px solid var(--line)", 
                        borderRadius: "var(--radius-md)", 
                        background: "rgba(255, 255, 255, 0.01)",
                        flexWrap: "wrap"
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "12px", minWidth: "240px" }}>
                        <img 
                          src={booking.userId?.profileImage || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(booking.userId?.name || "Tenant")}`} 
                          alt={booking.userId?.name} 
                          className="avatar" 
                        />
                        <div>
                          <strong style={{ fontSize: "0.95rem" }}>{booking.userId?.name}</strong>
                          <span style={{ display: "block", fontSize: "0.75rem", color: "var(--muted)" }}>
                            📞 {booking.userId?.phone} &bull; ✉️ {booking.userId?.email}
                          </span>
                          {!booking.ownerRead && <span className="chip chip-danger" style={{ fontSize: "0.55rem", padding: "1px 4px", marginTop: "4px" }}>NEW</span>}
                        </div>
                      </div>

                      <div>
                        <span style={{ fontSize: "0.8rem", color: "var(--muted)" }}>Listing:</span>
                        <Link to={`/property/${booking.propertyId?._id}`} style={{ display: "block", fontWeight: "700", fontSize: "0.85rem", color: "var(--accent)" }}>
                          {booking.propertyId?.title || "Property Listing"}
                        </Link>
                      </div>

                      <div>
                        <span className="chip chip-success" style={{ fontSize: "0.65rem", padding: "2px 8px" }}>
                          📅 {new Date(booking.visitDate).toLocaleDateString()}
                        </span>
                        <span className="chip chip-accent" style={{ fontSize: "0.65rem", padding: "2px 8px", marginLeft: "6px" }}>
                          ⏰ {booking.visitTime}
                        </span>
                      </div>

                      {/* Action buttons based on status */}
                      <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                        {booking.status === "scheduled" ? (
                          <>
                            <button onClick={() => handleConfirmVisit(booking._id)} className="btn btn-primary btn-small" style={{ background: "var(--success)" }}>Confirm</button>
                            <button onClick={() => handleCancelVisit(booking._id)} className="btn btn-secondary btn-small" style={{ color: "var(--danger)" }}>Cancel</button>
                          </>
                        ) : (
                          <>
                            <span className={`chip ${getBookingStatusMeta(booking.status).chipClass}`} style={{ textTransform: "uppercase", fontSize: "0.65rem" }}>
                              {getBookingStatusMeta(booking.status).label}
                            </span>
                            <button 
                              onClick={() => handleDeleteBooking(booking._id)}
                              className="btn btn-secondary btn-icon"
                              style={{ minHeight: "32px", width: "32px", height: "32px", padding: "0", display: "grid", placeItems: "center", borderColor: "rgba(239, 68, 68, 0.15)", color: "var(--danger)" }}
                              title="Remove visit record"
                            >
                              <Trash2 size={14} />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ textAlign: "center", padding: "64px 24px" }}>
                  <Calendar size={36} style={{ color: "var(--muted)", margin: "0 auto 12px" }} />
                  <p style={{ color: "var(--muted)" }}>No visit bookings scheduled yet.</p>
                </div>
              )}
            </div>
          )}

          {/* Properties tab list */}
          {activeTab === "properties" && (
            <div className="glass-card" style={{ padding: "24px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", gap: "12px", flexWrap: "wrap" }}>
                <h3 style={{ fontSize: "1.15rem", fontWeight: "700" }}>Manage Listings</h3>
                <button onClick={() => setActiveTab("add")} className="btn btn-primary btn-small">
                  <Plus size={14} /> Add Property
                </button>
              </div>

              {loading ? (
                renderSkeletons()
              ) : properties.length > 0 ? (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "20px" }}>
                  {properties.map((prop) => {
                    const images = prop.images && prop.images.length > 0 ? prop.images : ["/placeholder-property.jpg"];
                    const isEditing = editingId === prop._id;

                    return (
                      <div key={prop._id} className={`property-card ${prop.listingStatus === 'rented' ? 'rented' : ''}`} style={{ borderRadius: "var(--radius-md)" }}>
                        <div className="card-image-container" style={{ aspectRatio: "4 / 3" }}>
                          <img 
                            src={images[0]} 
                            alt={prop.title} 
                            className="card-image" 
                            loading="lazy"
                            onError={(e) => { e.target.src = '/placeholder-property.jpg' }}
                          />
                          <span className="chip chip-accent card-badge">
                            {prop.propertyType}
                          </span>
                          
                          {/* Listing status overlay dropdown */}
                          <div style={{ position: "absolute", top: "10px", right: "10px", zIndex: 5 }}>
                            <select 
                              value={prop.listingStatus} 
                              onChange={(e) => handleUpdateStatus(prop._id, e.target.value)}
                              className="form-select"
                              style={{ padding: "4px 8px", fontSize: "0.75rem", background: "rgba(0,0,0,0.7)", color: "white", borderColor: "transparent", cursor: "pointer", borderRadius: "var(--radius-sm)" }}
                            >
                              <option value="available" style={{ color: "black" }}>Active</option>
                              <option value="hidden" style={{ color: "black" }}>Paused</option>
                              <option value="rented" style={{ color: "black" }}>Rented</option>
                              <option value="draft" style={{ color: "black" }}>Draft</option>
                            </select>
                          </div>

                          {prop.isVerifiedProperty && (
                            <span className="chip chip-success" style={{ position: "absolute", bottom: "10px", left: "10px", zIndex: 2, fontSize: "0.65rem", padding: "2px 8px" }}>
                              Verified
                            </span>
                          )}
                        </div>

                        <div className="property-card-body" style={{ padding: "14px" }}>
                          <Link to={`/property/${prop._id}`} style={{ fontSize: "0.95rem", fontWeight: "700", display: "block" }}>
                            {prop.title}
                          </Link>
                          <span style={{ fontSize: "0.8rem", color: "var(--muted)", display: "block", marginBottom: "8px" }}>
                            📍 {prop.area}, {formatCity(prop.city).toUpperCase()}
                          </span>

                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid var(--line)", paddingTop: "10px", marginTop: "auto" }}>
                            {isEditing ? (
                              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                                <input 
                                  type="number" 
                                  value={editRent} 
                                  onChange={(e) => setEditRent(e.target.value)} 
                                  className="form-input" 
                                  style={{ padding: "4px 8px", fontSize: "0.8rem" }}
                                  placeholder="Rent"
                                />
                                <input 
                                  type="number" 
                                  value={editDeposit} 
                                  onChange={(e) => setEditDeposit(e.target.value)} 
                                  className="form-input" 
                                  style={{ padding: "4px 8px", fontSize: "0.8rem" }}
                                  placeholder="Deposit"
                                />
                              </div>
                            ) : (
                              <div>
                                <strong style={{ display: "block", color: "var(--accent-2)" }}>₹{formatMoney(prop.rent)} / mo</strong>
                                <span style={{ fontSize: "0.75rem", color: "var(--muted)" }}>Dep: ₹{formatMoney(prop.deposit)}</span>
                              </div>
                            )}

                            {/* Action buttons */}
                            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", justifyContent: "flex-end" }}>
                              {isEditing ? (
                                <>
                                  <button onClick={() => saveInlineEdit(prop._id)} className="btn btn-secondary btn-small" style={{ color: "var(--success)" }}>Save</button>
                                  <button onClick={() => setEditingId(null)} className="btn btn-secondary btn-small">Cancel</button>
                                </>
                              ) : (
                                <>
                                  <button onClick={() => startEditing(prop)} className="btn btn-secondary btn-icon btn-small" style={{ minHeight: "32px", width: "32px", height: "32px" }}>
                                    <Edit size={12} />
                                  </button>
                                  <button onClick={() => handleDeleteListing(prop._id)} className="btn btn-danger btn-icon btn-small" style={{ minHeight: "32px", width: "32px", height: "32px" }}>
                                    <Trash2 size={12} />
                                  </button>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div style={{ textAlign: "center", padding: "48px 0" }}>
                  <Building2 size={36} style={{ color: "var(--muted)", margin: "0 auto 12px" }} />
                  <p style={{ color: "var(--muted)" }}>You have not listed any properties yet.</p>
                </div>
              )}
            </div>
          )}

          {/* Add Property Form screen */}
          {activeTab === "add" && (
            <div className="glass-card" style={{ padding: "28px" }}>
              <h3 style={{ fontSize: "1.25rem", fontWeight: "800", marginBottom: "4px" }}>List Rental Property</h3>
              <p style={{ color: "var(--muted)", fontSize: "0.85rem", marginBottom: "20px" }}>Fill out details. The listing goes live instantly.</p>
              
              {formSuccess && (
                <div className="toast toast-success" style={{ position: "static", width: "100%", marginBottom: "20px", display: "flex", boxShadow: "none" }}>
                  <Check size={16} />
                  <span>Property listing uploaded successfully! Redirecting...</span>
                </div>
              )}

              {formError && (
                <div className="toast toast-error" style={{ position: "static", width: "100%", marginBottom: "20px", display: "flex", boxShadow: "none" }}>
                  <AlertCircle size={16} />
                  <span>{formError}</span>
                </div>
              )}

              <form onSubmit={handleAddPropertySubmit}>
                {/* Basic Info */}
                <div className="form-group">
                  <label className="form-label">Property Title</label>
                  <input 
                    type="text" 
                    placeholder="Premium 2BHK Flat near Hinjewadi IT Park" 
                    value={title} 
                    onChange={(e) => setTitle(e.target.value)} 
                    className="form-input" 
                    required 
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Property Type</label>
                    <select value={propertyType} onChange={(e) => setPropertyType(e.target.value)} className="form-select">
                      <option value="flat">Flat / Apartment</option>
                      <option value="room">Private Room</option>
                      <option value="pg">PG / Hostel</option>
                      <option value="house">Independent House</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Furnishing Status</label>
                    <select value={furnishedStatus} onChange={(e) => setFurnishedStatus(e.target.value)} className="form-select">
                      <option value="unfurnished">Unfurnished</option>
                      <option value="semi-furnished">Semi-Furnished</option>
                      <option value="fully-furnished">Fully-Furnished</option>
                    </select>
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Listing Status</label>
                    <select value={listingStatus} onChange={(e) => setListingStatus(e.target.value)} className="form-select">
                      <option value="available">Available</option>
                      <option value="rented">Rented</option>
                      <option value="hidden">Hidden / Paused</option>
                    </select>
                  </div>
                </div>

                {/* Pricing info */}
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Monthly Rent (₹)</label>
                    <input 
                      type="number" 
                      placeholder="e.g. 18000" 
                      value={rent} 
                      onChange={(e) => setRent(e.target.value)} 
                      className="form-input" 
                      required 
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Security Deposit (₹)</label>
                    <input 
                      type="number" 
                      placeholder="e.g. 45000" 
                      value={deposit} 
                      onChange={(e) => setDeposit(e.target.value)} 
                      className="form-input" 
                      required 
                    />
                  </div>
                </div>

                {/* Property Details */}
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Bedrooms</label>
                    <select value={bedrooms} onChange={(e) => setBedrooms(e.target.value)} className="form-select">
                      <option value="1">1 BHK</option>
                      <option value="2">2 BHK</option>
                      <option value="3">3 BHK</option>
                      <option value="4">4 BHK</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Bathrooms</label>
                    <select value={bathrooms} onChange={(e) => setBathrooms(e.target.value)} className="form-select">
                      <option value="1">1 Bathroom</option>
                      <option value="2">2 Bathrooms</option>
                      <option value="3">3+ Bathrooms</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Available From</label>
                    <input 
                      type="date" 
                      value={availableFrom} 
                      onChange={(e) => setAvailableFrom(e.target.value)} 
                      className="form-input" 
                    />
                  </div>
                </div>

                {/* Location Picker */}
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Full Address</label>
                  <input 
                    type="text" 
                    placeholder="Flat 304, Marvel Society, Baner Road" 
                    value={address} 
                    onChange={(e) => setAddress(e.target.value)} 
                    className="form-input" 
                    required 
                  />
                  </div>
                  <div className="form-group" style={{ maxWidth: "160px" }}>
                    <label className="form-label">City</label>
                    <input
                      type="text"
                      placeholder="e.g. Surat, Nagpur…"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="form-input"
                      required
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Area / Locality</label>
                    <input 
                      type="text" 
                      placeholder="e.g. Baner" 
                      value={area} 
                      onChange={(e) => setArea(e.target.value)} 
                      className="form-input" 
                      required 
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Pin Code</label>
                    <input 
                      type="text" 
                      placeholder="e.g. 411045" 
                      value={pinCode} 
                      onChange={(e) => setPinCode(e.target.value)} 
                      className="form-input" 
                      required 
                    />
                  </div>
                </div>

                {/* Leaflet Picker Map Panel */}
                <div className="form-group">
                  <label className="form-label">Select Location coordinates on Map</label>
                  <div style={{ display: "flex", gap: "10px", marginBottom: "10px" }}>
                    <button 
                      type="button" 
                      onClick={useCurrentLocation} 
                      className="btn btn-secondary btn-small"
                      style={{ borderColor: "var(--accent)" }}
                    >
                      📍 Locate Me
                    </button>
                    <button 
                      type="button" 
                      onClick={handleAddressAutoMark} 
                      className="btn btn-secondary btn-small"
                    >
                      🗺️ Auto-Mark Address
                    </button>
                  </div>
                  <div id="picker-map" style={{ height: "300px", background: "#f3f4f6", border: "1px solid var(--line)", borderRadius: "var(--radius-md)" }}></div>
                  <div style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
                    <span style={{ fontSize: "0.8rem", color: "var(--muted)" }}>Latitude: <strong>{latitude}</strong></span>
                    <span style={{ fontSize: "0.8rem", color: "var(--muted)" }}>Longitude: <strong>{longitude}</strong></span>
                  </div>
                </div>

                {/* Description & contact info */}
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Contact Number (+91)</label>
                    <input 
                      type="tel" 
                      placeholder="Enter 10-digit number" 
                      value={contactNumber} 
                      onChange={(e) => setContactNumber(e.target.value)} 
                      className="form-input" 
                      required 
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Property Description</label>
                  <textarea 
                    placeholder="Provide a detailed description of the property, guidelines, deposit terms..." 
                    value={description} 
                    onChange={(e) => setDescription(e.target.value)} 
                    className="form-textarea" 
                    rows="4" 
                    required
                  ></textarea>
                </div>

                {/* Amenities Checklist */}
                <div className="form-group">
                  <label className="form-label">Amenities</label>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: "10px", marginTop: "6px" }}>
                    {availableAmenities.map((amenity) => {
                      const isChecked = selectedAmenities.includes(amenity);
                      return (
                        <div 
                          key={amenity} 
                          onClick={() => handleAmenityToggle(amenity)}
                          className={`chip ${isChecked ? 'chip-accent' : ''}`}
                          style={{ cursor: "pointer", justifyContent: "center", padding: "8px" }}
                        >
                          {isChecked && <Check size={12} style={{ marginRight: "4px" }} />}
                          <span>{amenity}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Image Upload previews */}
                <div className="form-group">
                  <label className="form-label">Upload Property Images (Min 1, Max 10)</label>
                  <input 
                    type="file" 
                    multiple 
                    accept="image/*" 
                    onChange={handleImageFileChange} 
                    className="form-input" 
                    style={{ padding: "8px 12px" }}
                  />
                  {imagePreviews.length > 0 && (
                    <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginTop: "12px" }}>
                      {imagePreviews.map((src, idx) => (
                        <div key={idx} style={{ position: "relative", width: "80px", height: "80px", borderRadius: "var(--radius-md)", overflow: "hidden", border: "1px solid var(--line)" }}>
                          <img src={src} alt="Preview" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Submit button */}
                <button 
                  type="submit" 
                  disabled={formLoading} 
                  className="btn btn-primary" 
                  style={{ width: "100%", justifyContent: "center", minHeight: "44px" }}
                >
                  {formLoading ? "Uploading property listing..." : "Publish Listing"}
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
