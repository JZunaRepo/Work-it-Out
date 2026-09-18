import { c, radius } from "../theme";

export default function SetRow({ set, index, onChange }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "0.6fr 1fr 1fr", gap: 8, marginBottom: 6 }}>
      <div style={{ background: c.paleMauve, borderRadius: radius.xs, padding: 8, textAlign: "center", fontSize: 13, color: c.ink }}>
        {index + 1}
      </div>
      <input
        value={set.reps}
        onChange={(e) => onChange({ ...set, reps: e.target.value })}
        placeholder="—"
        inputMode="numeric"
        style={{ background: c.paleMauve, border: "none", borderRadius: radius.xs, padding: 8, textAlign: "center", fontSize: 13, color: c.ink, width: "100%", boxSizing: "border-box" }}
      />
      <input
        value={set.weight}
        onChange={(e) => onChange({ ...set, weight: e.target.value })}
        placeholder="— lb"
        inputMode="numeric"
        style={{ background: c.paleMauve, border: "none", borderRadius: radius.xs, padding: 8, textAlign: "center", fontSize: 13, color: c.ink, width: "100%", boxSizing: "border-box" }}
      />
    </div>
  );
}
