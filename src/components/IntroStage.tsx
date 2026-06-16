import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import iPng    from "@/assets/pronouns/i.svg";
import youPng  from "@/assets/pronouns/you.svg";
import hePng   from "@/assets/pronouns/he.svg";
import herPng  from "@/assets/pronouns/she.svg";
import toasterSvg from "@/assets/pronouns/toaster.svg";
import toasterLeftSvg from "@/assets/pronouns/toaster-left.svg";
import usPng   from "@/assets/pronouns/us.svg";
import yallPng from "@/assets/pronouns/yall.svg";
import themPng        from "@/assets/pronouns/they.svg";
import formalLeftSvg  from "@/assets/pronouns/formal-left.svg";
import formalRightSvg from "@/assets/pronouns/formal-right.svg";
import chefHatSvg     from "@/assets/poster/chef-hat.svg";

// ─── Step definitions ────────────────────────────────────────────────────────

type Reveal =
  | null
  | "def-articles"
  | "indef-articles"
  | "pronoun"
  | "sie-only"
  | "Sie-add"
  | "der-er-link"
  | "chef-hat"
  | "done";

type StepDef = {
  question: string;
  answers: Array<{ label: string; response: string }>;
  reveal: Reveal;
  scaleAfter?: number;
  pronounLabel?: string;
};

const STEPS: StepDef[] = [
  // ── Q0 ─────────────────────────────────────────────────────────────────────
  {
    question: "Do you want to see the relation between der, die, das and er, sie, es?",
    answers: [
      { label: "No, but yes", response: "Fair. We're showing you anyway. It turns out German articles and pronouns are closely related — once you see it, you can't unsee it." },
      { label: "Yes",         response: "Great instinct. The link between der/die/das and er/sie/es is one of those things that makes German suddenly feel logical." },
      { label: "For sure",    response: "Smart. The connection is one of German's best-kept secrets — once it clicks, the whole system opens up." },
    ],
    reveal: null,
    scaleAfter: 0.875,
  },
  // ── Articles ────────────────────────────────────────────────────────────────
  {
    question: "How would you translate der, die, das?",
    answers: [
      { label: "the, the, the", response: "Exactly. All three mean 'the' — one for each grammatical gender: der (masculine), die (feminine), das (neuter). Every German noun picks one." },
      { label: "Pain",          response: "Only emotionally. In practice, der/die/das all mean 'the' — split across three genders: masculine, feminine, and neuter." },
      { label: "Stress",        response: "Learning them can feel that way. But they all just mean 'the' — three versions for three genders: der (m), die (f), das (n)." },
    ],
    reveal: "def-articles",
  },
  {
    question: "How would you translate ein, eine, ein?",
    answers: [
      { label: "a, a, a", response: "Right. ein/eine/ein all mean 'a' or 'an' — one for each gender: masculine, feminine, neuter. Like der/die/das, just indefinite." },
      { label: "b, b, b", response: "Wrong letter, right idea — they're all the same meaning. ein/eine/ein mean 'a' or 'an', three forms for three genders." },
      { label: "c, c, c", response: "Not quite. All three mean 'a' or 'an' — ein for masculine and neuter, eine for feminine. Three genders, three forms." },
    ],
    reveal: "indef-articles",
  },
  // ── Pronouns ────────────────────────────────────────────────────────────────
  {
    question: "What is 'I' in German?",
    answers: [
      { label: "Egg",                     response: "Das Ei is egg. The German for 'I' is ich — lowercase, always. First pronoun you'll need." },
      { label: "Two eyebrows and a nose", response: "Poetically accurate. But grammatically, 'I' in German is ich — first-person singular, used exactly like its English counterpart." },
      { label: "ich",                     response: "Correct. ich — always lowercase — is German for 'I'. First person singular, first stop on the list." },
    ],
    reveal: "pronoun",
    pronounLabel: "ich",
  },
  {
    question: "How would you translate 'du'?",
    answers: [
      { label: "Two",  response: "That's zwei. du means 'you' — the casual, informal version used with friends, family, and people you actually like." },
      { label: "You",  response: "Exactly. du is the informal 'you' in German — used with anyone you'd be on a first-name basis with." },
      { label: "Milk", response: "That's Milch. du means 'you' — casual singular, used with friends, family, or anyone you'd speak to informally." },
    ],
    reveal: "pronoun",
    pronounLabel: "du",
  },
  {
    question: "How would you translate er, sie, es?",
    answers: [
      { label: "He-Man",      response: "Just he. er = he, sie = she, es = it — your three third-person singular pronouns, one for each gender." },
      { label: "She-Ra",      response: "Just she. er = he, sie = she, es = it. These mirror der, die, das more closely than you might expect." },
      { label: "He, she, it", response: "Exactly. er, sie, es — he, she, it. One for each gender, and they echo der, die, das in a way that's worth noticing." },
    ],
    reveal: "pronoun",
    pronounLabel: "er • sie • es",
  },
  {
    question: "Hold on — look at er, sie, es and then look at der, die, das. Notice anything?",
    answers: [
      { label: "They kind of rhyme?",       response: "More than rhyme — the endings are the same. der/er, die/sie, das/es. Strip the 'd' from the article and the pronoun is right there." },
      { label: "The endings match",         response: "Exactly. der → er. die → sie. das → es. The article is the pronoun with a 'd' in front. Same gender, same ending — two jobs, one word family." },
      { label: "Is that... the same word?", response: "Pretty much. The article introduces the noun, the pronoun replaces it — but they share the same endings. Once you know one set, you half-know the other." },
    ],
    reveal: "der-er-link",
  },
  {
    question: "How would you translate 'we' into German?",
    answers: [
      { label: "wer", response: "Close — wer means 'who', not 'we'. The German for 'we' is wir. One letter off, completely different meaning." },
      { label: "was", response: "was means 'what' in German. 'We' is wir — first person plural, you and whoever else is in the group." },
      { label: "wir", response: "Correct. wir is 'we' — everyone together, first person plural." },
    ],
    reveal: "pronoun",
    pronounLabel: "wir",
  },
  {
    question: "How would you translate 'you (all)'?",
    answers: [
      { label: "dir", response: "dir is a dative form of 'you' — that comes later. For talking to a group informally, the word is ihr." },
      { label: "du",  response: "du is singular 'you'. When you're talking to a whole group informally, you need ihr — German's 'you all'." },
      { label: "ihr", response: "Right. ihr is the informal plural 'you' — used when addressing a group casually. Think 'you all' or 'you guys'." },
    ],
    reveal: "pronoun",
    pronounLabel: "ihr",
  },
  {
    question: "What is 'they' in German?",
    answers: [
      { label: "ihr",    response: "ihr is 'you all' — talking TO a group. When you're talking ABOUT a group, the word is sie (lowercase). Same concept, different direction." },
      { label: "sie",    response: "Correct. sie (lowercase) means 'they' — third person plural. You've met sie before as 'she'; here it pulls double duty." },
      { label: "Aliens", response: "Grammatically they'd be sie. Lowercase sie means 'they' in German — one word that covers she, they, and (capitalized) the formal you." },
    ],
    reveal: "sie-only",
  },
  {
    question: "Which one is the formal 'you'?",
    answers: [
      { label: "ihr", response: "ihr is casual plural 'you all'. The formal you — used for strangers, superiors, or anyone you'd address respectfully — is Sie, capital S." },
      { label: "sie", response: "sie (lowercase) is 'she' or 'they'. The formal version is Sie — same word, capital S, completely different register." },
      { label: "Sie", response: "Exactly. Sie — capital S — is the formal 'you' in German. Same spelling as 'she' and 'they', but that capital letter changes everything." },
    ],
    reveal: "Sie-add",
  },
  // ── Chef's hat ──────────────────────────────────────────────────────────────
  {
    question: "One more thing lives above this column on the cheatsheet — a chef's hat with a little cloud over it. What's that about?",
    answers: [
      { label: "The chef is just hungry",           response: "Tempting theory, but no. That cloud reads 'sein' — German for 'to be'. And the hat itself marks something bigger: the 'boss' of the sentence." },
      { label: "It's the verb 'to be'",             response: "Right about the cloud — that's 'sein', 'to be'. But the hat is the real signal: it marks the 'boss' of the sentence, the subject. Ask 'wer?' — 'who?' — and whoever answers wears it." },
      { label: "It marks the subject — the 'boss'", response: "Exactly. The chef's hat marks the Nominativ case: the 'boss' of the sentence — the one doing the being (sein) or the doing. Ask 'wer?' — 'who?' — and the answer is whatever's wearing this hat." },
    ],
    reveal: "chef-hat",
  },
  // ── Done ────────────────────────────────────────────────────────────────────
  {
    question: "That's the entire Nominativ column. Ready to explore the rest?",
    answers: [
      { label: "Let's go!", response: "" },
    ],
    reveal: "done",
  },
];

