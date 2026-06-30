// @ts-nocheck
import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import cloudGreen from "@/assets/poster/cloud-green.svg";
import cloudPurple from "@/assets/poster/cloud-purple.svg";

const INTRO_KEY = "genau_verb_intro_seen";

function VerbIntroCard({ onDismiss }: { onDismiss: () => void }) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const id = requestAnimationFrame(() => requestAnimationFrame(() => setVisible(true)));
    return () => cancelAnimationFrame(id);
  }, []);

  const MNEMONICS = [
    ["helfen",  "help to you",    "Er hilft mir"],
    ["glauben", "believe to you", "Ich glaube ihm"],
    ["danken",  "thank to you",   "Ich danke dir"],
  ] as const;

  return (
    <div
      className="absolute inset-0 flex items-center justify-center z-30 px-5"
      style={{ background: "rgba(214,234,248,0.55)", backdropFilter: "blur(3px)" }}
      onClick={onDismiss}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          opacity: visible ? 1 : 0,
          transform: visible ? "translateY(0) scale(1)" : "translateY(16px) scale(0.96)",
          transition: "opacity 380ms ease, transform 380ms cubic-bezier(0.22,1,0.36,1)",
        }}
        className="w-full max-w-[340px] rounded-2xl overflow-hidden shadow-2xl bg-white"
      >
        {/* Sky header */}
        <div
          style={{ background: "linear-gradient(160deg, #c8e6f7 0%, #ddf0fb 60%, #eef7fd 100%)" }}
          className="relative px-6 pt-7 pb-5 text-center overflow-hidden"
        >
          <div className="absolute top-3 left-4 text-2xl opacity-40 select-none pointer-events-none">☁</div>
          <div className="absolute top-5 right-6 text-xl opacity-25 select-none pointer-events-none">☁</div>
          <div className="absolute bottom-2 left-12 text-base opacity-20 select-none pointer-events-none">☁</div>
          <p className="text-[11px] font-bold uppercase tracking-widest text-poster-purple/70 mb-1.5">verb grammar</p>
          <h2 className="font-display font-bold text-[22px] leading-tight text-poster-ink">
            Verbs choose their case
          </h2>
          <p className="text-[13px] text-poster-ink/55 mt-1.5 leading-snug">
            It's baked into the verb — not the sentence.
          </p>
        </div>

        {/* Body */}
        <div className="px-5 py-4 space-y-3.5">
          <p className="text-[13px] text-poster-ink/75 leading-snug">
            <span className="font-semibold text-poster-green">Akkusativ verbs</span> take a direct
            object. <span className="font-semibold text-poster-purple">Dativ verbs</span> are
            different — they secretly mean giving something <em>to</em> someone.
          </p>

          <div
            className="rounded-xl px-4 py-3.5 space-y-2"
            style={{
              background: "hsl(var(--poster-purple) / 0.07)",
              border: "1px solid hsl(var(--poster-purple) / 0.18)",
            }}
          >
            <p className="text-[11px] font-bold uppercase tracking-widest text-poster-purple">
              The hidden "to" trick
            </p>
            <p className="text-[12px] text-poster-ink/60 leading-snug">
              Read Dativ verbs as if there's a "to" hidden in English:
            </p>
            <div className="space-y-1.5 text-[12px]">
              {MNEMONICS.map(([de, mnemonic, ex]) => (
                <div key={de} className="flex items-baseline gap-1.5 flex-wrap">
                  <span className="font-bold text-poster-ink font-slab">{de}</span>
                  <span className="text-poster-ink/30">→</span>
                  <span className="text-poster-ink/60 italic">"{mnemonic}"</span>
                  <span className="text-poster-ink/30 text-[10px]">· {ex}</span>
                </div>
              ))}
            </div>
          </div>

          <p className="text-[11px] text-poster-ink/40 leading-snug">
            That phantom "to" is why Dativ verbs take{" "}
            <span className="font-semibold">mir · dir · ihm</span> — not mich · dich · ihn.
          </p>
        </div>

        {/* CTA */}
        <div className="px-5 pb-5">
          <button
            onClick={onDismiss}
            className="w-full py-3 rounded-xl font-display font-bold text-white text-sm tracking-wide"
            style={{ background: "linear-gradient(135deg, #5bafd6 0%, #7ec8e3 100%)" }}
          >
            Explore the verbs ↗
          </button>
        </div>
      </div>
    </div>
  );
}

type Verb = {
  de: string;
  en: string;
  example: { de: string; en: string };
};

