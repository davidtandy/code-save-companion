// @ts-nocheck
import { forwardRef, useImperativeHandle, useRef, useState, useCallback, useEffect, useLayoutEffect, useMemo, createContext, useContext } from "react";
import { cn } from "@/lib/utils";
import { WORDS, WORD_GENDER, type CaseKey, type Gender, type SubWord, type WordDatum } from "./wordData";
import { ARTICLE_ROW_MEMBERS, ARTICLE_ROW, WORD_GROUP } from "./groupData";
import type { LearnStep } from "./quiz/useQuiz";
import type { MorphEntry } from "./morph";

const MorphCtx = createContext<Map<string, MorphEntry> | null>(null);
const MorphContextIdCtx = createContext<string | null>(null);
const PinnedPossIdCtx = createContext<string | null>(null);
type FlourishState = { epoch: number; indices: Map<string, number> };
const FlourishCtx = createContext<FlourishState>({ epoch: 0, indices: new Map() });
type LoadFlourishState = { active: boolean; counter: { current: number } };
const LoadFlourishCtx = createContext<LoadFlourishState>({ active: false, counter: { current: 0 } });


const SUB_STROKE: Record<SubWord["gender"], string> = {
  m:      "hsl(var(--gender-masc))",
  f:      "hsl(var(--gender-fem))",
  n:      "hsl(var(--gender-neut))",
  pl:     "hsl(var(--gender-plural))",
  formal: "hsl(var(--gender-formal))",
};

/** Gender display mode for cells. */
type GenderMode = "off" | "hover" | "always";
const GenderCtx = createContext<GenderMode>("off");
/** When the quiz is active, multi-subword pronoun pills render as separate pills. */
const QuizActiveCtx = createContext<boolean>(false);
/** When true, pills use compact (slim) sizing for mobile. */
const SlimCtx = createContext<boolean>(false);
/** When true and the pill is not active, it fades toward white. */
const DimCtx = createContext<boolean>(false);

const GENDER_BORDER: Record<Exclude<Gender, "mixed">, string> = {
  m:  "border-gender-masc",
  f:  "border-gender-fem",
  n:  "border-gender-neut",
  pl: "border-gender-plural",
};

const GENDER_BORDER_HOVER: Record<Exclude<Gender, "mixed">, string> = {
  m:  "hover:border-gender-masc",
  f:  "hover:border-gender-fem",
  n:  "hover:border-gender-neut",
  pl: "hover:border-gender-plural",
};

/** Returns Tailwind classes for a word's gender border, or "" if none. */
function genderClasses(id: string | undefined, mode: GenderMode): string {
  if (mode === "off" || !id) return "";
  const g = WORD_GENDER[id];
  if (!g || g === "mixed") return "";
  if (mode === "always") return cn("border-[3px]", GENDER_BORDER[g]);
  // hover: transparent border reserves space, color appears on hover
  return cn("border-[3px] border-transparent", GENDER_BORDER_HOVER[g]);
}
import bicycle from "@/assets/poster/bicycle.svg";
import seinCloud from "@/assets/poster/chef-hat.svg";
import envelope from "@/assets/poster/envelope.svg";
import liebenStamp from "@/assets/poster/lieben.svg";
import gebenStamp from "@/assets/poster/geben.svg";

/** Poster intrinsic size — used for zoom math. */
export const POSTER_W = 900;
export const POSTER_H = 760;

export type PosterHandle = {
  /** Get the bounding rect (poster-local px) of a cell or case zone. */
  getRect: (id: string) => DOMRect | null;
  /** Returns the root poster element (poster-local coordinate origin). */
  getRoot: () => HTMLDivElement | null;
  /** Fire a staggered inset-ring burst on the given pill ids (L→R wave). */
  fireLinkBurst: (ids: readonly string[], staggerMs: number) => void;
  /** Radial ripple from a clicked pill, then double-flash all pills. */
  rippleFrom: (sourceId: string, result: "correct" | "wrong") => void;
};

type Props = {
  activeCase: CaseKey | null;
  activeWordId: string | null;
  morphContextId?: string | null;
  pinnedPossId?: string | null;
  onTapCase: (c: CaseKey) => void;
  onTapCaseIcon?: (c: CaseKey, rect: DOMRect) => void;
  onTapWord: (id: string) => void;
  onTapBackground?: () => void;
  onTapVerbCloud?: () => void;
  genderMode?: GenderMode;
  morphMap?: Map<string, MorphEntry> | null;
  flourish?: FlourishState;
  quizBlur?: boolean;
  quizActive?: boolean;
  slimPills?: boolean;
  pillPadH?: number;
  pillPadV?: number;
  caseGap?: number;
  mobileZoomedCase?: CaseKey | null;
  caseHoverDim?: boolean;
  pinnedCase?: CaseKey | null;
  learnDim?: { step: LearnStep; case: CaseKey; group: string | null; row: string | null; correctPillId: string | null } | null;
  learnOverlay?: {
    step: 1 | 2 | 3;
    case: CaseKey;
    transparent: boolean;
    onCaseTap: (c: CaseKey) => "correct" | "wrong";
    onGroupTap: (groupType: "pronouns" | "articles") => "correct" | "wrong";
    onColumnTap: (columnType: "defArticles" | "indefArticles") => "correct" | "wrong";
  } | null;
};

/* ---------- Atoms ---------- */

const CLIP = {
  left:  "polygon(0% 0%, 100% 0%, 67% 100%, 0% 100%)",
  right: "polygon(33% 0%, 100% 0%, 100% 100%, 0% 100%)",
};

