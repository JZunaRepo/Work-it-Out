import { Camera } from "lucide-react";
import { c, radius } from "../theme";

export default function ThumbPlaceholder({ size = 40, photoUrl }) {
  if (photoUrl) {
    return (
      <img
        src={photoUrl}
        alt=""
        style={{ width: size, height: size, borderRadius: radius.xs, objectFit: "cover", flexShrink: 0 }}
      />
    );
  }
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: radius.xs,
        background: c.paleMauve,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
      }}
    >
      <Camera size={16} color={c.mauveSoft} />
    </div>
  );
}
