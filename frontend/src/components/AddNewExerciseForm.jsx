import { useRef, useState } from "react";
import { Camera, Plus } from "lucide-react";
import { c, radius } from "../theme";

const MUSCLE_GROUPS = ["Chest", "Back", "Shoulders", "Arms", "Biceps", "Triceps", "Core", "Abs", "Hips", "Legs", "Cardio"];
const EQUIPMENT_TYPES = ["Barbell", "Dumbbell", "Machine", "Cable", "Bodyweight"];

export default function AddNewExerciseForm({ onAdd }) {
  const [name, setName] = useState("");
  const [muscleGroup, setMuscleGroup] = useState("");
  const [equipment, setEquipment] = useState("");
  const [photo, setPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const fileInput = useRef(null);

  const pickPhoto = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhoto(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  const submit = async () => {
    if (!name || !muscleGroup || !equipment) return;
    setSaving(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append("name", name);
      formData.append("muscle_group", muscleGroup);
      formData.append("equipment", equipment);
      if (photo) formData.append("photo", photo);
      await onAdd(formData);
      setName("");
      setMuscleGroup("");
      setEquipment("");
      setPhoto(null);
      setPhotoPreview(null);
      if (fileInput.current) fileInput.current.value = "";
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ background: c.primary, borderRadius: radius.md, padding: 16 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
        <Plus size={15} color="#fff" />
        <span style={{ fontSize: 13, color: "#fff", fontWeight: 500 }}>Add a new exercise</span>
      </div>

      <label
        style={{
          background: photoPreview ? "transparent" : "#2a2a30",
          border: "1px dashed #5c5c66",
          borderRadius: radius.sm,
          padding: photoPreview ? 0 : 20,
          marginBottom: 10,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          cursor: "pointer",
          overflow: "hidden",
        }}
      >
        {photoPreview ? (
          <img src={photoPreview} alt="" style={{ width: "100%", maxHeight: 140, objectFit: "cover", borderRadius: radius.sm }} />
        ) : (
          <>
            <Camera size={22} color={c.muted} />
            <div style={{ fontSize: 11, color: c.muted, marginTop: 6 }}>Reference photo of the machine</div>
          </>
        )}
        <input ref={fileInput} type="file" accept="image/*" onChange={pickPhoto} style={{ display: "none" }} />
      </label>

      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Exercise name"
        style={{ width: "100%", boxSizing: "border-box", background: "#2a2a30", border: "1px solid #3a3a42", borderRadius: radius.sm, padding: "9px 12px", fontSize: 12, color: "#fff", marginBottom: 8, outline: "none" }}
      />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 12 }}>
        <select value={muscleGroup} onChange={(e) => setMuscleGroup(e.target.value)} style={{ background: "#2a2a30", border: "1px solid #3a3a42", borderRadius: radius.sm, padding: "9px 8px", fontSize: 12, color: muscleGroup ? "#fff" : c.muted }}>
          <option value="">Muscle group</option>
          {MUSCLE_GROUPS.map((m) => (
            <option key={m} value={m}>{m}</option>
          ))}
        </select>
        <select value={equipment} onChange={(e) => setEquipment(e.target.value)} style={{ background: "#2a2a30", border: "1px solid #3a3a42", borderRadius: radius.sm, padding: "9px 8px", fontSize: 12, color: equipment ? "#fff" : c.muted }}>
          <option value="">Equipment</option>
          {EQUIPMENT_TYPES.map((eq) => (
            <option key={eq} value={eq}>{eq}</option>
          ))}
        </select>
      </div>
      {error && <div style={{ fontSize: 11, color: c.celebrationCoral, marginBottom: 8 }}>{error}</div>}
      <button
        onClick={submit}
        disabled={saving}
        style={{ width: "100%", background: c.mauve, color: "#fff", border: "none", borderRadius: radius.pill, padding: 10, fontSize: 12, fontWeight: 500, cursor: saving ? "default" : "pointer", opacity: saving ? 0.7 : 1 }}
      >
        {saving ? "Adding…" : "Add to library"}
      </button>
    </div>
  );
}
