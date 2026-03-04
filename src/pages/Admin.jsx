import React, { useEffect, useMemo, useState } from "react";
import { addDoc, collection, doc, onSnapshot, orderBy, query, updateDoc } from "firebase/firestore";
import { db } from "../firebase";

function tsToDate(ts) {
  if (!ts) return null;
  if (typeof ts.toDate === "function") return ts.toDate();
  return null;
}

export default function Admin() {
  const [teamA, setTeamA] = useState("");
  const [teamB, setTeamB] = useState("");
  const [startLocal, setStartLocal] = useState(""); // datetime-local value
  const [err, setErr] = useState("");
  const [ok, setOk] = useState("");

  const [matches, setMatches] = useState([]);

  useEffect(() => {
    const q = query(collection(db, "matches"), orderBy("startAt", "asc"));
    return onSnapshot(q, (snap) => {
      setMatches(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
  }, []);

  async function createMatch(e) {
    e.preventDefault();
    try {
      setErr("");
      setOk("");

      if (!teamA.trim() || !teamB.trim()) {
        setErr("Please enter both team names.");
        return;
      }
      if (teamA.trim() === teamB.trim()) {
        setErr("Teams must be different.");
        return;
      }
      if (!startLocal) {
        setErr("Please pick a start date/time.");
        return;
      }

      // datetime-local parses as local time in the admin's browser
      const dt = new Date(startLocal);
      if (!Number.isFinite(dt.getTime())) {
        setErr("Invalid start time.");
        return;
      }

      await addDoc(collection(db, "matches"), {
        teamA: teamA.trim(),
        teamB: teamB.trim(),
        startAt: dt, // Firestore converts Date -> Timestamp
        status: "scheduled",
        resultWinner: null,
        resultCombinedScore: null,
      });

      setTeamA("");
      setTeamB("");
      setStartLocal("");
      setOk("Match created.");
    } catch (e2) {
      setErr(e2?.message || "Failed to create match.");
    }
  }

  async function finalizeMatch(m, winner, total) {
    try {
      const n = Number(total);
      if (!winner) return alert("Pick a winner.");
      if (!Number.isFinite(n) || n <= 0) return alert("Enter a valid combined score.");

      await updateDoc(doc(db, "matches", m.id), {
        status: "final",
        resultWinner: winner,
        resultCombinedScore: n,
      });
    } catch (e) {
      alert(e?.message || "Failed to save result.");
    }
  }

  return (
    <div className="stack">
      <div className="card">
        <h2>Admin</h2>
        <p className="muted">
          Create matches and enter results. Times are stored as an absolute moment and displayed in each user’s local time.
        </p>

        <form className="form" onSubmit={createMatch}>
          <div className="row">
            <label style={{ flex: 1 }}>
              Team A
              <input value={teamA} onChange={(e) => setTeamA(e.target.value)} placeholder="e.g., CSK" />
            </label>
            <label style={{ flex: 1 }}>
              Team B
              <input value={teamB} onChange={(e) => setTeamB(e.target.value)} placeholder="e.g., MI" />
            </label>
          </div>

          <label>
            Start time (local)
            <input type="datetime-local" value={startLocal} onChange={(e) => setStartLocal(e.target.value)} />
          </label>

          {err && <div className="error">{err}</div>}
          {ok && <div className="success">{ok}</div>}

          <button className="btn" type="submit">Create Match</button>
        </form>
      </div>

      <div className="card">
        <h2>Manage Results</h2>

        {matches.length === 0 ? (
          <div className="muted">No matches yet.</div>
        ) : (
          <div className="table">
            <div className="thead">
              <div>Match</div>
              <div>Start (local)</div>
              <div>Status</div>
              <div>Result</div>
            </div>

            {matches.map((m) => {
              const start = tsToDate(m.startAt);
              return (
                <AdminRow
                  key={m.id}
                  match={m}
                  startText={start ? start.toLocaleString() : "—"}
                  onFinalize={finalizeMatch}
                />
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function AdminRow({ match, startText, onFinalize }) {
  const [winner, setWinner] = useState(match.resultWinner || "");
  const [total, setTotal] = useState(match.resultCombinedScore ?? "");

  useEffect(() => {
    setWinner(match.resultWinner || "");
    setTotal(match.resultCombinedScore ?? "");
  }, [match.resultWinner, match.resultCombinedScore]);

  return (
    <div className="trow">
      <div><b>{match.teamA}</b> vs <b>{match.teamB}</b></div>
      <div>{startText}</div>
      <div>{match.status}</div>
      <div className="right">
        <div className="row">
          <select value={winner} onChange={(e) => setWinner(e.target.value)}>
            <option value="">Winner…</option>
            <option value={match.teamA}>{match.teamA}</option>
            <option value={match.teamB}>{match.teamB}</option>
          </select>
          <input
            value={total}
            onChange={(e) => setTotal(e.target.value)}
            placeholder="Combined score"
            style={{ width: 150 }}
          />
          <button className="btn" onClick={() => onFinalize(match, winner, total)}>
            Save Result
          </button>
        </div>
      </div>
    </div>
  );
}