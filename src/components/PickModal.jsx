import React, { useEffect, useMemo, useState } from "react";
import { db } from "../firebase";
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";

function tsToDate(ts) {
  if (!ts) return null;
  if (typeof ts.toDate === "function") return ts.toDate();
  return null;
}

export default function PickModal({ match, user, onClose }) {
  const [loading, setLoading] = useState(true);
  const [pickedWinner, setPickedWinner] = useState("");
  const [pickedTotal, setPickedTotal] = useState("");
  const [err, setErr] = useState("");
  const [saving, setSaving] = useState(false);

  const startDate = useMemo(() => tsToDate(match.startAt), [match.startAt]);
  const locked = startDate ? new Date() >= startDate : false;

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        setLoading(true);
        setErr("");
        const ref = doc(db, "matches", match.id, "predictions", user.uid);
        const snap = await getDoc(ref);
        if (!mounted) return;

        if (snap.exists()) {
          const d = snap.data();
          setPickedWinner(d.pickWinner || "");
          setPickedTotal(d.pickCombinedScore ?? "");
        } else {
          setPickedWinner("");
          setPickedTotal("");
        }
      } catch (e) {
        setErr(e?.message || "Failed to load your pick.");
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => {
      mounted = false;
    };
  }, [match.id, user.uid]);

  async function save() {
    try {
      setSaving(true);
      setErr("");

      if (locked) {
        setErr("This match is locked. You can’t edit picks after start time.");
        return;
      }
      if (!pickedWinner) {
        setErr("Please pick a winner.");
        return;
      }
      const n = Number(pickedTotal);
      if (!Number.isFinite(n) || n <= 0) {
        setErr("Please enter a valid combined score (number).");
        return;
      }

      const ref = doc(db, "matches", match.id, "predictions", user.uid);
      await setDoc(
        ref,
        {
          userId: user.uid,
          displayName: user.displayName || user.email || "Unknown",
          email: user.email || null,
          pickWinner: pickedWinner,
          pickCombinedScore: n,
          updatedAt: serverTimestamp(),
          createdAt: serverTimestamp(),
        },
        { merge: true }
      );

      onClose();
    } catch (e) {
      setErr(e?.message || "Failed to save.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="modal-backdrop" onMouseDown={onClose}>
      <div className="modal" onMouseDown={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>
            Pick: {match.teamA} vs {match.teamB}
          </h3>
          <button className="btn ghost" onClick={onClose}>✕</button>
        </div>

        <div className="muted">
          Start (local): {startDate ? startDate.toLocaleString() : "—"}
          {locked && <span className="pill">Locked</span>}
        </div>

        {loading ? (
          <div className="card-inner">Loading…</div>
        ) : (
          <div className="card-inner stack">
            <div>
              <div className="label">Who will win?</div>
              <div className="row">
                <button
                  className={`btn ${pickedWinner === match.teamA ? "" : "ghost"}`}
                  onClick={() => setPickedWinner(match.teamA)}
                  disabled={locked}
                >
                  {match.teamA}
                </button>
                <button
                  className={`btn ${pickedWinner === match.teamB ? "" : "ghost"}`}
                  onClick={() => setPickedWinner(match.teamB)}
                  disabled={locked}
                >
                  {match.teamB}
                </button>
              </div>
            </div>

            <label>
              Combined score (total runs)
              <input
                value={pickedTotal}
                onChange={(e) => setPickedTotal(e.target.value)}
                placeholder="e.g., 365"
                inputMode="numeric"
                disabled={locked}
              />
            </label>

            {err && <div className="error">{err}</div>}

            <div className="row right">
              <button className="btn ghost" onClick={onClose}>Cancel</button>
              <button className="btn" onClick={save} disabled={saving || locked}>
                Save Pick
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}