const AKK_VERBS: Verb[] = [
  { de: "kaufen",   en: "to buy",     example: { de: "Ich kaufe einen Apfel.", en: "I'm buying an apple." } },
  { de: "sehen",    en: "to see",     example: { de: "Er sieht den Film.", en: "He sees the film." } },
  { de: "kennen",   en: "to know",    example: { de: "Ich kenne ihn gut.", en: "I know him well." } },
  { de: "lieben",   en: "to love",    example: { de: "Sie liebt ihn.", en: "She loves him." } },
  { de: "finden",   en: "to find",    example: { de: "Sie findet den Schlüssel.", en: "She finds the key." } },
  { de: "machen",   en: "to make/do", example: { de: "Er macht einen Fehler.", en: "He makes a mistake." } },
  { de: "brauchen", en: "to need",    example: { de: "Ich brauche einen Arzt.", en: "I need a doctor." } },
  { de: "nehmen",   en: "to take",    example: { de: "Er nimmt den Bus.", en: "He takes the bus." } },
  { de: "fragen",   en: "to ask",     example: { de: "Sie fragt ihn.", en: "She asks him." } },
  { de: "lesen",    en: "to read",    example: { de: "Er liest einen Brief.", en: "He reads a letter." } },
  { de: "besuchen", en: "to visit",   example: { de: "Wir besuchen ihn.", en: "We visit him." } },
  { de: "haben",    en: "to have",    example: { de: "Ich habe einen Hund.", en: "I have a dog." } },
];

const DAT_VERBS: Verb[] = [
  { de: "helfen",     en: "to help",         example: { de: "Er hilft mir.", en: "He helps me." } },
  { de: "danken",     en: "to thank",        example: { de: "Ich danke dir.", en: "I thank you." } },
  { de: "gefallen",   en: "to please/like",  example: { de: "Es gefällt mir.", en: "I like it." } },
  { de: "folgen",     en: "to follow",       example: { de: "Folg mir!", en: "Follow me!" } },
  { de: "gehören",    en: "to belong to",    example: { de: "Das gehört mir.", en: "That belongs to me." } },
  { de: "glauben",    en: "to believe",      example: { de: "Ich glaube ihm.", en: "I believe him." } },
  { de: "antworten",  en: "to answer",       example: { de: "Sie antwortet ihm.", en: "She answers him." } },
  { de: "vertrauen",  en: "to trust",        example: { de: "Ich vertraue dir.", en: "I trust you." } },
  { de: "zuhören",    en: "to listen to",    example: { de: "Hör mir zu!", en: "Listen to me!" } },
  { de: "empfehlen",  en: "to recommend",    example: { de: "Ich empfehle dir das.", en: "I recommend that to you." } },
  { de: "schaden",    en: "to harm",         example: { de: "Das schadet ihm.", en: "That harms him." } },
  { de: "nützen",     en: "to be useful to", example: { de: "Das nützt mir nichts.", en: "That's no use to me." } },
];

const DRIFT_CLASSES = ["verb-drift-a", "verb-drift-b", "verb-drift-c"] as const;

const AKK_SKY: { left: number; top: number }[] = [
  { left: 2,  top: 6  },
  { left: 24, top: 2  },
  { left: 10, top: 20 },
  { left: 34, top: 14 },
  { left: 1,  top: 36 },
  { left: 20, top: 40 },
  { left: 38, top: 30 },
  { left: 8,  top: 55 },
  { left: 28, top: 58 },
  { left: 42, top: 50 },
  { left: 14, top: 74 },
  { left: 32, top: 78 },
];

const DAT_SKY: { left: number; top: number }[] = [
  { left: 55, top: 8  },
  { left: 72, top: 3  },
  { left: 80, top: 17 },
  { left: 60, top: 22 },
  { left: 76, top: 34 },
  { left: 57, top: 38 },
  { left: 68, top: 48 },
  { left: 80, top: 56 },
  { left: 56, top: 62 },
  { left: 74, top: 68 },
  { left: 50, top: 80 },
  { left: 68, top: 82 },
];

type VerbCloudProps = {
  verb: Verb;
  color: "green" | "purple";
  driftClass: string;
  driftDelay: number;
  staggerX: number;
  showExample: boolean;
  pauseDrift?: boolean;
};