const Pill = ({
  word,
  color,
  active,
  activeWordId,
  onTap,
  className,
  registerRef,
  children,
  clipSide,
}: {
  word?: WordDatum;
  color: "green" | "yellow" | "purple" | "red";
  active?: boolean;
  /** If a sub-token of this pill is active, we still render normal pill but highlight the token. */
  activeWordId?: string | null;
  onTap?: (id: string) => void;
  className?: string;
  registerRef?: (id: string, el: HTMLElement | null) => void;
  children?: React.ReactNode;
  clipSide?: "left" | "right";
}) => {
  const baseBg =
    color === "green" ? "bg-poster-green"
    : color === "yellow" ? "bg-poster-yellow"
    : color === "purple" ? "bg-poster-purple"
    : "bg-poster-red";
  const id = word?.id;
  const showGender = useContext(GenderCtx);
  const morphMap = useContext(MorphCtx);
  const morphContextId = useContext(MorphContextIdCtx);
  const pinnedPossId = useContext(PinnedPossIdCtx);
  const flourish = useContext(FlourishCtx);
  const loadFl = useContext(LoadFlourishCtx);
  const quizActive = useContext(QuizActiveCtx);
  const slim = useContext(SlimCtx);
  const dim = useContext(DimCtx);
  const morph = id ? morphMap?.get(id) ?? null : null;
  const isContextActive = !!(id && morphContextId && id === morphContextId);
  const isPinned = !!(id && pinnedPossId && id === pinnedPossId);
  const flourishIdx = id ? flourish.indices.get(id) : undefined;
  const shouldFlourish = flourishIdx !== undefined;
  // Random stagger index for the initial load flicker (per-pill random delay).
  const loadIdx = useMemo(() => {
    loadFl.counter.current += 1;
    return Math.floor(Math.random() * 40);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const effectiveColor = morph?.color ?? color;
  const bg =
    effectiveColor === "green" ? "bg-poster-green"
    : effectiveColor === "yellow" ? "bg-poster-yellow"
    : effectiveColor === "purple" ? "bg-poster-purple"
    : "bg-poster-red-deep";
  void baseBg;
  const genderCls = genderClasses(id, showGender);
  const subs = word?.subWords;

  // Quiz mode: split multi-subword pills into separate pill buttons so each
  // sub-token (ihn / sie / es, etc.) is independently tappable.
  if (quizActive && subs && id && !morph) {
    return (
      <div className={cn("flex gap-1 items-stretch", className)}>
        {subs.map((sw, i) => {
          const subId = `${id}::${i}`;
          const isSubActive = activeWordId === subId;
          return (
            <button
              key={subId}
              ref={(el) => registerRef?.(subId, el)}
              data-cell-id={subId}
              data-formal={sw.gender === "formal" ? "" : undefined}
              onClick={(e) => {
                e.stopPropagation();
                onTap?.(subId);
              }}
              className={cn(
                "flex-1 min-w-0 rounded-sm flex items-center justify-center text-white font-slab font-medium shadow-sm select-none",
                "transition-transform active:scale-95",
                slim ? "h-7 text-xs shadow-none" : "h-9 text-sm",
                bg,
                isSubActive && "ring-2 ring-poster-ink/50",
              )}
            >
              {sw.token}
            </button>
          );
        })}
      </div>
    );
  }


  return (
    <button
      key={`${flourish.epoch}`}
      ref={(el) => id && registerRef?.(id, el)}
      data-cell-id={id}
      onClick={(e) => {
        if (!id || !onTap) return;
        e.stopPropagation();
        onTap(id);
      }}
      style={{
        ...(shouldFlourish ? { ["--i" as never]: flourishIdx } : {}),
        ...(loadFl.active ? { ["--li" as never]: loadIdx } : {}),
        ...(clipSide ? { clipPath: CLIP[clipSide] } : {}),
      } as React.CSSProperties}
      className={cn(
        "rounded-sm flex justify-center text-white font-slab font-medium shadow-sm select-none",
        "transition-transform active:scale-95 gap-1",
        clipSide === "left"  ? "items-start relative z-10"  :
        clipSide === "right" ? "items-end relative -translate-x-9"  : "items-center",
        slim ? "h-7 text-xs px-1 shadow-none" : "h-9 text-sm",
        bg,
        genderCls,
        shouldFlourish && "pill-flourish",
        loadFl.active && "pill-load-flicker",
        isPinned ? "poss-pinned" : (active || isContextActive || (activeWordId && id && activeWordId.startsWith(`${id}::`))) ? "ring-2 ring-poster-ink/50" : "",
        dim && !active && !isPinned && !isContextActive && !(activeWordId && id && activeWordId.startsWith(`${id}::`))
          && (!morph || (activeWordId?.startsWith("pos-") && id?.startsWith("pos-")))
          && "opacity-60 transition-opacity duration-200",
        className,
      )}
    >
      {morph ? (
        <span className="pill-flourish-text" style={{ ["--i" as never]: flourishIdx ?? 0 } as React.CSSProperties}>
          {morph.parts.map((p, i) => {
            const stroke = showGender !== "off" && morph.endingGender && morph.endingGender !== "pl"
              ? `hsl(var(--gender-${morph.endingGender === "m" ? "masc" : morph.endingGender === "f" ? "fem" : "neut"}))`
              : showGender !== "off" && morph.endingGender === "pl" ? "hsl(var(--gender-plural))" : null;
            const sw = subs?.[i];
            const subId = subs && id ? `${id}::${i}` : null;
            const isSubActive = subId ? activeWordId === subId : false;
            const inner = (
              <>
                {p.stem}
                <span
                  className={cn("font-bold", p.ending && "text-poster-red-deep red-ending-halo")}
                  style={stroke ? { borderBottom: `3px solid ${stroke}`, paddingBottom: 1 } : undefined}
                >{p.ending}</span>
              </>
            );
            return (
              <span key={i}>
                {i > 0 && <span aria-hidden className="opacity-70 mx-1">•</span>}
                {subId ? (
                  <span
                    ref={(el) => registerRef?.(subId, el)}
                    data-cell-id={subId}
                    data-formal={sw?.gender === "formal" ? "" : undefined}
                    role="button"
                    tabIndex={0}
                    onClick={(e) => {
                      e.stopPropagation();
                      onTap?.(subId);
                    }}
                    className={cn("sub-tok", isSubActive && "sub-tok-active")}
                    style={sw ? ({ ["--sub-stroke" as never]: SUB_STROKE[sw.gender] } as React.CSSProperties) : undefined}
                  >
                    {inner}
                  </span>
                ) : inner}
              </span>
            );
          })}
        </span>
      ) : (children ?? (subs && id
        ? subs.map((sw, i) => {
            const subId = `${id}::${i}`;
            const isSubActive = activeWordId === subId;
            return (
              <span key={subId} className="inline-flex items-center gap-1">
                {i > 0 && <span aria-hidden className="opacity-70">•</span>}
                <span
                  ref={(el) => registerRef?.(subId, el)}
                  data-cell-id={subId}
                  data-formal={sw.gender === "formal" ? "" : undefined}
                  role="button"
                  tabIndex={0}
                  onClick={(e) => {
                    e.stopPropagation();
                    onTap?.(subId);
                  }}
                  className={cn("sub-tok", isSubActive && "sub-tok-active")}
                  style={{ ["--sub-stroke" as never]: SUB_STROKE[sw.gender] }}
                >
                  {sw.token}
                </span>
              </span>
            );
          })
        : word?.display))}
    </button>
  );
};

const PrepWord = ({
  word,
  registerRef,
  onTap,
  active,
  tiny,
}: {
  word: WordDatum;
  registerRef?: (id: string, el: HTMLElement | null) => void;
  onTap?: (id: string) => void;
  active?: boolean;
  tiny?: boolean;
}) => (
  <button
    ref={(el) => registerRef?.(word.id, el)}
    data-cell-id={word.id}
    onClick={(e) => {
      e.stopPropagation();
      onTap?.(word.id);
    }}
    className={cn(
      "block w-full text-center font-slab text-white leading-tight",
      tiny ? "text-[10px]" : "text-sm",
      active && "underline underline-offset-2",
    )}
  >
    {word.display}
  </button>
);

const SWATCH_BORDER: Record<string, string> = {
  "bg-gender-masc":   "border-gender-masc",
  "bg-gender-fem":    "border-gender-fem",
  "bg-gender-neut":   "border-gender-neut",
  "bg-gender-plural": "border-gender-plural",
  "bg-gender-formal": "border-gender-formal",
};

export type LegendGender = "m" | "f" | "n" | "pl" | "formal";

/** Articles only — bounding box source for each gender. */
const ARTICLES_BY_GENDER: Record<LegendGender, string[]> = {
  m:      ["nom-ein", "nom-der", "akk-einen", "akk-den", "dat-einem", "dat-dem"],
  f:      ["nom-eine", "nom-die", "akk-eine", "akk-die", "dat-einer", "dat-der"],
  n:      ["nom-ein2", "nom-das", "akk-ein", "akk-das", "dat-einem2", "dat-dem2"],
  pl:     ["nom-none", "nom-diePl", "akk-none", "akk-diePl", "dat-noneN", "dat-denN"],
  formal: [],
};

const SWATCH_GENDER: Record<string, LegendGender> = {
  "bg-gender-masc": "m",
  "bg-gender-fem": "f",
  "bg-gender-neut": "n",
  "bg-gender-plural": "pl",
  "bg-gender-formal": "formal",
};

const LegendSwatch = ({
  color, label, gender, hovered, stuck, onHover, onClick,
}: {
  color: string;
  label: string;
  gender: LegendGender;
  hovered: boolean;
  stuck: boolean;
  onHover: (g: LegendGender | null) => void;
  onClick: (g: LegendGender) => void;
}) => (
  <button
    type="button"
    onMouseEnter={() => onHover(gender)}
    onMouseLeave={() => onHover(null)}
    onClick={(e) => { e.stopPropagation(); onClick(gender); }}
    className={cn("inline-flex items-center gap-2 cursor-pointer", (hovered || stuck) && "opacity-100", !hovered && !stuck && "opacity-90")}
  >
    <span className={cn("relative inline-block w-6 h-6 rounded-md bg-white border-[5px]", SWATCH_BORDER[color] ?? "border-poster-ink")}>
      {stuck && <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-poster-ink">✓</span>}
    </span>
    <span className="font-display font-semibold">{label}</span>
  </button>
);

/* ---------- Main poster ---------- */

export const Poster = forwardRef<PosterHandle, Props>(
  ({ activeCase, activeWordId, morphContextId = null, pinnedPossId = null, onTapCase, onTapCaseIcon, onTapWord, onTapBackground, onTapVerbCloud, genderMode = "off", morphMap = null, flourish = { epoch: 0, indices: new Map() }, quizBlur = false, quizActive = false, slimPills = false, pillPadH = 28, pillPadV = 32, caseGap = 16, mobileZoomedCase, caseHoverDim = false, pinnedCase = null, learnDim = null, learnOverlay = null }, ref) => {
    const rootRef = useRef<HTMLDivElement>(null);
    const cellRefs = useRef<Record<string, HTMLElement | null>>({});

    /** Load-time flicker: active for the first ~2.5s after mount. */
    const loadCounterRef = useRef({ current: 0 });
    const [loadActive, setLoadActive] = useState(true);
    useEffect(() => {
      const t = setTimeout(() => setLoadActive(false), 2500);
      return () => clearTimeout(t);
    }, []);
    const loadFlourish = useMemo(() => ({ active: loadActive, counter: loadCounterRef.current }), [loadActive]);

    const registerRef = (id: string, el: HTMLElement | null) => {
      cellRefs.current[id] = el;
    };

    useImperativeHandle(ref, () => ({
      getRect: (id) => {
        const root = rootRef.current;
        if (!root) return null;
        const rRoot = root.getBoundingClientRect();
        // Normalize by current rendered scale so result is in poster-local px,
        // independent of any active zoom/transform applied by ancestors.
        const s = rRoot.width / POSTER_W || 1;

        // Virtual rect for article sub-rows (def / indef) — computed from member pills
        // so we don't have to wrap the grid (which would break the 2-col layout).
        if (ARTICLE_ROW_MEMBERS[id]) {
          let l = Infinity, t = Infinity, r = -Infinity, b = -Infinity, any = false;
          for (const pid of ARTICLE_ROW_MEMBERS[id]) {
            const el = cellRefs.current[pid];
            if (!el) continue;
            const rE = el.getBoundingClientRect();
            any = true;
            const lx = (rE.left - rRoot.left) / s;
            const ty = (rE.top - rRoot.top) / s;
            l = Math.min(l, lx); t = Math.min(t, ty);
            r = Math.max(r, lx + rE.width / s); b = Math.max(b, ty + rE.height / s);
          }
          if (!any) return null;
          return new DOMRect(l, t, r - l, b - t);
        }

        let target: HTMLElement | null = null;
        if (id.startsWith("zone-")) {
          target = root.querySelector(`[data-zone="${id}"]`) as HTMLElement | null;
        } else if (id.startsWith("g-") || id.startsWith("nom-row-")) {
          target = root.querySelector(`[data-group="${id}"]`) as HTMLElement | null;
        } else {
          target = cellRefs.current[id] ?? null;
        }
        if (!target) return null;

        const rEl = target.getBoundingClientRect();
        let left = (rEl.left - rRoot.left) / s;
        let top = (rEl.top - rRoot.top) / s;
        let width = rEl.width / s;
        let height = rEl.height / s;

        // For case zones, trim the icon (first child <button>) from the top so
        // the spotlight wraps just the pills.
        if (id.startsWith("zone-")) {
          const btn = target.querySelector(":scope > button") as HTMLElement | null;
          if (btn) {
            const rB = btn.getBoundingClientRect();
            const bottom = (rB.bottom - rRoot.top) / s;
            const delta = bottom - top;
            if (delta > 0 && delta < height) {
              top = bottom;
              height -= delta;
            }
          }
        }

        return new DOMRect(left, top, width, height);
      },
      getRoot: () => rootRef.current,
      fireLinkBurst: (ids, staggerMs) => {
        ids.forEach((id, i) => {
          const el = cellRefs.current[id];
          if (!el) return;
          el.style.animationDelay = `${i * staggerMs}ms`;
          el.style.animationDuration = '600ms';
          el.classList.remove('link-burst');
          void el.offsetWidth; // force reflow to restart the animation
          el.classList.add('link-burst');
        });
      },
      rippleFrom(sourceId, result) {
        const sourceEl = cellRefs.current[sourceId];
        if (!sourceEl) return;
        const srcR = sourceEl.getBoundingClientRect();
        const srcCx = srcR.left + srcR.width / 2;
        const srcCy = srcR.top + srcR.height / 2;
        const SPEED = 1800; // px/s
        const ANIM_MS = 250; // fade-to-color duration per pill
        const cls = result === "correct" ? "pill-ripple-correct" : "pill-ripple-wrong";
        let maxDelay = 0;
        const tasks: Array<{ el: HTMLElement; delay: number }> = [];
        Object.entries(cellRefs.current).forEach(([id, el]) => {
          if (!el || id.startsWith("verb-")) return;
          const r = el.getBoundingClientRect();
          const delay = Math.round(Math.hypot(r.left + r.width / 2 - srcCx, r.top + r.height / 2 - srcCy) / SPEED * 1000);
          maxDelay = Math.max(maxDelay, delay);
          tasks.push({ el, delay });
        });
        const HOLD_MS = 200;
        const SNAP_MS = 70;  // natural color visible per flash
        const FADE_MS = 80;  // fade back to color per flash
        const clsFlash = result === "correct" ? "pill-flash-correct" : "pill-flash-wrong";

        const allPills = () => Object.entries(cellRefs.current)
          .filter(([id, el]) => el && !id.startsWith("verb-")).map(([, el]) => el!);

        const snapToNatural = () => allPills().forEach(el => el.classList.remove(cls, clsFlash));
        const fadeToColor = () => {
          const pills = allPills();
          pills.forEach(el => el.classList.remove(cls, clsFlash));
          void pills[0]?.offsetWidth;
          pills.forEach(el => el.classList.add(clsFlash));
        };

        // Phase 1: ripple in — each pill fades to color (source first)
        tasks.forEach(({ el, delay }) => {
          setTimeout(() => {
            el.classList.remove(cls);
            void el.offsetWidth;
            el.classList.add(cls);
          }, delay);
        });
        const allDone = maxDelay + ANIM_MS;

        // Phase 2: hold, then two quick flashes to natural before ripple back
        const T0 = allDone + HOLD_MS;
        setTimeout(snapToNatural,  T0);
        setTimeout(fadeToColor,    T0 + SNAP_MS);
        setTimeout(snapToNatural,  T0 + SNAP_MS + FADE_MS);
        setTimeout(fadeToColor,    T0 + SNAP_MS * 2 + FADE_MS);

        // Phase 3: ripple back — same direction, same delays
        const T_OUT = T0 + SNAP_MS * 2 + FADE_MS * 2 + 60;
        tasks.forEach(({ el, delay }) => {
          setTimeout(() => el.classList.remove(cls, clsFlash), T_OUT + delay);
        });
      },
    }));

    /* Legend hover/stick state for gender highlight rectangles. */
    const [legendHover, setLegendHover] = useState<LegendGender | null>(null);
    const [legendStuck, setLegendStuck] = useState<Set<LegendGender>>(new Set());
    const [highlightRects, setHighlightRects] = useState<{ gender: LegendGender; rect: { left: number; top: number; width: number; height: number } }[]>([]);
    const [hoverDimCase, setHoverDimCase] = useState<CaseKey | null>(null);
    const [overlayCaseHover, setOverlayCaseHover] = useState<CaseKey | null>(null);

    type OverlayRect = { left: number; top: number; width: number; height: number };
    const [overlayRects, setOverlayRects] = useState<{
      cases: { caseKey: CaseKey; rect: OverlayRect }[];
      groups: { groupType: "pronouns" | "defArticles" | "indefArticles"; rect: OverlayRect }[];
    }>({ cases: [], groups: [] });
    const [wrongOverlayKey, setWrongOverlayKey] = useState<string | null>(null);
    const wrongOverlayTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const flashWrongOverlay = useCallback((key: string) => {
      if (wrongOverlayTimer.current) clearTimeout(wrongOverlayTimer.current);
      setWrongOverlayKey(key);
      wrongOverlayTimer.current = setTimeout(() => setWrongOverlayKey(null), 500);
    }, []);

    useLayoutEffect(() => {
      const compute = () => {
        const root = rootRef.current;
        if (!root || !learnOverlay) { setOverlayRects({ cases: [], groups: [] }); return; }
        const rRoot = root.getBoundingClientRect();
        const s = rRoot.width / POSTER_W || 1;
        const toRect = (el: HTMLElement | null): OverlayRect | null => {
          if (!el) return null;
          const r = el.getBoundingClientRect();
          return { left: (r.left - rRoot.left) / s, top: (r.top - rRoot.top) / s, width: r.width / s, height: r.height / s };
        };
        const unionRect = (a: OverlayRect | null, b: OverlayRect | null): OverlayRect | null => {
          if (!a && !b) return null;
          if (!a) return b!;
          if (!b) return a;
          const left = Math.min(a.left, b.left); const top = Math.min(a.top, b.top);
          const right = Math.max(a.left + a.width, b.left + b.width); const bottom = Math.max(a.top + a.height, b.top + b.height);
          return { left, top, width: right - left, height: bottom - top };
        };
        if (learnOverlay.step === 1) {
          // Cover only the pill groups (pron + art), excluding header icon and prep strips.
          const cases: { caseKey: CaseKey; rect: OverlayRect }[] = [];
          for (const c of ["nom", "akk", "dat"] as const) {
            const rect = unionRect(
              toRect(root.querySelector(`[data-group="g-${c}-pron"]`) as HTMLElement | null),
              toRect(root.querySelector(`[data-group="g-${c}-art"]`) as HTMLElement | null),
            );
            if (rect) cases.push({ caseKey: c, rect });
          }
          setOverlayRects({ cases, groups: [] });
        } else if (learnOverlay.step === 2) {
          // Pronouns rectangle + whole articles rectangle (no def/indef split yet).
          const c = learnOverlay.case;
          const groups: { groupType: "pronouns" | "articles" | "defArticles" | "indefArticles"; rect: OverlayRect }[] = [];
          const pronRect = toRect(root.querySelector(`[data-group="g-${c}-pron"]`) as HTMLElement | null);
          if (pronRect) groups.push({ groupType: "pronouns", rect: pronRect });
          const artRect = toRect(root.querySelector(`[data-group="g-${c}-art"]`) as HTMLElement | null);
          if (artRect) groups.push({ groupType: "articles", rect: artRect });
          setOverlayRects({ cases: [], groups });
        } else if (learnOverlay.step === 3) {
          // Def / indef column split inside the articles group.
          const c = learnOverlay.case;
          const artEl = root.querySelector(`[data-group="g-${c}-art"]`) as HTMLElement | null;
          const artRect = toRect(artEl);
          const groups: { groupType: "pronouns" | "articles" | "defArticles" | "indefArticles"; rect: OverlayRect }[] = [];
          if (artRect) {
            const GAP = 3;
            const midX = artRect.left + artRect.width / 2;
            groups.push({ groupType: "indefArticles", rect: { left: artRect.left, top: artRect.top, width: midX - artRect.left - GAP, height: artRect.height } });
            groups.push({ groupType: "defArticles",   rect: { left: midX + GAP,  top: artRect.top, width: artRect.width / 2 - GAP,   height: artRect.height } });
          }
          setOverlayRects({ cases: [], groups });
        } else {
          setOverlayRects({ cases: [], groups: [] });
        }
      };
      compute();
      window.addEventListener("resize", compute);
      return () => window.removeEventListener("resize", compute);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [learnOverlay?.step, learnOverlay?.case]);

    const computeHighlights = () => {
      const root = rootRef.current;
      if (!root) return;
      const rRoot = root.getBoundingClientRect();
      const s = rRoot.width / POSTER_W || 1;
      const active = new Set<LegendGender>(legendStuck);
      if (legendHover) active.add(legendHover);
      const out: { gender: LegendGender; rect: { left: number; top: number; width: number; height: number } }[] = [];
      active.forEach((g) => {
        const ids = ARTICLES_BY_GENDER[g];
        let l = Infinity, t = Infinity, r = -Infinity, b = -Infinity;
        let any = false;
        ids.forEach((id) => {
          const el = cellRefs.current[id];
          if (!el) return;
          const rE = el.getBoundingClientRect();
          any = true;
          const lx = (rE.left - rRoot.left) / s;
          const ty = (rE.top - rRoot.top) / s;
          l = Math.min(l, lx); t = Math.min(t, ty);
          r = Math.max(r, lx + rE.width / s); b = Math.max(b, ty + rE.height / s);
        });
        if (any) out.push({ gender: g, rect: { left: l, top: t, width: r - l, height: b - t } });
      });
      setHighlightRects(out);
    };

    useLayoutEffect(() => { computeHighlights(); }, [legendHover, legendStuck]);
    useEffect(() => {
      const h = () => computeHighlights();
      window.addEventListener("resize", h);
      return () => window.removeEventListener("resize", h);
    }, [legendHover, legendStuck]);

    // Learn-mode progressive dimming — pure DOM, no React re-renders on hover
    useEffect(() => {
      const root = rootRef.current;
      if (!root) return;

      const clear = () => root.querySelectorAll(".learn-dim:not([data-zone])").forEach((el) => el.classList.remove("learn-dim"));
      const dim = (el: Element | null) => el?.classList.add("learn-dim");

      function applyLearnDim(hoverPillId: string | null) {
        clear();
        if (!learnDim) return;
        const { step, case: lCase, group: lGroup, row: lRow } = learnDim;
        const hoverParent = hoverPillId?.split("::")[0] ?? null;

        // Step 2+: dim non-article groups within the locked case zone
        if (step >= 2) {
          const hoverGroup = hoverParent ? WORD_GROUP[hoverParent] : null;
          const effectiveGroup = lGroup ?? (hoverGroup && WORD_GROUP[hoverParent ?? ""] ? hoverGroup : null);
          const caseGroups: Record<CaseKey, string[]> = {
            akk: ["g-akk-pron", "g-akk-prep", "g-twL", "g-akk-art"],
            nom: ["g-nom-pron", "g-nom-art"],
            dat: ["g-dat-pron", "g-dat-prep", "g-twR", "g-dat-art"],
          };
          const groups = caseGroups[lCase];
          if (effectiveGroup && groups.includes(effectiveGroup)) {
            groups.forEach((g) => {
              if (g !== effectiveGroup) dim(root.querySelector(`[data-group="${g}"]`));
            });
          }
        }

        // Step 3+: dim the non-target article row (individual pills)
        if (step >= 3 && lGroup) {
          const hoverRow = hoverParent ? ARTICLE_ROW[hoverParent] : null;
          const correctRow = learnDim?.correctPillId ? ARTICLE_ROW[learnDim.correctPillId] : null;
          const effectiveRow = lRow ?? correctRow ?? (hoverRow?.startsWith(lCase) ? hoverRow : null);
          if (effectiveRow) {
            root.querySelectorAll(`[data-group="${lGroup}"] [data-cell-id]`).forEach((el) => {
              const pid = (el as HTMLElement).dataset.cellId?.split("::")[0] ?? "";
              if (ARTICLE_ROW[pid] !== effectiveRow) dim(el);
            });
          }
        }

        // Step 4: dim all pills in the row except the correct answer
        if (step >= 4 && hoverPillId && lRow && learnDim?.correctPillId) {
          root.querySelectorAll(`[data-group="${lGroup}"] [data-cell-id]`).forEach((el) => {
            const pid = (el as HTMLElement).dataset.cellId?.split("::")[0] ?? "";
            if (pid !== hoverParent && ARTICLE_ROW[pid] === lRow) dim(el);
          });
        }
      }

      applyLearnDim(null);

      const onMove = (e: MouseEvent) => {
        if (!learnDim) { applyLearnDim(null); return; }
        const { step, group: lGroup, case: lCase } = learnDim;

        // Step 4: individual pill precision
        if (step >= 4) {
          const el = (e.target as HTMLElement).closest("[data-cell-id]") as HTMLElement | null;
          applyLearnDim(el?.dataset.cellId ?? null);
          return;
        }

        // Step 3: virtual bbox hit-test for def vs indef columns
        if (step === 3 && lGroup) {
          const px = e.clientX, py = e.clientY;
          const rowIds = [`${lCase}-art-row-def`, `${lCase}-art-row-indef`];
          let found: string | null = null;
          for (const rowId of rowIds) {
            const members = ARTICLE_ROW_MEMBERS[rowId] ?? [];
            let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
            for (const pid of members) {
              const el = cellRefs.current[pid];
              if (!el) continue;
              const r = el.getBoundingClientRect();
              minX = Math.min(minX, r.left); minY = Math.min(minY, r.top);
              maxX = Math.max(maxX, r.right); maxY = Math.max(maxY, r.bottom);
            }
            if (px >= minX && px <= maxX && py >= minY && py <= maxY) {
              found = members[0] ?? null;
              break;
            }
          }
          applyLearnDim(found);
          return;
        }

        // Step 2: group-level detection via DOM hierarchy
        if (step === 2) {
          const groupEl = (e.target as HTMLElement).closest("[data-group]") as HTMLElement | null;
          const firstPill = groupEl?.querySelector("[data-cell-id]") as HTMLElement | null;
          applyLearnDim(firstPill?.dataset.cellId ?? null);
          return;
        }

        applyLearnDim(null);
      };
      const onLeave = () => applyLearnDim(null);

      root.addEventListener("mousemove", onMove);
      root.addEventListener("mouseleave", onLeave);
      return () => {
        root.removeEventListener("mousemove", onMove);
        root.removeEventListener("mouseleave", onLeave);
        root.querySelectorAll(".learn-dim:not([data-zone])").forEach((el) => el.classList.remove("learn-dim"));
      };
    }, [learnDim]); // eslint-disable-line react-hooks/exhaustive-deps

    const STROKE: Record<LegendGender, string> = {
      m: "hsl(var(--gender-masc))",
      f: "hsl(var(--gender-fem))",
      n: "hsl(var(--gender-neut))",
      pl: "hsl(var(--gender-plural))",
      formal: "hsl(var(--gender-formal))",
    };

    const tap = (id: string) => onTapWord(id);

    // Possessives animation constants — caseGap is purely spacing, not column-width
    const POSS_COL_W = (POSTER_W - pillPadH * 2) / 3;
    const POSS_COL_GAP = caseGap;
    const POSS_W = POSS_COL_W * 0.55;
    const POSS_PILL_H = slimPills ? 28 : 36;
    const POSS_PILL_GAP = 6;
    const POSS_TOP = 32 + 112 + 8; // top of pronouns block (padding + icon + mb-2)
    const colLeft = (col: number) => pillPadH + col * (POSS_COL_W + POSS_COL_GAP);

    // Natural row position: where possessives sit in normal flow (below the grid)
    const POSS_NATURAL_TOP = 510;
    const ROW_PILL_W = Math.floor((POSTER_W - pillPadH * 2 + 2 * caseGap - 5 * POSS_PILL_GAP) / 6);
    const rowPillX = (i: number) => pillPadH + i * (ROW_PILL_W + POSS_PILL_GAP);

    // Case-zoom column position — per-case side:
    //   Akk → RIGHT of pronouns (col 0 right edge + gap)
    //   Nom → LEFT of pronouns  (col 1 left edge − width − gap)
    //   Dat → LEFT of pronouns  (col 2 left edge − width − gap)
    const POSS_NUDGE = 5; // px between possessives column and the adjacent pronouns
    // isMobile = prop is present (undefined = desktop, null/CaseKey = mobile)
    const isMobilePoss = mobileZoomedCase !== undefined;
    const isZoomed = mobileZoomedCase != null;
    // NOM pronouns are centered (items-center) inside the column. Each row is
    // w-[72px] + gap-1.5(6px) + w-10(40px) = 118px, so the left edge of the row
    // sits (POSS_COL_W - 118) / 2 inset from the column boundary.
    const NOM_PRON_ROW_W = isMobilePoss ? (72 + 6 + 40) : (150 + 6 + 64);
    const nomInnerOffset = (POSS_COL_W - NOM_PRON_ROW_W) / 2;
    const colPillX =
      mobileZoomedCase === "akk"
        ? colLeft(0) + POSS_COL_W + POSS_NUDGE
        : mobileZoomedCase === "nom"
          ? colLeft(1) + nomInnerOffset - POSS_W - POSS_NUDGE
          : colLeft(2) - POSS_W - POSS_NUDGE; // dat or fallback
    const colPillY = (i: number) => POSS_TOP + i * (POSS_PILL_H + POSS_PILL_GAP);

    return (
      <MorphCtx.Provider value={morphMap}>
      <MorphContextIdCtx.Provider value={morphContextId}>
      <PinnedPossIdCtx.Provider value={pinnedPossId}>
      <FlourishCtx.Provider value={flourish}>
      <LoadFlourishCtx.Provider value={loadFlourish}>
      <GenderCtx.Provider value={genderMode}>
      <QuizActiveCtx.Provider value={quizActive}>
      <SlimCtx.Provider value={slimPills}>
      <DimCtx.Provider value={!!activeWordId}>
      <div
        ref={rootRef}
        className={cn("relative bg-poster-bg select-none", (legendHover === "formal" || legendStuck.has("formal")) && "formal-active", quizBlur && "quiz-active")}
        style={{ width: POSTER_W, height: POSTER_H, padding: `${pillPadV}px ${pillPadH}px` }}
        onClick={(e) => {
          const t = e.target as HTMLElement;
          if (!t.closest("button")) onTapBackground?.();
        }}
      >
        {/* ===== Three case zones (L-shapes) ===== */}
        <div
          className="grid grid-cols-3 relative z-10"
          style={{ gridTemplateColumns: `${POSS_COL_W}px ${POSS_COL_W}px ${POSS_COL_W}px`, columnGap: caseGap }}
          onMouseLeave={() => setHoverDimCase(null)}
        >
          {/* ============== AKKUSATIV (left L) ============== */}
          <div data-zone="zone-akk"
            className={cn("relative z-10 transition-opacity duration-200", ((pinnedCase !== null ? pinnedCase !== "akk" : (isMobilePoss && !isZoomed || caseHoverDim) && hoverDimCase !== null && hoverDimCase !== "akk") || (!!learnDim && overlayCaseHover !== null && overlayCaseHover !== "akk")) && (learnDim ? "learn-dim" : "opacity-40"))}
            onMouseEnter={() => { if (!pinnedCase && (isMobilePoss && !isZoomed || caseHoverDim)) setHoverDimCase("akk"); }}
          >
            <button
              onClick={(e) => { onTapCase("akk"); onTapCaseIcon?.("akk", e.currentTarget.getBoundingClientRect()); }}
              className="w-full flex flex-col items-center mb-2 active:scale-95 transition-transform"
            >
              <img src={bicycle} alt="Bicycle — Akkusativ WEN • WOHIN (direct object)"
                   className="h-28 object-contain" draggable={false} />
            </button>

            {/* Pronoun stack + red prep strip aligned to top of "ich" */}
            <div className="flex gap-1.5 items-start">
              {/* Red strip (Akk preps) — top-aligned with pronoun stack */}
              <div data-group="g-akk-prep" className="bg-poster-green rounded-sm py-2 px-1 flex flex-col items-center justify-evenly w-[28%] gap-1 self-stretch">
                {(["akk-prep-für","akk-prep-gegen","akk-prep-um","akk-prep-bis","akk-prep-ohne","akk-prep-durch"] as const).map(k => (
                  <PrepWord key={k} word={WORDS[k]} registerRef={registerRef} onTap={tap}
                            active={activeWordId === k} />
                ))}
              </div>

              <div data-group="g-akk-pron" className="flex-1 flex flex-col gap-1.5 items-stretch">
                <Pill word={WORDS["akk-mich"]}   color="green" active={activeWordId === "akk-mich"}   activeWordId={activeWordId} onTap={tap} registerRef={registerRef} className="whitespace-nowrap" />
                <Pill word={WORDS["akk-dich"]}   color="green" active={activeWordId === "akk-dich"}   activeWordId={activeWordId} onTap={tap} registerRef={registerRef} className="whitespace-nowrap" />
                <Pill word={WORDS["akk-ihn"]}    color="green" active={activeWordId === "akk-ihn"}    activeWordId={activeWordId} onTap={tap} registerRef={registerRef} className="whitespace-nowrap" />
                <Pill word={WORDS["akk-uns"]}    color="green" active={activeWordId === "akk-uns"}    activeWordId={activeWordId} onTap={tap} registerRef={registerRef} className="whitespace-nowrap" />
                <Pill word={WORDS["akk-euch"]}   color="green" active={activeWordId === "akk-euch"}   activeWordId={activeWordId} onTap={tap} registerRef={registerRef} className="whitespace-nowrap" />
                <Pill word={WORDS["akk-sieSie"]} color="green" active={activeWordId === "akk-sieSie"} activeWordId={activeWordId} onTap={tap} registerRef={registerRef} className="whitespace-nowrap" />
              </div>
            </div>

            {/* Articles row */}
            <div className="relative mt-2 pl-[calc(28%+0.375rem)]">
              {/* Two-way preps — absolutely positioned so they can't push articles taller */}
              <div data-group="g-twL" className="absolute inset-y-0 left-0 w-[28%] bg-poster-green rounded-sm py-1 px-1 flex flex-col items-center justify-evenly gap-0 overflow-hidden border-2 border-poster-red-deep">
                {(["twL-in","twL-auf","twL-an","twL-unter","twL-neben","twL-hinter","twL-unter2","twL-über","twL-vor","twL-zwischen"] as const).map(k => (
                  <PrepWord key={k} word={WORDS[k]} registerRef={registerRef} onTap={tap}
                            active={activeWordId === k} tiny />
                ))}
              </div>

              {/* Articles grid — extra 1rem width compensates for -translate-x-4 on right pill */}
              <div data-group="g-akk-art" className="grid grid-cols-2 gap-x-0 gap-y-1.5 content-start" style={{ width: 'calc(100% + 2.25rem)' }}>
                <Pill word={WORDS["akk-einen"]}  color="green" active={activeWordId==="akk-einen"}  activeWordId={activeWordId} onTap={tap} registerRef={registerRef} clipSide="left">
                  ein<span data-poster-ending className="text-poster-red-deep font-bold red-ending-halo">en</span>
                </Pill>
                <Pill word={WORDS["akk-den"]}    color="green" active={activeWordId==="akk-den"}    activeWordId={activeWordId} onTap={tap} registerRef={registerRef} clipSide="right" />
                <Pill word={WORDS["akk-eine"]}   color="green" active={activeWordId==="akk-eine"}   activeWordId={activeWordId} onTap={tap} registerRef={registerRef} clipSide="left">
                  ein<span data-poster-ending className="text-poster-red-deep font-bold red-ending-halo">e</span>
                </Pill>
                <Pill word={WORDS["akk-die"]}    color="green" active={activeWordId==="akk-die"}    activeWordId={activeWordId} onTap={tap} registerRef={registerRef} clipSide="right" />
                <Pill word={WORDS["akk-ein"]}    color="green" active={activeWordId==="akk-ein"}    activeWordId={activeWordId} onTap={tap} registerRef={registerRef} clipSide="left" />
                <Pill word={WORDS["akk-das"]}    color="green" active={activeWordId==="akk-das"}    activeWordId={activeWordId} onTap={tap} registerRef={registerRef} clipSide="right" />
                <Pill word={WORDS["akk-none"]}   color="green" active={activeWordId==="akk-none"}   activeWordId={activeWordId} onTap={tap} registerRef={registerRef} clipSide="left" />
                <Pill word={WORDS["akk-diePl"]}  color="green" active={activeWordId==="akk-diePl"}  activeWordId={activeWordId} onTap={tap} registerRef={registerRef} clipSide="right">
                  di<span data-poster-ending className="text-poster-red-deep font-bold red-ending-halo">e</span>
                </Pill>
              </div>
            </div>
          </div>

          {/* ============== NOMINATIV (center) ============== */}
          <div data-zone="zone-nom"
            className={cn("relative z-10 transition-opacity duration-200", ((pinnedCase !== null ? pinnedCase !== "nom" : (isMobilePoss && !isZoomed || caseHoverDim) && hoverDimCase !== null && hoverDimCase !== "nom") || (!!learnDim && overlayCaseHover !== null && overlayCaseHover !== "nom")) && (learnDim ? "learn-dim" : "opacity-40"))}
            onMouseEnter={() => { if (!pinnedCase && (isMobilePoss && !isZoomed || caseHoverDim)) setHoverDimCase("nom"); }}
          >
            <button
              onClick={(e) => { onTapCase("nom"); onTapCaseIcon?.("nom", e.currentTarget.getBoundingClientRect()); }}
              className="w-full flex flex-col items-center mb-2 active:scale-95 transition-transform"
            >
              <img src={seinCloud} alt="Chef hat with sein cloud — Nominativ WER (subject / to be)"
                   className="h-28 object-contain" draggable={false} />
            </button>

            {/* Pronoun + ending pairs (each pair centered as a group) */}
            <div data-group="g-nom-pron" className="flex flex-col gap-1.5 items-center">
              <div data-group="nom-row-ich" className="flex gap-1.5 justify-center">
                <Pill word={WORDS["nom-ich"]}    color="yellow" active={activeWordId==="nom-ich"}    activeWordId={activeWordId} onTap={tap} registerRef={registerRef} className={cn(isMobilePoss ? "w-[72px]" : "w-[150px]", "whitespace-nowrap")} />
                <Pill word={WORDS["nom-end-e"]}  color="yellow" active={activeWordId==="nom-end-e"}  activeWordId={activeWordId} onTap={tap} registerRef={registerRef} className={cn(isMobilePoss ? "w-10" : "w-16", "text-xs text-poster-ink")} />
              </div>
              <div data-group="nom-row-du" className="flex gap-1.5 justify-center">
                <Pill word={WORDS["nom-du"]}     color="yellow" active={activeWordId==="nom-du"}     activeWordId={activeWordId} onTap={tap} registerRef={registerRef} className={cn(isMobilePoss ? "w-[72px]" : "w-[150px]", "whitespace-nowrap")} />
                <Pill word={WORDS["nom-end-st"]} color="yellow" active={activeWordId==="nom-end-st"} activeWordId={activeWordId} onTap={tap} registerRef={registerRef} className={cn(isMobilePoss ? "w-10" : "w-16", "text-xs text-poster-ink")} />
              </div>
              <div data-group="nom-row-er" className="flex gap-1.5 justify-center">
                <Pill word={WORDS["nom-er"]}     color="yellow" active={activeWordId==="nom-er"}     activeWordId={activeWordId} onTap={tap} registerRef={registerRef} className={cn(isMobilePoss ? "w-[72px]" : "w-[150px]", "whitespace-nowrap")} />
                <Pill word={WORDS["nom-end-t"]}  color="yellow" active={activeWordId==="nom-end-t"}  activeWordId={activeWordId} onTap={tap} registerRef={registerRef} className={cn(isMobilePoss ? "w-10" : "w-16", "text-xs text-poster-ink")} />
              </div>
              <div data-group="nom-row-wir" className="flex gap-1.5 justify-center">
                <Pill word={WORDS["nom-wir"]}    color="yellow" active={activeWordId==="nom-wir"}    activeWordId={activeWordId} onTap={tap} registerRef={registerRef} className={cn(isMobilePoss ? "w-[72px]" : "w-[150px]", "whitespace-nowrap")} />
                <Pill word={WORDS["nom-end-en"]} color="yellow" active={activeWordId==="nom-end-en"} activeWordId={activeWordId} onTap={tap} registerRef={registerRef} className={cn(isMobilePoss ? "w-10" : "w-16", "text-xs text-poster-ink")} />
              </div>
              <div data-group="nom-row-ihr" className="flex gap-1.5 justify-center">
                <Pill word={WORDS["nom-ihr"]}    color="yellow" active={activeWordId==="nom-ihr"}    activeWordId={activeWordId} onTap={tap} registerRef={registerRef} className={cn(isMobilePoss ? "w-[72px]" : "w-[150px]", "whitespace-nowrap")} />
                <Pill word={WORDS["nom-end-t2"]} color="yellow" active={activeWordId==="nom-end-t2"} activeWordId={activeWordId} onTap={tap} registerRef={registerRef} className={cn(isMobilePoss ? "w-10" : "w-16", "text-xs text-poster-ink")} />
              </div>
              <div data-group="nom-row-sie" className="flex gap-1.5 justify-center">
                <Pill word={WORDS["nom-sieSie"]} color="yellow" active={activeWordId==="nom-sieSie"} activeWordId={activeWordId} onTap={tap} registerRef={registerRef} className={cn(isMobilePoss ? "w-[72px]" : "w-[150px]", "whitespace-nowrap")} />
                <Pill word={WORDS["nom-end-en2"]}color="yellow" active={activeWordId==="nom-end-en2"}onTap={tap} registerRef={registerRef} className={cn(isMobilePoss ? "w-10" : "w-16", "text-xs text-poster-ink")} />
              </div>
            </div>

            {/* Articles — container=134px (118px visual pair + 16px for -translate-x-4 right pill).
                 ml centers the 118px visual footprint, not the 134px layout box. */}
            <div data-group="g-nom-art" className="grid grid-cols-2 gap-x-0 gap-y-1.5 mt-2" style={{ width: NOM_PRON_ROW_W + 36, marginLeft: `calc((100% - ${NOM_PRON_ROW_W}px) / 2)` }}>
              <Pill word={WORDS["nom-ein"]}  color="yellow" active={activeWordId==="nom-ein"}  activeWordId={activeWordId} onTap={tap} registerRef={registerRef} clipSide="left" />
              <Pill word={WORDS["nom-der"]}  color="yellow" active={activeWordId==="nom-der"}  activeWordId={activeWordId} onTap={tap} registerRef={registerRef} clipSide="right" />
              <Pill word={WORDS["nom-eine"]} color="yellow" active={activeWordId==="nom-eine"} activeWordId={activeWordId} onTap={tap} registerRef={registerRef} clipSide="left">
                ein<span data-poster-ending className="text-poster-red-deep font-bold red-ending-halo">e</span>
              </Pill>
              <Pill word={WORDS["nom-die"]}  color="yellow" active={activeWordId==="nom-die"}  activeWordId={activeWordId} onTap={tap} registerRef={registerRef} clipSide="right" />
              <Pill word={WORDS["nom-ein2"]} color="yellow" active={activeWordId==="nom-ein2"} activeWordId={activeWordId} onTap={tap} registerRef={registerRef} clipSide="left" />
              <Pill word={WORDS["nom-das"]}  color="yellow" active={activeWordId==="nom-das"}  activeWordId={activeWordId} onTap={tap} registerRef={registerRef} clipSide="right" />
              <Pill word={WORDS["nom-none"]} color="yellow" active={activeWordId==="nom-none"} activeWordId={activeWordId} onTap={tap} registerRef={registerRef} clipSide="left" />
              <Pill word={WORDS["nom-diePl"]}color="yellow" active={activeWordId==="nom-diePl"}onTap={tap} registerRef={registerRef} clipSide="right" />
            </div>

          </div>

          {/* ============== DATIV (right L, mirrored) ============== */}
          <div data-zone="zone-dat"
            className={cn("relative z-10 transition-opacity duration-200", ((pinnedCase !== null ? pinnedCase !== "dat" : (isMobilePoss && !isZoomed || caseHoverDim) && hoverDimCase !== null && hoverDimCase !== "dat") || (!!learnDim && overlayCaseHover !== null && overlayCaseHover !== "dat")) && (learnDim ? "learn-dim" : "opacity-40"))}
            onMouseEnter={() => { if (!pinnedCase && (isMobilePoss && !isZoomed || caseHoverDim)) setHoverDimCase("dat"); }}
          >
            <button
              onClick={(e) => { onTapCase("dat"); onTapCaseIcon?.("dat", e.currentTarget.getBoundingClientRect()); }}
              className="w-full flex flex-col items-center mb-2 active:scale-95 transition-transform"
            >
              <img src={envelope} alt="Envelope — Dativ WEM • WO • WANN"
                   className="h-28 object-contain" draggable={false} />
            </button>

            {/* Pronoun stack + red prep strip aligned to top of "mir" */}
            <div className="flex gap-1.5 items-start">
              <div data-group="g-dat-pron" className="flex-1 flex flex-col gap-1.5 items-stretch">
                <Pill word={WORDS["dat-mir"]}   color="purple" active={activeWordId==="dat-mir"}   activeWordId={activeWordId} onTap={tap} registerRef={registerRef} className="whitespace-nowrap" />
                <Pill word={WORDS["dat-dir"]}   color="purple" active={activeWordId==="dat-dir"}   activeWordId={activeWordId} onTap={tap} registerRef={registerRef} className="whitespace-nowrap" />
                <Pill word={WORDS["dat-ihm"]}   color="purple" active={activeWordId==="dat-ihm"}   activeWordId={activeWordId} onTap={tap} registerRef={registerRef} className="whitespace-nowrap" />
                <Pill word={WORDS["dat-uns"]}   color="purple" active={activeWordId==="dat-uns"}   activeWordId={activeWordId} onTap={tap} registerRef={registerRef} className="whitespace-nowrap" />
                <Pill word={WORDS["dat-euch"]}  color="purple" active={activeWordId==="dat-euch"}  activeWordId={activeWordId} onTap={tap} registerRef={registerRef} className="whitespace-nowrap" />
                <Pill word={WORDS["dat-ihnen"]} color="purple" active={activeWordId==="dat-ihnen"} activeWordId={activeWordId} onTap={tap} registerRef={registerRef} className="whitespace-nowrap" />
              </div>

              {/* Right red strip — Dativ preps, top-aligned with pronoun stack */}
              <div data-group="g-dat-prep" className="bg-poster-purple rounded-sm py-0.5 px-1 flex flex-col items-center justify-evenly w-[28%] gap-0 self-stretch">
                {(["dat-prep-zu","dat-prep-von","dat-prep-mit","dat-prep-bei","dat-prep-nach","dat-prep-seit","dat-prep-ab","dat-prep-aus","dat-prep-gegenüber","dat-prep-außer"] as const).map(k => (
                  <PrepWord key={k} word={WORDS[k]} registerRef={registerRef} onTap={tap}
                            active={activeWordId === k}
                            tiny={k === "dat-prep-gegenüber"} />
                ))}
              </div>
            </div>

            {/* Articles row */}
            <div className="relative mt-2 pr-[calc(28%+0.375rem)]">
              <div data-group="g-dat-art" className="grid grid-cols-2 gap-x-0 gap-y-1.5 content-start" style={{ width: 'calc(100% + 2.25rem)' }}>
                <Pill word={WORDS["dat-einem"]} color="purple" active={activeWordId==="dat-einem"} activeWordId={activeWordId} onTap={tap} registerRef={registerRef} clipSide="left">
                  ein<span data-poster-ending className="text-poster-red-deep font-bold red-ending-halo">em</span>
                </Pill>
                <Pill word={WORDS["dat-dem"]}   color="purple" active={activeWordId==="dat-dem"}   activeWordId={activeWordId} onTap={tap} registerRef={registerRef} clipSide="right" />
                <Pill word={WORDS["dat-einer"]} color="purple" active={activeWordId==="dat-einer"} activeWordId={activeWordId} onTap={tap} registerRef={registerRef} clipSide="left">
                  ein<span data-poster-ending className="text-poster-red-deep font-bold red-ending-halo">er</span>
                </Pill>
                <Pill word={WORDS["dat-der"]}   color="purple" active={activeWordId==="dat-der"}   activeWordId={activeWordId} onTap={tap} registerRef={registerRef} clipSide="right" />
                <Pill word={WORDS["dat-einem2"]}color="purple" active={activeWordId==="dat-einem2"}onTap={tap} registerRef={registerRef} clipSide="left">
                  ein<span data-poster-ending className="text-poster-red-deep font-bold red-ending-halo">em</span>
                </Pill>
                <Pill word={WORDS["dat-dem2"]}  color="purple" active={activeWordId==="dat-dem2"}  activeWordId={activeWordId} onTap={tap} registerRef={registerRef} clipSide="right" />
                <Pill word={WORDS["dat-noneN"]} color="purple" active={activeWordId==="dat-noneN"} activeWordId={activeWordId} onTap={tap} registerRef={registerRef} clipSide="left">
                  —…<span data-poster-ending className="text-poster-red-deep font-bold red-ending-halo">n</span>
                </Pill>
                <Pill word={WORDS["dat-denN"]}  color="purple" active={activeWordId==="dat-denN"}  activeWordId={activeWordId} onTap={tap} registerRef={registerRef} clipSide="right">
                  den…<span data-poster-ending className="text-poster-red-deep font-bold red-ending-halo">n</span>
                </Pill>
              </div>

              <div data-group="g-twR" className="absolute inset-y-0 right-0 w-[28%] bg-poster-purple rounded-sm py-1 px-1 flex flex-col items-center justify-evenly gap-0 overflow-hidden border-2 border-poster-red-deep">
                {(["twR-in","twR-auf","twR-an","twR-unter","twR-neben","twR-hinter","twR-unter2","twR-über","twR-vor","twR-zwischen"] as const).map(k => (
                  <PrepWord key={k} word={WORDS[k]} registerRef={registerRef} onTap={tap}
                            active={activeWordId === k} tiny />
                ))}
              </div>
            </div>
          </div>

          {/* Floating cloud stamps — desktop only */}
          {!slimPills && (
            <>
              <button
                ref={(el) => registerRef("verb-lieben", el)}
                data-cell-id="verb-lieben"
                onClick={(e) => { e.stopPropagation(); if (onTapVerbCloud) { onTapVerbCloud(); } else { tap("verb-lieben"); } }}
                aria-label="lieben — to love"
                className={cn(
                  "absolute z-20 active:scale-95 transition-all rounded-full cloud-float-a opacity-30 hover:opacity-100",
                  activeWordId === "verb-lieben" && "ring-2 ring-poster-green ring-offset-2 cloud-float-paused",
                )}
                style={{ left: "37.33%", top: "12%" }}
              >
                <img src={liebenStamp} alt="" className="h-16 object-contain pointer-events-none" draggable={false} />
              </button>
              <button
                ref={(el) => registerRef("verb-geben", el)}
                data-cell-id="verb-geben"
                onClick={(e) => { e.stopPropagation(); if (onTapVerbCloud) { onTapVerbCloud(); } else { tap("verb-geben"); } }}
                aria-label="geben — to give"
                className={cn(
                  "absolute z-20 active:scale-95 transition-all rounded-full cloud-float-b opacity-30 hover:opacity-100",
                  activeWordId === "verb-geben" && "ring-2 ring-poster-purple ring-offset-2 cloud-float-paused",
                )}
                style={{ left: "66%", top: "12%" }}
              >
                <img src={gebenStamp} alt="" className="h-16 object-contain pointer-events-none" draggable={false} />
              </button>
            </>
          )}
        </div>

        {/* Possessives — desktop: normal flow row. Mobile: each pill is permanently
            absolutely positioned and transitions via transform between the full-view
            row position and the case-zoom column position beside the active case. */}
        {isMobilePoss ? (
          // Mobile: single persistent set of pills, positions driven by transform.
          // The outer div is a zero-size anchor at poster origin.
          <div data-group="g-pos" data-quiz-hide aria-hidden={false}
               style={{ position: "absolute", left: 0, top: 0, zIndex: 15, pointerEvents: "none" }}>
            {(["pos-mein","pos-dein","pos-sein","pos-unser","pos-euer","pos-ihr"] as const).map((k, i) => {
              const tx = isZoomed ? colPillX  : rowPillX(i);
              const ty = isZoomed ? colPillY(i) : POSS_NATURAL_TOP;
              const w  = isZoomed ? POSS_W : ROW_PILL_W;
              return (
                <div
                  key={k}
                  style={{
                    position: "absolute",
                    left: 0,
                    top: 0,
                    width: w,
                    height: POSS_PILL_H,
                    transform: `translate(${tx}px, ${ty}px)`,
                    transition: `transform 0.45s cubic-bezier(0.22,1,0.36,1) ${i * 40}ms`,
                    pointerEvents: "auto",
                  }}
                >
                  <Pill word={WORDS[k]} color="red"
                        active={activeWordId === k} activeWordId={activeWordId} onTap={tap} registerRef={registerRef}
                        className="w-full text-xs font-display font-semibold cursor-pointer" />
                </div>
              );
            })}
          </div>
        ) : (
          // Desktop: normal flow full-width row
          <div data-group="g-pos" data-quiz-hide className="relative flex gap-1.5" style={{ zIndex: 0, width: `calc(100% + ${2 * caseGap}px)`, marginTop: '16px' }}>
            {(["pos-mein","pos-dein","pos-sein","pos-unser","pos-euer","pos-ihr"] as const).map(k => (
              <Pill key={k} word={WORDS[k]} color="red"
                    active={activeWordId === k} activeWordId={activeWordId} onTap={tap} registerRef={registerRef}
                    className="flex-1 text-sm font-display font-semibold cursor-pointer" />
            ))}
          </div>
        )}

        {/* Learn overlay — step 1 case rectangles */}
        {learnOverlay && overlayRects.cases.map(({ caseKey, rect }) => {
          const isWrong = wrongOverlayKey === caseKey;
          const bgCls = caseKey === "nom" ? "bg-poster-yellow" : caseKey === "akk" ? "bg-poster-green" : "bg-poster-purple";
          const borderCls = caseKey === "nom" ? "border-poster-yellow" : caseKey === "akk" ? "border-poster-green" : "border-poster-purple";
          const label = caseKey === "nom" ? "Nominativ" : caseKey === "akk" ? "Akkusativ" : "Dativ";
          const angle = -Math.atan2(rect.height, rect.width) * (180 / Math.PI);
          return (
            <div
              key={caseKey}
              className={cn("absolute border-2 rounded-sm cursor-pointer flex items-center justify-center overflow-hidden opacity-0 transition-opacity duration-150", !learnOverlay.transparent && "hover:opacity-100", bgCls, borderCls, isWrong && "overlay-wrong-flash")}
              style={{ left: rect.left, top: rect.top, width: rect.width, height: rect.height, zIndex: 25 }}
              onMouseEnter={() => setOverlayCaseHover(caseKey)}
              onMouseLeave={() => setOverlayCaseHover(null)}
              onClick={(e) => { e.stopPropagation(); const r = learnOverlay.onCaseTap(caseKey); if (r === "wrong") flashWrongOverlay(caseKey); }}
            >
              <span className="font-display font-black text-white uppercase tracking-widest select-none pointer-events-none"
                    style={{ fontSize: "clamp(1.5rem, 4vw, 3rem)", transform: `rotate(${angle}deg)`, textShadow: "0 2px 12px rgba(0,0,0,0.4)", whiteSpace: "nowrap" }}>
                {label}
              </span>
            </div>
          );
        })}

        {/* Learn overlay — step 2 group rectangles (pronouns vs articles) */}
        {learnOverlay && learnOverlay.step === 2 && overlayRects.groups.map(({ groupType, rect }) => {
          const isWrong = wrongOverlayKey === groupType;
          const c = learnOverlay.case;
          const bgCls = c === "nom" ? "bg-poster-yellow" : c === "akk" ? "bg-poster-green" : "bg-poster-purple";
          const borderCls = c === "nom" ? "border-poster-yellow" : c === "akk" ? "border-poster-green" : "border-poster-purple";
          const label = groupType === "pronouns" ? "Pronouns" : "Articles";
          const angle = -Math.atan2(rect.height, rect.width) * (180 / Math.PI);
          return (
            <div
              key={groupType}
              className={cn("absolute border-2 rounded-sm cursor-pointer flex items-center justify-center overflow-hidden opacity-0 transition-opacity duration-150", !learnOverlay.transparent && "hover:opacity-100", bgCls, borderCls, isWrong && "overlay-wrong-flash")}
              style={{ left: rect.left, top: rect.top, width: rect.width, height: rect.height, zIndex: 25 }}
              onClick={(e) => { e.stopPropagation(); const r = learnOverlay.onGroupTap(groupType as "pronouns" | "articles"); if (r === "wrong") flashWrongOverlay(groupType); }}
            >
              <span className="font-display font-bold text-white uppercase tracking-wider select-none pointer-events-none text-center leading-tight"
                    style={{ fontSize: "clamp(0.8rem, 2vw, 1.25rem)", transform: `rotate(${angle}deg)`, textShadow: "0 2px 8px rgba(0,0,0,0.35)", whiteSpace: "pre-line" }}>
                {label}
              </span>
            </div>
          );
        })}

        {/* Learn overlay — step 3 column rectangles (def vs indef) */}
        {learnOverlay && learnOverlay.step === 3 && overlayRects.groups.map(({ groupType, rect }) => {
          const isWrong = wrongOverlayKey === groupType;
          const c = learnOverlay.case;
          const bgCls = c === "nom" ? "bg-poster-yellow" : c === "akk" ? "bg-poster-green" : "bg-poster-purple";
          const borderCls = c === "nom" ? "border-poster-yellow" : c === "akk" ? "border-poster-green" : "border-poster-purple";
          const label = groupType === "indefArticles" ? "Indefinite\nArticles" : "Definite\nArticles";
          const angle = -Math.atan2(rect.height, rect.width) * (180 / Math.PI);
          return (
            <div
              key={groupType}
              className={cn("absolute border-2 rounded-sm cursor-pointer flex items-center justify-center overflow-hidden opacity-0 transition-opacity duration-150", !learnOverlay.transparent && "hover:opacity-100", bgCls, borderCls, isWrong && "overlay-wrong-flash")}
              style={{ left: rect.left, top: rect.top, width: rect.width, height: rect.height, zIndex: 25 }}
              onClick={(e) => { e.stopPropagation(); const r = learnOverlay.onColumnTap(groupType as "defArticles" | "indefArticles"); if (r === "wrong") flashWrongOverlay(groupType); }}
            >
              <span className="font-display font-bold text-white uppercase tracking-wider select-none pointer-events-none text-center leading-tight"
                    style={{ fontSize: "clamp(0.8rem, 2vw, 1.25rem)", transform: `rotate(${angle}deg)`, textShadow: "0 2px 8px rgba(0,0,0,0.35)", whiteSpace: "pre-line" }}>
                {label}
              </span>
            </div>
          );
        })}

        {/* Gender highlight rectangles (behind pills) */}
        {highlightRects.map(({ gender, rect }) => {
          const sw = 3; // stroke width (outer)
          return (
            <div
              key={gender}
              aria-hidden
              className="absolute pointer-events-none rounded-sm"
              style={{
                left: rect.left - sw,
                top: rect.top - sw,
                width: rect.width + sw * 2,
                height: rect.height + sw * 2,
                border: `${sw}px solid ${STROKE[gender]}`,
                zIndex: 0,
              }}
            />
          );
        })}

        {/* Footer (tightened up — content above no longer needs the extra space) */}
        <div className="relative z-10 mt-16 bg-poster-teal rounded-sm py-1.5 text-center" style={{ width: `calc(100% + ${2 * caseGap}px)` }}>
          <a
            href="https://www.genau-genau.com"
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="font-script text-white text-2xl tracking-wide hover:underline"
          >
            www.genau-genau.com
          </a>
        </div>

        <div className="text-[10px] text-poster-ink/50 mt-2 text-center">
          © Wekas Gaba — recreated as an interactive study aid.
        </div>
      </div>
      </DimCtx.Provider>
      </SlimCtx.Provider>
      </QuizActiveCtx.Provider>
      </GenderCtx.Provider>
      </LoadFlourishCtx.Provider>
      </FlourishCtx.Provider>
      </PinnedPossIdCtx.Provider>
      </MorphContextIdCtx.Provider>
      </MorphCtx.Provider>
    );
  },
);
Poster.displayName = "Poster";
