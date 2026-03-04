import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../auth.jsx";

export default function Protected({ children, requireAdmin = false }) {
  const { user, loading, isAdmin } = useAuth();

  if (loading) return <div className="card">Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;

  if (requireAdmin && !isAdmin) {
    return <div className="card">You are not authorized to view this page.</div>;
  }

  return children;
}