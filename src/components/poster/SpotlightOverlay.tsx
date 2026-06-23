import { cn } from "@/lib/utils";

type Rect = { left: number; top: number; width: number; height: number };

type Props = {
  /** Legacy single cutout (fully clear). Kept for back-compat. */
  cutout?: Rect | null;
  /** Tiered cutouts — outer→inner: case, group, word, sub. Each can be null. */
  caseRect?: Rect | null;
  groupRect?: Rect | null;
  wordRect?: Rect | null;
  subRect?: Rect | null;
  /** Additional fully-clear cutouts (e.g. per-letter ending highlights). */
  extraCutouts?: Rect[];
  padding?: number;
  className?: string;
};

/**
 * Tiered SVG mask:
 *   white = full overlay (darkest dim)
 *   gray  = partial overlay (medium dim)
 *   black = fully clear
 *
 * Subtle visibility tiers (user choice):
 *   outside-case 18% | case 45% | group 65% | word 85% | sub-word 100%
 *
 * Mask gray for region X = 1 - (visibility[X] / outside-visibility-of-base).
 * We build it so each *interior* layer subtracts more darkness.
 *
 * Concretely: base overlay opacity is 0.82 (existing). The mask grayscale
 * value GV (0-255) sets that pixel's overlay opacity to 0.82 * (GV/255).
 * Region visibility = 1 - 0.82 * (GV/255).
 *
 *   18% vis → 0.82 * GV/255 = 0.82 → GV = 255 (white)
 *   45% vis → 0.82 * GV/255 = 0.55 → GV ≈ 171
 *   65% vis → 0.82 * GV/255 = 0.35 → GV ≈ 109
 *   85% vis → 0.82 * GV/255 = 0.15 → GV ≈ 47
 *  100% vis → GV = 0 (black)
 */

const FILL = {
  case:  "rgb(171,171,171)",
  group: "rgb(109,109,109)",
  word:  "rgb(47,47,47)",
  clear: "black",
};

const RECT_TRANSITION = "all 400ms cubic-bezier(0.22, 1, 0.36, 1)";

export const SpotlightOverlay = ({
  cutout,
  caseRect,
  groupRect,
  wordRect,
  subRect,
  extraCutouts,
  padding = 8,
  className,
}: Props) => {
  const tiered = !!(caseRect || groupRect || wordRect || subRect);
  const visible =
    cutout !== null && cutout !== undefined
      ? true
      : tiered || (extraCutouts && extraCutouts.length > 0);

  const renderRect = (
    r: Rect | null | undefined,
    fill: string,
    rx: number,
    pad: number,
  ) =>
    r ? (
      <rect
        x={r.left - pad}
        y={r.top - pad}
        width={r.width + pad * 2}
        height={r.height + pad * 2}
        rx={rx}
        ry={rx}
        fill={fill}
        style={{ transition: RECT_TRANSITION }}
      />
    ) : null;

  return (
    <svg
      className={cn(
        "absolute inset-0 w-full h-full pointer-events-none transition-opacity duration-300",
        visible ? "opacity-100" : "opacity-0",
        className,
      )}
      preserveAspectRatio="none"
    >
      <defs>
        <mask id="spotlight-mask">
          {/* Fully-overlaid base (darkest dim outside everything). */}
          <rect x="0" y="0" width="100%" height="100%" fill="white" />

          {/* Tiered partial cutouts — paint outermost first. */}
          {tiered && renderRect(caseRect, FILL.case, 12, padding + 4)}
          {tiered && renderRect(groupRect, FILL.group, 10, padding + 2)}
          {tiered && renderRect(wordRect, FILL.word, 8, padding)}
          {tiered && renderRect(subRect, FILL.clear, 6, padding - 2)}

          {/* Legacy single cutout — fully clear. */}
          {cutout && !tiered && renderRect(cutout, FILL.clear, 8, padding)}

          {/* Extra fully-clear cutouts (ending mini-spotlights, etc.). */}
          {extraCutouts?.map((r, i) => (
            <rect
              key={i}
              x={r.left - 2}
              y={r.top - 2}
              width={r.width + 4}
              height={r.height + 4}
              rx="4"
              ry="4"
              fill="black"
            />
          ))}
        </mask>
      </defs>
      <rect
        x="0"
        y="0"
        width="100%"
        height="100%"
        fill="white"
        opacity="0.82"
        mask="url(#spotlight-mask)"
      />
    </svg>
  );
};
