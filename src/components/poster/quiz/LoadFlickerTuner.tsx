import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Copy, RotateCcw, Play, X, ChevronDown, ChevronUp } from "lucide-react";

/**
 * Dev-only tuner for the load-time pill flicker (.pill-load-flicker).
 * Visible only when URL has ?tune=1.
 */

type Settings = {
  duration: number;       // ms
  stagger: number;        // ms per pill
  useSteps: boolean;      // steps(n) vs linear
  steps: number;          // step count
  colors: string[];       // color stop keys
  stops: number[];        // keyframe percentages (ascending 0..100)
  order: Order;           // pill stagger order
};

type Order = "forward" | "reverse" | "center-out" | "edges-in" | "random" | "diagonal-tl" | "diagonal-br";
const ORDERS: Order[] = ["forward", "reverse", "center-out", "edges-in", "diagonal-tl", "diagonal-br", "random"];

const COLOR_OPTIONS: Record<string, { label: string; css: string }> = {
  grey:   { label: "grey",   css: "hsl(0 0% 72%)" },
  dark:   { label: "dark",   css: "hsl(0 0% 30%)" },
  white:  { label: "white",  css: "hsl(0 0% 100%)" },
  green:  { label: "green",  css: "hsl(var(--poster-green))" },
  yellow: { label: "yellow", css: "hsl(var(--poster-yellow))" },
  purple: { label: "purple", css: "hsl(var(--poster-purple))" },
  red:    { label: "red",    css: "hsl(var(--poster-red))" },
  teal:   { label: "teal",   css: "hsl(var(--poster-teal))" },
  ink:    { label: "ink",    css: "hsl(var(--poster-ink))" },
  masc:   { label: "masc",   css: "hsl(var(--gender-masc))" },
  fem:    { label: "fem",    css: "hsl(var(--gender-fem))" },
  neut:   { label: "neut",   css: "hsl(var(--gender-neut))" },
  plural: { label: "plural", css: "hsl(var(--gender-plural))" },
};
const COLOR_KEYS = Object.keys(COLOR_OPTIONS);

const DEFAULTS: Settings = {
  duration: 950,
  stagger: 22,
  useSteps: true,
  steps: 6,
  colors: ["grey", "green", "yellow", "purple", "red", "teal", "grey"],
  stops:  [0, 17, 34, 51, 68, 85, 100],
  order:  "forward",
};

const STYLE_ID = "pill-load-flicker-tuner-style";

function buildCss(s: Settings): string {
  const kf = s.colors
    .map((c, i) => `  ${s.stops[i]}% { background-color: ${COLOR_OPTIONS[c]?.css ?? "hsl(0 0% 72%)"}; }`)
    .join("\n");
  const timing = s.useSteps ? `steps(${s.steps}, end)` : "linear";
  return `
@keyframes pill-load-flicker {
${kf}
}
.pill-load-flicker {
  animation: pill-load-flicker ${s.duration}ms ${timing} 1 backwards;
  animation-delay: calc(var(--li, 0) * ${s.stagger}ms);
}
`;
}

function applyAll(s: Settings) {
  let el = document.getElementById(STYLE_ID) as HTMLStyleElement | null;
  if (!el) {
    el = document.createElement("style");
    el.id = STYLE_ID;
    document.head.appendChild(el);
  }
  el.textContent = buildCss(s);
}

function computeLi(order: Order, total: number): number[] {
  const idx = Array.from({ length: total }, (_, i) => i);
  if (order === "forward") return idx;
  if (order === "reverse") return idx.map((i) => total - 1 - i);
  if (order === "random") {
    const a = [...idx];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }
  // Spatial orders rely on actual element positions.
  const pills = Array.from(document.querySelectorAll<HTMLElement>("[data-cell-id]"));
  const rects = pills.map((el) => el.getBoundingClientRect());
  if (rects.length === 0) return idx;
  const cx = rects.reduce((s, r) => s + (r.left + r.width / 2), 0) / rects.length;
  const cy = rects.reduce((s, r) => s + (r.top + r.height / 2), 0) / rects.length;
  const minX = Math.min(...rects.map((r) => r.left));
  const minY = Math.min(...rects.map((r) => r.top));
  const maxX = Math.max(...rects.map((r) => r.right));
  const maxY = Math.max(...rects.map((r) => r.bottom));
  const score = (i: number): number => {
    const r = rects[i];
    const px = r.left + r.width / 2;
    const py = r.top + r.height / 2;
    if (order === "center-out")  return Math.hypot(px - cx, py - cy);
    if (order === "edges-in")    return -Math.hypot(px - cx, py - cy);
    if (order === "diagonal-tl") return (px - minX) + (py - minY);
    if (order === "diagonal-br") return (maxX - px) + (maxY - py);
    return i;
  };
  // Sort indices by score, then assign rank as the --li value.
  const order2 = [...idx].sort((a, b) => score(a) - score(b));
  const out = new Array<number>(total);
  order2.forEach((origIdx, rank) => { out[origIdx] = rank; });
  return out;
}

function replayPills(order: Order = "forward") {
  const pills = document.querySelectorAll<HTMLElement>("[data-cell-id]");
  const li = computeLi(order, pills.length);
  pills.forEach((el, i) => {
    el.style.setProperty("--li", String(li[i] ?? i));
    el.classList.remove("pill-load-flicker");
    void el.offsetWidth;
    el.classList.add("pill-load-flicker");
  });
}

