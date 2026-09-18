import logoBlack from "../assets/logo-black.png";
import logoWhite from "../assets/logo-white.png";

const LOGO_ASPECT = 576 / 495;

export default function Logo({ size = 32, onDark = false }) {
  const src = onDark ? logoWhite : logoBlack;
  return (
    <img
      src={src}
      alt="Work it out logo"
      style={{ height: size, width: Math.round(size * LOGO_ASPECT), display: "block", objectFit: "contain" }}
    />
  );
}
