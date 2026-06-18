// @ts-nocheck
import { useState, useEffect } from "react";
import { X, RotateCcw } from "lucide-react";
import { DEFAULT_ZONES, loadZones, saveZones } from "./QuestionWordSVGMap";
import type { QWZoneConfig, QWZone } from "./QuestionWordSVGMap";

type Props = {
  onClose: () => void;
  onChange: (zones: QWZoneConfig) => void;
};

const CASE_LABELS: Record<string, string> = {
  nom: "NOM — Chef hat",
  akk: "AKK — Bicycle",
  dat: "DAT — Envelope",
};

function ZoneSliders({
  zone,
  color,
  onChange,
}: {
  zone: QWZone;
  color: string;
  onChange: (z: QWZone) => void;
}) {
  const fields: { key: keyof QWZone; label: string }[] = [
    { key: "x", label: "X" },
    { key: "y", label: "Y" },
    { key: "w", label: "W" },
    { key: "h", label: "H" },
  ];

  return (
    <div className="mb-3">
      <div
        className="text-[11px] font-bold uppercase tracking-widest mb-1.5"
        style={{ color }}
      >
        {zone.word}
      </div>
      <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
        {fields.map(({ key, label }) => (
          <label key={key} className="flex flex-col gap-0.5">
            <div className="flex justify-between text-[10px] text-poster-ink/50">
              <span>{label}</span>
              <span className="tabular-nums">{Math.round(zone[key] as number)}</span>
            </div>
            <input
              type="range"
              min={0}
              max={key === "w" || key === "h" ? 100 : 99}
              step={1}
              value={zone[key] as number}
              onChange={(e) =>
                onChange({ ...zone, [key]: Number(e.target.value) })
              }
              className="w-full h-1 accent-current"
              style={{ accentColor: color }}
            />
          </label>
        ))}
      </div>
    </div>
  );
}

export function QuestionWordTuner({ onClose, onChange }: Props) {
  const [zones, setZones] = useState<QWZoneConfig>(loadZones);

  useEffect(() => {
    saveZones(zones);
    onChange(zones);
  }, [zones]);

  function updateZone(
    group: keyof QWZoneConfig,
    word: string,
    updated: QWZone
  ) {
    setZones((prev) => ({
      ...prev,
      [group]: prev[group].map((z) => (z.word === word ? updated : z)),
    }));
  }

  function reset() {
    setZones(DEFAULT_ZONES);
  }

  const COLORS: Record<keyof QWZoneConfig, string> = {
    nom: "#d4a010",
    akk: "#2ea05a",
    dat: "#7c4db8",
  };

  return (
    <div
      className="fixed bottom-4 right-4 z-[500] w-72 bg-white/97 backdrop-blur-sm rounded-2xl shadow-2xl border border-poster-ink/12 overflow-hidden"
      onClick={(e) => e.stopPropagation()}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-poster-ink/5 border-b border-poster-ink/10">
        <span className="text-xs font-bold uppercase tracking-widest text-poster-ink/60">
          QW Zone Tuner
        </span>
        <div className="flex gap-2">
          <button
            onClick={reset}
            className="w-7 h-7 rounded-full flex items-center justify-center text-poster-ink/40 hover:text-poster-ink/80 hover:bg-poster-ink/8 transition-colors"
            title="Reset to defaults"
          >
            <RotateCcw size={13} />
          </button>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full flex items-center justify-center text-poster-ink/40 hover:text-poster-ink/80 hover:bg-poster-ink/8 transition-colors"
          >
            <X size={13} />
          </button>
        </div>
      </div>

      {/* Scrollable zone list */}
      <div className="overflow-y-auto max-h-[70vh] px-4 py-3 space-y-4">
        {(["akk", "nom", "dat"] as const).map((group) => (
          <div key={group}>
            <div className="text-[10px] uppercase tracking-widest text-poster-ink/35 font-semibold mb-2">
              {CASE_LABELS[group]}
            </div>
            {zones[group].map((zone) => (
              <ZoneSliders
                key={zone.word}
                zone={zone}
                color={COLORS[group]}
                onChange={(updated) => updateZone(group, zone.word, updated)}
              />
            ))}
            <div className="border-b border-poster-ink/8 mt-1" />
          </div>
        ))}
      </div>
    </div>
  );
}
