import { useEffect, useLayoutEffect, useRef, useState } from "react";

export type TourStep = {
  id: string;
  label: string;
  title: string;
  body: string;
  /** Spotlight target ids. First one drives popup placement. */
  targetIds?: string[];
  /** Semantic side-effect id handled by Index (e.g. simulate morph). */
  onEnterId?: "activate-nom-ein" | "activate-dat-einem";
};

export const TOUR_STEPS: TourStep[] = [
  { id: "welcome",     label: "1 / 11",          title: "30-second tour",
    body: "A quick walk through the cheatsheet." },

  { id: "nom-case",    label: "2 / 11 · Nom",    title: "Nominativ",
    body: "The subject of the sentence — yellow. The one doing the action.",
    targetIds: ["zone-nom"] },

  { id: "akk-case",    label: "3 / 11 · Akk",    title: "Akkusativ",
    body: "The direct object — green. What is being acted upon. A handful of prepositions also force Akkusativ on whatever noun comes next.",
    targetIds: ["zone-akk"] },

  { id: "dat-case",    label: "4 / 11 · Dat",    title: "Dativ",
    body: "The indirect object — purple. Often the recipient of an action. Dativ also appears after a fixed group of prepositions, and it changes both the article and, on plural nouns, the noun's ending — watch for the trailing -n.",
    targetIds: ["zone-dat"] },

  { id: "levels-intro", label: "5 / 11",         title: "Tap to explore — four levels",
    body: "Tap a case to focus on it. Tap again to step deeper.",
    targetIds: ["zone-nom"] },

  { id: "levels-block", label: "6 / 11",         title: "Article block",
    body: "Each case has a block of articles — definite (the) and indefinite (a / an).",
    targetIds: ["g-nom-art"] },

  { id: "levels-row",   label: "7 / 11",         title: "Article row",
    body: "Inside the block, definite and indefinite each get their own row.",
    targetIds: ["nom-art-row-def"] },

  { id: "levels-pill",  label: "8 / 11",         title: "A specific article",
    body: "And finally, a single article — der, the masculine definite article in Nominativ.",
    targetIds: ["nom-der"] },

  { id: "morph",        label: "9 / 11",         title: "Morphing",
    body: "Tap an indefinite article and the possessives row morphs to match — meinem, deinem, seinem… all take the same Dativ ending.",
    targetIds: ["dat-einem", "g-pos"],
    onEnterId: "activate-dat-einem" },

  { id: "gender",       label: "10 / 11",        title: "Need help with gendered words?",
    body: "Open the menu (☰) to activate gender colors." },

  { id: "done",         label: "11 / 11",        title: "Quiz mode is default",
    body: "Tap Explore in the header to roam free anytime." },
];

type Props = {
  step: number;
  onBack: () => void;
  onNext: () => void;
  onSkip: () => void;
  /** Returns the union viewport rect of the step's target spotlight(s). */
  getTargetViewportRect: () => DOMRect | null;
};

const POPUP_W = 360;
const POPUP_H_EST = 200;
const MARGIN = 12;

function isDesktop() {
  return typeof window !== "undefined" && window.matchMedia("(min-width: 640px)").matches;
}

/** Place popup in the largest free quadrant around the target rect. */
function autoPlace(target: DOMRect | null): { left: number; top: number } {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  if (!target) {
    return { left: Math.max(MARGIN, (vw - POPUP_W) / 2), top: Math.max(MARGIN, (vh - POPUP_H_EST) / 2) };
  }
  // Candidate slots: right, left, below, above.
  const candidates = [
    { left: target.right + MARGIN, top: Math.min(Math.max(MARGIN, target.top), vh - POPUP_H_EST - MARGIN), score: vw - target.right - POPUP_W - MARGIN },
    { left: target.left - POPUP_W - MARGIN, top: Math.min(Math.max(MARGIN, target.top), vh - POPUP_H_EST - MARGIN), score: target.left - POPUP_W - MARGIN },
    { left: Math.min(Math.max(MARGIN, target.left), vw - POPUP_W - MARGIN), top: target.bottom + MARGIN, score: vh - target.bottom - POPUP_H_EST - MARGIN },
    { left: Math.min(Math.max(MARGIN, target.left), vw - POPUP_W - MARGIN), top: target.top - POPUP_H_EST - MARGIN, score: target.top - POPUP_H_EST - MARGIN },
  ];
  const ok = candidates.filter((c) => c.score >= 0);
  const chosen = (ok.length ? ok : candidates).sort((a, b) => b.score - a.score)[0];
  return {
    left: Math.min(Math.max(MARGIN, chosen.left), vw - POPUP_W - MARGIN),
    top: Math.min(Math.max(MARGIN, chosen.top), vh - POPUP_H_EST - MARGIN),
  };
}

