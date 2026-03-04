import React, { useEffect, useMemo, useState } from "react";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../auth";
import PickModal from "../components/PickModal";
import RevealPicks from "../components/RevealPicks";

function tsToDate(ts) {
  if (!ts) return null;
  // Firestore Timestamp has toDate()
  if (typeof ts.toDate === "function") return ts.toDate();
  return null;
}

export default function Matches() {
  const { user } = useAuth();
  const [matches, setMatches] = useState([]);
  const [selected, setSelected] = useState(null);
  const [revealFor, setRevealFor] = useState(null);

  useEffect(() => {
    const q = query(collection(db, "matches"), orderBy("startAt", "asc"));
    return onSnapshot(q, (snap) => {
      const rows = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setMatches(rows);
    });
  }, []);

  const now = new Date();

  const upcoming = useMemo(() => {
    return matches.filter((m) => {
      const d = tsToDate(m.startAt);
      return d && d > now && m.status !== "final";
    });
  }, [matches, now]);

  const lockedOrFinal = useMemo(() => {
    return matches.filter((m) => {
      const d = tsToDate(m.startAt);
      return d && d <= now;
    });
  }, [matches, now]);

  return (
    <div className="stack">
      <div className="card">
        <h2>Upcoming Matches</h2>
        <p className="muted">
          Your pick is editable until match start (your local time). Others’ picks stay hidden until then.
        </p>

        {upcoming.length === 0 ? (
          <div className="muted">No upcoming matches yet. (Admin will add them.)</div>
        ) : (
          <div className="table">
            <div className="thead">
              <div>Match</div>
              <div>Start (local)</div>
              <div></div>
            </div>
            {upcoming.map((m) => {
              const start = tsToDate(m.startAt);
              return (
                <div className="trow" key={m.id}>
                  <div><b>{m.teamA}</b> vs <b>{m.teamB}</b></div>
                  <div>{start ? start.toLocaleString() : "—"}</div>
                  <div className="right">
                    <button className="btn" onClick={() => setSelected(m)}>
                      Make / Edit Pick
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="card">
        <h2>Locked / Completed</h2>
        <p className="muted">
          Once the match starts, picks are revealed for everyone.
        </p>

        {lockedOrFinal.length === 0 ? (
          <div className="muted">Nothing locked yet.</div>
        ) : (
          <div className="table">
            <div className="thead">
              <div>Match</div>
              <div>Start (local)</div>
              <div>Result</div>
              <div></div>
            </div>
            {lockedOrFinal.map((m) => {
              const start = tsToDate(m.startAt);
              const resultTxt =
                m.status === "final"
                  ? `${m.resultWinner || "?"} • Total ${m.resultCombinedScore ?? "?"}`
                  : "In progress / awaiting result";

              return (
                <div className="trow" key={m.id}>
                  <div><b>{m.teamA}</b> vs <b>{m.teamB}</b></div>
                  <div>{start ? start.toLocaleString() : "—"}</div>
                  <div>{resultTxt}</div>
                  <div className="right">
                    <button className="btn ghost" onClick={() => setRevealFor(m)}>
                      View Revealed Picks
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {selected && (
        <PickModal
          match={selected}
          user={user}
          onClose={() => setSelected(null)}
        />
      )}

      {revealFor && (
        <RevealPicks
          match={revealFor}
          onClose={() => setRevealFor(null)}
        />
      )}
    </div>
  );
}