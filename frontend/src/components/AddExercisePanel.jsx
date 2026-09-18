import { useEffect, useState } from "react";
import { Check, Plus, Search, X } from "lucide-react";
import { api } from "../api";
import { c, radius } from "../theme";

export default function AddExercisePanel({ exercises, onPick, profileId }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);

  useEffect(() => {
    if (!open) return;
    const handle = setTimeout(() => {
      const fetcher = query.trim() ? api.getExercises({ q: query }) : api.getRecentExercises(profileId);
      fetcher.then(setResults).catch(() => setResults([]));
    }, 200);
    return () => clearTimeout(handle);
  }, [query, open, profileId]);

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        style={{ width: "100%", background: c.canvas, border: `1px dashed ${c.hairline}`, borderRadius: radius.md, padding: "12px 16px", marginBottom: 12, display: "flex", alignItems: "center", gap: 6, cursor: "pointer" }}
      >
        <Plus size={13} color={c.slate} />
        <span style={{ fontSize: 13, color: c.slate }}>Add exercise</span>
      </button>
    );
  }

  return (
    <div style={{ background: c.canvas, borderRadius: radius.md, padding: 12, marginBottom: 12, border: `1px solid ${c.hairline}` }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6, background: c.paleMauve, borderRadius: radius.xs, padding: "8px 10px", marginBottom: 8 }}>
        <Search size={12} color={c.mauve} />
        <input
          autoFocus
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by name or muscle group…"
          style={{ border: "none", background: "transparent", fontSize: 11, color: c.ink, flex: 1, outline: "none" }}
        />
        <X size={13} color={c.muted} style={{ cursor: "pointer" }} onClick={() => setOpen(false)} />
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 4, maxHeight: 160, overflowY: "auto" }}>
        {results.map((r) => {
          const alreadyAdded = exercises.some((e) => e.exercise_id === r.id);
          return (
            <div
              key={r.id}
              onClick={() => {
                if (!alreadyAdded) {
                  onPick(r);
                  setOpen(false);
                  setQuery("");
                }
              }}
              style={{
                padding: "7px 9px",
                fontSize: 11,
                borderRadius: radius.xs,
                cursor: alreadyAdded ? "default" : "pointer",
                background: alreadyAdded ? c.paleMauve : "transparent",
                color: alreadyAdded ? c.mauve : c.ink,
                fontWeight: alreadyAdded ? 500 : 400,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <span>{r.full_name} <span style={{ color: c.muted, fontWeight: 400 }}>· {r.muscle_group}</span></span>
              {alreadyAdded && <Check size={13} />}
            </div>
          );
        })}
        {results.length === 0 && (
          <div style={{ fontSize: 11, color: c.muted, padding: "6px 9px" }}>
            {query.trim() ? "No matches." : "No previously used exercises yet — type to search the full library."}
          </div>
        )}
      </div>
    </div>
  );
}
