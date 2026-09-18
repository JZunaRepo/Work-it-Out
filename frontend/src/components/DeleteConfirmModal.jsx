import { c, radius } from "../theme";

export default function DeleteConfirmModal({ message, onCancel, onConfirm }) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(23,23,28,0.55)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20, zIndex: 50 }}>
      <div style={{ background: c.canvas, borderRadius: radius.md, padding: 20, width: 280, textAlign: "center" }}>
        <div style={{ fontSize: 14, fontWeight: 500, color: c.ink, marginBottom: 6 }}>Are you sure?</div>
        <div style={{ fontSize: 12, color: c.slate, marginBottom: 16 }}>
          {message || "Are you sure you want to delete this?"}
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={onCancel} style={{ flex: 1, background: c.paleMauve, color: c.mauveDeep, border: "none", borderRadius: radius.pill, padding: 9, fontSize: 12, fontWeight: 500, cursor: "pointer" }}>Cancel</button>
          <button onClick={onConfirm} style={{ flex: 1, background: c.mauve, color: "#fff", border: "none", borderRadius: radius.pill, padding: 9, fontSize: 12, fontWeight: 500, cursor: "pointer" }}>Delete</button>
        </div>
      </div>
    </div>
  );
}
