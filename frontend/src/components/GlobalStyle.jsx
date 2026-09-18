import { c } from "../theme";

export default function GlobalStyle() {
  return (
    <style>{`
      .wio-wordmark { font-family: 'Fredoka', 'Quicksand', sans-serif; font-weight: 600; letter-spacing: -0.3px; }
      .wio-shell { width: 100%; min-height: 100%; box-sizing: border-box; }
      .wio-nav {
        width: 100%; box-sizing: border-box;
        padding: calc(14px + env(safe-area-inset-top)) clamp(16px, 4vw, 40px) 14px;
        display: flex; align-items: center; justify-content: space-between;
        background: ${c.canvas}; border-bottom: 1px solid ${c.hairline};
      }
      .wio-main { width: 100%; box-sizing: border-box; padding: clamp(16px, 3vw, 32px) clamp(16px, 4vw, 40px) 40px; max-width: 1100px; margin: 0 auto; }
      .wio-tabs { display: flex; background: ${c.paleMauve}; border-radius: 999px; padding: 4px; }
      .wio-tab-btn { padding: 8px 18px; border-radius: 999px; border: none; cursor: pointer; font-size: 13px; font-weight: 500; }
      .wio-content-grid { display: grid; grid-template-columns: 1fr; gap: 20px; }
      @media (min-width: 860px) {
        .wio-content-grid.log { grid-template-columns: minmax(320px, 420px) 1fr; align-items: start; }
      }
      .wio-fill { width: 100%; box-sizing: border-box; }

      /* Mobile-only shell: fixed height + internal scroll + bottom tab bar,
         below the 860px breakpoint where the desktop top-nav layout applies. */
      .wio-mobile-shell { height: 100dvh; display: flex; flex-direction: column; overflow: hidden; box-sizing: border-box; }
      .wio-mobile-content { flex: 1; overflow-y: auto; -webkit-overflow-scrolling: touch; }
      .wio-bottom-nav {
        flex: none; display: grid; grid-template-columns: repeat(2, 1fr);
        background: ${c.canvas}; border-top: 1px solid ${c.hairline};
        padding: 8px 6px calc(8px + env(safe-area-inset-bottom));
      }
      .wio-bottom-nav-btn {
        display: flex; flex-direction: column; align-items: center; gap: 4px;
        background: transparent; border: none; padding: 8px 2px; min-height: 48px; cursor: pointer;
      }

      /* iOS Safari zooms the whole page in when a focused text input/textarea
         computes to a font-size under 16px. Both are styled inline at 11-13px
         here for visual density, so on mobile widths (where this is actually
         iOS) force 16px at rest too, not just on focus — sizing up only on
         focus would fix the zoom but cause its own jump/reflow the instant
         you tap in. The !important is required to win over those inline
         styles. <select> is deliberately excluded: iOS opens a native picker
         wheel for it instead of zooming, so there's no bug to fix there, and
         forcing 16px only made the Library filter pills look oversized. */
      @media (max-width: 859px) {
        input, textarea { font-size: 16px !important; }
      }
    `}</style>
  );
}
