// @ts-nocheck
import { useEffect, useRef, useState } from "react";
import { Info, X } from "lucide-react";
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

  const AKK_FAMILIES = [
    { label: "Action",      verbs: ["kaufen", "nehmen", "finden", "brauchen"], ex: "Ich kaufe ihn." },
    { label: "Perception",  verbs: ["sehen", "kennen", "lesen", "lieben"],     ex: "Er sieht sie." },
  ];
  const DAT_FAMILIES = [
    { label: "Communication", verbs: ["helfen", "antworten", "danken", "zuhören", "folgen", "glauben", "vertrauen", "empfehlen", "widersprechen", "befehlen", "schreiben"], ex: "Er antwortet ihr." },
    { label: "Feeling / state", verbs: ["gefallen", "fehlen", "schmecken", "wehtun", "schaden", "nützen", "passen", "gelingen", "leidtun", "auffallen", "imponieren"],     ex: "Es gefällt mir."  },
  ];

  return (
    <div
      className="absolute inset-0 flex items-center justify-center z-30 px-5"
      style={{ background: "rgba(214,234,248,0.55)", backdropFilter: "blur(3px)" }}
      onClick={(e) => { e.stopPropagation(); onDismiss(); }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          opacity: visible ? 1 : 0,
          transform: visible ? "translateY(0) scale(1)" : "translateY(16px) scale(0.96)",
          transition: "opacity 380ms ease, transform 380ms cubic-bezier(0.22,1,0.36,1)",
        }}
        className="w-full max-w-[480px] rounded-2xl overflow-y-auto shadow-2xl bg-white"
        style={{ maxHeight: "90dvh" }}
      >
        {/* Sky header */}
        <div
          style={{ background: "linear-gradient(160deg, #c8e6f7 0%, #ddf0fb 60%, #eef7fd 100%)" }}
          className="relative px-6 pt-7 pb-5 text-center overflow-hidden"
        >
          <div className="absolute top-1 left-2 text-8xl opacity-15 select-none pointer-events-none">☁</div>
          <div className="absolute top-3 right-3 text-7xl opacity-10 select-none pointer-events-none">☁</div>
          <div className="absolute bottom-0 left-8 text-6xl opacity-[0.07] select-none pointer-events-none">☁</div>
          <p className="text-[11px] font-bold uppercase tracking-widest text-poster-purple/70 mb-1.5">verb grammar</p>
          <h2 className="font-display font-bold text-[22px] leading-tight text-poster-ink">
            Most verbs take Akkusativ
          </h2>
          <p className="text-[13px] text-poster-ink/55 mt-1.5 leading-snug">
            A few demand Dativ — and it's worth knowing which.
          </p>
        </div>

        {/* Body */}
        <div className="px-5 py-4 space-y-3">
          <p className="text-[13px] text-poster-ink/70 leading-snug">
            <span className="font-semibold text-poster-green">Akkusativ is the default</span> — assume
            it and you'll be right most of the time. There are only ~40 Dativ-only verbs in all of
            German. Learn those, and everything else takes care of itself.
          </p>

          {/* Akkusativ families */}
          <div
            className="rounded-xl px-4 py-3 space-y-2"
            style={{
              background: "hsl(var(--poster-green) / 0.07)",
              border: "1px solid hsl(var(--poster-green) / 0.2)",
            }}
          >
            <p className="text-[11px] font-bold uppercase tracking-widest text-poster-green">
              Akkusativ families
            </p>
            {AKK_FAMILIES.map(({ label, verbs, ex }) => (
              <div key={label} className="flex items-start gap-2">
                <span
                  className="shrink-0 text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded-md text-white mt-0.5"
                  style={{ background: "hsl(var(--poster-green) / 0.55)" }}
                >
                  {label}
                </span>
                <div className="text-[11px] font-mono leading-snug">
                  <div className="text-poster-ink/55">{verbs.join(" · ")}</div>
                  <div className="text-poster-ink/35 mt-0.5"><em>{ex}</em></div>
                </div>
              </div>
            ))}
          </div>

          {/* Dativ families */}
          <div
            className="rounded-xl px-4 py-3 space-y-2"
            style={{
              background: "hsl(var(--poster-purple) / 0.07)",
              border: "1px solid hsl(var(--poster-purple) / 0.18)",
            }}
          >
            <p className="text-[11px] font-bold uppercase tracking-widest text-poster-purple">
              Dativ families
            </p>
            {DAT_FAMILIES.map(({ label, verbs, ex }) => (
              <div key={label} className="flex items-start gap-2">
                <span
                  className="shrink-0 text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded-md text-white mt-0.5"
                  style={{ background: "hsl(var(--poster-purple) / 0.5)" }}
                >
                  {label}
                </span>
                <div className="text-[11px] font-mono leading-snug">
                  <div className="text-poster-ink/55">{verbs.join(" · ")}</div>
                  <div className="text-poster-ink/35 mt-0.5"><em>{ex}</em></div>
                </div>
              </div>
            ))}
          </div>

          <p className="text-[11px] text-poster-ink/40 leading-snug">
            When in doubt → <span className="font-semibold text-poster-green">ihn · sie · es</span>.
            Dativ exceptions → <span className="font-semibold text-poster-purple">ihm · ihr · ihnen</span>.
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
  memory: string;
};

