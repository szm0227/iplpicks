import React, { useEffect, useMemo, useState } from "react";
import { collection, getDocs, onSnapshot, orderBy, query } from "firebase/firestore";
import { db } from "../firebase";
import { calcPoints } from "../score";

function tsToDate(ts) {
  if (!ts) return null;
  if (typeof ts.toDate === "function") return ts.toDate();
  return null;
}

export default function Leaderboard() {
  const [matches, setMatches] = useState([]);
  const [scores, setScores] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, "matches"), orderBy("startAt", "asc"));
    return onSnapshot(q, (snap) => {
      setMatches(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function compute() {
      setLoading(true);

      // Only score matches that have results
      const finals = matches.filter((m) => m.status === "final" && m.resultWinner && m.resultCombinedScore != null);

      const totalsByUser = new Map(); // userId -> { name, totalPoints, breakdown[] }

      for (const m of finals) {
        // predictions are in subcollection matches/{matchId}/predictions
        const predSnap = await getDocs(collection(db, "matches", m.id, "predictions"));
        predSnap.forEach((pdoc) => {
          const p = pdoc.data();
          const userId = p.userId || pdoc.id;
          const name = p.displayName || p.email || userId;

          const pts = calcPoints({
            pickedWinner: p.pickWinner,
            pickedTotal: p.pickCombinedScore,
            actualWinner: m.resultWinner,
            actualTotal: m.resultCombinedScore,
          });

          const prev = totalsByUser.get(userId) || { userId, name, totalPoints: 0, breakdown: [] };
          prev.totalPoints += pts;
          prev.breakdown.push({
            matchId: m.id,
            match: `${m.teamA} vs ${m.teamB}`,
            points: pts,
          });
          totalsByUser.set(userId, prev);
        });
      }

      const arr = Array.from(totalsByUser.values());
      arr.sort((a, b) => b.totalPoints - a.totalPoints);

      if (!cancelled) {
        setScores(arr);
        setLoading(false);
      }
    }

    compute().catch(() => setLoading(false));

    return () => {
      cancelled = true;
    };
  }, [matches]);

  return (
    <div className="card">
      <h2>Leaderboard</h2>
      <p className="muted">Scores include only matches with results entered by admin.</p>

      {loading ? (
        <div className="muted">Calculating…</div>
      ) : scores.length === 0 ? (
        <div className="muted">No scored matches yet.</div>
      ) : (
        <div className="table">
          <div className="thead">
            <div>Rank</div>
            <div>Player</div>
            <div>Total</div>
          </div>
          {scores.map((s, idx) => (
            <div className="trow" key={s.userId}>
              <div>{idx + 1}</div>
              <div><b>{s.name}</b></div>
              <div>{s.totalPoints}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}