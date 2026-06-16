import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { CASE_INFO, type CaseKey } from "./wordData";
import { cn } from "@/lib/utils";

export type IconRect = { x: number; y: number; width: number; height: number };

type Props = {
  caseKey: CaseKey;
  iconSrc: string;
  iconRect: IconRect;
  onClose: () => void;
};

const COLORS: Record<CaseKey, { bg: string; text: string; lightBg: string; border: string }> = {
  akk: { bg: "bg-poster-green",  text: "text-poster-green",  lightBg: "bg-poster-green/10",  border: "border-poster-green"  },
  nom: { bg: "bg-poster-yellow", text: "text-poster-yellow", lightBg: "bg-poster-yellow/10", border: "border-poster-yellow" },
  dat: { bg: "bg-poster-purple", text: "text-poster-purple", lightBg: "bg-poster-purple/10", border: "border-poster-purple" },
};

const EXTRA: Record<CaseKey, { preps: string; iconHint: string }> = {
  akk: {
    preps: "für · gegen · um · bis · ohne · durch",
    iconHint: "The bicycle moves toward something — wohin? It marks direction and the direct target of an action.",
  },
  nom: {
    preps: "sein takes Nominativ on both sides",
    iconHint: "The chef IS the one doing the action. With sein (to be), both the subject and the predicate are Nominativ.",
  },
  dat: {
    preps: "zu · von · mit · bei · nach · seit · ab · aus · gegenüber · außer",
    iconHint: "The envelope is addressed TO someone. Dativ also appears in expressions of place (wo?) and time (wann?).",
  },
};

export const CaseHeaderPopup = ({ caseKey, iconSrc, iconRect, onClose }: Props) => {
  // 0 = mounted at icon position (0ms), 1 = flying to center (16ms), 2 = content visible (400ms)
  const [phase, setPhase] = useState<0 | 1 | 2>(0);

  useEffect(() => {
    // Two rAFs ensure the initial transform is painted before we start transitioning
    const raf = requestAnimationFrame(() =>
      requestAnimationFrame(() => {
        setPhase(1);
        const t = setTimeout(() => setPhase(2), 380);
        return () => clearTimeout(t);
      })
    );
    return () => cancelAnimationFrame(raf);
  }, []);

  const info = CASE_INFO[caseKey];
  const c = COLORS[caseKey];
  const extra = EXTRA[caseKey];

  // FLIP: compute offset from viewport center to icon center
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const dx = iconRect.x + iconRect.width / 2 - vw / 2;
  const dy = iconRect.y + iconRect.height / 2 - vh / 2;

  const cardTransform = phase === 0
    ? `translate(${dx}px, ${dy}px) scale(0.2)`
    : "translate(0,0) scale(1)";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={onClose}>

      {/* Dimmed backdrop */}
      <div
        className="absolute inset-0 bg-black/50 transition-opacity duration-300"
        style={{ opacity: phase >= 1 ? 1 : 0 }}
      />

      {/* Card */}
      <div
        className="relative w-[min(88vw,320px)] rounded-2xl bg-white shadow-2xl overflow-hidden"
        style={{
          transform: cardTransform,
          transition: phase === 0 ? "none" : "transform 400ms cubic-bezier(0.22,1,0.36,1), opacity 300ms ease",
          opacity: phase === 0 ? 0 : 1,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Icon header */}
        <div className={cn("flex flex-col items-center pt-8 pb-6 bg-white border-b-4", c.border)}>
          <img src={iconSrc} className="h-24 object-contain" draggable={false} />
        </div>

        {/* Case name + questions — always visible once card arrives */}
        <div className="flex items-start justify-between gap-2 px-5 pt-4 pb-3 border-b border-poster-ink/10">
          <div>
            <div className="font-display font-bold text-xl text-poster-ink leading-tight">{info.name}</div>
            <div className={cn("text-sm font-bold tracking-widest mt-0.5 uppercase", c.text)}>
              {info.questions}
            </div>
            <div className="text-xs text-poster-ink/45 mt-0.5">{info.english}</div>
          </div>
          <button
            onClick={onClose}
            className="shrink-0 mt-0.5 text-poster-ink/35 hover:text-poster-ink transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body — fades + expands in after card lands */}
        <div
          style={{
            maxHeight: phase >= 2 ? 400 : 0,
            opacity: phase >= 2 ? 1 : 0,
            overflow: "hidden",
            transition: "max-height 350ms cubic-bezier(0.22,1,0.36,1), opacity 300ms ease 80ms",
          }}
        >
          <div className="px-5 py-4 space-y-3">
            {/* Role badge */}
            <div className="flex items-center gap-2">
              <span className={cn("text-[11px] font-bold uppercase tracking-widest px-2.5 py-0.5 rounded-full text-white", c.bg)}>
                {info.role}
              </span>
            </div>

            {/* Rule */}
            <p className="text-sm text-poster-ink/80 leading-snug">{info.rule}</p>

            {/* Prep list */}
            <div className="rounded-lg px-3 py-2 bg-poster-bg">
              <div className="text-[11px] text-poster-ink/50 uppercase tracking-widest mb-1">Prepositions</div>
              <div className="text-xs font-mono text-poster-ink/70 leading-relaxed">{extra.preps}</div>
            </div>

            {/* Icon hint */}
            <p className="text-xs text-poster-ink/50 italic leading-snug">{extra.iconHint}</p>
          </div>
        </div>
      </div>
    </div>
  );
};
