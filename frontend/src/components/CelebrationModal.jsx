import { Flame, Trophy } from "lucide-react";
import { GRAIN_BG, c, radius } from "../theme";

export default function CelebrationModal({ data, onContinue }) {
  const isStreak = data.type === "streak";

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(23,23,28,0.5)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20, zIndex: 50 }}>
      <div style={{ maxWidth: 340, width: "100%", borderRadius: radius.lg, overflow: "hidden", position: "relative", background: "linear-gradient(135deg, #3d2a2e 0%, #8c6169 40%, #ff8a65 75%, #e8c07d 100%)" }}>
        <div style={{ position: "absolute", inset: 0, opacity: 0.08, backgroundImage: GRAIN_BG, mixBlendMode: "overlay" }} />
        <div style={{ padding: "36px 22px 28px", textAlign: "center", position: "relative" }}>
          <div style={{ width: 50, height: 50, borderRadius: "50%", background: "rgba(23,23,28,0.7)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px" }}>
            {isStreak ? <Flame size={24} color="#fff" /> : <Trophy size={24} color="#fff" />}
          </div>

          {isStreak ? (
            <>
              <div style={{ fontSize: 11, letterSpacing: 0.5, color: "rgba(255,255,255,0.85)", marginBottom: 6 }}>
                WORKOUT STREAK
              </div>
              <div style={{ fontSize: 20, fontWeight: 500, color: "#fff", marginBottom: 18 }}>
                {data.count} days in a row
              </div>
            </>
          ) : (
            <>
              <div style={{ fontSize: 11, letterSpacing: 0.5, color: "rgba(255,255,255,0.85)", marginBottom: 6 }}>
                NEW PERSONAL RECORD
              </div>
              <div style={{ fontSize: 20, fontWeight: 500, color: "#fff", marginBottom: 18 }}>
                {data.exerciseName} · {data.today} lb
              </div>
              <div style={{ background: c.primary, borderRadius: radius.md, padding: "14px 16px", textAlign: "left", marginBottom: 18 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: c.muted, marginBottom: 8 }}>
                  <span>Previous best</span>
                  <span>{data.previousBest} lb</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "#fff", fontWeight: 500 }}>
                  <span>Today</span>
                  <span>
                    {data.today} lb <span style={{ color: c.celebrationCoral }}>+{data.delta} lb</span>
                  </span>
                </div>
              </div>
            </>
          )}

          <button onClick={onContinue} style={{ width: "100%", background: "#fff", color: "#3d2a2e", border: "none", borderRadius: radius.pill, padding: 11, fontSize: 13, fontWeight: 500, cursor: "pointer" }}>
            Continue
          </button>
        </div>
      </div>
    </div>
  );
}