// ─── Dynamic scale ────────────────────────────────────────────────────────────
// Pill dimensions measured from browser (text-[80px] py-8, gap-6):
const PILL_H    = 184;  // px per pill row
const PILL_GAP  = 24;   // px (gap-6), applied between items and between sections
const ARTICLE_H = 600;  // px (3 article rows + 2 inner gaps)
const FILL_PX   = 569;  // target visual height — fills ≈63% of 900px viewport, symmetric margins

// Gap between the pronoun stack and the docked-below article block, while
// pronouns are still building. We want this gap's *on-screen* size to stay
// constant (so the article block reliably sits below the fold without the
// resting pan jumping around as the zoom-out scale changes between reveals) —
// so the canvas-local gap is computed as DOCK_SCREEN_GAP / scale. The "slam
// together" transition collapses it down to a normal PILL_GAP.
const DOCK_SCREEN_GAP = 750;

// Chef-hat step geometry: the hat floats in reserved blank space directly
// above the pronoun stack — HAT_H is its block height, HAT_GAP_BELOW the
// buffer kept clear between its bottom edge and the stack's top edge (so the
// "blank space" zoom can frame it without any column creeping into view), and
// HAT_PAD_ABOVE extra blank space above it for that tight-zoom feel.
const HAT_H          = 800;
const HAT_GAP_BELOW  = 40;
const HAT_PAD_ABOVE  = 80;

// Articles are revealed first (and stay docked out of view below the canvas
// while pronouns build), then the two stacks combine. hasArticles=true means
// "size for the combined column" — used both for the lone-article phase and
// the final slam-together zoom-out.
function computeScale(nPronouns: number, hasArticles = false): number {
  const pronounsH = nPronouns > 0 ? nPronouns * (PILL_H + PILL_GAP) - PILL_GAP : 0;
  const articlesH = hasArticles
    ? (nPronouns > 0 ? PILL_GAP + ARTICLE_H : ARTICLE_H)
    : 0;
  const natural = pronounsH + articlesH;
  return natural > 0 ? Math.min(0.875, FILL_PX / natural) : 0.875;
}

