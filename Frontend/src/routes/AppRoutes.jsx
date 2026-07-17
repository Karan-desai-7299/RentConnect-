import { lazy, Suspense } from "react";
import { Route, Routes } from "react-router-dom";
import MainLayout from "../layouts/MainLayout";
import Home from "../pages/Home/Home";
import Login from "../pages/Login/Login";
import Register from "../pages/Register/Register";
import Search from "../pages/Search/Search";
import About from "../pages/About/About";
import ProtectedRoute from "./ProtectedRoute";

// Lazy-loaded pages
const PropertyDetails = lazy(() => import("../pages/PropertyDetails/PropertyDetails"));
const Profile = lazy(() => import("../pages/Profile/Profile"));
const Dashboard = lazy(() => import("../pages/Dashboard/Dashboard"));
const Owner = lazy(() => import("../pages/Owner/Owner"));
const Admin = lazy(() => import("../pages/Admin/Admin"));
const Chat = lazy(() => import("../pages/Chat/Chat"));
const Favorites = lazy(() => import("../pages/Favorites/Favorites"));
const ForgotPassword = lazy(() => import("../pages/ForgotPassword/ForgotPassword"));
const ResetPassword = lazy(() => import("../pages/ResetPassword/ResetPassword"));
const VerifyEmail = lazy(() => import("../pages/VerifyEmail/VerifyEmail"));

const NotFound = () => (
  <div className="page" style={{ padding: "40px 20px", textAlign: "center" }}>
    <section className="section compact">
      <h1 style={{ fontSize: "4rem", margin: "0" }}>404</h1>
      <p style={{ fontSize: "1.2rem", color: "var(--muted)" }}>Oops! Page not found.</p>
    </section>
  </div>
);

const PageLoader = () => (
  <div className="flex-center" style={{ minHeight: "60vh", display: "flex", justifyContent: "center", alignItems: "center" }}>
    <div className="spinner">Loading...</div>
  </div>
);

export default function AppRoutes() {
  return (
    <MainLayout>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/search" element={<Search />} />
          <Route path="/property/:id" element={<PropertyDetails />} />
          <Route path="/about" element={<About />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/verify-email" element={<VerifyEmail />} />

          {/* User (Tenant) Dashboard */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute allowedRoles={["user"]}>
                <Dashboard />
              </ProtectedRoute>
            }
          />

          {/* Owner Dashboard */}
          <Route
            path="/owner"
            element={
              <ProtectedRoute allowedRoles={["owner"]}>
                <Owner />
              </ProtectedRoute>
            }
          />

          {/* Admin Panel */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <Admin />
              </ProtectedRoute>
            }
          />

          {/* Shared Protected Routes */}
          <Route
            path="/profile"
            element={
              <ProtectedRoute allowedRoles={["user", "owner", "admin"]}>
                <Profile />
              </ProtectedRoute>
            }
          />
          <Route
            path="/chat"
            element={
              <ProtectedRoute allowedRoles={["user", "owner"]}>
                <Chat />
              </ProtectedRoute>
            }
          />
          <Route
            path="/favorites"
            element={
              <ProtectedRoute allowedRoles={["user"]}>
                <Favorites />
              </ProtectedRoute>
            }
          />

          {/* Fallback */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </MainLayout>
  );
}
