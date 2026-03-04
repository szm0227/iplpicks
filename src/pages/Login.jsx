import React, { useState } from "react";
import {
  GoogleAuthProvider,
  signInWithPopup,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
} from "firebase/auth";
import { auth, db } from "../firebase";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const nav = useNavigate();
  const [mode, setMode] = useState("login"); // "login" | "signup"
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  async function upsertUserProfile(u) {
    if (!u) return;
    await setDoc(
      doc(db, "users", u.uid),
      {
        uid: u.uid,
        email: u.email || null,
        displayName: u.displayName || null,
        photoURL: u.photoURL || null,
        lastLoginAt: serverTimestamp(),
      },
      { merge: true }
    );
  }

  async function loginGoogle() {
    try {
      setBusy(true);
      setErr("");
      const provider = new GoogleAuthProvider();
      const cred = await signInWithPopup(auth, provider);
      await upsertUserProfile(cred.user);
      nav("/");
    } catch (e) {
      setErr(e?.message || "Google login failed.");
    } finally {
      setBusy(false);
    }
  }

  async function submitEmailPass(e) {
    e.preventDefault();
    try {
      setBusy(true);
      setErr("");

      if (mode === "signup") {
        if (!displayName.trim()) {
          setErr("Please enter a name for sign up.");
          return;
        }
        const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
        await updateProfile(cred.user, { displayName: displayName.trim() });
        await upsertUserProfile({ ...cred.user, displayName: displayName.trim() });
        nav("/");
      } else {
        const cred = await signInWithEmailAndPassword(auth, email.trim(), password);
        await upsertUserProfile(cred.user);
        nav("/");
      }
    } catch (e2) {
      setErr(e2?.message || "Auth failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid">
      <div className="card">
        <h2>Sign in</h2>
        <p className="muted">Play with friends — picks are hidden until match start.</p>

        <button className="btn" onClick={loginGoogle} disabled={busy}>
          Continue with Google
        </button>

        <div className="divider"><span>or</span></div>

        <div className="tabs">
          <button className={`tab ${mode === "login" ? "active" : ""}`} onClick={() => setMode("login")}>
            Login
          </button>
          <button className={`tab ${mode === "signup" ? "active" : ""}`} onClick={() => setMode("signup")}>
            Create account
          </button>
        </div>

        <form onSubmit={submitEmailPass} className="form">
          {mode === "signup" && (
            <label>
              Display name
              <input value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="Your name" />
            </label>
          )}

          <label>
            Email
            <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@email.com" type="email" />
          </label>

          <label>
            Password
            <input value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" type="password" />
          </label>

          {err && <div className="error">{err}</div>}

          <button className="btn" type="submit" disabled={busy}>
            {mode === "signup" ? "Create account" : "Login"}
          </button>
        </form>
      </div>

      <div className="card">
        <h2>How scoring works</h2>
        <ul className="list">
          <li><b>Winner correct</b>: +20</li>
          <li><b>Exact Combined total</b>: +25</li>
          <li>Diff ≤ 5:+l10, ≤ 10: +7, ≤ 20: +4</li>
        </ul>
        <p className="muted">
          <h3>Good Luck, Have Fun!</h3>
        </p>
      </div>
    </div>
  );
}