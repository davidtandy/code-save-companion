import { useEffect, useState } from "react";

type Props = {
  /** Minimum viewport width in CSS px to consider "phone-sized". */
  phoneMaxWidth?: number;
};

/**
 * Full-screen overlay shown when a phone is held in portrait.
 * Hides the app and prompts the user to rotate.
 *
 * Tablets/desktop never see this (they fall outside `phoneMaxWidth`).
 */
export const RotateOverlay = ({ phoneMaxWidth = 820 }: Props) => {
  const [showing, setShowing] = useState(false);

  useEffect(() => {
    const check = () => {
      const portrait = window.matchMedia("(orientation: portrait)").matches;
      const phoneSized = window.innerWidth <= phoneMaxWidth;
      setShowing(portrait && phoneSized);
    };
    check();

    // Best-effort orientation lock (works on installed PWAs / some Android Chrome).
    const anyScreen = window.screen as unknown as {
      orientation?: { lock?: (o: string) => Promise<void> };
    };
    anyScreen.orientation?.lock?.("landscape").catch(() => {
      /* silently ignore — overlay is the real enforcement */
    });

    window.addEventListener("resize", check);
    window.addEventListener("orientationchange", check);
    return () => {
      window.removeEventListener("resize", check);
      window.removeEventListener("orientationchange", check);
    };
  }, [phoneMaxWidth]);

  if (!showing) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-poster-bg flex flex-col items-center justify-center px-8 text-center">
      <div className="animate-pulse mb-6">
        <svg
          width="96"
          height="96"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          className="text-poster-teal"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect x="5" y="2" width="14" height="20" rx="2" ry="2" transform="rotate(90 12 12)" />
          <path d="M12 18h.01" />
          <path d="M3 4l3 3M3 4l3-3M3 4h6" />
        </svg>
      </div>
      <h2 className="font-display font-bold text-2xl text-poster-teal mb-2">
        Please rotate your phone
      </h2>
      <p className="font-body text-sm text-poster-ink/70 max-w-xs">
        This cheatsheet is designed for landscape — turn your device sideways to start exploring.
      </p>
    </div>
  );
};
