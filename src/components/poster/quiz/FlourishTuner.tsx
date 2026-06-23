import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Copy, RotateCcw, Play, X, ChevronDown, ChevronUp } from "lucide-react";

/**
 * Dev-only tuner for the quiz letter-trickle flourish.
 * Visible only when URL has ?tune=1.
 * Tweak → Replay → Copy settings → paste in chat to bake.
 */

type Settings = {
  // Timing
  duration: number;          // s
  stagger: number;           // ms per letter
  initialDelay: number;      // ms before wave starts
  iterations: number;        // 1 = play once; 0 = infinite
  direction: string;         // normal | reverse | alternate | alternate-reverse
  ease: string;
  // Peak transforms
  lift: number;              // px upward at peak
  sway: number;              // px horizontal at peak
  scale: number;             // scale at peak (1 = no scale)
  rotate: number;            // deg at peak
  letterSpacing: number;     // px at peak
  opacityPeak: number;       // 0..1 at peak
  // Keyframe shape
  peakAt: number;            // % keyframe of peak
  returnAt: number;          // % keyframe where letter is back home
  // Color
  colorFlash: boolean;       // turn color flash on/off
};

const DEFAULTS: Settings = {
  duration: 3,
  stagger: 13,
  initialDelay: 820,
  iterations: 5,
  direction: "normal",
  ease: "ease-in-out",
  lift: 0,
  sway: 0,
  scale: 1,
  rotate: 0,
  letterSpacing: 0,
  opacityPeak: 0,
  peakAt: 21,
  returnAt: 39,
  colorFlash: true,
};

const EASES = [
  "ease-out",
  "ease-in",
  "ease-in-out",
  "linear",
  "cubic-bezier(.2,.8,.2,1)",
  "cubic-bezier(.34,1.56,.64,1)",
  "cubic-bezier(.68,-0.55,.27,1.55)",
];

const DIRECTIONS = ["normal", "reverse", "alternate", "alternate-reverse"];

const STYLE_ID = "quiz-trickle-tuner-style";

function buildKeyframes(s: Settings): string {
  const restTransform = `translateY(0) translateX(0) scale(1) rotate(0deg)`;
  const peakTransform = `translateY(${-s.lift}px) translateX(${s.sway}px) scale(${s.scale}) rotate(${s.rotate}deg)`;
  const peakColor = s.colorFlash ? `hsl(var(--poster-ink))` : `inherit`;
  return `
    @keyframes quiz-trickle {
      0%, ${s.returnAt}%, 100% {
        color: inherit;
        transform: ${restTransform};
        opacity: 1;
        letter-spacing: 0;
      }
      ${s.peakAt}% {
        color: ${peakColor};
        transform: ${peakTransform};
        opacity: ${s.opacityPeak};
        letter-spacing: ${s.letterSpacing}px;
      }
    }
  `;
}

function applyAll(s: Settings) {
  const r = document.documentElement.style;
  r.setProperty("--quiz-trickle-duration", `${s.duration}s`);
  r.setProperty("--quiz-trickle-stagger", String(s.stagger));
  r.setProperty("--quiz-trickle-initial-delay", String(s.initialDelay));
  r.setProperty("--quiz-trickle-lift", `${s.lift}px`);
  r.setProperty("--quiz-trickle-ease", s.ease);
  r.setProperty("--quiz-trickle-iterations", s.iterations === 0 ? "infinite" : String(s.iterations));
  r.setProperty("--quiz-trickle-direction", s.direction);
  let el = document.getElementById(STYLE_ID) as HTMLStyleElement | null;
  if (!el) {
    el = document.createElement("style");
    el.id = STYLE_ID;
    document.head.appendChild(el);
  }
  el.textContent = buildKeyframes(s);
}

function replayLetters() {
  document.querySelectorAll<HTMLElement>(".quiz-trickle-letter").forEach((el) => {
    el.style.animationName = "none";
    void el.offsetWidth;
    el.style.animationName = "";
  });
}