export const IntroTour = ({ step, onBack, onNext, onSkip, getTargetViewportRect }: Props) => {
  const s = TOUR_STEPS[step];
  const [mounted, setMounted] = useState(false);
  const [pos, setPos] = useState<{ left: number; top: number } | null>(null);
  const [desktop, setDesktop] = useState<boolean>(typeof window !== "undefined" ? isDesktop() : true);
  const draggedRef = useRef(false);
  const dragState = useRef<{ active: boolean; offX: number; offY: number }>({ active: false, offX: 0, offY: 0 });

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    const onResize = () => setDesktop(isDesktop());
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // Re-place when step changes (resets drag).
  useLayoutEffect(() => {
    draggedRef.current = false;
    if (!desktop) { setPos(null); return; }
    const place = () => {
      const r = getTargetViewportRect();
      setPos(autoPlace(r));
    };
    place();
    const t = setTimeout(place, 80);
    return () => clearTimeout(t);
  }, [step, desktop, getTargetViewportRect]);

  useEffect(() => {
    if (!desktop) return;
    const onResize = () => {
      if (draggedRef.current) return;
      const r = getTargetViewportRect();
      setPos(autoPlace(r));
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [desktop, step, getTargetViewportRect]);

  const onDragPointerDown = (e: React.PointerEvent) => {
    if (!desktop || !pos) return;
    dragState.current.active = true;
    dragState.current.offX = e.clientX - pos.left;
    dragState.current.offY = e.clientY - pos.top;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };
  const onDragPointerMove = (e: React.PointerEvent) => {
    if (!dragState.current.active) return;
    draggedRef.current = true;
    const left = Math.min(Math.max(MARGIN, e.clientX - dragState.current.offX), window.innerWidth - POPUP_W - MARGIN);
    const top = Math.min(Math.max(MARGIN, e.clientY - dragState.current.offY), window.innerHeight - 80);
    setPos({ left, top });
  };
  const onDragPointerUp = (e: React.PointerEvent) => {
    dragState.current.active = false;
    try { (e.target as HTMLElement).releasePointerCapture(e.pointerId); } catch { /* noop */ }
  };

  if (!s) return null;

  const desktopStyle: React.CSSProperties | undefined = desktop && pos
    ? { position: "fixed", left: pos.left, top: pos.top, width: POPUP_W, transition: dragState.current.active ? "none" : "left 280ms ease, top 280ms ease" }
    : undefined;

  const card = (
    <div
      data-no-reset
      onClick={(e) => e.stopPropagation()}
      style={desktopStyle}
      className={
        desktop
          ? `pointer-events-auto bg-white rounded-xl shadow-2xl border border-poster-ink/15 select-none ${mounted ? "opacity-100" : "opacity-0"}`
          : `pointer-events-auto bg-white rounded-xl shadow-2xl border border-poster-ink/15 p-5 w-[min(92vw,420px)] transition-all duration-300 ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"}`
      }
    >
      {desktop ? (
        <>
          <div
            onPointerDown={onDragPointerDown}
            onPointerMove={onDragPointerMove}
            onPointerUp={onDragPointerUp}
            onPointerCancel={onDragPointerUp}
            className="cursor-move px-4 pt-3 pb-1 border-b border-poster-ink/10 flex items-center justify-between touch-none"
            title="Drag to move"
          >
            <div className="text-[10px] uppercase tracking-wide font-display font-bold text-poster-ink/60">{s.label}</div>
            <div className="text-[10px] text-poster-ink/40">⋮⋮</div>
          </div>
          <div className="p-4">
            <div className="font-display text-lg font-bold text-poster-ink mb-1">{s.title}</div>
            <p className="text-sm text-poster-ink/75 mb-3">{s.body}</p>
            <div className="flex items-center justify-between">
              <button onClick={onSkip} className="text-xs text-poster-ink/60 hover:text-poster-ink">Skip</button>
              <div className="flex gap-2">
                <button onClick={onBack} disabled={step === 0} className="h-8 px-3 text-xs font-display font-semibold text-poster-ink/70 hover:text-poster-ink disabled:opacity-30">Back</button>
                <button onClick={onNext} className="h-8 px-3 rounded-md bg-poster-ink text-white text-xs font-display font-semibold hover:bg-poster-ink/90">{step === TOUR_STEPS.length - 1 ? "Done" : "Next"}</button>
              </div>
            </div>
          </div>
        </>
      ) : (
        <>
          <div className="text-[10px] uppercase tracking-wide font-display font-bold text-poster-ink/60 mb-1">{s.label}</div>
          <div className="font-display text-lg font-bold text-poster-ink mb-1">{s.title}</div>
          <p className="text-sm text-poster-ink/75 mb-3">{s.body}</p>
          <div className="flex items-center justify-between">
            <button onClick={onSkip} className="text-xs text-poster-ink/60 hover:text-poster-ink">Skip</button>
            <div className="flex gap-2">
              <button onClick={onBack} disabled={step === 0} className="h-8 px-3 text-xs font-display font-semibold text-poster-ink/70 hover:text-poster-ink disabled:opacity-30">Back</button>
              <button onClick={onNext} className="h-8 px-3 rounded-md bg-poster-ink text-white text-xs font-display font-semibold hover:bg-poster-ink/90">{step === TOUR_STEPS.length - 1 ? "Done" : "Next"}</button>
            </div>
          </div>
        </>
      )}
    </div>
  );

  if (desktop) {
    return <div className="fixed inset-0 z-50 pointer-events-none">{card}</div>;
  }
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center pointer-events-none p-3">
      {card}
    </div>
  );
};
