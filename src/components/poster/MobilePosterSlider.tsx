import { useRef, useState, useEffect, useCallback, type RefObject, type KeyboardEvent } from "react";
import { Poster, POSTER_W, POSTER_H, type PosterHandle } from "./Poster";
import { CaseHeaderPopup, type IconRect } from "./CaseHeaderPopup";
import { SpotlightOverlay } from "./SpotlightOverlay";
import { cn } from "@/lib/utils";
import type { CaseKey } from "./wordData";
import type { MorphEntry } from "./morph";
import bicycle from "@/assets/poster/bicycle.svg";
import seinCloud from "@/assets/poster/chef-hat.svg";
import envelope from "@/assets/poster/envelope.svg";

const CASE_ICONS: Record<CaseKey, string> = { akk: bicycle, nom: seinCloud, dat: envelope };

type Props = {
  posterRef: RefObject<PosterHandle>;
  activeCase: CaseKey | null;
  activeWordId: string | null;
  morphContextId?: string | null;
  pinnedPossId?: string | null;
  level: number;
  cutout: { left: number; top: number; width: number; height: number } | null;
  extraCutouts: { left: number; top: number; width: number; height: number }[];
  onTapCase: (c: CaseKey) => void;
  onTapWord: (id: string) => void;
  onTapBackground: () => void;
  genderOn: boolean;
  morphMap: Map<string, MorphEntry>;
  quizBlur: boolean;
  quizActive: boolean;
  tourActive: boolean;
  tourCutouts: { left: number; top: number; width: number; height: number }[];
  onInfoLayout?: (n: number) => void;
  onInfoReady?: () => void;
  onTapVerbCloud?: () => void;
};

export const MOBILE_SLIDER_BAR_H = 72;

// 5 snap points: 0=full-left, 1=Akk, 2=Nom, 3=Dat, 4=full-right
const SNAP_COUNT = 5;
const CASE_SNAPS: Record<CaseKey, number> = { akk: 1, nom: 2, dat: 3 };
const SNAP_COLORS = [
  "bg-poster-ink/25",
  "bg-poster-green",
  "bg-poster-yellow",
  "bg-poster-purple",
  "bg-poster-ink/25",
];

const CASE_COL: Record<CaseKey, number> = { akk: 0, nom: 1, dat: 2 };

// Tunable defaults
const DEFAULTS = {
  // Wide view
  fullZoom:         1.5,
  fullMargin:       0,
  fullOffsetY:      25,
  fullOffsetX:      -8,
  // Zoomed view
  caseFill:         0.58,
  centerY:          124,
  akkOffsetX:       -77,
  akkOffsetY:       -200,
  nomOffsetX:       70,
  nomOffsetY:       -203,
  datOffsetX:       70,
  datOffsetY:       -207,
  caseGap:          102,
  fullCaseGap:      0,
  // Pills
  horizPad:         188,
  pillPadV:         32,
  // Spotlight
  spotlightOpacity: 0.85,
  spotlightPad:     4,
  // Animation
  animMs:           900,
  panelAnimMs:      300,
  snapThreshold:    5,
  // Pinch
  pinchMinScale:    0.3,
  pinchMaxScale:    5,
  // Zoomed header shift
  zoomedHeaderY:    -110,
  headerShiftMs:    400,
  // Slider rail
  sliderBarH:       72,
  thumbBlur:        4,
  // Info card
  infoLayout:       1,
};

type Tune = typeof DEFAULTS;

type ZoomState = { scale: number; tx: number; ty: number };

function computeSnapZooms(stageW: number, stageH: number, t: Tune): ZoomState[] {
  const fitScale = Math.min(
    (stageW - t.fullMargin * 2) / POSTER_W,
    (stageH - t.fullMargin * 2) / POSTER_H,
  ) * t.fullZoom;
  const fullTx = (stageW - POSTER_W * fitScale) / 2 + t.fullOffsetX;
  const fullTy = (stageH - POSTER_H * fitScale) / 2 + t.fullOffsetY;
  const fullState: ZoomState = { scale: fitScale, tx: fullTx, ty: fullTy };

  // Column geometry derived from live tune values (matches Poster.tsx math exactly)
  const colW = (POSTER_W - t.horizPad * 2) / 3;
  const colCenterX = (col: number) => t.horizPad + col * (colW + t.caseGap) + colW / 2;

  const caseOffsetX: Record<CaseKey, number> = { akk: t.akkOffsetX, nom: t.nomOffsetX, dat: t.datOffsetX };
  const caseOffsetY: Record<CaseKey, number> = { akk: t.akkOffsetY, nom: t.nomOffsetY, dat: t.datOffsetY };
  const caseStates = (["akk", "nom", "dat"] as CaseKey[]).map((c) => {
    const scale = (stageW * t.caseFill) / colW;
    const cx = colCenterX(CASE_COL[c]);
    const tx = stageW / 2 - cx * scale + caseOffsetX[c];
    const ty = stageH / 2 - t.centerY * scale + caseOffsetY[c];
    return { scale, tx, ty };
  });

  return [fullState, caseStates[0], caseStates[1], caseStates[2], fullState];
}

