import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Login from "./components/Login";
import UserDashboard from "./pages/UserDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import SuperAdminDashboard from "./pages/SuperAdminDashboard";
import { getRole } from "./utils/auth";

// Helper component to handle role-based dashboard routing
function DashboardRouter() {
  const role = getRole();
  if (!role) return <Navigate to="/" />;
  if (role === "Normal") return <UserDashboard />;
  if (role === "Admin") return <AdminDashboard />;
  if (role === "SuperAdmin") return <SuperAdminDashboard />; 
  return <Navigate to="/" />;
}

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/dashboard" element={<DashboardRouter />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}