// ─── Types & shared styles ────────────────────────────────────────────────────

type PillPhase = "blank" | "icon" | "text";

const ICON_FILTER = "brightness(0) invert(1)";

const POP_ANIM: React.CSSProperties = {
  animation: "pill-pop-in 0.45s cubic-bezier(0.22,1,0.36,1) both",
};

function iconStyle(visible: boolean): React.CSSProperties {
  return { filter: ICON_FILTER, opacity: visible ? 1 : 0, transition: "opacity 0.45s ease", flexShrink: 0 };
}

function labelStyle(visible: boolean): React.CSSProperties {
  return { opacity: visible ? 1 : 0, transition: "opacity 0.45s ease" };
}

const PRONOUN_ICON: Record<string, string> = {
  "ich": iPng,
  "du":  youPng,
  "wir": usPng,
  "ihr": yallPng,
};

// ─── Pill sub-components ──────────────────────────────────────────────────────

function StagePill({ label, icon, phase = "text", className, squared = false, radiusDelayMs = 0 }: {
  label: string;
  icon?: string;
  phase?: PillPhase;
  className?: string;
  // Once the article block has slammed together with the pronoun stack, its
  // pills straighten from the intro's full-pill shape to the cheatsheet's
  // rounded-sm corners — staggered per pill via `radiusDelayMs`.
  squared?: boolean;
  radiusDelayMs?: number;
}) {
  return (
    <div
      className={cn(
        "flex items-center justify-center gap-8 px-16 py-8 rounded-full bg-poster-yellow text-white font-bold text-[80px] select-none whitespace-nowrap min-w-max",
        className,
      )}
      style={{
        ...POP_ANIM,
        borderRadius: squared ? "4px" : undefined,
        transition: "border-radius 0.4s ease",
        transitionDelay: `${radiusDelayMs}ms`,
      }}
    >
      {icon && <img src={icon} alt="" className="h-28 w-auto" style={iconStyle(phase !== "blank")} />}
      <span style={labelStyle(phase === "text")}>{label}</span>
    </div>
  );
}

function ErSieEsPill({ phase, squared = false, radiusDelayMs = 0 }: {
  phase: PillPhase;
  squared?: boolean;
  radiusDelayMs?: number;
}) {
  const iconsOn = phase !== "blank";
  const textOn  = phase === "text";
  return (
    <div
      className="flex items-center justify-center gap-8 px-16 py-8 rounded-full bg-poster-yellow text-white font-bold text-[80px] select-none whitespace-nowrap min-w-max"
      style={{
        ...POP_ANIM,
        borderRadius: squared ? "4px" : undefined,
        transition: "border-radius 0.4s ease",
        transitionDelay: `${radiusDelayMs}ms`,
      }}
    >
      <img src={hePng}  alt="" className="h-24 w-auto" style={iconStyle(iconsOn)} />
      <span style={labelStyle(textOn)}>er</span>
      <span style={labelStyle(textOn)}> • </span>
      <img src={herPng} alt="" className="h-24 w-auto" style={iconStyle(iconsOn)} />
      <span style={labelStyle(textOn)}>sie</span>
      <span style={labelStyle(textOn)}> • </span>
      <img src={toasterLeftSvg} alt="" className="h-24 w-auto" style={iconStyle(iconsOn)} />
      <img src={toasterSvg}     alt="" className="h-12 w-auto -ml-[76px] mt-6 self-center" style={iconStyle(iconsOn)} />
      <span style={labelStyle(textOn)}>es</span>
    </div>
  );
}

const COMPARE_SCAN_COLORS = [
  "hsl(247 55% 40%)", // masc — deep indigo-violet
  "hsl(340 65% 70%)", // fem  — dusty rose
  "hsl(158 92% 24%)", // neut — deep emerald
];

function compareWordStyle(scanIdx: number, slot: number): React.CSSProperties {
  const active = scanIdx === slot + 1;
  return {
    display: "inline-block",
    color: active ? COMPARE_SCAN_COLORS[slot] : undefined,
    transform: active ? "scale(1.1)" : undefined,
    transition: "color 0.35s ease, transform 0.35s ease",
  };
}

// Single-pill "der • die • das" used in the comparison overlay.
// Each "d" bounces independently during the d-pulse beat.
function CompareDefPill({ scanIdx, dPulse }: { scanIdx: number; dPulse: boolean }) {
  const dStyle = (delayMs: number): React.CSSProperties => ({
    display: "inline-block",
    animation: dPulse ? "compare-d-bounce 0.6s ease both" : undefined,
    animationDelay: `${delayMs}ms`,
  });
  return (
    <div className="flex items-center justify-center gap-8 px-16 py-8 rounded-full bg-poster-yellow text-white font-bold text-[80px] select-none whitespace-nowrap min-w-max">
      <span style={compareWordStyle(scanIdx, 0)}><span style={dStyle(0)}>d</span>er</span>
      <span className="opacity-50"> • </span>
      <span style={compareWordStyle(scanIdx, 1)}><span style={dStyle(80)}>d</span>ie</span>
      <span className="opacity-50"> • </span>
      <span style={compareWordStyle(scanIdx, 2)}><span style={dStyle(160)}>d</span>as</span>
    </div>
  );
}

