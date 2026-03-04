import React, { useEffect, useMemo, useState } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "../firebase";

function tsToDate(ts) {
  if (!ts) return null;
  if (typeof ts.toDate === "function") return ts.toDate();
  return null;
}

export default function RevealPicks({ match, onClose }) {
  const [rows, setRows] = useState([]);
  const startDate = useMemo(() => tsToDate(match.startAt), [match.startAt]);

  useEffect(() => {
    const col = collection(db, "matches", match.id, "predictions");
    return onSnapshot(col, (snap) => {
      const r = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      r.sort((a, b) => (a.displayName || "").localeCompare(b.displayName || ""));
      setRows(r);
    });
  }, [match.id]);

  return (
    <div className="modal-backdrop" onMouseDown={onClose}>
      <div className="modal wide" onMouseDown={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Revealed Picks: {match.teamA} vs {match.teamB}</h3>
          <button className="btn ghost" onClick={onClose}>✕</button>
        </div>

        <div className="muted">
          Start (local): {startDate ? startDate.toLocaleString() : "—"}
          <span className="pill">Picks visible after start</span>
        </div>

        <div className="card-inner">
          {rows.length === 0 ? (
            <div className="muted">No picks submitted.</div>
          ) : (
            <div className="table">
              <div className="thead">
                <div>Player</div>
                <div>Winner</div>
                <div>Total</div>
              </div>
              {rows.map((r) => (
                <div className="trow" key={r.id}>
                  <div><b>{r.displayName || r.email || r.userId}</b></div>
                  <div>{r.pickWinner}</div>
                  <div>{r.pickCombinedScore}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}