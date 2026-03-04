import React from "react";
import { Route, Routes, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Matches from "./pages/Matches";
import Admin from "./pages/Admin";
import Leaderboard from "./pages/Leaderboard";
import Protected from "./components/Protected";
import Navbar from "./components/Navbar";

export default function App() {
  return (
    <>
      <Navbar />
      <div className="container">
        <Routes>
          <Route path="/login" element={<Login />} />

          <Route
            path="/"
            element={
              <Protected>
                <Matches />
              </Protected>
            }
          />

          <Route
            path="/leaderboard"
            element={
              <Protected>
                <Leaderboard />
              </Protected>
            }
          />

          <Route
            path="/admin"
            element={
              <Protected requireAdmin>
                <Admin />
              </Protected>
            }
          />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </>
  );
}