export const LoadFlickerTuner = () => {
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

  const setColorAt = (i: number) => (e: React.ChangeEvent<HTMLSelectElement>) =>
    setS((p) => {
      const colors = [...p.colors];
      colors[i] = e.target.value;
      return { ...p, colors };
    });

  const setStopAt = (i: number) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setS((p) => {
      const stops = [...p.stops];
      stops[i] = Number(e.target.value);
      return { ...p, stops };
    });

  const addSlot = () =>
    setS((p) => {
      if (p.colors.length >= 10) return p;
      const colors = [...p.colors];
      const stops = [...p.stops];
      const lastStop = stops[stops.length - 1];
      const prevStop = stops[stops.length - 2] ?? 0;
      const mid = Math.round((prevStop + lastStop) / 2);
      colors.splice(colors.length - 1, 0, "grey");
      stops.splice(stops.length - 1, 0, mid);
      return { ...p, colors, stops };
    });

  const removeSlot = (i: number) =>
    setS((p) => {
      if (p.colors.length <= 2) return p;
      const colors = p.colors.filter((_, idx) => idx !== i);
      const stops = p.stops.filter((_, idx) => idx !== i);
      return { ...p, colors, stops };
    });

  const copy = async () => {
    const payload =
`Load flicker settings:
  duration:   ${s.duration}ms
  stagger:    ${s.stagger}ms
  timing:     ${s.useSteps ? `steps(${s.steps}, end)` : "linear"}
  stops:      ${s.colors.map((c, i) => `${s.stops[i]}%→${c}`).join(", ")}`;
    try { await navigator.clipboard.writeText(payload); setCopied(true); } catch { /* noop */ }
    if (copiedTimer.current) window.clearTimeout(copiedTimer.current);
    copiedTimer.current = window.setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div
      data-no-reset
      onClick={(e) => e.stopPropagation()}
      className="fixed z-50 bottom-3 right-3 w-[340px] rounded-xl bg-white shadow-2xl border border-poster-ink/15 p-3 select-none"
    >
      <div className="flex items-center justify-between mb-2">
        <div className="text-[10px] uppercase tracking-wide font-display font-bold text-poster-ink/60">Load flicker tuner</div>
        <div className="flex items-center gap-1">
          <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => { setS(DEFAULTS); setTimeout(() => replayPills(DEFAULTS.order), 30); }} aria-label="Reset">
            <RotateCcw className="h-3.5 w-3.5" />
          </Button>
          <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => replayPills(s.order)} aria-label="Replay">
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
          <label className="flex items-center gap-2 text-[11px]">
            <span className="w-20 text-poster-ink/70">duration</span>
            <input type="range" min={100} max={3000} step={10} value={s.duration} onChange={setNum("duration")} className="flex-1" />
            <span className="w-14 text-right tabular-nums font-mono text-poster-ink">{s.duration}ms</span>
          </label>
          <label className="flex items-center gap-2 text-[11px]">
            <span className="w-20 text-poster-ink/70">stagger</span>
            <input type="range" min={0} max={100} step={1} value={s.stagger} onChange={setNum("stagger")} className="flex-1" />
            <span className="w-14 text-right tabular-nums font-mono text-poster-ink">{s.stagger}ms</span>
          </label>
          <label className="flex items-center gap-2 text-[11px]">
            <input type="checkbox" checked={s.useSteps} onChange={(e) => setS((p) => ({ ...p, useSteps: e.target.checked }))} />
            <span className="text-poster-ink/70">steps()</span>
            <input
              type="number"
              min={2}
              max={20}
              value={s.steps}
              disabled={!s.useSteps}
              onChange={setNum("steps")}
              className="w-14 ml-auto border border-poster-ink/20 rounded px-1 py-0.5 text-[11px] text-poster-ink disabled:opacity-40"
            />
          </label>
          <label className="flex items-center gap-2 text-[11px]">
            <span className="w-20 text-poster-ink/70">order</span>
            <select
              value={s.order}
              onChange={(e) => { const order = e.target.value as Order; setS((p) => ({ ...p, order })); setTimeout(() => replayPills(order), 30); }}
              className="flex-1 border border-poster-ink/20 rounded px-1 py-0.5 text-[11px] bg-white"
            >
              {ORDERS.map((o) => <option key={o} value={o}>{o}</option>)}
            </select>
          </label>

          <div className="text-[9px] uppercase tracking-wide font-display font-bold text-poster-ink/40 mt-2 flex items-center justify-between">
            <span>Color stops</span>
            <button onClick={addSlot} className="text-poster-teal font-bold text-[10px] hover:underline">+ add</button>
          </div>
          {s.colors.map((c, i) => (
            <div key={i} className="flex items-center gap-1.5 text-[11px]">
              <span
                className="inline-block w-4 h-4 rounded-sm border border-poster-ink/20 shrink-0"
                style={{ backgroundColor: COLOR_OPTIONS[c]?.css }}
              />
              <select
                value={c}
                onChange={setColorAt(i)}
                className="border border-poster-ink/20 rounded px-1 py-0.5 text-[11px] bg-white"
              >
                {COLOR_KEYS.map((k) => <option key={k} value={k}>{COLOR_OPTIONS[k].label}</option>)}
              </select>
              <input
                type="number"
                min={0}
                max={100}
                value={s.stops[i]}
                onChange={setStopAt(i)}
                className="w-14 border border-poster-ink/20 rounded px-1 py-0.5 text-[11px] text-poster-ink"
              />
              <span className="text-poster-ink/40">%</span>
              <button
                onClick={() => removeSlot(i)}
                disabled={s.colors.length <= 2}
                className="ml-auto text-poster-ink/40 hover:text-poster-red disabled:opacity-20"
                aria-label="Remove"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      <Button size="sm" className="mt-2 w-full h-7 text-[11px]" onClick={copy}>
        <Copy className="h-3 w-3 mr-1" />
        {copied ? "Copied — paste in chat" : "Copy settings"}
      </Button>
    </div>
  );
};
