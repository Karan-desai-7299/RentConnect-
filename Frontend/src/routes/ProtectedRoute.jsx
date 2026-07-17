import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute({ children, allowedRoles }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="page flex-center" style={{ minHeight: "60vh", display: "flex", justifyContent: "center", alignItems: "center" }}>
        <div className="spinner">Loading user profile...</div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // If not authorized for this role, send to their own default page
    if (user.role === "admin") return <Navigate to="/admin" replace />;
    if (user.role === "owner") return <Navigate to="/owner" replace />;
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}