function lerp(a: number, b: number, t: number) { return a + (b - a) * t; }

function interpolate(snaps: ZoomState[], value: number): ZoomState {
  const lo = Math.floor(Math.max(0, Math.min(SNAP_COUNT - 2, value)));
  const hi = lo + 1;
  const t = Math.max(0, Math.min(1, value - lo));
  return {
    scale: lerp(snaps[lo].scale, snaps[hi].scale, t),
    tx:    lerp(snaps[lo].tx,    snaps[hi].tx,    t),
    ty:    lerp(snaps[lo].ty,    snaps[hi].ty,    t),
  };
}

// ── Tuner panel ──────────────────────────────────────────────────────────────

type SliderRowProps = {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  fmt?: (v: number) => string;
  onChange: (v: number) => void;
};

function SliderRow({ label, value, min, max, step, fmt, onChange }: SliderRowProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");

  const commit = (raw: string) => {
    const n = parseFloat(raw);
    if (!isNaN(n)) onChange(Math.max(min, Math.min(max, n)));
    setEditing(false);
  };

  return (
    <div className="flex items-center gap-2">
      <span className="w-28 shrink-0 text-[11px] text-poster-ink/70 font-mono">{label}</span>
      <input
        type="range"
        min={min} max={max} step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        onPointerDown={(e) => e.stopPropagation()}
        className="flex-1 h-1.5 accent-poster-teal cursor-pointer"
      />
      {editing ? (
        <input
          type="number"
          autoFocus
          value={draft}
          min={min} max={max} step={step}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={(e) => commit(e.target.value)}
          onKeyDown={(e: KeyboardEvent<HTMLInputElement>) => {
            if (e.key === "Enter") commit((e.target as HTMLInputElement).value);
            if (e.key === "Escape") setEditing(false);
          }}
          onPointerDown={(e) => e.stopPropagation()}
          className="w-16 text-right text-[11px] font-mono text-poster-ink bg-white border border-poster-ink/30 rounded px-1 shrink-0 outline-none focus:border-poster-teal"
        />
      ) : (
        <button
          type="button"
          onPointerDown={(e) => e.stopPropagation()}
          onClick={() => { setDraft(String(value)); setEditing(true); }}
          className="w-16 text-right text-[11px] font-mono text-poster-ink shrink-0 hover:underline cursor-text"
        >
          {fmt ? fmt(value) : value}
        </button>
      )}
    </div>
  );
}

