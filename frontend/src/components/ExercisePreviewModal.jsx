import { useEffect, useState } from "react";
import { Camera, X } from "lucide-react";
import { api } from "../api";
import { c, radius } from "../theme";

export default function ExercisePreviewModal({ exerciseId, onClose }) {
  const [exercise, setExercise] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    setExercise(null);
    setError(null);
    api.getExercise(exerciseId).then(setExercise).catch((e) => setError(e.message));
  }, [exerciseId]);

  const photoUrl = exercise ? api.photoUrl(exercise.photo_url) : null;

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(23,23,28,0.55)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20, zIndex: 50 }}>
      <div style={{ background: c.canvas, borderRadius: radius.lg, width: "100%", maxWidth: 380, maxHeight: "85vh", overflowY: "auto", position: "relative" }}>
        <button
          onClick={onClose}
          style={{ position: "absolute", top: 12, right: 12, background: "rgba(23,23,28,0.6)", border: "none", borderRadius: "50%", width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", zIndex: 1 }}
        >
          <X size={15} color="#fff" />
        </button>

        {photoUrl ? (
          <img src={photoUrl} alt="" style={{ width: "100%", height: 220, objectFit: "cover", display: "block", borderRadius: `${radius.lg}px ${radius.lg}px 0 0` }} />
        ) : (
          <div style={{ width: "100%", height: 220, background: c.paleMauve, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: `${radius.lg}px ${radius.lg}px 0 0` }}>
            <Camera size={32} color={c.mauveSoft} />
          </div>
        )}

        <div style={{ padding: 20 }}>
          {error && <div style={{ fontSize: 13, color: c.mauve }}>Couldn't load this exercise: {error}</div>}

          {!error && !exercise && <div style={{ fontSize: 13, color: c.muted }}>Loading…</div>}

          {exercise && (
            <>
              <div style={{ fontSize: 17, fontWeight: 500, color: c.ink, marginBottom: 8 }}>{exercise.full_name}</div>
              <div style={{ display: "flex", gap: 6, marginBottom: 16 }}>
                <span style={{ background: c.paleMauve, color: c.mauveDeep, borderRadius: 999, padding: "4px 10px", fontSize: 11, fontWeight: 500 }}>
                  {exercise.muscle_group}
                </span>
                <span style={{ background: c.paleMauve, color: c.mauveDeep, borderRadius: 999, padding: "4px 10px", fontSize: 11, fontWeight: 500 }}>
                  {exercise.equipment}
                </span>
              </div>
              <div style={{ fontSize: 11, color: c.muted, fontWeight: 500, marginBottom: 4, letterSpacing: 0.3 }}>INSTRUCTIONS</div>
              <div style={{ fontSize: 13, color: c.ink, lineHeight: 1.5 }}>
                {exercise.instructions || "No instructions available for this exercise."}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
