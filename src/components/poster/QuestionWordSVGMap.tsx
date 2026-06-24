// @ts-nocheck
import { cn } from "@/lib/utils";
import chefHat from "@/assets/poster/chef-hat.svg";
import bicycle from "@/assets/poster/bicycle.svg";
import envelope from "@/assets/poster/envelope.svg";

export type QWZone = { word: string; x: number; y: number; w: number; h: number };

export type QWZoneConfig = {
  nom: QWZone[];
  akk: QWZone[];
  dat: QWZone[];
};

export const DEFAULT_ZONES: QWZoneConfig = {
  nom: [
    { word: "WER", x: 19, y: 71, w: 60, h: 25 },
  ],
  akk: [
    { word: "WEN",   x: 0,  y: 70, w: 37, h: 38 },
    { word: "WOHIN", x: 50, y: 63, w: 49, h: 52 },
  ],
  dat: [
    { word: "WEM",  x: 20, y: 9,  w: 60, h: 35 },
    { word: "WO",   x: 0,  y: 70, w: 37, h: 18 },
    { word: "WANN", x: 49, y: 71, w: 44, h: 18 },
  ],
};

const STORAGE_KEY = "qw-zones";

export function loadZones(): QWZoneConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return { ...DEFAULT_ZONES, ...JSON.parse(raw) };
  } catch {}
  return DEFAULT_ZONES;
}

export function saveZones(zones: QWZoneConfig) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(zones)); } catch {}
}

// aspect ratios from SVG viewBoxes
const RATIOS = { nom: 954 / 872, akk: 1354 / 780, dat: 1004 / 652 };

const CASE_COLOR: Record<string, string> = {
  nom: "#f5c842",   // yellow
  akk: "#3cbe6e",   // green
  dat: "#9b6fd4",   // purple
};

// ── Single SVG with zones (used inside Poster per-column) ───────────────────

type SingleProps = {
  group: keyof QWZoneConfig;
  zones: QWZone[];
  /** When true, zones are visible and clickable */
  active?: boolean;
  onWordClick?: (word: string) => void;
  /** Fires when clicking the image in non-active mode */
  onImageClick?: (e: React.MouseEvent) => void;
  activeWord?: string | null;
  correctWord?: string | null;
  wrongWord?: string | null;
  tunerMode?: boolean;
  className?: string;
  imgClassName?: string;
  /** Size the zone box by a fixed height (auto width) instead of full width,
   *  so groups with different native aspect ratios (chef-hat is near-square,
   *  bicycle/envelope are wide) still occupy the same height as each other. */
  fixedHeight?: boolean;
};

const SVG_SRC: Record<keyof QWZoneConfig, string> = {
  nom: chefHat,
  akk: bicycle,
  dat: envelope,
};

export function QWSvgSingle({
  group,
  zones,
  active = false,
  onWordClick,
  onImageClick,
  activeWord,
  correctWord,
  wrongWord,
  tunerMode = false,
  className,
  imgClassName = "h-28 object-contain",
  fixedHeight = false,
}: SingleProps) {
  const color = CASE_COLOR[group];

  if (!active && !tunerMode) {
    return (
      <img
        src={SVG_SRC[group]}
        alt=""
        draggable={false}
        className={cn(imgClassName, className)}
        onClick={onImageClick}
      />
    );
  }

  const content = (
    <>
      <img
        src={SVG_SRC[group]}
        alt=""
        draggable={false}
        className="absolute inset-0 w-full h-full object-fill pointer-events-none select-none"
      />
      {zones.map((zone) => {
        const isSelected = activeWord  === zone.word;
        const isCorrect  = correctWord === zone.word;
        const isWrong    = wrongWord   === zone.word;
        return (
          <button
            key={zone.word}
            onClick={() => onWordClick?.(zone.word)}
            style={{
              position: "absolute",
              left: `${zone.x}%`, top: `${zone.y}%`,
              width: `${zone.w}%`, height: `${zone.h}%`,
              borderRadius: 8,
              border: isCorrect ? "2.5px solid #22c55e"
                : isWrong   ? "2.5px solid #ef4444"
                : isSelected || tunerMode ? `2px solid ${color}88`
                : "2px solid transparent",
              background: isCorrect ? "rgba(34,197,94,0.18)"
                : isWrong   ? "rgba(239,68,68,0.18)"
                : isSelected ? `${color}33`
                : tunerMode  ? `${color}22`
                : "transparent",
              transition: "background 0.15s, border-color 0.15s",
              cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}
            className="hover:opacity-80 active:scale-95 transition-transform"
          >
            <span style={{
              fontSize: "clamp(13px, 3.6cqw, 21px)", fontWeight: 800,
              color: "transparent",
              letterSpacing: "0.05em", pointerEvents: "none",
              userSelect: "none",
            }}>
              {zone.word}
            </span>
          </button>
        );
      })}
    </>
  );

  if (fixedHeight) {
    return (
      <div className={cn("relative", className)}>
        <div className="relative mx-auto h-28" style={{ aspectRatio: String(RATIOS[group]) }}>
          {content}
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn("relative inline-block", className)}
      style={{ aspectRatio: String(RATIOS[group]) }}
    >
      {content}
    </div>
  );
}

// ── Three SVGs together (live quiz fullscreen) ───────────────────────────────

type Props = {
  zones?: QWZoneConfig;
  onWordClick: (word: string) => void;
  activeWord?: string | null;
  correctWord?: string | null;
  wrongWord?: string | null;
  tunerMode?: boolean;
  className?: string;
  gap?: number;
};

export function QuestionWordSVGMap({
  zones: zonesProp,
  onWordClick,
  activeWord,
  correctWord,
  wrongWord,
  tunerMode = false,
  className,
  gap = 8,
}: Props) {
  const zones = zonesProp ?? DEFAULT_ZONES;

  // Each column's flex-grow share is set to its own aspect ratio, so that
  // width (flex-grow * container) / ratio works out equal for all three —
  // same rendered height regardless of how square (nom) or wide (akk/dat)
  // the source SVG is.
  const FLEX: Record<keyof QWZoneConfig, number> = RATIOS;

  const groups: (keyof QWZoneConfig)[] = ["akk", "nom", "dat"];

  return (
    <div className={cn("flex items-end", className)} style={{ gap }}>
      {groups.map((key) => (
        <div key={key} className="relative min-w-0" style={{ flex: FLEX[key], aspectRatio: String(RATIOS[key]) }}>
          <QWSvgSingle
            group={key}
            zones={zones[key]}
            active
            onWordClick={onWordClick}
            activeWord={activeWord}
            correctWord={correctWord}
            wrongWord={wrongWord}
            tunerMode={tunerMode}
            className="absolute inset-0 w-full h-full"
            imgClassName="absolute inset-0 w-full h-full object-fill"
          />
        </div>
      ))}
    </div>
  );
}