export const FlourishTuner = () => {
  const enabled = typeof window !== "undefined" && new URLSearchParams(window.location.search).has("tune");
  const [s, setS] = useState<Settings>(DEFAULTS);
  const [visible, setVisible] = useState(true);
  const [collapsed, setCollapsed] = useState(false);
  const [copied, setCopied] = useState(false);
  const copiedTimer = useRef<number | null>(null);

  useEffect(() => { if (enabled) applyAll(s); }, [s, enabled]);

  if (!enabled || !visible) return null;

  const setNum = (k: keyof Settings) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setS((p) => ({ ...p, [k]: Number(e.target.value) }));
  const setStr = (k: keyof Settings) => (e: React.ChangeEvent<HTMLSelectElement>) =>
    setS((p) => ({ ...p, [k]: e.target.value }));
  const setBool = (k: keyof Settings) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setS((p) => ({ ...p, [k]: e.target.checked }));

  const copy = async () => {
    const payload =
`Flourish settings:
  duration:        ${s.duration}s
  stagger:         ${s.stagger}ms
  initial-delay:   ${s.initialDelay}ms
  iterations:      ${s.iterations === 0 ? "infinite" : s.iterations}
  direction:       ${s.direction}
  ease:            ${s.ease}
  lift:            ${s.lift}px
  sway:            ${s.sway}px
  scale:           ${s.scale}
  rotate:          ${s.rotate}deg
  letter-spacing:  ${s.letterSpacing}px
  opacity@peak:    ${s.opacityPeak}
  peak@:           ${s.peakAt}%
  return@:         ${s.returnAt}%
  color-flash:     ${s.colorFlash ? "on" : "off"}`;
    try { await navigator.clipboard.writeText(payload); setCopied(true); } catch { /* noop */ }
    if (copiedTimer.current) window.clearTimeout(copiedTimer.current);
    copiedTimer.current = window.setTimeout(() => setCopied(false), 1500);
  };

  const Row = ({ label, k, min, max, step, suffix }: { label: string; k: keyof Settings; min: number; max: number; step: number; suffix?: string }) => (
    <label className="flex items-center gap-2 text-[11px]">
      <span className="w-24 text-poster-ink/70">{label}</span>
      <input type="range" min={min} max={max} step={step} value={s[k] as number} onChange={setNum(k)} className="flex-1" />
      <span className="w-14 text-right tabular-nums font-mono text-poster-ink">{s[k] as number}{suffix ?? ""}</span>
    </label>
  );

  return (
    <div
      data-no-reset
      onClick={(e) => e.stopPropagation()}
      className="fixed z-50 bottom-3 left-3 w-[320px] rounded-xl bg-white shadow-2xl border border-poster-ink/15 p-3 select-none"
    >
      <div className="flex items-center justify-between mb-2">
        <div className="text-[10px] uppercase tracking-wide font-display font-bold text-poster-ink/60">Flourish tuner</div>
        <div className="flex items-center gap-1">
          <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => setS(DEFAULTS)} aria-label="Reset">
            <RotateCcw className="h-3.5 w-3.5" />
          </Button>
          <Button size="icon" variant="ghost" className="h-6 w-6" onClick={replayLetters} aria-label="Replay">
            <Play className="h-3.5 w-3.5" />
          </Button>
          <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => setCollapsed((c) => !c)} aria-label="Toggle">
            {collapsed ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
          </Button>
          <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => setVisible(false)} aria-label="Hide">
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {!collapsed && (
        <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-1">
          <div className="text-[9px] uppercase tracking-wide font-display font-bold text-poster-ink/40 mt-1">Timing</div>
          <Row label="duration"      k="duration"     min={0.05} max={3}    step={0.05} suffix="s" />
          <Row label="stagger"       k="stagger"      min={0}    max={80}   step={1}    suffix="ms" />
          <Row label="initial delay" k="initialDelay" min={0}    max={1000} step={10}   suffix="ms" />
          <Row label="iterations"    k="iterations"   min={0}    max={5}    step={1} />
          <label className="flex items-center gap-2 text-[11px]">
            <span className="w-24 text-poster-ink/70">direction</span>
            <select value={s.direction} onChange={setStr("direction")} className="flex-1 border border-poster-ink/20 rounded px-1 py-0.5 text-[11px] bg-white">
              {DIRECTIONS.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
          </label>
          <label className="flex items-center gap-2 text-[11px]">
            <span className="w-24 text-poster-ink/70">ease</span>
            <select value={s.ease} onChange={setStr("ease")} className="flex-1 border border-poster-ink/20 rounded px-1 py-0.5 text-[11px] bg-white">
              {EASES.map((e) => <option key={e} value={e}>{e}</option>)}
            </select>
          </label>

          <div className="text-[9px] uppercase tracking-wide font-display font-bold text-poster-ink/40 mt-2">Peak transforms</div>
          <Row label="lift"          k="lift"          min={0}  max={20}  step={1}    suffix="px" />
          <Row label="sway"          k="sway"          min={-20} max={20} step={1}    suffix="px" />
          <Row label="scale"         k="scale"         min={0.5} max={1.8} step={0.05} />
          <Row label="rotate"        k="rotate"        min={-45} max={45} step={1}    suffix="°" />
          <Row label="letter-space"  k="letterSpacing" min={-4} max={8}   step={0.5}  suffix="px" />
          <Row label="opacity@peak"  k="opacityPeak"   min={0}  max={1}   step={0.05} />

          <div className="text-[9px] uppercase tracking-wide font-display font-bold text-poster-ink/40 mt-2">Keyframe shape</div>
          <Row label="peak @"        k="peakAt"        min={1}  max={50}  step={1}    suffix="%" />
          <Row label="return @"      k="returnAt"      min={5}  max={95}  step={1}    suffix="%" />

          <div className="text-[9px] uppercase tracking-wide font-display font-bold text-poster-ink/40 mt-2">Color</div>
          <label className="flex items-center gap-2 text-[11px]">
            <input type="checkbox" checked={s.colorFlash} onChange={setBool("colorFlash")} />
            <span className="text-poster-ink/70">color flash at peak (poster-ink)</span>
          </label>
        </div>
      )}

      <Button size="sm" className="mt-2 w-full h-7 text-[11px]" onClick={copy}>
        <Copy className="h-3 w-3 mr-1" />
        {copied ? "Copied — paste in chat" : "Copy settings"}
      </Button>
    </div>
  );
};