const AKK_VERBS: Verb[] = [
  { de: "kaufen",   en: "to buy",     example: { de: "Ich kaufe einen Apfel.", en: "I'm buying an apple." },  memory: "Cash leaves your hand, goods land in yours — a direct swap." },
  { de: "sehen",    en: "to see",     example: { de: "Er sieht den Film.", en: "He sees the film." },         memory: "Your gaze reaches out and touches what you see." },
  { de: "kennen",   en: "to know",    example: { de: "Ich kenne ihn gut.", en: "I know him well." },          memory: "You hold a person in your mental grip — you know them." },
  { de: "lieben",   en: "to love",    example: { de: "Sie liebt ihn.", en: "She loves him." },                memory: "Love wraps directly around its object." },
  { de: "finden",   en: "to find",    example: { de: "Sie findet den Schlüssel.", en: "She finds the key." }, memory: "Finding = seizing something that was hiding from you." },
  { de: "machen",   en: "to make/do", example: { de: "Er macht einen Fehler.", en: "He makes a mistake." },   memory: "You reach out and shape the world directly." },
  { de: "brauchen", en: "to need",    example: { de: "Ich brauche einen Arzt.", en: "I need a doctor." },     memory: "Need pulls the object straight toward you." },
  { de: "nehmen",   en: "to take",    example: { de: "Er nimmt den Bus.", en: "He takes the bus." },          memory: "Taking is the most direct action there is." },
  { de: "fragen",   en: "to ask",     example: { de: "Sie fragt ihn.", en: "She asks him." },                 memory: "A question is an arrow fired straight at someone." },
  { de: "lesen",    en: "to read",    example: { de: "Er liest einen Brief.", en: "He reads a letter." },     memory: "Your eyes devour the page directly." },
  { de: "besuchen", en: "to visit",   example: { de: "Wir besuchen ihn.", en: "We visit him." },              memory: "You go directly to someone's door." },
  { de: "haben",    en: "to have",    example: { de: "Ich habe einen Hund.", en: "I have a dog." },           memory: "Possession is the most direct relationship possible." },
];

const DAT_VERBS: Verb[] = [
  { de: "helfen",     en: "to help",         example: { de: "Er hilft mir.", en: "He helps me." },                       memory: "Help is extended to an outstretched hand — not grabbed from one." },
  { de: "danken",     en: "to thank",        example: { de: "Ich danke dir.", en: "I thank you." },                      memory: "Gratitude is a gift sent to its recipient." },
  { de: "gefallen",   en: "to please/like",  example: { de: "Es gefällt mir.", en: "I like it." },                       memory: "Something falls pleasantly onto your taste — it pleases to you." },
  { de: "folgen",     en: "to follow",       example: { de: "Folg mir!", en: "Follow me!" },                             memory: "Following trails behind toward someone — you never get ahead of them." },
  { de: "gehören",    en: "to belong to",    example: { de: "Das gehört mir.", en: "That belongs to me." },              memory: "Belonging always points to an owner." },
  { de: "glauben",    en: "to believe",      example: { de: "Ich glaube ihm.", en: "I believe him." },                   memory: "Belief is directed toward a person, not fired at them." },
  { de: "antworten",  en: "to answer",       example: { de: "Sie antwortet ihm.", en: "She answers him." },              memory: "An answer is sent back to the questioner — it travels toward them." },
  { de: "vertrauen",  en: "to trust",        example: { de: "Ich vertraue dir.", en: "I trust you." },                   memory: "Trust builds gradually toward someone over time." },
  { de: "zuhören",    en: "to listen to",    example: { de: "Hör mir zu!", en: "Listen to me!" },                        memory: "zu (toward) + hören (hear) — the Dativ is literally built into the word." },
  { de: "empfehlen",  en: "to recommend",    example: { de: "Ich empfehle dir das.", en: "I recommend that to you." },   memory: "A recommendation is a gift given to someone for their benefit." },
  { de: "schaden",    en: "to harm",         example: { de: "Das schadet ihm.", en: "That harms him." },                 memory: "Harm happens to a recipient — they're the one who receives it." },
  { de: "nützen",     en: "to be useful to", example: { de: "Das nützt mir nichts.", en: "That's no use to me." },       memory: "Usefulness exists for someone's benefit — they're the recipient." },
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

      {!showIntro && (
        <button
          className="absolute bottom-4 right-4 z-10 w-9 h-9 rounded-full bg-white/60 flex items-center justify-center text-poster-ink/50 hover:bg-white/90 hover:text-poster-ink/80 transition-colors"
          onClick={(e) => { e.stopPropagation(); setShowIntro(true); }}
          title="How verb cases work"
        >
          <Info className="h-4 w-4" />
        </button>
      )}

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

        {/* ── Memory tip popup ── */}
        {desktopFocused && (() => {
          const verbs = desktopFocused.group === "akk" ? AKK_VERBS : DAT_VERBS;
          const verb = verbs[desktopFocused.i];
          const isGreen = desktopFocused.group === "akk";
          return (
            <div
              className="absolute left-0 right-0 flex justify-center pointer-events-none"
              style={{ top: "calc(50% + 118px)", zIndex: 25 }}
            >
              <div
                key={`${desktopFocused.group}-${desktopFocused.i}`}
                className="bg-white/95 rounded-2xl shadow-xl px-5 py-3.5 text-center max-w-[300px]"
                style={{
                  border: `1px solid hsl(var(${isGreen ? "--poster-green" : "--poster-purple"}) / 0.2)`,
                  animation: "memory-tip-in 300ms cubic-bezier(0.22,1,0.36,1) both",
                  backdropFilter: "blur(8px)",
                }}
              >
                <p
                  className="text-[10px] font-bold uppercase tracking-widest mb-1.5"
                  style={{ color: `hsl(var(${isGreen ? "--poster-green" : "--poster-purple"}))`, opacity: 0.7 }}
                >
                  memory tip
                </p>
                <p className="text-[12px] text-poster-ink/65 leading-snug">
                  {verb.memory}
                </p>
              </div>
            </div>
          );
        })()}
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
