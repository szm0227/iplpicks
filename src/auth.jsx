import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "./firebase";

const AuthCtx = createContext(null);

export const ADMIN_EMAIL = "sectionsm141@gmail.com";

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u || null);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const value = useMemo(() => {
    const isAdmin = !!user?.email && user.email.toLowerCase() === ADMIN_EMAIL.toLowerCase();
    return { user, loading, isAdmin };
  }, [user, loading]);

  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}

export function useAuth() {
  return useContext(AuthCtx);
}