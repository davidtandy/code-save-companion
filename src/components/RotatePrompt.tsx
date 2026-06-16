import { useEffect, useState } from "react";

const PHONE_MAX_WIDTH = 820;

function isPortraitPhone() {
  return (
    window.matchMedia("(orientation: portrait)").matches &&
    window.innerWidth <= PHONE_MAX_WIDTH
  );
}

export function RotatePrompt() {
  const [showing, setShowing] = useState(() =>
    typeof window !== "undefined" ? isPortraitPhone() : false,
  );

  useEffect(() => {
    const check = () => setShowing(isPortraitPhone());
    window.addEventListener("resize", check);
    window.addEventListener("orientationchange", check);

    // Best-effort landscape lock (Android Chrome / installed PWAs only — silently ignored elsewhere)
    (window.screen as any).orientation?.lock?.("landscape").catch(() => {});

    return () => {
      window.removeEventListener("resize", check);
      window.removeEventListener("orientationchange", check);
    };
  }, []);

  if (!showing) return null;

  return (
    <div className="fixed inset-0 z-[200] bg-poster-ink flex flex-col items-center justify-center gap-8 px-10 text-center">
      {/* Animated phone-rotate graphic */}
      <div className="rotate-prompt-phone">
        <svg
          width="120"
          height="120"
          viewBox="0 0 48 48"
          fill="none"
          aria-hidden="true"
        >
          {/* Phone body */}
          <rect
            x="14" y="6" width="20" height="32" rx="3"
            stroke="hsl(196 42% 45%)"
            strokeWidth="2.5"
            fill="none"
          />
          {/* Home button dot */}
          <circle cx="24" cy="34" r="1.5" fill="hsl(196 42% 45%)" />
          {/* Curved rotation arrow */}
          <path
            d="M10 20 A14 14 0 0 1 38 20"
            stroke="hsl(38 75% 58%)"
            strokeWidth="2.5"
            strokeLinecap="round"
            fill="none"
          />
          {/* Arrowhead */}
          <polyline
            points="34,16 38,20 34,24"
            stroke="hsl(38 75% 58%)"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        </svg>
      </div>

      <div>
        <h2 className="font-display font-bold text-3xl text-white leading-tight mb-3">
          Rotate your screen
        </h2>
        <p className="text-white/60 text-base max-w-[260px] leading-relaxed">
          This cheatsheet is designed for landscape — turn your phone sideways to continue.
        </p>
      </div>
    </div>
  );
}