function TunerPanel({ tune, onChange }: { tune: Tune; onChange: (k: keyof Tune, v: number) => void }) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "ok" | "err">("idle");
  const [bgOpacity, setBgOpacity] = useState(0.95);

  const copySettings = () => {
    const text = Object.entries(tune).map(([k, v]) => `${k}: ${v}`).join(", ");
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };

  const saveSettings = async () => {
    setSaveState("saving");
    try {
      const res = await fetch("/api/tune", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(tune),
      });
      setSaveState(res.ok ? "ok" : "err");
    } catch {
      setSaveState("err");
    }
    setTimeout(() => setSaveState("idle"), 2000);
  };

  const G = ({ label }: { label: string }) => (
    <div className="text-[9px] uppercase tracking-widest font-mono font-bold text-poster-ink/30 pt-1">{label}</div>
  );

  const S = ({ label, k, min, max, step, fmt }: { label: string; k: keyof Tune; min: number; max: number; step: number; fmt?: (v: number) => string }) => (
    <SliderRow label={label} value={tune[k] as number} min={min} max={max} step={step} fmt={fmt} onChange={(v) => onChange(k, v)} />
  );

  return (
    <div
      className="fixed left-0 right-0 z-50"
      style={{
        top: 0,
        transform: open ? "translateY(0)" : "translateY(calc(-100% + 28px))",
        transition: `transform ${tune.panelAnimMs}ms cubic-bezier(0.22,1,0.36,1)`,
      }}
      onPointerDown={(e) => e.stopPropagation()}
    >
      <div
        className="border-b border-poster-ink/15 shadow-lg"
        style={{ backgroundColor: `rgba(255,255,255,${bgOpacity})` }}
      >
        {/* Header */}
        <div className="flex items-center gap-2 px-4 pt-3 pb-2">
          <div className="text-[10px] uppercase tracking-widest font-display font-bold text-poster-ink/40 shrink-0">
            Mobile Zoom Tuner
          </div>
          <input
            type="range" min={0.1} max={1} step={0.05}
            value={bgOpacity}
            onChange={(e) => setBgOpacity(Number(e.target.value))}
            onPointerDown={(e) => e.stopPropagation()}
            className="flex-1 h-1.5 accent-poster-teal cursor-pointer"
            title="Background opacity"
          />
          <button
            type="button"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={copySettings}
            className="text-[11px] font-mono px-2 py-0.5 rounded border border-poster-ink/20 text-poster-ink/60 hover:bg-poster-ink/5 active:scale-95 transition-all shrink-0"
          >
            {copied ? "✓ copied" : "copy"}
          </button>
          <button
            type="button"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={saveSettings}
            className="text-[11px] font-mono px-2 py-0.5 rounded border border-poster-teal/50 text-poster-teal hover:bg-poster-teal/10 active:scale-95 transition-all shrink-0"
          >
            {saveState === "saving" ? "saving…" : saveState === "ok" ? "✓ saved" : saveState === "err" ? "✗ error" : "save to src"}
          </button>
        </div>

        {/* Scrollable sliders */}
        <div className="overflow-y-auto max-h-[55vh] px-4 pb-3 space-y-2.5">
          <G label="Wide view" />
          <S label="Zoom"     k="fullZoom"    min={0.4}  max={1.5}  step={0.01} fmt={(v) => v.toFixed(2) + "×"} />
          <S label="Margin"   k="fullMargin"  min={0}    max={80}   step={1}    fmt={(v) => `${v}px`} />
          <S label="Offset Y" k="fullOffsetY" min={-200} max={200}  step={1}    fmt={(v) => `${v > 0 ? "+" : ""}${v}px`} />
          <S label="Offset X" k="fullOffsetX" min={-200} max={200}  step={1}    fmt={(v) => `${v > 0 ? "+" : ""}${v}px`} />

          <G label="Zoomed view" />
          <S label="Zoom"           k="caseFill"   min={0.1}  max={1.4}  step={0.01} fmt={(v) => v.toFixed(2) + "×"} />
          <S label="Vertical frame" k="centerY"    min={0}    max={600}  step={1}    fmt={(v) => `${v}px`} />
          <S label="Akk offset X"   k="akkOffsetX" min={-300} max={300}  step={1}    fmt={(v) => `${v > 0 ? "+" : ""}${v}px`} />
          <S label="Akk offset Y"   k="akkOffsetY" min={-300} max={300}  step={1}    fmt={(v) => `${v > 0 ? "+" : ""}${v}px`} />
          <S label="Nom offset X"   k="nomOffsetX" min={-300} max={300}  step={1}    fmt={(v) => `${v > 0 ? "+" : ""}${v}px`} />
          <S label="Nom offset Y"   k="nomOffsetY" min={-300} max={300}  step={1}    fmt={(v) => `${v > 0 ? "+" : ""}${v}px`} />
          <S label="Dat offset X"   k="datOffsetX" min={-300} max={300}  step={1}    fmt={(v) => `${v > 0 ? "+" : ""}${v}px`} />
          <S label="Dat offset Y"   k="datOffsetY" min={-300} max={300}  step={1}    fmt={(v) => `${v > 0 ? "+" : ""}${v}px`} />
          <S label="Case gap"       k="caseGap"    min={0}    max={300}  step={1}    fmt={(v) => `${v}px`} />
          <S label="Wide gap"       k="fullCaseGap" min={-200} max={60}  step={1}    fmt={(v) => `${v}px`} />

          <G label="Pills" />
          <S label="Horiz pad" k="horizPad" min={28} max={220} step={1} fmt={(v) => `${v}px`} />
          <S label="Vert pad"  k="pillPadV" min={0}  max={80}  step={1} fmt={(v) => `${v}px`} />

          <G label="Spotlight" />
          <S label="Opacity" k="spotlightOpacity" min={0}  max={1}  step={0.05} fmt={(v) => v.toFixed(2)} />
          <S label="Padding" k="spotlightPad"     min={0}  max={24} step={1}    fmt={(v) => `${v}px`} />

          <G label="Animation" />
          <S label="Snap speed"     k="animMs"        min={80}  max={900} step={10} fmt={(v) => `${v}ms`} />
          <S label="Panel speed"    k="panelAnimMs"   min={80}  max={800} step={10} fmt={(v) => `${v}ms`} />
          <S label="Snap threshold" k="snapThreshold" min={1}   max={40}  step={1}  fmt={(v) => `${v}px`} />

          <G label="Pinch" />
          <S label="Min scale" k="pinchMinScale" min={0.1} max={1}  step={0.05} fmt={(v) => v.toFixed(2) + "×"} />
          <S label="Max scale" k="pinchMaxScale" min={1}   max={10} step={0.5}  fmt={(v) => v.toFixed(1) + "×"} />

          <G label="Zoomed view extra" />
          <S label="Header shift Y" k="zoomedHeaderY" min={-400} max={400} step={2} fmt={(v) => `${v > 0 ? "+" : ""}${v}px`} />

          <G label="Slider rail" />
          <S label="Bar height"  k="sliderBarH" min={32} max={96} step={2}  fmt={(v) => `${v}px`} />
          <S label="Thumb blur"  k="thumbBlur"  min={0}  max={40} step={1}  fmt={(v) => `${v}px`} />

          <G label="Info card" />
          <div className="flex gap-1.5">
            {([1, 2, 3, 4, 5] as const).map((n) => (
              <button
                key={n}
                type="button"
                onPointerDown={(e) => e.stopPropagation()}
                onClick={() => onChange("infoLayout", n)}
                className={cn(
                  "flex-1 py-1.5 rounded text-[11px] font-mono font-bold border transition-colors",
                  tune.infoLayout === n
                    ? "bg-poster-teal text-white border-poster-teal"
                    : "bg-white text-poster-ink/50 border-poster-ink/15 hover:bg-poster-ink/5",
                )}
              >
                {n}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tab — always visible at bottom of panel */}
      <div className="flex justify-end pr-4">
        <button
          type="button"
          onPointerDown={(e) => { e.stopPropagation(); setOpen((o) => !o); }}
          className="bg-white/90 backdrop-blur border border-t-0 border-poster-ink/15 rounded-b-md px-3 py-1 text-[11px] font-mono font-semibold text-poster-ink/60 shadow-sm select-none active:scale-95 transition-transform"
        >
          {open ? "▲ hide" : "▼ tune"}
        </button>
      </div>
    </div>
  );
}

// ── Experience tuner (top-left) ───────────────────────────────────────────────

function ExperienceTuner({ tune, onChange }: { tune: Tune; onChange: (k: keyof Tune, v: number) => void }) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const copySettings = () => {
    const keys: (keyof Tune)[] = ["fullZoom","fullOffsetX","fullOffsetY","caseFill","centerY","akkOffsetX","akkOffsetY","nomOffsetX","nomOffsetY","datOffsetX","datOffsetY","zoomedHeaderY","headerShiftMs","animMs"];
    const text = keys.map((k) => `${k}: ${tune[k]}`).join(", ");
    navigator.clipboard.writeText(text).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1500); });
  };

  const G = ({ label }: { label: string }) => (
    <div className="text-[9px] uppercase tracking-widest font-mono font-bold text-poster-ink/30 pt-1">{label}</div>
  );
  const S = ({ label, k, min, max, step, fmt }: { label: string; k: keyof Tune; min: number; max: number; step: number; fmt?: (v: number) => string }) => (
    <SliderRow label={label} value={tune[k] as number} min={min} max={max} step={step} fmt={fmt} onChange={(v) => onChange(k, v)} />
  );

  return (
    <div
      className="fixed left-0 z-50 w-72"
      style={{
        top: 0,
        transform: open ? "translateY(0)" : "translateY(calc(-100% + 28px))",
        transition: `transform ${tune.panelAnimMs}ms cubic-bezier(0.22,1,0.36,1)`,
      }}
      onPointerDown={(e) => e.stopPropagation()}
    >
      <div className="bg-white/60 border-b border-r border-poster-ink/15 shadow-lg rounded-br-md">
        <div className="flex items-center gap-2 px-4 pt-3 pb-2">
          <div className="text-[10px] uppercase tracking-widest font-display font-bold text-poster-ink/40 flex-1">
            Experience Tuner
          </div>
          <button
            type="button"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={copySettings}
            className="text-[11px] font-mono px-2 py-0.5 rounded border border-poster-ink/20 text-poster-ink/60 hover:bg-poster-ink/5 active:scale-95 transition-all shrink-0"
          >
            {copied ? "✓ copied" : "copy"}
          </button>
        </div>
        <div className="overflow-y-auto max-h-[55vh] px-4 pb-3 space-y-2.5">
          <G label="Zoomed view" />
          <S label="Zoom"      k="caseFill"   min={0.1}  max={1.4}  step={0.01} fmt={(v) => v.toFixed(2) + "×"} />
          <S label="Center Y"  k="centerY"    min={0}    max={600}  step={1}    fmt={(v) => `${v}px`} />
          <S label="Akk X"     k="akkOffsetX" min={-300} max={300}  step={1}    fmt={(v) => `${v > 0 ? "+" : ""}${v}px`} />
          <S label="Akk Y"     k="akkOffsetY" min={-300} max={300}  step={1}    fmt={(v) => `${v > 0 ? "+" : ""}${v}px`} />
          <S label="Nom X"     k="nomOffsetX" min={-300} max={300}  step={1}    fmt={(v) => `${v > 0 ? "+" : ""}${v}px`} />
          <S label="Nom Y"     k="nomOffsetY" min={-300} max={300}  step={1}    fmt={(v) => `${v > 0 ? "+" : ""}${v}px`} />
          <S label="Dat X"     k="datOffsetX" min={-300} max={300}  step={1}    fmt={(v) => `${v > 0 ? "+" : ""}${v}px`} />
          <S label="Dat Y"     k="datOffsetY" min={-300} max={300}  step={1}    fmt={(v) => `${v > 0 ? "+" : ""}${v}px`} />

          <G label="Header shift" />
          <S label="Shift Y"   k="zoomedHeaderY" min={-400} max={400} step={2}  fmt={(v) => `${v > 0 ? "+" : ""}${v}px`} />
          <S label="Speed"     k="headerShiftMs" min={80}   max={900} step={10} fmt={(v) => `${v}ms`} />

          <G label="Snap animation" />
          <S label="Speed"     k="animMs"     min={80}   max={900}  step={10}   fmt={(v) => `${v}ms`} />
        </div>
      </div>
      <div className="flex justify-start pl-0">
        <button
          type="button"
          onPointerDown={(e) => { e.stopPropagation(); setOpen((o) => !o); }}
          className="bg-white/90 backdrop-blur border border-t-0 border-poster-ink/15 rounded-b-md px-3 py-1 text-[11px] font-mono font-semibold text-poster-ink/60 shadow-sm select-none active:scale-95 transition-transform"
        >
          {open ? "▲ hide" : "▼ zoom"}
        </button>
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function MobilePosterSlider({
  posterRef,
  activeCase,
  activeWordId,
  morphContextId,
  pinnedPossId,
  level,
  cutout,
  extraCutouts,
  onTapCase,
  onTapWord,
  onTapBackground,
  genderOn,
  morphMap,
  quizBlur,
  quizActive,
  tourActive,
  tourCutouts,
  onInfoLayout,
  onInfoReady,
  onTapVerbCloud,
}: Props) {
  const stageRef = useRef<HTMLDivElement>(null);
  const sliderTrackRef = useRef<HTMLDivElement>(null);

  const [tune, setTune] = useState<Tune>(DEFAULTS);
  const setTuneKey = useCallback((k: keyof Tune, v: number) => {
    setTune((prev) => ({ ...prev, [k]: v }));
  }, []);

  const [sliderValue, setSliderValue] = useState(0);
  const sliderValueRef = useRef(0);
  const snapAnimRef = useRef<number | null>(null);
  const snapTargetRef = useRef(0);
  const [isSnapping, setIsSnapping] = useState(false);
  const [snapZooms, setSnapZooms] = useState<ZoomState[]>(() =>
    computeSnapZooms(390, 700, DEFAULTS),
  );
  const snapZoomsRef = useRef<ZoomState[]>(computeSnapZooms(390, 700, DEFAULTS));

  // Direct-lerp state for snap animation — avoids passing through intermediate snap points.
  const snapFromZoomRef = useRef<ZoomState>({ scale: 1, tx: 0, ty: 0 });
  const snapToZoomRef   = useRef<ZoomState>({ scale: 1, tx: 0, ty: 0 });
  const snapFromGapRef  = useRef(16);
  const snapToGapRef    = useRef(16);
  const [snapTransform, setSnapTransform] = useState<ZoomState | null>(null);
  const [snapCaseGap,   setSnapCaseGap]   = useState<number | null>(null);
  const [displayedZoomedCase, setDisplayedZoomedCase] = useState<CaseKey | null>(null);
  const [casePopup, setCasePopup] = useState<{ caseKey: CaseKey; iconRect: IconRect } | null>(null);

  // Lift infoLayout to parent whenever it changes
  useEffect(() => { onInfoLayout?.(tune.infoLayout); }, [tune.infoLayout]);

  // Recompute snap zooms on mount, resize, or tune change
  useEffect(() => {
    const compute = () => {
      const stage = stageRef.current;
      if (!stage) return;
      const { width, height } = stage.getBoundingClientRect();
      if (width > 0 && height > 0) {
        const z = computeSnapZooms(width, height, tune);
        setSnapZooms(z);
        snapZoomsRef.current = z;
      }
    };
    compute();
    window.addEventListener("resize", compute);
    return () => window.removeEventListener("resize", compute);
  }, [tune]);

  const snapTo = useCallback((target: number) => {
    if (snapAnimRef.current != null) {
      cancelAnimationFrame(snapAnimRef.current);
      snapAnimRef.current = null;
    }
    snapTargetRef.current = target;

    // Capture start/end zoom states for a direct lerp (no intermediate snap points).
    const sv = sliderValueRef.current;
    snapFromZoomRef.current = interpolate(snapZoomsRef.current, sv);
    snapToZoomRef.current   = interpolate(snapZoomsRef.current, target);

    // Capture start/end case gap.
    const gapSnaps = [tune.fullCaseGap, tune.caseGap, tune.caseGap, tune.caseGap, tune.fullCaseGap] as const;
    const glo = Math.floor(Math.max(0, Math.min(3, sv)));
    snapFromGapRef.current = Math.round(lerp(gapSnaps[glo], gapSnaps[glo + 1], Math.max(0, sv - glo)));
    snapToGapRef.current   = target === 0 || target === 4 ? tune.fullCaseGap : tune.caseGap;

    const fromSlider = sv;
    const start = performance.now();
    setIsSnapping(true);

    const frame = (now: number) => {
      const t = Math.min(1, (now - start) / tune.animMs);
      const eased = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;

      setSnapTransform({
        scale: lerp(snapFromZoomRef.current.scale, snapToZoomRef.current.scale, eased),
        tx:    lerp(snapFromZoomRef.current.tx,    snapToZoomRef.current.tx,    eased),
        ty:    lerp(snapFromZoomRef.current.ty,    snapToZoomRef.current.ty,    eased),
      });
      setSnapCaseGap(Math.round(lerp(snapFromGapRef.current, snapToGapRef.current, eased)));

      const value = fromSlider + (target - fromSlider) * eased;
      sliderValueRef.current = value;
      setSliderValue(value);

      if (t < 1) {
        snapAnimRef.current = requestAnimationFrame(frame);
      } else {
        sliderValueRef.current = target;
        setSliderValue(target);
        setSnapTransform(null);
        setSnapCaseGap(null);
        snapAnimRef.current = null;
        setIsSnapping(false);
      }
    };
    snapAnimRef.current = requestAnimationFrame(frame);
  }, [tune.animMs, tune.caseGap]);

  // Gates the header Y-shift and info box; delayed when snapping from full view.
  const [headerLevelReady, setHeaderLevelReady] = useState(false);

  // Auto-snap when drill-down state changes
  useEffect(() => {
    if (level > 0 && activeCase) {
      const fromFull = Math.round(sliderValue) === 0;
      snapTo(CASE_SNAPS[activeCase]);
      if (fromFull) {
        setHeaderLevelReady(false);
        const t = setTimeout(() => {
          setHeaderLevelReady(true);
          onInfoReady?.();
        }, 500);
        return () => clearTimeout(t);
      } else {
        setHeaderLevelReady(true);
        onInfoReady?.();
      }
    } else if (level === 0) {
      snapTo(sliderValue < 2.5 ? 0 : 4);
      setHeaderLevelReady(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeCase, level]);

  // ── Slider drag ────────────────────────────────────────────────────────────
  // From wide view, a pill tap should only zoom — not select the word.
  const handleTapWord = (id: string) => {
    if (Math.round(sliderValue) === 0) {
      const prefix = id.split("-")[0];
      const c: CaseKey | null =
        prefix === "akk" || prefix === "twL" ? "akk" :
        prefix === "nom" ? "nom" :
        prefix === "dat" || prefix === "twR" ? "dat" : null;
      if (c) snapTo(CASE_SNAPS[c]);
      return;
    }
    onTapWord(id);
  };

  const sliderDragRef = useRef(false);

  const getSliderValueFromClientX = (clientX: number) => {
    const track = sliderTrackRef.current;
    if (!track) return sliderValue;
    const rect = track.getBoundingClientRect();
    return Math.max(0, Math.min(SNAP_COUNT - 1, ((clientX - rect.left) / rect.width) * (SNAP_COUNT - 1)));
  };

  const onThumbPointerDown = (e: React.PointerEvent) => {
    e.stopPropagation();
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    if (snapAnimRef.current != null) {
      cancelAnimationFrame(snapAnimRef.current);
      snapAnimRef.current = null;
    }
    sliderDragRef.current = true;
    setIsSnapping(false);

    const onMove = (ev: PointerEvent) => {
      const v = getSliderValueFromClientX(ev.clientX);
      sliderValueRef.current = v;
      setSliderValue(v);
    };
    const onUp = (ev: PointerEvent) => {
      sliderDragRef.current = false;
      snapTo(Math.round(getSliderValueFromClientX(ev.clientX)));
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  };

  // ── Stage pan/pinch + horizontal case swipe ────────────────────────────────
  const didPanRef = useRef(false);
  const pinchRef = useRef({
    pointers: new Map<number, { x: number; y: number }>(),
    startDist: 0, startScale: 1, startTx: 0, startTy: 0,
    singleStart: null as { x: number; y: number; tx: number; ty: number } | null,
    moved: false,
  });
  const [pinchZoom, setPinchZoom] = useState<ZoomState | null>(null);
  const currentBase = () => pinchZoom ?? interpolate(snapZooms, sliderValue);

  // Swipe-to-snap: tracks single-pointer horizontal drag to change case
  const swipeRef = useRef<{
    startX: number; startY: number; startSnap: number;
    intent: "h" | "v" | null; pointerId: number;
  } | null>(null);
  const SWIPE_LOCK_PX = 8;    // px of movement before locking direction
  const SWIPE_COMMIT_PX = 50; // px horizontal delta to commit to next case

  const onStagePointerDown = (e: React.PointerEvent) => {
    pinchRef.current.pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    pinchRef.current.moved = false;
    const base = currentBase();
    if (pinchRef.current.pointers.size === 1) {
      pinchRef.current.singleStart = { x: e.clientX, y: e.clientY, tx: base.tx, ty: base.ty };
      swipeRef.current = {
        startX: e.clientX, startY: e.clientY,
        startSnap: Math.round(sliderValueRef.current),
        intent: null, pointerId: e.pointerId,
      };
    } else if (pinchRef.current.pointers.size === 2) {
      swipeRef.current = null; // two fingers = pinch, not swipe
      pinchRef.current.singleStart = null;
      const pts = Array.from(pinchRef.current.pointers.values());
      pinchRef.current.startDist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
      pinchRef.current.startScale = base.scale;
      pinchRef.current.startTx = base.tx;
      pinchRef.current.startTy = base.ty;
    }
  };
  const onStagePointerMove = (e: React.PointerEvent) => {
    if (!pinchRef.current.pointers.has(e.pointerId)) return;
    pinchRef.current.pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pinchRef.current.pointers.size === 2) {
      const pts = Array.from(pinchRef.current.pointers.values());
      const d = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
      if (pinchRef.current.startDist > 0) {
        const newScale = Math.max(tune.pinchMinScale, Math.min(tune.pinchMaxScale, pinchRef.current.startScale * (d / pinchRef.current.startDist)));
        setPinchZoom({ scale: newScale, tx: pinchRef.current.startTx, ty: pinchRef.current.startTy });
        pinchRef.current.moved = true;
      }
      return;
    }
    // Single pointer — check swipe direction before applying pan
    const sw = swipeRef.current;
    if (sw && e.pointerId === sw.pointerId) {
      const sdx = e.clientX - sw.startX;
      const sdy = e.clientY - sw.startY;
      if (sw.intent === null && Math.hypot(sdx, sdy) > SWIPE_LOCK_PX) {
        sw.intent = Math.abs(sdx) > Math.abs(sdy) ? "h" : "v";
        if (sw.intent === "v") {
          // Reset pan anchor to avoid a positional jump after the dead-zone
          const base = currentBase();
          pinchRef.current.singleStart = { x: e.clientX, y: e.clientY, tx: base.tx, ty: base.ty };
        }
      }
      if (sw.intent === "h") {
        // Move slider live to give visual feedback during drag
        const stageW = stageRef.current?.getBoundingClientRect().width ?? 390;
        const newVal = Math.max(0, Math.min(SNAP_COUNT - 1, sw.startSnap - sdx / (stageW / 2)));
        sliderValueRef.current = newVal;
        setSliderValue(newVal);
        pinchRef.current.moved = true;
        return; // don't pan while swiping horizontally
      }
      if (sw.intent === null) return; // direction undetermined — suppress movement
      // sw.intent === "v": fall through to normal pan
    }
    const ss = pinchRef.current.singleStart;
    if (!ss) return;
    const dx = e.clientX - ss.x, dy = e.clientY - ss.y;
    if (Math.hypot(dx, dy) > tune.snapThreshold) pinchRef.current.moved = true;
    setPinchZoom((prev) => {
      const base = prev ?? interpolate(snapZooms, sliderValue);
      return { scale: base.scale, tx: ss.tx + dx, ty: ss.ty + dy };
    });
  };
  const onStagePointerUp = (e: React.PointerEvent) => {
    const sw = swipeRef.current;
    if (sw && e.pointerId === sw.pointerId && sw.intent === "h") {
      const sdx = e.clientX - sw.startX;
      swipeRef.current = null;
      pinchRef.current.moved = false;
      pinchRef.current.pointers.delete(e.pointerId);
      if (pinchRef.current.pointers.size === 0) { setPinchZoom(null); pinchRef.current.singleStart = null; }
      didPanRef.current = true; // suppress tap-through after a swipe gesture
      if (sdx < -SWIPE_COMMIT_PX) snapTo(Math.min(SNAP_COUNT - 1, sw.startSnap + 1));
      else if (sdx > SWIPE_COMMIT_PX) snapTo(Math.max(0, sw.startSnap - 1));
      else snapTo(sw.startSnap); // below threshold — snap back
      return;
    }
    swipeRef.current = null;
    pinchRef.current.pointers.delete(e.pointerId);
    if (pinchRef.current.pointers.size === 0) {
      if (pinchRef.current.moved) {
        didPanRef.current = true;
        if (pinchZoom) snapTo(Math.round(sliderValue));
      }
      setPinchZoom(null);
      pinchRef.current.singleStart = null;
    }
  };

  const { scale, tx, ty: tyBase } = snapTransform ?? currentBase();

  const GAP_SNAPS = [tune.fullCaseGap, tune.caseGap, tune.caseGap, tune.caseGap, tune.fullCaseGap];
  const gapLo = Math.floor(Math.max(0, Math.min(3, sliderValue)));
  const currentCaseGap = snapCaseGap ?? Math.round(lerp(GAP_SNAPS[gapLo], GAP_SNAPS[gapLo + 1], sliderValue - gapLo));

  const snappedSlider = isSnapping ? Math.round(snapTargetRef.current) : Math.round(sliderValue);
  const mobileZoomedCase: CaseKey | null =
    snappedSlider === 1 ? "akk" : snappedSlider === 2 ? "nom" : snappedSlider === 3 ? "dat" : null;
  const isZoomedCase = snappedSlider > 0 && snappedSlider < 4;

  useEffect(() => {
    const t = setTimeout(() => setDisplayedZoomedCase(mobileZoomedCase), 500);
    return () => clearTimeout(t);
  }, [mobileZoomedCase]);
  const ty = tyBase + (isZoomedCase && level >= 3 ? tune.zoomedHeaderY : 0);

  return (
    <div className="flex-1 min-h-0 flex flex-col relative overflow-hidden bg-poster-bg">

      {/* Stage */}
      <div
        ref={stageRef}
        className="flex-1 min-h-0 relative overflow-hidden"
        style={{ touchAction: "none" }}
        onPointerDown={onStagePointerDown}
        onPointerMove={onStagePointerMove}
        onPointerUp={onStagePointerUp}
        onPointerCancel={(e) => {
          const sw = swipeRef.current;
          if (sw?.intent === "h" && e.pointerId === sw.pointerId) {
            swipeRef.current = null;
            pinchRef.current.moved = false;
            pinchRef.current.pointers.delete(e.pointerId);
            if (pinchRef.current.pointers.size === 0) { setPinchZoom(null); pinchRef.current.singleStart = null; }
            snapTo(sw.startSnap); // always snap back on cancel
          } else {
            onStagePointerUp(e);
          }
        }}
        onClickCapture={(e) => {
          if (didPanRef.current) { e.stopPropagation(); e.preventDefault(); didPanRef.current = false; }
        }}
        onClick={(e) => {
          if (didPanRef.current) { didPanRef.current = false; return; }
          const t = e.target as HTMLElement;
          if (t.closest("button, [role='button'], a, input, select, textarea")) return;
          onTapBackground();
        }}
      >
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: POSTER_W,
            height: POSTER_H,
            transform: `translateY(${isZoomedCase && level >= 3 && headerLevelReady ? tune.zoomedHeaderY : 0}px)`,
            transition: `transform ${tune.headerShiftMs}ms cubic-bezier(0.22,1,0.36,1)`,
          }}
        >
        <div
          style={{
            width: POSTER_W,
            height: POSTER_H,
            position: "absolute",
            top: 0,
            left: 0,
            transformOrigin: "0 0",
            transform: `translate(${tx}px, ${tyBase}px) scale(${scale})`,
            transition: "none",
          }}
        >
          <Poster
            ref={posterRef}
            activeCase={activeCase}
            activeWordId={activeWordId}
            morphContextId={morphContextId}
            pinnedPossId={pinnedPossId}
            onTapCase={onTapCase}
            onTapWord={handleTapWord}
            onTapCaseIcon={(c, rect) => setCasePopup({ caseKey: c, iconRect: rect })}
            onTapVerbCloud={onTapVerbCloud}
            onTapBackground={onTapBackground}
            genderMode={!genderOn ? "off" : level >= 2 ? "always" : "hover"}
            morphMap={morphMap}
            quizBlur={quizBlur}
            quizActive={quizActive}
            slimPills
            pillPadH={tune.horizPad}
            pillPadV={tune.pillPadV}
            caseGap={currentCaseGap}
            mobileZoomedCase={displayedZoomedCase}
          />
        </div>
        </div>
      </div>

      {/* Case header popup */}
      {casePopup && (
        <CaseHeaderPopup
          caseKey={casePopup.caseKey}
          iconSrc={CASE_ICONS[casePopup.caseKey]}
          iconRect={casePopup.iconRect}
          onClose={() => setCasePopup(null)}
        />
      )}

      {/* Slider footer */}
      <div
        className="shrink-0 relative z-40 bg-white border-t border-poster-ink/10 flex flex-col justify-center gap-1.5 px-6"
        style={{ height: tune.sliderBarH }}
      >
        <div
          ref={sliderTrackRef}
          className="relative w-full cursor-default"
          style={{ height: 36, touchAction: "none" }}
        >
          {/* Visual track line */}
          <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-[5px] bg-poster-ink/12 rounded-full overflow-hidden pointer-events-none">
            <div
              className="h-full bg-poster-teal/60 rounded-full"
              style={{
                width: `${(sliderValue / (SNAP_COUNT - 1)) * 100}%`,
              }}
            />
          </div>
          {/* Snap dots */}
          {Array.from({ length: SNAP_COUNT }, (_, i) => (
            <button
              key={i}
              type="button"
              onClick={(e) => { e.stopPropagation(); snapTo(i); }}
              className={cn(
                "absolute top-1/2 -translate-y-1/2 -translate-x-1/2 rounded-full transition-all duration-200 pointer-events-auto z-10",
                SNAP_COLORS[i],
                snappedSlider === i && i > 0 && i < 4
                  ? "w-7 h-7 ring-2 ring-white ring-offset-1"
                  : i === 0 || i === 4 ? "w-5 h-5" : "w-6 h-6",
              )}
              style={{ left: `${(i / (SNAP_COUNT - 1)) * 100}%` }}
            />
          ))}
          {/* Frosted glass thumb */}
          <div
            className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-[34px] h-[34px] rounded-full pointer-events-auto z-20 cursor-grab active:cursor-grabbing touch-none"
            style={{
              left: `${(sliderValue / (SNAP_COUNT - 1)) * 100}%`,
              background: "transparent",
              backdropFilter: `blur(${tune.thumbBlur}px)`,
              WebkitBackdropFilter: `blur(${tune.thumbBlur}px)`,
              boxShadow: "0 2px 14px rgba(0,0,0,0.18), 0 1px 4px rgba(0,0,0,0.10), 0 0 0 1px rgba(255,255,255,0.6) inset",
            }}
            onPointerDown={onThumbPointerDown}
          />
        </div>
        {/* Case labels */}
        <div className="relative w-full pointer-events-none" style={{ height: 13 }}>
          {[
            { i: 1, label: "AKK", activeClass: "text-poster-green" },
            { i: 2, label: "NOM", activeClass: "text-poster-yellow" },
            { i: 3, label: "DAT", activeClass: "text-poster-purple" },
          ].map(({ i, label, activeClass }) => (
            <button
              key={label}
              type="button"
              onClick={(e) => { e.stopPropagation(); snapTo(i); }}
              className={cn(
                "absolute -top-1 -translate-x-1/2 text-[13px] font-extrabold tracking-widest transition-colors duration-200 pointer-events-auto",
                snappedSlider === i ? activeClass : "text-poster-ink/60",
              )}
              style={{ left: `${(i / (SNAP_COUNT - 1)) * 100}%` }}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
