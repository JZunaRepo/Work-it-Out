import { ChevronsDown, ChevronsUp, Pencil, Plus, Trash2 } from "lucide-react";
import { c, radius } from "../theme";
import SetRow from "./SetRow";

export default function ExerciseCard({ exercise, saved, onAddSet, onSetChange, onDelete, onEdit, onPreview, onMove, canMoveUp, canMoveDown }) {
  return (
    <div style={{ background: c.canvas, borderRadius: radius.md, padding: "14px 16px", marginBottom: 12, border: `1px solid ${c.hairline}` }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
        <span
          onClick={() => onPreview(exercise.exercise_id)}
          style={{ fontSize: 15, fontWeight: 500, color: c.ink, cursor: "pointer" }}
        >
          {exercise.full_name}
        </span>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          {!saved && onMove && (
            <>
              <ChevronsUp
                size={15}
                color={canMoveUp ? c.muted : c.hairline}
                style={{ cursor: canMoveUp ? "pointer" : "default" }}
                onClick={() => canMoveUp && onMove(exercise.id, "top")}
              />
              <ChevronsDown
                size={15}
                color={canMoveDown ? c.muted : c.hairline}
                style={{ cursor: canMoveDown ? "pointer" : "default" }}
                onClick={() => canMoveDown && onMove(exercise.id, "bottom")}
              />
            </>
          )}
          {saved && <Pencil size={15} color={c.muted} style={{ cursor: "pointer" }} onClick={onEdit} />}
          <Trash2 size={15} color={c.mauve} style={{ cursor: "pointer" }} onClick={() => onDelete(exercise.id)} />
        </div>
      </div>

      {!saved && (
        <div style={{ display: "grid", gridTemplateColumns: "0.6fr 1fr 1fr", gap: 8, fontSize: 11, color: c.muted, padding: "0 2px 6px" }}>
          <span>Set</span>
          <span>Reps</span>
          <span>Weight</span>
        </div>
      )}

      {exercise.sets.map((s, i) =>
        saved ? (
          <div key={i} style={{ background: c.paleMauve, borderRadius: radius.xs, padding: "6px 10px", fontSize: 11, color: c.ink, display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
            <span>Set {i + 1}</span>
            <span>{s.reps || "—"} reps × {s.weight || "—"} lb</span>
          </div>
        ) : (
          <SetRow key={i} set={s} index={i} onChange={(next) => onSetChange(exercise.id, i, next)} />
        )
      )}

      {!saved && (
        <button
          onClick={() => onAddSet(exercise.id)}
          style={{ width: "100%", background: "transparent", border: `1px dashed ${c.mauveSoft}`, color: c.mauve, borderRadius: radius.sm, padding: 8, fontSize: 13, fontWeight: 500, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 4 }}
        >
          <Plus size={14} /> Add set
        </button>
      )}
    </div>
  );
}
