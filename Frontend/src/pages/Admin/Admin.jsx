import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../../services/api";
import { useToast } from "../../hooks/useToast";
import { formatMoney } from "../../utils/formatters";
import { 
  ShieldAlert, 
  Users, 
  Building, 
  AlertTriangle, 
  Trash2, 
  UserX, 
  UserCheck, 
  CheckCircle,
  Eye,
  Check,
  Search
} from "lucide-react";

export default function Admin() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [usersList, setUsersList] = useState([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("reports"); // "reports" | "users"
  const [userSearch, setUserSearch] = useState("");
  const [userRoleFilter, setUserRoleFilter] = useState("all");
  const showToast = useToast();

  // Fetch admin dashboard details
  const fetchAdminDashboard = () => {
    setLoading(true);
    api.get(`/api/v1/admin/dashboard`)
      .then((res) => {
        if (res.data?.success) {
          setData(res.data.data);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching admin dashboard:", err);
        setLoading(false);
        showToast("Failed to fetch dashboard data.", "error");
      });
  };

  // Fetch users list
  const fetchUsersList = () => {
    setUsersLoading(true);
    let url = `/api/v1/admin/users?limit=50`;
    if (userSearch) url += `&search=${encodeURIComponent(userSearch)}`;
    if (userRoleFilter !== "all") url += `&role=${userRoleFilter}`;

    api.get(url)
      .then((res) => {
        if (res.data?.success && Array.isArray(res.data.data.users)) {
          setUsersList(res.data.data.users);
        }
        setUsersLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching users list:", err);
        setUsersLoading(false);
        showToast("Failed to fetch users list.", "error");
      });
  };

  useEffect(() => {
    fetchAdminDashboard();
  }, []);

  useEffect(() => {
    if (activeTab === "users") {
      fetchUsersList();
    }
  }, [activeTab, userSearch, userRoleFilter]);

  // Delete reported property
  const handleDeleteReportedProperty = (propertyId) => {
    if (!window.confirm("Are you sure you want to permanently delete this reported listing?")) return;

    api.delete(`/api/v1/admin/property/${propertyId}`)
      .then(() => {
        showToast("Listing deleted & report resolved.");
        fetchAdminDashboard();
      })
      .catch((err) => {
        console.error(err);
        showToast("Failed to delete listing.", "error");
      });
  };

  // Verify property
  const handleVerifyProperty = (propertyId) => {
    api.put(`/api/v1/admin/property/${propertyId}/verify`)
      .then(() => {
        showToast("Listing verified successfully.");
        fetchAdminDashboard();
      })
      .catch((err) => {
        console.error(err);
        showToast("Failed to verify listing.", "error");
      });
  };

  // Ban/Unban user
  const handleToggleBanUser = (userId) => {
    if (!userId) return;
    
    api.put(`/api/v1/admin/users/${userId}/ban`)
      .then((res) => {
        if (res.data?.success) {
          showToast(res.data.data.message);
          if (activeTab === "users") {
            fetchUsersList();
          } else {
            fetchAdminDashboard();
          }
        }
      })
      .catch((err) => {
        console.error(err);
        showToast("Failed to update user ban status.", "error");
      });
  };

  if (loading) {
    return (
      <div className="page" style={{ padding: "40px 0" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          <div className="skeleton" style={{ height: "80px", borderRadius: "var(--radius-lg)" }}></div>
          <div className="stats-grid-4">
            <div className="skeleton" style={{ height: "100px" }}></div>
            <div className="skeleton" style={{ height: "100px" }}></div>
            <div className="skeleton" style={{ height: "100px" }}></div>
            <div className="skeleton" style={{ height: "100px" }}></div>
          </div>
          <div className="skeleton" style={{ height: "400px", borderRadius: "var(--radius-lg)" }}></div>
        </div>
      </div>
    );
  }

  const stats = data?.stats || { totalUsers: 0, totalOwners: 0, totalProperties: 0, totalReports: 0 };
  const reports = data?.reports || [];
  const popular = data?.popularProperties || [];

  return (
    <div className="page">
      {/* Header */}
      <div style={{ marginBottom: "28px", display: "flex", alignItems: "center", gap: "12px" }}>
        <div className="brand-mark" style={{ background: "var(--danger)" }}>
          <ShieldAlert size={20} />
        </div>
        <div>
          <h1 style={{ fontSize: "1.75rem", fontWeight: "800" }}>Admin Moderation Center</h1>
          <p style={{ color: "var(--muted)", fontSize: "0.85rem" }}>Monitor platform statistics, report investigations, and user moderation</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid-4" style={{ marginBottom: "28px" }}>
        <div className="stat-card" style={{ borderLeft: "4px solid var(--accent)" }}>
          <span style={{ fontSize: "0.8rem", color: "var(--muted)" }}>Total Tenants</span>
          <strong>{stats.totalUsers} Users</strong>
        </div>
        <div className="stat-card" style={{ borderLeft: "4px solid var(--accent-2)" }}>
          <span style={{ fontSize: "0.8rem", color: "var(--muted)" }}>Total Owners</span>
          <strong>{stats.totalOwners} Owners</strong>
        </div>
        <div className="stat-card" style={{ borderLeft: "4px solid var(--success)" }}>
          <span style={{ fontSize: "0.8rem", color: "var(--muted)" }}>Active Properties</span>
          <strong>{stats.totalProperties} listings</strong>
        </div>
        <div className="stat-card" style={{ borderLeft: "4px solid var(--danger)" }}>
          <span style={{ fontSize: "0.8rem", color: "var(--muted)" }}>Pending Reports</span>
          <strong>{stats.totalReports} alerts</strong>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: "12px", borderBottom: "1px solid var(--line)", marginBottom: "24px" }}>
        <button 
          onClick={() => setActiveTab("reports")} 
          className={`sidebar-nav-item ${activeTab === "reports" ? "active" : ""}`}
          style={{ minHeight: "44px", borderBottomLeftRadius: 0, borderBottomRightRadius: 0 }}
        >
          <AlertTriangle size={16} />
          <span>Reported Listings ({reports.length})</span>
        </button>
        <button 
          onClick={() => setActiveTab("users")} 
          className={`sidebar-nav-item ${activeTab === "users" ? "active" : ""}`}
          style={{ minHeight: "44px", borderBottomLeftRadius: 0, borderBottomRightRadius: 0 }}
        >
          <Users size={16} />
          <span>User Management</span>
        </button>
      </div>

      {activeTab === "reports" ? (
        /* Grid: Left - Reports moderation list, Right - Popular properties metrics */
        <div className="admin-detail-layout">
          {/* Reports panel */}
          <div className="glass-card" style={{ padding: "24px" }}>
            <h3 style={{ fontSize: "1.15rem", fontWeight: "800", marginBottom: "16px", display: "flex", alignItems: "center", gap: "6px" }}>
              <AlertTriangle size={18} style={{ color: "var(--danger)" }} />
              <span>Spam & Brokerage Reports</span>
            </h3>

            {reports.length > 0 ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                {reports.map((report) => {
                  const prop = report.propertyId;
                  const reporter = report.reporterId;
                  const owner = prop?.ownerId;

                  return (
                    <div 
                      key={report._id} 
                      style={{ 
                        padding: "16px", 
                        border: "1px solid var(--line)", 
                        borderRadius: "var(--radius-md)", 
                        background: "rgba(239, 68, 68, 0.02)",
                        borderLeft: "3px solid var(--danger)"
                      }}
                    >
                      {/* Header */}
                      <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "10px", marginBottom: "12px", alignItems: "flex-start" }}>
                        <div>
                          <strong style={{ fontSize: "0.95rem" }}>Report: Listing #{prop?._id?.slice(-6) || "Deleted"}</strong>
                          {prop ? (
                            <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                              <Link to={`/property/${prop._id}`} style={{ display: "block", fontSize: "0.85rem", color: "var(--accent)", fontWeight: "600" }}>
                                {prop.title}
                              </Link>
                              {prop.isVerifiedProperty && <span className="chip chip-success" style={{ fontSize: "0.55rem", padding: "1px 4px" }}>Verified</span>}
                            </div>
                          ) : (
                            <span style={{ display: "block", fontSize: "0.85rem", color: "var(--danger)" }}>Property has already been deleted</span>
                          )}
                        </div>
                        
                        <div style={{ display: "flex", gap: "8px" }}>
                          {prop && (
                            <>
                              {!prop.isVerifiedProperty && (
                                <button 
                                  onClick={() => handleVerifyProperty(prop._id)} 
                                  className="btn btn-secondary btn-small"
                                  style={{ color: "var(--success)", borderColor: "var(--success)" }}
                                >
                                  <Check size={12} /> Verify Listing
                                </button>
                              )}
                              <button 
                                onClick={() => handleDeleteReportedProperty(prop._id)} 
                                className="btn btn-danger btn-small"
                                title="Delete Listing & Resolve"
                              >
                                <Trash2 size={12} /> Delete Listing
                              </button>
                            </>
                          )}
                          {owner && (
                            <button 
                              onClick={() => handleToggleBanUser(owner._id)} 
                              className="btn btn-secondary btn-small"
                              style={{ color: "var(--warning)", borderColor: "var(--warning)" }}
                            >
                              <UserX size={12} /> Ban Owner
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Metadata details */}
                      <div style={{ fontSize: "0.8rem", color: "var(--muted)", background: "rgba(255,255,255,0.01)", padding: "10px", borderRadius: "var(--radius-sm)", display: "flex", flexDirection: "column", gap: "4px" }}>
                        <div>
                          <strong>Reporter:</strong> {reporter?.name || "Unknown"} ({reporter?.email || "No email"})
                        </div>
                        {owner && (
                          <div>
                            <strong>Owner:</strong> {owner.name} ({owner.email} &bull; {owner.phone})
                          </div>
                        )}
                        <div style={{ borderTop: "1px solid var(--line)", paddingTop: "6px", marginTop: "4px", color: "var(--text)" }}>
                          <strong>Reason:</strong> "{report.reason}"
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div style={{ textAlign: "center", padding: "48px 12px", color: "var(--muted)" }}>
                <CheckCircle size={32} style={{ color: "var(--success)", marginBottom: "12px", margin: "0 auto" }} />
                <strong>All clear!</strong>
                <p style={{ fontSize: "0.85rem", marginTop: "4px" }}>No listings are currently pending report moderation reviews.</p>
              </div>
            )}
          </div>

          {/* Popular properties sidebar */}
          <aside style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            <div className="glass-card" style={{ padding: "24px" }}>
              <h3 style={{ fontSize: "1.05rem", fontWeight: "800", marginBottom: "16px", display: "flex", alignItems: "center", gap: "6px" }}>
                <Eye size={18} style={{ color: "var(--accent)" }} />
                <span>Top Viewed Listings</span>
              </h3>

              <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                {popular.map((item) => (
                  <div key={item._id} style={{ display: "flex", gap: "10px", fontSize: "0.85rem", paddingBottom: "10px", borderBottom: "1px solid var(--line)" }}>
                    <img 
                      src={item.images?.[0] || "/placeholder-property.jpg"} 
                      alt={item.title} 
                      style={{ width: "50px", height: "40px", objectFit: "cover", borderRadius: "var(--radius-sm)" }}
                      loading="lazy"
                      onError={(e) => { e.target.src = '/placeholder-property.jpg' }}
                    />
                    <div style={{ flexGrow: 1, minWidth: 0 }}>
                      <Link to={`/property/${item._id}`} style={{ fontWeight: "700", display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {item.title}
                      </Link>
                      <span style={{ color: "var(--muted)", fontSize: "0.75rem" }}>Views: {item.viewsCount} &bull; Rent: ₹{formatMoney(item.rent)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </aside>
        </div>
      ) : (
        /* Users Management Tab */
        <div className="glass-card" style={{ padding: "24px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px", flexWrap: "wrap", marginBottom: "20px" }}>
            <div style={{ display: "flex", gap: "10px", flexGrow: 1, maxWidth: "400px" }}>
              <input 
                type="text" 
                placeholder="Search user name or email..."
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                className="form-input"
                style={{ padding: "8px 12px", fontSize: "0.9rem" }}
              />
            </div>
            
            <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
              <span style={{ fontSize: "0.85rem", color: "var(--muted)" }}>Role:</span>
              <select 
                value={userRoleFilter} 
                onChange={(e) => setUserRoleFilter(e.target.value)} 
                className="form-select"
                style={{ padding: "6px 12px", fontSize: "0.85rem" }}
              >
                <option value="all">All Roles</option>
                <option value="user">Tenants Only</option>
                <option value="owner">Owners Only</option>
                <option value="admin">Admins Only</option>
              </select>
            </div>
          </div>

          {usersLoading ? (
            <div style={{ display: "flex", justifyContent: "center", padding: "40px" }}>
              <div className="spinner">Fetching users list...</div>
            </div>
          ) : usersList.length > 0 ? (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.9rem", textAlign: "left" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--line)" }}>
                    <th style={{ padding: "12px" }}>Name</th>
                    <th style={{ padding: "12px" }}>Email</th>
                    <th style={{ padding: "12px" }}>Phone</th>
                    <th style={{ padding: "12px" }}>Role</th>
                    <th style={{ padding: "12px" }}>Status</th>
                    <th style={{ padding: "12px", textAlign: "right" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {usersList.map((usr) => (
                    <tr key={usr._id} style={{ borderBottom: "1px solid var(--line)" }}>
                      <td style={{ padding: "12px", fontWeight: "600" }}>{usr.name}</td>
                      <td style={{ padding: "12px" }}>{usr.email}</td>
                      <td style={{ padding: "12px" }}>{usr.phone}</td>
                      <td style={{ padding: "12px" }}>
                        <span className={`chip ${usr.role === 'admin' ? 'chip-danger' : 'chip-accent'}`} style={{ padding: "2px 8px", fontSize: "0.65rem" }}>
                          {usr.role}
                        </span>
                      </td>
                      <td style={{ padding: "12px" }}>
                        <span className={`chip ${usr.isBanned ? 'chip-danger' : 'chip-success'}`} style={{ padding: "2px 8px", fontSize: "0.65rem" }}>
                          {usr.isBanned ? "Banned" : "Active"}
                        </span>
                      </td>
                      <td style={{ padding: "12px", textAlign: "right" }}>
                        {usr.role !== "admin" && (
                          <button 
                            onClick={() => handleToggleBanUser(usr._id)} 
                            className={`btn ${usr.isBanned ? 'btn-primary' : 'btn-secondary'} btn-small`}
                            style={{ minHeight: "32px", fontSize: "0.75rem" }}
                          >
                            {usr.isBanned ? "Unban User" : "Ban User"}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p style={{ textAlign: "center", color: "var(--muted)", padding: "40px 0" }}>No users match your criteria.</p>
          )}
        </div>
      )}
    </div>
  );
}