function VerbCloud({ verb, color, driftClass, driftDelay, staggerX, showExample, pauseDrift }: VerbCloudProps) {
  const isGreen = color === "green";
  const cloudSrc = isGreen ? cloudGreen : cloudPurple;

  return (
    <div
      className="relative shrink-0"
      style={{
        width: 160,
        height: 96,
        marginLeft: staggerX,
        filter: "drop-shadow(0 0 6px white) drop-shadow(0 0 12px white)",
        animationName: driftClass,
        animationDuration: driftClass === "verb-drift-c" ? "14s" : driftClass === "verb-drift-b" ? "12s" : "10s",
        animationTimingFunction: "ease-in-out",
        animationIterationCount: "infinite",
        animationDelay: `${driftDelay}s`,
        animationPlayState: pauseDrift ? "paused" : "running",
      }}
    >
      <div
        className={cn("absolute inset-0 pointer-events-none", isGreen ? "bg-poster-green" : "bg-poster-purple")}
        style={{
          WebkitMaskImage: `url(${cloudSrc})`,
          maskImage: `url(${cloudSrc})`,
          WebkitMaskSize: "100% 100%",
          maskSize: "100% 100%",
          WebkitMaskMode: "alpha",
          maskMode: "alpha",
        }}
      />

      {!showExample && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-end px-4 pb-4">
          <div className={cn("font-display font-bold text-[28px] leading-tight text-center", isGreen ? "text-poster-green" : "text-poster-purple")}>
            {verb.de}
          </div>
        </div>
      )}

      {showExample && (
        <>
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-end px-4 pb-4">
            <div className={cn("font-slab text-xs font-bold text-center leading-snug", isGreen ? "text-poster-green" : "text-poster-purple")}>
              {verb.example.de}
            </div>
          </div>
          <div className="absolute left-0 right-0 z-10 flex justify-center" style={{ top: "calc(100% - 6px)" }}>
            <div className="text-[10px] text-poster-ink/50 text-center italic px-2">
              {verb.example.en}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

type FocusedCloud = { group: "akk" | "dat"; i: number; dx: number; dy: number };

type Props = { onClose: () => void };

export function VerbCloudOverlay({ onClose }: Props) {
  const skyRef = useRef<HTMLDivElement>(null);
  const [isClosing, setIsClosing] = useState(false);
  const [desktopHovered, setDesktopHovered] = useState<{ group: "akk" | "dat"; i: number } | null>(null);
  const [desktopFocused, setDesktopFocused] = useState<FocusedCloud | null>(null);

  const [selectedAkk, setSelectedAkk] = useState<number | null>(null);
  const [selectedDat, setSelectedDat] = useState<number | null>(null);

  const [showIntro, setShowIntro] = useState(() => !localStorage.getItem(INTRO_KEY));
  function dismissIntro() {
    localStorage.setItem(INTRO_KEY, "1");
    setShowIntro(false);
  }

  function handleClose() {
    setIsClosing(true);
    setTimeout(onClose, 380);
  }

  function handleDesktopClick(group: "akk" | "dat", i: number, pos: { left: number; top: number }) {
    if (desktopFocused?.group === group && desktopFocused?.i === i) {
      setDesktopFocused(null);
      return;
    }
    const sky = skyRef.current;
    if (!sky) return;
    const rect = sky.getBoundingClientRect();
    const cloudCenterX = rect.left + (pos.left / 100) * rect.width + 80;
    const cloudCenterY = rect.top + (pos.top / 100) * rect.height + 48;
    const dx = window.innerWidth / 2 - cloudCenterX;
    const dy = window.innerHeight / 2 - cloudCenterY;
    setDesktopFocused({ group, i, dx, dy });
  }

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col"
      style={{ animation: `${isClosing ? "verb-overlay-out" : "verb-overlay-in"} 380ms ease both`, background: "linear-gradient(to bottom, #d6eaf8 0%, #eef7fd 50%, #f7fcff 100%)" }}
      onClick={handleClose}
    >
      <button
        className="absolute top-4 right-4 z-10 w-9 h-9 rounded-full bg-poster-ink/10 flex items-center justify-center text-poster-ink/60 hover:bg-poster-ink/20 transition-colors"
        onClick={(e) => { e.stopPropagation(); handleClose(); }}
      >
        <X className="h-4 w-4" />
      </button>

      {/* ── DESKTOP: sky layout ── */}
      <div
        ref={skyRef}
        className="hidden md:block relative flex-1"
        onClick={(e) => { e.stopPropagation(); if (desktopFocused) { setDesktopFocused(null); setDesktopHovered(null); } else { handleClose(); } }}
      >
        <div className="absolute top-4 left-5 flex gap-5 pointer-events-none">
          <span className="text-xs font-bold uppercase tracking-widest text-poster-green opacity-60">Akkusativ</span>
          <span className="text-xs font-bold uppercase tracking-widest text-poster-purple opacity-60">Dativ</span>
        </div>

        {AKK_VERBS.map((verb, i) => {
          const pos = AKK_SKY[i];
          const isFocused = desktopFocused?.group === "akk" && desktopFocused?.i === i;
          const isDimmed = desktopFocused !== null && !isFocused;
          const isHovered = !desktopFocused && desktopHovered?.group === "akk" && desktopHovered?.i === i;
          return (
            <div
              key={verb.de}
              className="absolute cursor-pointer"
              style={{
                left: `${pos.left}%`,
                top: `${pos.top}%`,
                transform: isFocused ? `translate(${desktopFocused!.dx}px, ${desktopFocused!.dy}px) scale(2)` : undefined,
                opacity: isDimmed ? 0.12 : 1,
                zIndex: isFocused ? 20 : undefined,
                transition: "transform 0.35s ease, opacity 0.35s ease",
              }}
              onMouseEnter={() => { if (!desktopFocused) setDesktopHovered({ group: "akk", i }); }}
              onMouseLeave={() => setDesktopHovered(null)}
              onClick={(e) => { e.stopPropagation(); handleDesktopClick("akk", i, pos); }}
            >
              <VerbCloud
                verb={verb}
                color="green"
                driftClass={DRIFT_CLASSES[i % 3]}
                driftDelay={i * 0.5}
                staggerX={0}
                showExample={isHovered || isFocused}
                pauseDrift={isFocused}
              />
            </div>
          );
        })}

        {DAT_VERBS.map((verb, i) => {
          const pos = DAT_SKY[i];
          const isFocused = desktopFocused?.group === "dat" && desktopFocused?.i === i;
          const isDimmed = desktopFocused !== null && !isFocused;
          const isHovered = !desktopFocused && desktopHovered?.group === "dat" && desktopHovered?.i === i;
          return (
            <div
              key={verb.de}
              className="absolute cursor-pointer"
              style={{
                left: `${pos.left}%`,
                top: `${pos.top}%`,
                transform: isFocused ? `translate(${desktopFocused!.dx}px, ${desktopFocused!.dy}px) scale(2)` : undefined,
                opacity: isDimmed ? 0.12 : 1,
                zIndex: isFocused ? 20 : undefined,
                transition: "transform 0.35s ease, opacity 0.35s ease",
              }}
              onMouseEnter={() => { if (!desktopFocused) setDesktopHovered({ group: "dat", i }); }}
              onMouseLeave={() => setDesktopHovered(null)}
              onClick={(e) => { e.stopPropagation(); handleDesktopClick("dat", i, pos); }}
            >
              <VerbCloud
                verb={verb}
                color="purple"
                driftClass={DRIFT_CLASSES[i % 3]}
                driftDelay={i * 0.5 + 0.25}
                staggerX={0}
                showExample={isHovered || isFocused}
                pauseDrift={isFocused}
              />
            </div>
          );
        })}
      </div>

      {/* ── MOBILE: two scrollable columns ── */}
      <div className="md:hidden flex shrink-0 pt-5 pb-2 px-4" onClick={(e) => e.stopPropagation()}>
        <div className="flex-1 text-center">
          <div className="text-xs font-bold uppercase tracking-widest text-poster-green">Akkusativ</div>
          <div className="text-[10px] text-poster-ink/40">WEN? verbs</div>
        </div>
        <div className="flex-1 text-center">
          <div className="text-xs font-bold uppercase tracking-widest text-poster-purple">Dativ</div>
          <div className="text-[10px] text-poster-ink/40">WEM? verbs</div>
        </div>
      </div>

      <div className="md:hidden flex flex-1 min-h-0 gap-0 px-2" onClick={(e) => e.stopPropagation()}>
        <div className="flex-1 overflow-y-auto flex flex-col items-center gap-3 py-3 pr-1">
          {AKK_VERBS.map((verb, i) => (
            <div
              key={verb.de}
              className="cursor-pointer"
              onClick={() => { setSelectedAkk(selectedAkk === i ? null : i); setSelectedDat(null); }}
            >
              <VerbCloud
                verb={verb}
                color="green"
                driftClass={DRIFT_CLASSES[i % 3]}
                driftDelay={i * 0.6}
                staggerX={i % 2 === 0 ? 0 : 8}
                showExample={selectedAkk === i}
              />
            </div>
          ))}
        </div>

        <div className="w-px bg-poster-ink/10 shrink-0 my-4" />

        <div className="flex-1 overflow-y-auto flex flex-col items-center gap-3 py-3 pl-1">
          {DAT_VERBS.map((verb, i) => (
            <div
              key={verb.de}
              className="cursor-pointer"
              onClick={() => { setSelectedDat(selectedDat === i ? null : i); setSelectedAkk(null); }}
            >
              <VerbCloud
                verb={verb}
                color="purple"
                driftClass={DRIFT_CLASSES[i % 3]}
                driftDelay={i * 0.6 + 0.3}
                staggerX={i % 2 === 0 ? 0 : -8}
                showExample={selectedDat === i}
              />
            </div>
          ))}
        </div>
      </div>

      {showIntro && <VerbIntroCard onDismiss={dismissIntro} />}
    </div>
  );
}
