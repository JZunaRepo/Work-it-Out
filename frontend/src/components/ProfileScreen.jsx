import { useState } from "react";
import { Plus } from "lucide-react";
import { GRAIN_BG, radius } from "../theme";
import Logo from "./Logo";

export default function ProfileScreen({ profiles, profilesError, onSelect, onAddProfile }) {
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState("");
  const [addError, setAddError] = useState(null);

  const submit = async () => {
    if (!name.trim()) return;
    setAddError(null);
    try {
      await onAddProfile(name.trim());
      setName("");
      setAdding(false);
    } catch (e) {
      setAddError(e.message);
    }
  };

  return (
    <div
      style={{
        width: "100%",
        minHeight: "100vh",
        position: "relative",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg, #2b1626 0%, #4b3a66 38%, #8c6169 65%, #e9ddc8 100%)",
        boxSizing: "border-box",
        padding: "24px",
      }}
    >
      <div style={{ position: "absolute", inset: 0, background: "radial-gradient(circle at 78% 25%, rgba(255,138,101,0.45) 0%, rgba(255,138,101,0) 55%)" }} />
      <div style={{ position: "absolute", inset: 0, background: "radial-gradient(circle at 15% 85%, rgba(232,192,125,0.3) 0%, rgba(232,192,125,0) 50%)" }} />
      <div style={{ position: "absolute", inset: 0, opacity: 0.08, backgroundImage: GRAIN_BG, mixBlendMode: "overlay" }} />

      <div style={{ position: "relative", textAlign: "center", width: "100%", maxWidth: 480 }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12, marginBottom: 44 }}>
          <Logo size={84} onDark />
          <div className="wio-wordmark" style={{ fontSize: "clamp(34px, 5.5vw, 46px)", color: "#fff" }}>
            Work it out
          </div>
        </div>
        <div style={{ fontSize: 15, color: "rgba(255,255,255,0.85)", marginBottom: 24 }}>
          Who's training today?
        </div>
        {profilesError && (
          <div style={{ fontSize: 13, color: "#ffd8d8", marginBottom: 16 }}>
            Couldn't reach the server: {profilesError}
          </div>
        )}
        <div style={{ display: "flex", gap: 18, justifyContent: "center", flexWrap: "wrap", alignItems: "flex-start" }}>
          {profiles.map((p) => (
            <button
              key={p.id}
              onClick={() => onSelect(p)}
              style={{ background: "none", border: "none", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}
            >
              <div
                style={{
                  width: 76,
                  height: 76,
                  borderRadius: radius.md,
                  background: "#17171c",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 24,
                  fontWeight: 500,
                  color: "#fff",
                }}
              >
                {p.name[0]}
              </div>
              <span style={{ fontSize: 13, color: "#fff" }}>{p.name}</span>
            </button>
          ))}

          {adding ? (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
              <input
                autoFocus
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && submit()}
                placeholder="Name"
                style={{
                  width: 76,
                  height: 76,
                  borderRadius: radius.md,
                  background: "rgba(255,255,255,0.15)",
                  border: "1px solid rgba(255,255,255,0.5)",
                  color: "#fff",
                  textAlign: "center",
                  fontSize: 13,
                  outline: "none",
                }}
              />
              <button
                onClick={submit}
                style={{ background: "none", border: "none", color: "#fff", fontSize: 12, cursor: "pointer", textDecoration: "underline" }}
              >
                Add
              </button>
              {addError && (
                <span style={{ fontSize: 11, color: "#ffd8d8", maxWidth: 120, textAlign: "center" }}>{addError}</span>
              )}
            </div>
          ) : (
            <button
              onClick={() => setAdding(true)}
              style={{ background: "none", border: "none", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}
            >
              <div
                style={{
                  width: 76,
                  height: 76,
                  borderRadius: radius.md,
                  background: "rgba(255,255,255,0.15)",
                  border: "1px dashed rgba(255,255,255,0.5)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Plus size={26} color="#fff" />
              </div>
              <span style={{ fontSize: 13, color: "rgba(255,255,255,0.8)" }}>Add profile</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
