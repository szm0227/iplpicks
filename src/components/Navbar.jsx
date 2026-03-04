import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { signOut } from "firebase/auth";
import { auth } from "../firebase";
import { useAuth } from "../auth.jsx";

export default function Navbar() {
  const { user, isAdmin } = useAuth();
  const nav = useNavigate();

  async function logout() {
    await signOut(auth);
    nav("/login");
  }

  return (
    <div className="navbar">
      <div className="navbar-inner">
        <div className="brand">IPL Picks</div>

        <div className="nav-links">
          {user ? (
            <>
              <Link to="/">Matches</Link>
              <Link to="/leaderboard">Leaderboard</Link>
              {isAdmin && <Link to="/admin">Admin</Link>}
              <button className="btn ghost" onClick={logout}>Logout</button>
            </>
          ) : (
            <Link to="/login">Login</Link>
          )}
        </div>
      </div>
    </div>
  );
}