// er / sie / es with scan highlighting — used in the comparison overlay.
function CompareErSieEsPill({ scanIdx }: { scanIdx: number }) {
  return (
    <div className="flex items-center justify-center gap-8 px-16 py-8 rounded-full bg-poster-yellow text-white font-bold text-[80px] select-none whitespace-nowrap min-w-max">
      <img src={hePng}         alt="" className="h-24 w-auto" style={{ filter: ICON_FILTER }} />
      <span style={compareWordStyle(scanIdx, 0)}>er</span>
      <span className="opacity-50"> • </span>
      <img src={herPng}        alt="" className="h-24 w-auto" style={{ filter: ICON_FILTER }} />
      <span style={compareWordStyle(scanIdx, 1)}>sie</span>
      <span className="opacity-50"> • </span>
      <img src={toasterLeftSvg} alt="" className="h-24 w-auto" style={{ filter: ICON_FILTER }} />
      <img src={toasterSvg}    alt="" className="h-12 w-auto -ml-[76px] mt-6 self-center" style={{ filter: ICON_FILTER }} />
      <span style={compareWordStyle(scanIdx, 2)}>es</span>
    </div>
  );
}

function SieSiePill({ phase, sieHasSie, squared = false, radiusDelayMs = 0 }: {
  phase: PillPhase;
  sieHasSie: boolean;
  squared?: boolean;
  radiusDelayMs?: number;
}) {
  return (
    <div
      className="flex items-center justify-center gap-8 px-16 py-8 rounded-full bg-poster-yellow text-white font-bold text-[80px] select-none whitespace-nowrap min-w-max"
      style={{
        ...POP_ANIM,
        borderRadius: squared ? "4px" : undefined,
        transition: "border-radius 0.4s ease",
        transitionDelay: `${radiusDelayMs}ms`,
      }}
    >
      <img src={themPng} alt="" className="h-28 w-auto" style={iconStyle(phase !== "blank")} />
      <span style={labelStyle(phase === "text")}>sie</span>
      {sieHasSie && (
        <>
          <span className="intro-sie-appear">•</span>
          <span className="flex items-center intro-sie-appear">
            <img src={formalLeftSvg}  alt="" className="h-24 w-auto" style={iconStyle(true)} />
            <img src={formalRightSvg} alt="" className="h-24 w-auto -ml-3" style={iconStyle(true)} />
          </span>
          <span className="intro-sie-appear">Sie</span>
        </>
      )}
    </div>
  );
}

function PronounPill({ label, phase, sieHasSie, squared = false, radiusDelayMs = 0 }: {
  label: string;
  phase: PillPhase;
  sieHasSie: boolean;
  squared?: boolean;
  radiusDelayMs?: number;
}) {
  if (label === "sieSie")        return <SieSiePill phase={phase} sieHasSie={sieHasSie} squared={squared} radiusDelayMs={radiusDelayMs} />;
  if (label === "er • sie • es") return <ErSieEsPill phase={phase} squared={squared} radiusDelayMs={radiusDelayMs} />;
  return <StagePill label={label} icon={PRONOUN_ICON[label]} phase={phase} className="text-center" squared={squared} radiusDelayMs={radiusDelayMs} />;
}

// ─── Main component ──────────────────────────────────────────────────────────

type Props = { onComplete: () => void };

