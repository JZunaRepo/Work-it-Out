import { useEffect, useState } from "react";
import { Check, Plus, Search, X } from "lucide-react";
import { api } from "../api";
import { matchesQuery } from "../search";
import { c, radius } from "../theme";

export default function AddExercisePanel({ exercises, onPick, profileId }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [recent, setRecent] = useState([]);
  const [libraryResults, setLibraryResults] = useState(null);
  const [searching, setSearching] = useState(false);

  // Typing always filters the recent list locally — the full library is only searched
  // once Enter is pressed, so results don't jump straight to all 1,300+ exercises on
  // the first keystroke.
  useEffect(() => {
    if (!open) return;
    api.getRecentExercises(profileId).then(setRecent).catch(() => setRecent([]));
  }, [open, profileId]);

  useEffect(() => {
    // Any edit to the query invalidates a previous Enter-triggered library search —
    // back to filtering recent exercises until Enter is pressed again.
    setLibraryResults(null);
  }, [query]);

  const searchLibrary = () => {
    if (!query.trim()) return;
    setSearching(true);
    api
      .getExercises({ q: query })
      .then(setLibraryResults)
      .catch(() => setLibraryResults([]))
      .finally(() => setSearching(false));
  };

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

  const showingLibrary = libraryResults !== null;
  const results = showingLibrary ? libraryResults : recent.filter((r) => matchesQuery(r.full_name + " " + r.muscle_group, query));

  return (
    <div style={{ background: c.canvas, borderRadius: radius.md, padding: 12, marginBottom: 12, border: `1px solid ${c.hairline}` }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6, background: c.paleMauve, borderRadius: radius.xs, padding: "8px 10px", marginBottom: 8 }}>
        <Search size={12} color={c.mauve} />
        <input
          autoFocus
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") searchLibrary();
          }}
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
                  setLibraryResults(null);
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
            {searching
              ? "Searching…"
              : showingLibrary
              ? "No matches."
              : query.trim()
              ? "No matches in your recent exercises — press Enter to search the full library."
              : "No previously used exercises yet — type to search the full library."}
          </div>
        )}
      </div>
    </div>
  );
}
