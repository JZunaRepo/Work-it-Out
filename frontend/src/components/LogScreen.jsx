import { useEffect, useState } from "react";
import { Check, ChevronLeft, ChevronRight, ClipboardPaste, Copy, Pencil } from "lucide-react";
import { api } from "../api";
import { c, radius } from "../theme";
import AddExercisePanel from "./AddExercisePanel";
import CelebrationModal from "./CelebrationModal";
import DeleteConfirmModal from "./DeleteConfirmModal";
import ExerciseCard from "./ExerciseCard";
import ExercisePreviewModal from "./ExercisePreviewModal";

const WEEKDAY_LABELS = ["M", "T", "W", "T", "F", "S", "S"];
const MONTH_LABELS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function fmtDate(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function isSameDay(a, b) {
  return fmtDate(a) === fmtDate(b);
}

function addDays(d, n) {
  const r = new Date(d);
  r.setDate(d.getDate() + n);
  return r;
}

function startOfWeek(d) {
  return addDays(d, -((d.getDay() + 6) % 7)); // Monday-first
}

function weekRangeLabel(weekStart) {
  const weekEnd = addDays(weekStart, 6);
  const startMonth = MONTH_LABELS[weekStart.getMonth()].slice(0, 3);
  const endMonth = MONTH_LABELS[weekEnd.getMonth()].slice(0, 3);
  if (weekStart.getMonth() === weekEnd.getMonth()) {
    return `${startMonth} ${weekStart.getDate()}–${weekEnd.getDate()}, ${weekEnd.getFullYear()}`;
  }
  return `${startMonth} ${weekStart.getDate()} – ${endMonth} ${weekEnd.getDate()}, ${weekEnd.getFullYear()}`;
}

function shortDateLabel(d) {
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

// Persisted the same way the active tab is (see App.jsx), so a copied day's workout
// survives a tab switch or a reload instead of only living in this component's state.
function readStoredClipboard() {
  try {
    const raw = localStorage.getItem("wio-clipboard");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export default function LogScreen({ profile }) {
  const today = new Date();
  const [weekStart, setWeekStart] = useState(startOfWeek(today));
  const [selectedDay, setSelectedDay] = useState(today);
  const [loggedDates, setLoggedDates] = useState(new Set());
  const [exercises, setExercises] = useState([]);
  const [saved, setSaved] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [celebration, setCelebration] = useState(null);
  const [loading, setLoading] = useState(false);
  const [previewId, setPreviewId] = useState(null);
  const [clipboard, setClipboard] = useState(readStoredClipboard);

  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const refreshWeek = () => {
    api.getRange(profile.id, fmtDate(weekStart), fmtDate(addDays(weekStart, 6))).then((rows) => {
      setLoggedDates(new Set(rows.filter((r) => r.is_saved).map((r) => r.log_date)));
    });
  };

  useEffect(refreshWeek, [profile.id, weekStart]);

  const shiftWeek = (deltaWeeks) => {
    setWeekStart((prev) => addDays(prev, deltaWeeks * 7));
    setSelectedDay((prev) => addDays(prev, deltaWeeks * 7));
  };

  useEffect(() => {
    const fetchDay = () => {
      setLoading(true);
      api
        .getDay(profile.id, fmtDate(selectedDay))
        .then((day) => {
          setSaved(day.is_saved);
          setExpanded(false);
          setExercises(
            day.exercises.map((e) => ({
              id: e.exercise_id,
              exercise_id: e.exercise_id,
              full_name: e.full_name,
              sets: e.sets.map((s) => ({ reps: s.reps ?? "", weight: s.weight ?? "" })),
            }))
          );
        })
        .finally(() => setLoading(false));
    };

    fetchDay();

    // Re-fetch when the tab/app regains focus — e.g. iOS Safari often resumes a backgrounded
    // tab without reloading it, so an edit made elsewhere (a library rename, a save from
    // another device) wouldn't otherwise show up until a manual reload. Two independent
    // triggers since neither event fires reliably in every browser on its own.
    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") fetchDay();
    };
    const onFocus = () => fetchDay();
    document.addEventListener("visibilitychange", onVisibilityChange);
    window.addEventListener("focus", onFocus);
    return () => {
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.removeEventListener("focus", onFocus);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile.id, selectedDay]);

  const addSet = (exerciseId) => {
    setSaved(false);
    setExercises((prev) =>
      prev.map((e) => {
        if (e.id !== exerciseId) return e;
        // New sets start at the same weight as set 1 — most sets of an exercise use one weight.
        const firstWeight = e.sets[0]?.weight ?? "";
        return { ...e, sets: [...e.sets, { reps: "", weight: firstWeight }] };
      })
    );
  };

  const setChange = (exerciseId, index, next) =>
    setExercises((prev) => prev.map((e) => (e.id === exerciseId ? { ...e, sets: e.sets.map((s, i) => (i === index ? next : s)) } : e)));

  const pickExercise = async (libraryEntry) => {
    setSaved(false);
    let bestWeight = "";
    try {
      const { weight } = await api.getBestWeight(libraryEntry.id, profile.id);
      bestWeight = weight != null ? String(weight) : "";
    } catch {
      bestWeight = "";
    }
    setExercises((prev) => [
      ...prev,
      { id: libraryEntry.id, exercise_id: libraryEntry.id, full_name: libraryEntry.full_name, sets: [{ reps: "", weight: bestWeight }] },
    ]);
  };

  const confirmDelete = () => {
    // Drop back into edit mode so "Save workout" reappears — otherwise this
    // removal would only exist in local state and never reach the backend.
    setSaved(false);
    setExpanded(false);
    setExercises((prev) => prev.filter((e) => e.id !== deleteTarget));
    setDeleteTarget(null);
  };

  const startEditing = () => {
    setSaved(false);
    setExpanded(false);
  };

  const copyDay = () => {
    const entry = {
      sourceLabel: shortDateLabel(selectedDay),
      exercises: exercises.map((e) => ({
        exercise_id: e.exercise_id,
        full_name: e.full_name,
        sets: e.sets.map((s) => ({ ...s })),
      })),
    };
    setClipboard(entry);
    try {
      localStorage.setItem("wio-clipboard", JSON.stringify(entry));
    } catch {
      /* noop */
    }
  };

  const pasteDay = () => {
    if (!clipboard) return;
    setSaved(false);
    setExpanded(false);
    setExercises((prev) => {
      const existingIds = new Set(prev.map((e) => e.exercise_id));
      const toAdd = clipboard.exercises
        .filter((e) => !existingIds.has(e.exercise_id))
        .map((e) => ({
          id: e.exercise_id,
          exercise_id: e.exercise_id,
          full_name: e.full_name,
          sets: e.sets.map((s) => ({ ...s })),
        }));
      return [...prev, ...toAdd];
    });
    // One-shot: pasting consumes the clipboard so the button doesn't keep resurfacing
    // on every other day, wanted or not — copy again for another paste.
    setClipboard(null);
    try {
      localStorage.removeItem("wio-clipboard");
    } catch {
      /* noop */
    }
  };

  // "top"/"bottom" rather than single-step up/down — with only a handful of exercises
  // logged per day, jumping straight to either end is more useful than nudging one at a time.
  const moveExercise = (exerciseId, direction) => {
    setExercises((prev) => {
      const idx = prev.findIndex((e) => e.id === exerciseId);
      if (idx === -1) return prev;
      const next = [...prev];
      const [item] = next.splice(idx, 1);
      if (direction === "top") next.unshift(item);
      else next.push(item);
      return next;
    });
  };

  const saveWorkout = async () => {
    const payload = exercises.map((e) => ({
      exercise_id: e.exercise_id,
      sets: e.sets.map((s) => ({
        reps: s.reps === "" ? null : Number(s.reps),
        weight: s.weight === "" ? null : Number(s.weight),
      })),
    }));
    const result = await api.saveDay(profile.id, fmtDate(selectedDay), payload);
    setSaved(true);
    setExpanded(false);
    refreshWeek();

    if (result.pr) {
      setCelebration({
        type: "pr",
        exerciseName: result.pr.exercise_name,
        previousBest: result.pr.previous_best,
        today: result.pr.today,
        delta: result.pr.delta,
      });
    } else if (result.streak.milestone_hit) {
      setCelebration({ type: "streak", count: result.streak.count });
    }
  };

  const showEditableCards = !saved;
  const showLoggedCards = saved && expanded;
  const showCollapsedSummary = saved && !expanded;

  return (
    <div className="wio-fill">
      <div style={{ background: c.primary, borderRadius: radius.md, overflow: "hidden", width: "100%" }}>
        <div style={{ padding: "18px 20px 14px", color: "#fff", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontSize: 20, fontWeight: 500, marginBottom: 2 }}>{weekRangeLabel(weekStart)}</div>
            <div style={{ fontSize: 12, color: c.muted }}>Tap a day to view its log</div>
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            <ChevronLeft size={18} color={c.muted} style={{ cursor: "pointer" }} onClick={() => shiftWeek(-1)} />
            <ChevronRight size={18} color={c.muted} style={{ cursor: "pointer" }} onClick={() => shiftWeek(1)} />
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 6, padding: "0 16px 16px" }}>
          {WEEKDAY_LABELS.map((d, i) => (
            <div key={i} style={{ textAlign: "center", fontSize: 11, color: c.slate }}>{d}</div>
          ))}
          {weekDays.map((day, i) => {
            const isSelected = isSameDay(day, selectedDay);
            const logged = loggedDates.has(fmtDate(day));
            return (
              <div
                key={i}
                onClick={() => setSelectedDay(day)}
                style={{ textAlign: "center", padding: "8px 0", borderRadius: radius.sm, background: isSelected ? c.mauve : "transparent", color: "#fff", fontSize: 13, fontWeight: isSelected ? 500 : 400, cursor: "pointer" }}
              >
                {day.getDate()}
                {logged && !isSelected && <div style={{ width: 4, height: 4, borderRadius: "50%", background: c.mauveSoft, margin: "3px auto 0" }} />}
              </div>
            );
          })}
        </div>

        <div style={{ background: c.paleMauve, borderRadius: `${radius.md}px ${radius.md}px 0 0`, padding: "18px 18px 8px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
            <span style={{ fontSize: 13, color: c.ink, fontWeight: 500 }}>
              {selectedDay.toLocaleDateString(undefined, { weekday: "short", month: "long", day: "numeric" })}
            </span>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              {exercises.length > 0 && (
                <Copy size={14} color={c.muted} style={{ cursor: "pointer" }} onClick={copyDay} title="Copy this day's exercises" />
              )}
              {saved && (
                <>
                  <span style={{ fontSize: 11, color: c.mauve, display: "flex", alignItems: "center", gap: 4 }}>
                    <Check size={13} /> Logged
                  </span>
                  <Pencil size={14} color={c.muted} style={{ cursor: "pointer" }} onClick={startEditing} />
                </>
              )}
            </div>
          </div>

          {loading && <div style={{ fontSize: 12, color: c.muted, padding: "8px 0" }}>Loading…</div>}

          {!loading &&
            (showEditableCards || showLoggedCards) &&
            exercises.map((ex, i) => (
              <ExerciseCard
                key={ex.id}
                exercise={ex}
                saved={saved}
                onAddSet={addSet}
                onSetChange={setChange}
                onDelete={setDeleteTarget}
                onEdit={startEditing}
                onPreview={setPreviewId}
                onMove={moveExercise}
                canMoveUp={i > 0}
                canMoveDown={i < exercises.length - 1}
              />
            ))}

          {!loading && showCollapsedSummary && (
            <div style={{ background: c.canvas, borderRadius: radius.md, padding: "12px 14px", border: `1px solid ${c.hairline}`, marginBottom: 12 }}>
              <div style={{ fontSize: 11, color: c.muted, marginBottom: 4 }}>
                {exercises.length} exercise{exercises.length !== 1 ? "s" : ""} logged today
              </div>
              <div style={{ marginBottom: 10 }}>
                {exercises.map((e, i) => (
                  <div
                    key={e.id}
                    onClick={() => setPreviewId(e.exercise_id)}
                    style={{
                      fontSize: 12,
                      color: c.ink,
                      padding: "6px 0",
                      borderBottom: i < exercises.length - 1 ? `1px solid ${c.hairline}` : "none",
                      cursor: "pointer",
                    }}
                  >
                    {e.full_name}
                  </div>
                ))}
              </div>
              <button
                onClick={() => setExpanded(true)}
                style={{ background: c.mauve, color: "#fff", border: "none", borderRadius: radius.pill, padding: "6px 14px", fontSize: 11, fontWeight: 500, cursor: "pointer" }}
              >
                View all
              </button>
            </div>
          )}

          {!loading && showLoggedCards && (
            <button
              onClick={() => setExpanded(false)}
              style={{ width: "100%", background: "transparent", border: "none", color: c.mauve, fontSize: 11, fontWeight: 500, cursor: "pointer", marginBottom: 12, textAlign: "left" }}
            >
              Hide details
            </button>
          )}

          {!loading && showEditableCards && clipboard && clipboard.exercises.some((e) => !exercises.some((x) => x.exercise_id === e.exercise_id)) && (
            <button
              onClick={pasteDay}
              style={{ width: "100%", background: c.canvas, border: `1px dashed ${c.mauveSoft}`, color: c.mauve, borderRadius: radius.md, padding: "12px 16px", marginBottom: 12, display: "flex", alignItems: "center", gap: 6, cursor: "pointer" }}
            >
              <ClipboardPaste size={13} />
              <span style={{ fontSize: 13 }}>
                Paste {clipboard.exercises.length} exercise{clipboard.exercises.length !== 1 ? "s" : ""} copied from {clipboard.sourceLabel}
              </span>
            </button>
          )}

          {!loading && showEditableCards && <AddExercisePanel exercises={exercises} onPick={pickExercise} profileId={profile.id} />}

          {!loading && showEditableCards && (
            <button
              onClick={saveWorkout}
              style={{ width: "100%", background: c.primary, color: "#fff", border: "none", borderRadius: radius.pill, padding: 12, fontSize: 14, fontWeight: 500, marginBottom: 14, cursor: "pointer" }}
            >
              Save workout
            </button>
          )}
        </div>

        {deleteTarget && (
          <DeleteConfirmModal
            message="Are you sure you want to delete this?"
            onCancel={() => setDeleteTarget(null)}
            onConfirm={confirmDelete}
          />
        )}
        {celebration && <CelebrationModal data={celebration} onContinue={() => setCelebration(null)} />}
        {previewId && <ExercisePreviewModal exerciseId={previewId} onClose={() => setPreviewId(null)} />}
      </div>
    </div>
  );
}