export function IntroStage({ onComplete }: Props) {
  const [stepIdx, setStepIdx]     = useState(1); // step 0 disabled
  const [response, setResponse]   = useState<string | null>(null);
  const [answered, setAnswered]   = useState(false);

  // Revealed pill state
  // defStep: 0=none, 1=der blank, 2=der text, 3=die blank, 4=die text, 5=das blank, 6=das text
  const [defStep, setDefStep]     = useState(0);
  const [showIndef, setShowIndef] = useState(false);
  const [pronouns, setPronouns]   = useState<string[]>([]);
  const [sieHasSie, setSieHasSie] = useState(false);
  const [showChefHat, setShowChefHat] = useState(false);

  // der-er-link comparison overlay state
  const [showCompareOverlay, setShowCompareOverlay] = useState(false);
  const [compareScanIdx, setCompareScanIdx]         = useState(0); // 0=none 1=masc 2=fem 3=neut
  const [compareDPulse, setCompareDPulse]           = useState(false);

  // Spacing between the pronoun stack and the article block — starts large
  // enough to park the article block out of view below, and collapses to
  // PILL_GAP when the two stacks slam together.
  const [dockGap, setDockGap] = useState(DOCK_SCREEN_GAP / 0.875);

  // Once the user moves past the final pronoun question, the article columns
  // grow so the pair of them together spans the same width as the pronoun
  // stack above, and every visible pill — pronouns and articles alike —
  // straightens from the intro's full-pill shape to the cheatsheet's
  // rounded-sm corners. See `triggerPillStyleTransition`.
  const [indefColWidth, setIndefColWidth] = useState<number | null>(null);
  const [defColWidth, setDefColWidth]     = useState<number | null>(null);
  const [pillsSquared, setPillsSquared]   = useState(false);
  const pronounStackRef = useRef<HTMLDivElement>(null);
  const indefColRef     = useRef<HTMLDivElement>(null);
  const defColRef       = useRef<HTMLDivElement>(null);

  // Reveal animation
  const [revealType, setRevealType] = useState<"def" | "indef" | "pronoun" | null>(null);
  const [pillPhase, setPillPhase]   = useState<PillPhase>("text");
  const revealTimers = useRef<ReturnType<typeof setTimeout>[]>([]);
  // Separate from `revealTimers`: the post-slam width/corner animations should
  // keep running even though the user immediately clicks "Next" (which clears
  // `revealTimers`) — only unmounting the stage should cancel them.
  const slamTimers = useRef<ReturnType<typeof setTimeout>[]>([]);
  useEffect(() => () => slamTimers.current.forEach(clearTimeout), []);

  const [scale, setScale]         = useState(0.875);
  const [panY, setPanY]           = useState(0);
  const [fadingOut, setFadingOut] = useState(false);

  // Clamp the rendered scale so wide pills never overflow a narrow canvas area —
  // computeScale() only accounts for height, so this catches the width dimension.
  const canvasRef     = useRef<HTMLDivElement>(null);
  const canvasAreaRef = useRef<HTMLDivElement>(null);
  const [widthScale, setWidthScale] = useState(1);

  useEffect(() => {
    const canvas = canvasRef.current;
    const area   = canvasAreaRef.current;
    if (!canvas || !area) return;
    const measure = () => {
      const naturalW = canvas.offsetWidth;
      const availW   = area.clientWidth;
      setWidthScale(naturalW > 0 ? Math.min(1, availW / naturalW) : 1);
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(canvas);
    ro.observe(area);
    return () => ro.disconnect();
  }, [defStep, pronouns.length, showIndef, sieHasSie]);

  // Draggable card
  const [cardPos, setCardPos]     = useState<{ x: number; y: number } | null>(null);
  const dragOrigin = useRef<{ px: number; py: number; cx: number; cy: number } | null>(null);

  const step = STEPS[stepIdx];

  // `naturalHeight` is the height of the stack actually being revealed (pronouns).
  // `totalHeight` is the full canvas height, including any docked-below article
  // block — when it's larger than `naturalHeight`, the extra space is parked
  // below the viewport so the articles stay hidden until the final reveal.
  function scheduleReveal(targetScale: number, currentScale: number, hasIcon: boolean, naturalHeight?: number, totalHeight?: number) {
    let zoomIn: number;
    let panAtZoom = 0;
    let restPan = 0;

    if (hasIcon && naturalHeight) {
      const th = totalHeight ?? naturalHeight;
      const maxSafe = Math.min(1.0, 900 / naturalHeight);
      zoomIn = Math.min(0.85, maxSafe);
      // Pan targets are expressed in canvas-LOCAL pixels (distances within the
      // canvas's own unscaled coordinate space) — they're converted to actual
      // screen pixels at render time via `panY * renderedScale` (see
      // `pillCanvas`). Computing them this way — rather than baking in a scale
      // factor here — keeps them visually correct even when `renderedScale`
      // ends up clamped below `scale` by the width-overflow guard (`widthScale`):
      // whatever scale actually gets rendered, the pan still lines up with it.
      //
      // Pan so the newest pill (at the bottom of the pronoun stack) lands at
      // viewport center. Its center sits (naturalHeight - PILL_H/2) from the
      // canvas top, i.e. that far above the canvas's own vertical center (th/2).
      panAtZoom = -((naturalHeight - PILL_H / 2) - th / 2);
      // Resting pan keeps the whole pronoun stack centered (its midpoint at
      // naturalHeight/2), which pushes any docked article block below the fold.
      restPan = -(naturalHeight / 2 - th / 2);
    } else {
      zoomIn = Math.min(1.0, Math.max(currentScale + 0.05, targetScale + 0.08));
    }

    const timers = revealTimers.current;
    const t = (ms: number, fn: () => void) => { timers.push(setTimeout(fn, ms)); };

    t(280, () => {
      if (zoomIn > currentScale) setScale(zoomIn);
      setPanY(panAtZoom);
    });
    if (hasIcon) {
      t(900,  () => setPillPhase("icon"));
      t(1350, () => setPillPhase("text"));
    } else {
      t(900, () => setPillPhase("text"));
    }
    t(2200, () => { setScale(targetScale); setPanY(restPan); setRevealType(null); });
  }

  function applyReveal(idx: number, currentScale: number) {
    const s = STEPS[idx];
    revealTimers.current.forEach(clearTimeout);
    revealTimers.current = [];

    if (s.reveal === "def-articles") {
      const target = computeScale(pronouns.length, true);
      const zoomIn = Math.min(1.0, Math.max(currentScale + 0.05, target + 0.08));
      const timers = revealTimers.current;
      const t = (ms: number, fn: () => void) => { timers.push(setTimeout(fn, ms)); };
      setDefStep(1);
      setRevealType("def");
      if (zoomIn > currentScale) { t(250, () => setScale(zoomIn)); }
      t(550,  () => setDefStep(2));
      t(950,  () => setDefStep(3));
      t(1200, () => setDefStep(4));
      t(1600, () => setDefStep(5));
      t(1850, () => setDefStep(6));
      t(2400, () => { setScale(target); setRevealType(null); });
    } else if (s.reveal === "indef-articles") {
      const target = computeScale(pronouns.length, true);
      setShowIndef(true);
      setRevealType("indef");
      setPillPhase("blank");
      scheduleReveal(target, currentScale, false);
    } else if (s.reveal === "pronoun" && s.pronounLabel) {
      const nNew = pronouns.length + 1;
      const target = computeScale(nNew, false);
      const naturalHeight = nNew * (PILL_H + PILL_GAP) - PILL_GAP;
      const gap = DOCK_SCREEN_GAP / target;
      const totalHeight = naturalHeight + gap + ARTICLE_H;
      setPronouns((p) => [...p, s.pronounLabel!]);
      setDockGap(gap);
      setRevealType("pronoun");
      setPillPhase("blank");
      scheduleReveal(target, currentScale, true, naturalHeight, totalHeight);
    } else if (s.reveal === "sie-only") {
      const nNew = pronouns.length + 1;
      const target = computeScale(nNew, false);
      const naturalHeight = nNew * (PILL_H + PILL_GAP) - PILL_GAP;
      const gap = DOCK_SCREEN_GAP / target;
      const totalHeight = naturalHeight + gap + ARTICLE_H;
      setPronouns((p) => [...p, "sieSie"]);
      setSieHasSie(false);
      setDockGap(gap);
      setRevealType("pronoun");
      setPillPhase("blank");
      scheduleReveal(target, currentScale, true, naturalHeight, totalHeight);
    } else if (s.reveal === "der-er-link") {
      // Overlay showing the der/die/das ↔ er/sie/es relationship.
      // Scan beats light up each matched pair in its gender color (A+B combo),
      // then the "d" prefixes bounce to show they're the only difference.
      setRevealType(null);
      const timers = revealTimers.current;
      const t = (ms: number, fn: () => void) => { timers.push(setTimeout(fn, ms)); };
      t(0,    () => setShowCompareOverlay(true));
      t(1000, () => setCompareScanIdx(1));           // masc: der ↔ er
      t(1800, () => setCompareScanIdx(2));           // fem:  die ↔ sie
      t(2600, () => setCompareScanIdx(3));           // neut: das ↔ es
      t(3400, () => { setCompareScanIdx(0); setCompareDPulse(true); }); // d-bounce
      t(4200, () => setCompareDPulse(false));
    } else if (s.reveal === "Sie-add") {
      // Re-zoom into the "sie" pill a second time — the same zoom-in geometry
      // `scheduleReveal` uses for a freshly-revealed pill — so the formal
      // "• Sie" addition lands with emphasis, before the docked article block
      // slams up to meet the pronoun stack.
      const n = pronouns.length;
      const naturalHeight = n * (PILL_H + PILL_GAP) - PILL_GAP;
      const totalHeight = naturalHeight + dockGap + ARTICLE_H;
      const zoomIn = Math.min(0.85, Math.min(1.0, 900 / naturalHeight));
      const panAtZoom = -((naturalHeight - PILL_H / 2) - totalHeight / 2);

      setRevealType(null);

      const timers = revealTimers.current;
      const t = (ms: number, fn: () => void) => { timers.push(setTimeout(fn, ms)); };

      t(280,  () => { setScale(zoomIn); setPanY(panAtZoom); });
      t(1000, () => setSieHasSie(true));
      t(2400, () => {
        // Slam together: the docked article block slides up to meet the
        // pronoun stack while the canvas zooms out to frame the whole
        // combined column. The width-grow + corner-straightening that
        // follows is held off until the user clicks "Next" — see
        // `triggerPillStyleTransition`, fired from `handleNext` — so it
        // lands right as the "Let's go!" button appears.
        setDockGap(PILL_GAP);
        setScale(computeScale(pronouns.length, true));
        setPanY(0);
      });
    } else if (s.reveal === "chef-hat") {
      // Zoom in tight on the blank space directly above the now-fully-built
      // column — no part of it visible — then introduce the chef's hat that
      // crowns the Nominativ column on the main cheatsheet.
      const naturalHeight = pronouns.length * (PILL_H + PILL_GAP) - PILL_GAP;
      const assembledHeight = naturalHeight + PILL_GAP + ARTICLE_H;
      // Frame: bottom edge sits mid-way through the blank gap below the hat
      // (keeping the column just out of view), top edge clears the hat with
      // breathing room above it for that "blank space" feel.
      const frameBottom = -HAT_GAP_BELOW / 2;
      const frameTop = -(HAT_H + HAT_GAP_BELOW + HAT_PAD_ABOVE);
      const zoomIn = Math.min(1.0, 900 / (frameBottom - frameTop));
      const targetY = (frameTop + frameBottom) / 2;

      setRevealType(null);

      const timers = revealTimers.current;
      const t = (ms: number, fn: () => void) => { timers.push(setTimeout(fn, ms)); };

      t(280,  () => { setScale(zoomIn); setPanY(assembledHeight / 2 - targetY); });
      t(1300, () => setShowChefHat(true));
    } else if (s.reveal === null) {
      setScale(s.scaleAfter ?? 0.875);
    }
  }

  // Fired from `handleNext` the moment the user advances past the final
  // "Sie-add" question — lands right as the "Let's go!" button appears.
  // Grows the article columns to match the pronoun stack's width, and
  // straightens every visible pill's corners into the cheatsheet's style.
  function triggerPillStyleTransition() {
    slamTimers.current.forEach(clearTimeout);
    slamTimers.current = [];
    const t = (ms: number, fn: () => void) => { slamTimers.current.push(setTimeout(fn, ms)); };

    // `width` can't transition smoothly from "auto" — first lock in each
    // column's current natural width as an explicit pixel value (no visual
    // change), then on the next tick animate to the target so the browser
    // has two concrete pixel values to interpolate between.
    t(0, () => {
      setIndefColWidth(indefColRef.current?.offsetWidth ?? null);
      setDefColWidth(defColRef.current?.offsetWidth ?? null);
    });
    t(50, () => {
      const stackW = pronounStackRef.current?.offsetWidth ?? 0;
      const target = stackW > 0 ? (stackW - PILL_GAP) / 2 : null;
      setIndefColWidth(target);
      setDefColWidth(target);
    });
    // Then straighten every pill's corners — staggered top to bottom through
    // the stack via each pill's `radiusDelayMs`, the cascade spanning 0.25s.
    t(650, () => setPillsSquared(true));
  }

  // Fired from `handleNext` the moment the user advances past the chef-hat
  // step: zooms back out to frame the whole assembled column — hat now
  // crowning the top — so it visually "joins" the column via the reframe
  // alone, right before the "done" question appears.
  function triggerChefHatJoin() {
    const naturalHeight = pronouns.length * (PILL_H + PILL_GAP) - PILL_GAP;
    const assembledHeight = naturalHeight + PILL_GAP + ARTICLE_H;
    const fullHeight = assembledHeight + HAT_H + HAT_GAP_BELOW;
    const targetY = -(HAT_H + HAT_GAP_BELOW) + fullHeight / 2;
    setScale(Math.min(0.875, FILL_PX / fullHeight));
    setPanY(assembledHeight / 2 - targetY);
  }

  function handleAnswer(answer: { label: string; response: string }) {
    if (answered) return;

    if (STEPS[stepIdx].reveal === "done") {
      setFadingOut(true);
      setTimeout(() => onComplete(), 700);
      return;
    }

    applyReveal(stepIdx, scale);
    setResponse(answer.response || null);
    setAnswered(true);
  }

  function handleNext() {
    revealTimers.current.forEach(clearTimeout);
    revealTimers.current = [];
    setRevealType(null);
    setPillPhase("text");
    setDefStep((s) => s > 0 ? 6 : s);
    setResponse(null);
    setAnswered(false);
    if (STEPS[stepIdx].reveal === "der-er-link") { setShowCompareOverlay(false); setCompareScanIdx(0); setCompareDPulse(false); }
    if (STEPS[stepIdx].reveal === "Sie-add") triggerPillStyleTransition();
    if (STEPS[stepIdx].reveal === "chef-hat") triggerChefHatJoin();
    setStepIdx((i) => i + 1);
  }

  const hasPills = defStep > 0 || pronouns.length > 0;

  function onCardPointerDown(e: React.PointerEvent<HTMLDivElement>) {
    if ((e.target as HTMLElement).closest("button")) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    const rect = e.currentTarget.getBoundingClientRect();
    dragOrigin.current = { px: e.clientX, py: e.clientY, cx: rect.left, cy: rect.top };
  }

  function onCardPointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (!dragOrigin.current) return;
    setCardPos({
      x: dragOrigin.current.cx + (e.clientX - dragOrigin.current.px),
      y: dragOrigin.current.cy + (e.clientY - dragOrigin.current.py),
    });
  }

  function onCardPointerUp() { dragOrigin.current = null; }

  const cardStyle: React.CSSProperties = cardPos
    ? { top: cardPos.y, left: cardPos.x }
    : { bottom: 32, left: "50%", transform: "translateX(-50%)" };

  const renderedScale = Math.min(scale, widthScale);

  // Corner-straightening cascade (0.25s total), flowing top to bottom through
  // every visible "row" of the stack — one row per pronoun pill, plus one row
  // per side-by-side article pair (the indef/def pill sharing a row settle
  // together).
  const totalPillRows = pronouns.length + 3;
  const radiusDelay = (row: number) =>
    totalPillRows > 1 ? Math.round((row * 250) / (totalPillRows - 1)) : 0;

  const pillCanvas = hasPills && (
    <div
      ref={canvasRef}
      className="relative flex flex-col items-center"
      style={{
        // `panY` is a canvas-local pixel offset (see `scheduleReveal`) — convert
        // it to actual screen pixels using whatever scale is actually being
        // rendered, so the pan always lines up with the content even when
        // `widthScale` clamps `renderedScale` below `scale`.
        transform: `translate(0px, ${panY * renderedScale}px) scale(${renderedScale})`,
        transformOrigin: "center center",
        transition: "transform 1.1s cubic-bezier(0.22,1,0.36,1)",
      }}
    >
      {showChefHat && (
        <div
          className="absolute left-0 right-0 flex flex-col items-center justify-center"
          style={{ top: -(HAT_H + HAT_GAP_BELOW), height: HAT_H, ...POP_ANIM }}
        >
          <img
            src={chefHatSvg}
            alt="Chef hat with sein cloud — Nominativ WER (subject / to be)"
            className="h-[50rem] object-contain"
            draggable={false}
          />
        </div>
      )}
      {pronouns.length > 0 && (
        <div ref={pronounStackRef} className="flex flex-col items-stretch gap-6 w-full">
          {pronouns.map((p, i) => {
            const isNewest = i === pronouns.length - 1;
            const phase: PillPhase = (isNewest && revealType === "pronoun") ? pillPhase : "text";
            return (
              <PronounPill
                key={p === "sieSie" ? "sieSie" : p}
                label={p}
                phase={phase}
                sieHasSie={sieHasSie}
                squared={pillsSquared}
                radiusDelayMs={radiusDelay(i)}
              />
            );
          })}
        </div>
      )}
      {defStep > 0 && (
        <div
          className="flex gap-6"
          style={{
            marginTop: pronouns.length > 0 ? dockGap : 0,
            transition: "margin-top 1.1s cubic-bezier(0.22,1,0.36,1)",
          }}
        >
          {showIndef && (
            <div
              ref={indefColRef}
              className="flex flex-col gap-6"
              style={{ width: indefColWidth ?? undefined, transition: "width 0.6s cubic-bezier(0.22,1,0.36,1)" }}
            >
              <StagePill label="ein"  phase={revealType === "indef" ? pillPhase : "text"} squared={pillsSquared} radiusDelayMs={radiusDelay(pronouns.length + 0)} />
              <StagePill label="eine" phase={revealType === "indef" ? pillPhase : "text"} squared={pillsSquared} radiusDelayMs={radiusDelay(pronouns.length + 1)} />
              <StagePill label="ein"  phase={revealType === "indef" ? pillPhase : "text"} squared={pillsSquared} radiusDelayMs={radiusDelay(pronouns.length + 2)} />
            </div>
          )}
          <div
            ref={defColRef}
            className="flex flex-col gap-6"
            style={{ width: defColWidth ?? undefined, transition: "width 0.6s cubic-bezier(0.22,1,0.36,1)" }}
          >
            {defStep >= 1 && <StagePill label="der" phase={defStep < 2 ? "blank" : "text"} squared={pillsSquared} radiusDelayMs={radiusDelay(pronouns.length + 0)} />}
            {defStep >= 3 && <StagePill label="die" phase={defStep < 4 ? "blank" : "text"} squared={pillsSquared} radiusDelayMs={radiusDelay(pronouns.length + 1)} />}
            {defStep >= 5 && <StagePill label="das" phase={defStep < 6 ? "blank" : "text"} squared={pillsSquared} radiusDelayMs={radiusDelay(pronouns.length + 2)} />}
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div
      className="fixed inset-0 z-[60] bg-poster-bg flex flex-col md:flex-row"
      style={{ opacity: fadingOut ? 0 : 1, transition: fadingOut ? "opacity 0.7s ease" : undefined }}
    >

      {/* ── Desktop left sidebar (md+) ── */}
      <div className="hidden md:flex flex-col justify-center w-[26rem] shrink-0 h-full px-12 py-16 bg-white/75 backdrop-blur-sm border-r border-poster-ink/10">
        <div className="space-y-8">
          {!answered && (
            <p className="text-2xl font-bold text-poster-ink leading-snug">
              {step.question}
            </p>
          )}
          {!answered ? (
            <div className="flex flex-col gap-3">
              {step.answers.map((ans) => (
                <button
                  key={ans.label}
                  onClick={() => handleAnswer(ans)}
                  className="w-full py-3 px-5 rounded-2xl bg-poster-teal/10 hover:bg-poster-teal/20 active:bg-poster-teal/30 text-poster-ink font-medium transition-colors text-left text-base"
                >
                  {ans.label}
                </button>
              ))}
            </div>
          ) : (
            <div className="space-y-5 intro-response-appear">
              {response && (
                <p className="text-base text-poster-ink/70 leading-relaxed">
                  {response}
                </p>
              )}
              <button
                onClick={handleNext}
                className="w-full py-3 px-5 rounded-2xl bg-poster-teal text-white font-semibold hover:bg-poster-teal/90 active:bg-poster-teal/80 transition-colors text-base"
              >
                Next →
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── Pill canvas area ── */}
      <div ref={canvasAreaRef} className="relative flex-1 min-w-0 flex items-center justify-center overflow-hidden">
        {pillCanvas}
        {showCompareOverlay && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-poster-bg intro-response-appear">
            <div className="flex flex-col items-center gap-6 scale-[0.65] origin-center">
              <CompareDefPill scanIdx={compareScanIdx} dPulse={compareDPulse} />
              <CompareErSieEsPill scanIdx={compareScanIdx} />
            </div>
          </div>
        )}
      </div>

      {/* ── Mobile only: spacer + draggable bottom card ── */}
      <div className="h-64 shrink-0 md:hidden" />

      {stepIdx < STEPS.length && (
        <div
          className="md:hidden fixed z-50 bg-white rounded-2xl shadow-2xl border border-poster-ink/10 w-full max-w-sm touch-none select-none"
          style={cardStyle}
          onPointerDown={onCardPointerDown}
          onPointerMove={onCardPointerMove}
          onPointerUp={onCardPointerUp}
          onPointerCancel={onCardPointerUp}
        >
          <div className="flex justify-center pt-3 pb-1 cursor-grab active:cursor-grabbing">
            <div className="w-8 h-1 rounded-full bg-poster-ink/20" />
          </div>
          <div className="px-6 pb-5 space-y-4">
            {!answered && (
              <p className="text-lg font-semibold text-poster-ink text-center leading-snug">
                {step.question}
              </p>
            )}
            {!answered ? (
              <div className="flex flex-col gap-2">
                {step.answers.map((ans) => (
                  <button
                    key={ans.label}
                    onClick={() => handleAnswer(ans)}
                    className="w-full py-2 px-4 rounded-xl bg-poster-teal/10 hover:bg-poster-teal/20 active:bg-poster-teal/30 text-poster-ink font-medium transition-colors text-left"
                  >
                    {ans.label}
                  </button>
                ))}
              </div>
            ) : (
              <div className="space-y-3 intro-response-appear">
                {response && (
                  <p className="text-sm text-poster-ink/70 text-center leading-relaxed">
                    {response}
                  </p>
                )}
                <button
                  onClick={handleNext}
                  className="w-full py-2 px-4 rounded-xl bg-poster-teal text-white font-semibold hover:bg-poster-teal/90 active:bg-poster-teal/80 transition-colors"
                >
                  Next →
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
