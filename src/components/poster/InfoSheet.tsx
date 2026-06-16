import { useEffect, useState } from "react";
import { CASE_INFO, type CaseKey, type SubWord, type WordDatum } from "./wordData";
import type { GroupInfo } from "./groupData";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronDown, ChevronUp, ChevronRight, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { colorizeSentence, type CaseColorMode } from "./colorizeSentence";
import { WORD_PERSON, SUB_PERSON, renderPerson } from "./personData";
import { buildMorphInfo } from "./morphExamples";

export type SheetSide = "bottom" | "left" | "right";

type Props = {
  open: boolean;
  level: 1 | 2 | 3 | 4;
  activeCase: CaseKey;
  group?: GroupInfo | null;
  word?: WordDatum | null;
  sub?: SubWord | null;
  side: SheetSide;
  anchorRect?: DOMRect | null;
  caseColorMode?: CaseColorMode | null;
  /** When set + word is a possessive, render the morph-context view. */
  morphContextId?: string | null;
  /** When true, default the sheet to collapsed (sliver) so the quiz card has room. */
  quizActive?: boolean;
  /** Lifts the sheet off the bottom edge — use when a fixed footer sits below. */
  bottomOffset?: number;
  /** Mobile bottom-sheet card layout: 1 = split color | 2 = chips+example | 3 = two-col | 4 = floating chip */
  infoLayout?: number;
  /** When true, the colored block pulses in sync with the pinned possessive pill. */
  isPinned?: boolean;
  onBack: () => void;
  onClose: () => void;
};

const TYPE_LABEL: Record<string, string> = {
  pronoun: "Pronoun", "article-def": "Definite article", "article-indef": "Indefinite article",
  preposition: "Preposition", "preposition-2way": "Two-way preposition", ending: "Verb ending",
  possessive: "Possessive", header: "Question word", verb: "Verb",
};
const GENDER_LABEL: Record<SubWord["gender"], string> = {
  m: "masculine", f: "feminine", n: "neuter", pl: "plural", formal: "formal",
};

export const InfoSheet = ({
  open, level, activeCase, group, word, sub, side, anchorRect = null, caseColorMode = null,
  morphContextId = null, quizActive = false, bottomOffset = 0, infoLayout = 1, isPinned = false, onBack, onClose,
}: Props) => {
  const [collapsed, setCollapsed] = useState(quizActive);
  const [morphTab, setMorphTab] = useState<"breakdown" | "explanation">("breakdown");
  // When content changes: collapsed by default during quiz, expanded otherwise.
  useEffect(() => { setCollapsed(quizActive); setMorphTab("breakdown"); }, [level, group?.id, word?.id, sub?.token, morphContextId, quizActive]);

  // Detect morph context. At L3 the parent stem is used; at L4 the specific
  // sub-token is the stem (e.g. "ihr" inside pos-sein → ihren).
  const morph = (word && word.id.startsWith("pos-") && morphContextId)
    ? (level === 3
        ? buildMorphInfo(word.id, morphContextId)
        : level === 4 && sub
          ? buildMorphInfo(word.id, morphContextId, sub.token)
          : null)
    : null;

  // Detect base possessive view (no morph, no inherent case) — covers L3 pos-*
  // pills and L4 sub-pills (sein/ihr/sein/ihr/Ihr) inside pos-* without sticky context.
  const isPossessiveBase = !morph && word && word.id.startsWith("pos-") && (level === 3 || level === 4);

  // Effective case for color/accent: morph overrides, possessive base = neutral.
  const effectiveCase: CaseKey | null = morph ? morph.caseKey : (isPossessiveBase ? null : activeCase);

  const info = effectiveCase ? CASE_INFO[effectiveCase] : CASE_INFO[activeCase];
  const accent =
    effectiveCase === "akk" ? "border-poster-green text-poster-green"
    : effectiveCase === "nom" ? "border-poster-yellow text-poster-yellow"
    : effectiveCase === "dat" ? "border-poster-purple text-poster-purple"
    : "border-poster-ink/30 text-poster-ink";

  const renderDe = (de: string, hint?: CaseKey | null) =>
    caseColorMode ? colorizeSentence(de, caseColorMode, hint ?? effectiveCase ?? activeCase) : de;

  const caseBg =
    effectiveCase === "akk" ? "bg-poster-green" :
    effectiveCase === "nom" ? "bg-poster-yellow" :
    effectiveCase === "dat" ? "bg-poster-purple" :
    word?.id.startsWith("pos-") ? "bg-poster-red-deep" :
    "bg-poster-ink/20";
  const caseBgLight =
    effectiveCase === "akk" ? "bg-poster-green/10" :
    effectiveCase === "nom" ? "bg-poster-yellow/10" :
    effectiveCase === "dat" ? "bg-poster-purple/10" : "bg-poster-ink/5";
  const caseTextColor =
    effectiveCase === "akk" ? "text-poster-green" :
    effectiveCase === "nom" ? "text-poster-yellow" :
    effectiveCase === "dat" ? "text-poster-purple" :
    word?.id.startsWith("pos-") ? "text-poster-red-deep" :
    "text-poster-ink/70";

  // Position + size
  const isFloat = !!anchorRect;
  const sliver = 32;

  const floatStyle: React.CSSProperties = (() => {
    if (!isFloat || !anchorRect) return {};
    const CARD_W = 340;
    const GAP = 14;
    const MARGIN = 8;
    const rightSpace = window.innerWidth - anchorRect.right - GAP;
    const showRight = rightSpace >= CARD_W || rightSpace >= anchorRect.left - GAP;
    const left = showRight ? anchorRect.right + GAP : undefined;
    const right = showRight ? undefined : window.innerWidth - anchorRect.left + GAP;
    // Flip vertically: anchor in lower half → card grows upward from anchor bottom
    const anchorMidY = anchorRect.top + anchorRect.height / 2;
    const flipUp = anchorMidY > window.innerHeight / 2;
    const top = flipUp ? undefined : Math.max(MARGIN, anchorRect.top);
    const bottom = flipUp ? Math.max(MARGIN, window.innerHeight - anchorRect.bottom) : undefined;
    return { left, right, top, bottom, width: CARD_W };
  })();

  const transformStyle: React.CSSProperties = (() => {
    if (!open) {
      if (side === "bottom") return { transform: "translateY(100%)" };
      if (side === "left")   return { transform: "translateX(-100%)" };
      return { transform: "translateX(100%)" };
    }
    if (collapsed) {
      if (side === "bottom") return { transform: `translateY(calc(100% - ${sliver}px))` };
      if (side === "left")   return { transform: `translateX(calc(-100% + ${sliver}px))` };
      return { transform: `translateX(calc(100% - ${sliver}px))` };
    }
    return { transform: "translate(0,0)" };
  })();

  const wrapperCls = cn(
    "fixed z-30 bg-white pointer-events-auto flex flex-col",
    isFloat
      ? cn("rounded-xl shadow-2xl border-t-4 transition-opacity duration-150 max-h-[70vh] overflow-y-auto", accent)
      : cn("transition-transform duration-300 ease-out",
          side === "bottom" && "left-0 right-0 bottom-0 rounded-t-2xl border-t-4",
          side === "left"   && "left-0 top-0 rounded-r-2xl border-r-4",
          side === "right"  && "right-0 top-0 rounded-l-2xl border-l-4",
          accent),
  );
  const wrapperStyle: React.CSSProperties = isFloat
    ? { ...floatStyle, opacity: open ? 1 : 0, pointerEvents: open ? "auto" : "none" }
    : {
        ...transformStyle,
        ...(side === "bottom"
          ? { maxHeight: "42vh", bottom: bottomOffset }
          : { maxWidth: "min(33.333vw, 480px)", maxHeight: "100vh" }),
      };

  const ToggleIcon = collapsed
    ? (side === "bottom" ? ChevronUp : side === "left" ? ChevronRight : ChevronLeft)
    : (side === "bottom" ? ChevronDown : side === "left" ? ChevronLeft : ChevronRight);

  // Person line for current word/sub
  const personForCurrent: string | null = (() => {
    if (level === 4 && word && sub) {
      const subs = SUB_PERSON[word.id];
      const idx = word.subWords?.findIndex((s) => s.token === sub.token && s.gender === sub.gender) ?? -1;
      return subs && idx >= 0 ? subs[idx] : null;
    }
    if (level === 3 && word) return WORD_PERSON[word.id] ?? null;
    return null;
  })();

  const isMobileWord = side === "bottom" && level === 3 && word && !morph;
  const isMobileMorph = side === "bottom" && level === 3 && word && !!morph;

  return (
    <div className={wrapperCls} style={wrapperStyle} data-no-reset onClick={(e) => e.stopPropagation()}>
      {/* Collapse handle — hidden in floating mode */}
      {!isFloat && <button
        onClick={() => setCollapsed((c) => !c)}
        aria-label={collapsed ? "Expand" : "Collapse"}
        className={cn(
          "absolute z-10 bg-white shadow-md flex items-center justify-center text-poster-ink/70 hover:text-poster-ink",
          side === "bottom" && "left-1/2 -translate-x-1/2 -top-3 w-12 h-6 rounded-t-md border border-b-0 border-poster-ink/15",
          side === "left"   && "top-1/2 -translate-y-1/2 -right-3 w-6 h-12 rounded-r-md border border-l-0 border-poster-ink/15",
          side === "right"  && "top-1/2 -translate-y-1/2 -left-3 w-6 h-12 rounded-l-md border border-r-0 border-poster-ink/15",
        )}
      >
        <ToggleIcon className="h-4 w-4" />
      </button>}

      {/* ── Mobile morph essentials card (possessive + ein-article context) ── */}
      {isMobileMorph ? (
        <div className="min-h-0 flex-1 overflow-hidden relative">
          <div className="flex h-full">
            <button onClick={onClose} className="absolute top-3 right-3 z-10 text-white/60 hover:text-white"><X className="h-4 w-4" /></button>
            {/* Left: solid color — case name, stem+ending, base word */}
            <div className={cn("w-[42%] shrink-0 flex flex-col items-center px-3 py-3", caseBg, isPinned && "poss-pinned")}>
              <div className="text-[9px] font-bold uppercase tracking-widest text-white/70">{morph.caseName}</div>
              <div className="flex-1 flex items-center justify-center">
                <div className="font-slab font-bold text-3xl text-white text-center leading-tight">
                  {morph.stem}<span className="border-b-[3px] border-white/75">{morph.ending || "∅"}</span>
                </div>
              </div>
              <div className="text-[10px] text-white/60 text-center">{word.display} = {morph.stemEn}</div>
            </div>
            {/* Right: white — gender, trigger, example */}
            <div className="flex-1 px-4 py-3 flex flex-col justify-center gap-1.5 min-w-0">
              <div className={cn("text-[9px] font-bold uppercase tracking-wide", caseTextColor)}>{morph.genderName}</div>
              <div className="text-sm text-poster-ink leading-snug">
                from <em className="font-semibold">{morph.triggerDisplay}</em>{" "}
                <span className="text-poster-ink/50">→ {morph.ending ? <>-<strong>{morph.ending}</strong></> : "no ending"}</span>
              </div>
              {morph.exampleDe && (
                <div className="mt-0.5">
                  <div className="font-slab text-xs text-poster-ink leading-snug">{renderDe(morph.exampleDe, morph.caseKey)}</div>
                  <div className="text-[10px] text-poster-ink/50 italic">{morph.exampleEn}</div>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : isMobileWord ? (
        <div className="min-h-0 flex-1 overflow-hidden relative">

          {/* Layout 1: Split color — left half is case color, right is info */}
          {infoLayout === 1 && (
            <div className="flex h-full">
              <div className={cn("w-[40%] shrink-0 flex flex-col items-center justify-center px-3 py-4 gap-1.5", caseBg)}>
                <div className="text-[9px] font-bold uppercase tracking-widest text-white/60">{info.name}</div>
                <div className="font-slab font-bold text-3xl text-white text-center leading-tight">{word.display}</div>
                <div className="text-[10px] text-white/55 text-center">{TYPE_LABEL[word.type] ?? word.type}</div>
              </div>
              <div className="flex-1 min-w-0 flex flex-col px-4 py-3 gap-1.5">
                <div className="flex items-start justify-between">
                  <div />
                  <button onClick={onClose} className="text-poster-ink/40 hover:text-poster-ink shrink-0 -mr-1"><X className="h-4 w-4" /></button>
                </div>
                <div className="font-display font-bold text-xl text-poster-ink leading-tight mt-1">{word.translation}</div>
                {word.example && (
                  <div className="flex-1 flex flex-col justify-end gap-0.5">
                    <div className="text-xs text-poster-ink/65 italic leading-snug">{word.example.de}</div>
                    <div className="text-[10px] text-poster-ink/40">{word.example.en}</div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Layout 2: Stat chips + example card */}
          {infoLayout === 2 && (
            <div className="flex flex-col h-full px-4 py-3 gap-2.5">
              <div className="flex items-center gap-2">
                <div className="flex flex-wrap gap-1.5 flex-1 min-w-0">
                  {effectiveCase && (
                    <span className={cn("px-2.5 py-0.5 rounded-full text-xs font-bold text-white", caseBg)}>
                      {effectiveCase.toUpperCase()}
                    </span>
                  )}
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-poster-ink/10 text-poster-ink">
                    {TYPE_LABEL[word.type] ?? word.type}
                  </span>
                </div>
                <button onClick={onClose} className="text-poster-ink/40 hover:text-poster-ink shrink-0"><X className="h-4 w-4" /></button>
              </div>
              <div className="h-px bg-poster-ink/10" />
              {word.example ? (
                <div className={cn("flex-1 rounded-xl px-3 py-2.5 flex flex-col justify-center gap-1", caseBgLight)}>
                  <div className="font-slab text-base text-poster-ink">{renderDe(word.example.de, word.case)}</div>
                  <div className="text-xs text-poster-ink/55 italic">{word.example.en}</div>
                </div>
              ) : (
                <div className="flex-1 flex items-center">
                  <div className="font-display font-bold text-xl text-poster-ink">{word.translation}</div>
                </div>
              )}
              {word.note && <div className="text-[11px] text-poster-ink/50 italic">{word.note}</div>}
            </div>
          )}

          {/* Layout 3: Two-column grammar / example */}
          {infoLayout === 3 && (
            <div className="flex h-full m-2 rounded-xl overflow-hidden border border-poster-ink/10">
              <button onClick={onClose} className="absolute top-3 right-3 z-10 text-poster-ink/40 hover:text-poster-ink"><X className="h-4 w-4" /></button>
              <div className={cn("w-[40%] shrink-0 flex flex-col px-3 py-3 gap-1 border-r border-poster-ink/10", caseBgLight)}>
                <div className={cn("text-[9px] font-bold uppercase tracking-widest", caseTextColor)}>{info.name}</div>
                <div className="font-slab font-bold text-2xl text-poster-ink mt-1 leading-tight">{word.display}</div>
                <div className="text-xs text-poster-ink/55">{TYPE_LABEL[word.type] ?? word.type}</div>
                {word.note && <div className="text-[11px] text-poster-ink/45 italic mt-1">{word.note}</div>}
              </div>
              <div className="flex-1 px-3 py-3 flex flex-col justify-center gap-1.5 min-w-0 pr-8">
                {word.example ? (
                  <>
                    <div className="font-slab text-sm text-poster-ink leading-snug">{renderDe(word.example.de, word.case)}</div>
                    <div className="text-xs text-poster-ink/55 italic">{word.example.en}</div>
                  </>
                ) : (
                  <div className="font-display font-bold text-lg text-poster-ink">{word.translation}</div>
                )}
              </div>
            </div>
          )}

          {/* Layout 5: Full-height color split inside a rounded bordered card */}
          {infoLayout === 5 && (
            <div className="flex h-full m-2 rounded-xl overflow-hidden border border-poster-ink/10 shadow-sm">
              <button onClick={onClose} className="absolute top-3 right-3 z-10 text-white/60 hover:text-white"><X className="h-4 w-4" /></button>
              {/* Left: solid color — case name top, word centered, type bottom */}
              <div className={cn("w-[42%] shrink-0 flex flex-col items-center px-3 py-4", caseBg, isPinned && "poss-pinned")}>
                <div className="text-xs font-bold uppercase tracking-widest text-white">{info.name}</div>
                <div className="flex-1 flex items-center justify-center">
                  <div className="font-slab font-bold text-4xl text-white text-center leading-tight">{word.display}</div>
                </div>
                <div className="text-xs font-bold text-white text-center">{TYPE_LABEL[word.type] ?? word.type}</div>
              </div>
              {/* Right: example only */}
              <div className="flex-1 px-4 py-4 flex flex-col justify-center gap-2 min-w-0 bg-white">
                {word.example ? (
                  <>
                    <div className="font-slab text-base text-poster-ink leading-snug">{renderDe(word.example.de, word.case)}</div>
                    <div className="text-[13px] text-poster-ink/50 italic">{word.example.en}</div>
                  </>
                ) : (
                  <div className="font-display font-bold text-xl text-poster-ink">{word.translation}</div>
                )}
                {word.note && <div className="text-xs text-poster-ink/50 italic mt-1">{word.note}</div>}
              </div>
            </div>
          )}

          {/* Layout 4: Floating chip on tinted background */}
          {infoLayout === 4 && (
            <div className={cn("flex h-full gap-3 px-3 py-3 items-stretch", caseBgLight)}>
              <button onClick={onClose} className="absolute top-3 right-3 z-10 text-poster-ink/40 hover:text-poster-ink"><X className="h-4 w-4" /></button>
              <div className={cn("w-[52px] shrink-0 rounded-xl flex items-center justify-center font-slab font-bold text-white text-xl shadow-lg", caseBg)}>
                {word.display}
              </div>
              <div className="flex-1 min-w-0 pr-6 flex flex-col justify-center gap-1">
                <div className="font-display font-bold text-xl text-poster-ink leading-tight">{word.translation}</div>
                <div className="text-xs text-poster-ink/50">{TYPE_LABEL[word.type] ?? word.type} · {info.name}</div>
                {word.example && (
                  <div className="text-[11px] text-poster-ink/65 italic mt-1 leading-snug">{word.example.de}</div>
                )}
              </div>
            </div>
          )}

        </div>
      ) : (

      /* ── Standard layout ────────────────────────────────────────────────── */
      <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            {level > 1 && (
              <button onClick={onBack} className="inline-flex items-center text-xs text-poster-ink/60 mb-1 active:scale-95">
                <ChevronLeft className="h-3.5 w-3.5" />
                {level === 4 && word ? `Back to ${word.display}` : level === 3 && group ? `Back to ${group.name}` : `Back to ${info.name}`}
              </button>
            )}
            <div className="font-display font-bold text-lg text-poster-ink leading-tight">
              {level === 1 && info.name}
              {level === 2 && (group?.name ?? info.name)}
              {level === 3 && (morph ? morph.form : (word?.display ?? "—"))}
              {level === 4 && (morph ? morph.form : (sub?.token ?? "—"))}
              <span className="ml-2 text-xs font-body font-normal text-poster-ink/60">
                {level === 1
                  ? info.questions
                  : morph
                    ? `${morph.caseName} · ${morph.genderName}`
                    : level === 4 && sub
                      ? GENDER_LABEL[sub.gender]
                      : isPossessiveBase
                        ? "Possessive"
                        : info.name}
              </span>
            </div>
            {personForCurrent && (
              <div className="text-[11px] text-poster-ink/70 mt-0.5">{renderPerson(personForCurrent)}</div>
            )}
          </div>
          <Button size="icon" variant="ghost" onClick={onClose} className="h-8 w-8 shrink-0 text-poster-ink/60" aria-label="Close">
            <X className="h-4 w-4" />
          </Button>
        </div>

        {level === 1 && (
          <div className="mt-2 text-sm text-poster-ink/80 leading-snug space-y-1.5">
            <div><span className="font-semibold">{info.english}</span> · {info.role}</div>
            <div className="text-poster-ink/70">{info.rule}</div>
            <div className="bg-poster-bg rounded-lg px-3 py-2 mt-2 text-poster-ink/80 text-xs italic">{info.iconHint}</div>
          </div>
        )}
        {level === 2 && group && (
          <div className="mt-2 text-sm text-poster-ink/80">{group.description}</div>
        )}

        {(level === 3 || level === 4) && morph && (
          <div className="mt-3 text-sm text-poster-ink/80">
            <div className="flex gap-1 border-b border-poster-ink/10 mb-3">
              {(["breakdown", "explanation"] as const).map((t) => (
                <button key={t} onClick={() => setMorphTab(t)}
                  className={cn("px-3 py-1.5 text-xs font-semibold rounded-t-md transition-colors",
                    morphTab === t ? "bg-poster-bg text-poster-ink border-b-2 border-poster-ink" : "text-poster-ink/50 hover:text-poster-ink/80")}>
                  {t === "breakdown" ? "Breakdown" : "Explanation"}
                </button>
              ))}
            </div>
            {morphTab === "breakdown" && (
              <div className="space-y-2">
                <div className="bg-poster-bg rounded-lg px-3 py-2 text-sm">
                  <div className="font-slab text-poster-ink">{renderDe(morph.exampleDe, morph.caseKey)}</div>
                  <div className="text-poster-ink/60 italic">{morph.exampleEn}</div>
                </div>
                <div className="font-slab text-base text-poster-ink">
                  <span>{morph.stem}</span><span className="font-bold">{morph.ending || "∅"}</span>
                </div>
                <div className="space-y-1.5 pl-1">
                  <div className="flex gap-2">
                    <span className="font-mono text-poster-ink font-semibold w-16 shrink-0">{morph.stem}-</span>
                    <span className="text-poster-ink/75">stem — {morph.stemEn} ({morph.stemPerson})</span>
                  </div>
                  <div className="flex gap-2">
                    <span className="font-mono text-poster-ink font-semibold w-16 shrink-0">{morph.ending ? `-${morph.ending}` : "∅"}</span>
                    <span className="text-poster-ink/75">
                      {morph.ending
                        ? <>{morph.genderName} {morph.caseName} ending — because the noun (<em>{morph.nounDe}</em>, "{morph.nounEn}") is {morph.genderName}. Copied from <em>{morph.triggerDisplay}</em>.</>
                        : <>no ending — <em>{morph.triggerDisplay}</em> takes none in {morph.genderName} {morph.caseName} (the noun <em>{morph.nounDe}</em>, "{morph.nounEn}", is {morph.genderName}).</>}
                    </span>
                  </div>
                </div>
              </div>
            )}
            {morphTab === "explanation" && (
              <div className="space-y-2">
                <p className="leading-snug">
                  <strong className="text-poster-ink">{morph.form}</strong> = "{morph.stemEn}" with the {morph.genderName} {morph.caseName}{" "}
                  ending <strong>{morph.ending ? `-${morph.ending}` : "(none)"}</strong>.
                </p>
                <p className="leading-snug text-poster-ink/75">
                  You clicked <em>{morph.triggerDisplay}</em>, the indefinite article for {morph.genderName} {morph.caseName}. The {morph.genderName} part comes from the noun being modified — here <em>{morph.nounDe}</em> ("{morph.nounEn}"), which is {morph.genderName} in German.
                  {morph.ending
                    ? <> Every possessive in the row mirrors that ending, so the stem <strong>{morph.stem}-</strong> takes <strong>-{morph.ending}</strong> to agree with <em>{morph.nounDe}</em>.</>
                    : <> Since <em>{morph.triggerDisplay}</em> takes no ending in this slot, possessives stay in their bare stem form — just say <strong>{morph.form}</strong>.</>}
                  {morph.contracted && <> Note: <em>euer</em> drops its middle <em>e</em> when an ending is added → <strong>eur-</strong>.</>}
                </p>
                <div className="bg-poster-bg rounded-lg px-3 py-2 mt-2 text-sm">
                  <div className="font-slab text-poster-ink">{renderDe(morph.exampleDe, morph.caseKey)}</div>
                  <div className="text-poster-ink/60 italic">{morph.exampleEn}</div>
                </div>
              </div>
            )}
          </div>
        )}

        {level === 3 && word && !morph && (
          <div className="mt-2 text-sm text-poster-ink/80 space-y-1.5">
            <div>
              <span className="font-semibold text-poster-ink">{word.translation}</span>
              <span className="text-poster-ink/50 text-xs"> · {TYPE_LABEL[word.type] ?? word.type}</span>
            </div>
            {isPossessiveBase && (
              <div className="text-poster-ink/70 text-xs italic">Endings change with the noun's case + gender. Example below uses nominative.</div>
            )}
            {word.note && <div className="text-poster-ink/70">{word.note}</div>}
            {word.example && (
              <div className="bg-poster-bg rounded-lg px-3 py-2 mt-2 text-sm">
                <div className="font-slab text-poster-ink">{renderDe(word.example.de, word.case)}</div>
                <div className="text-poster-ink/60 italic">{word.example.en}</div>
              </div>
            )}
          </div>
        )}
        {level === 4 && sub && !morph && (
          <div className="mt-2 text-sm text-poster-ink/80 space-y-1.5">
            <div>
              <span className="font-semibold text-poster-ink">{sub.translation}</span>
              <span className="text-poster-ink/50 text-xs"> · {GENDER_LABEL[sub.gender]}</span>
            </div>
            {sub.note && <div className="text-poster-ink/70">{sub.note}</div>}
            {sub.example && (
              <div className="bg-poster-bg rounded-lg px-3 py-2 mt-2 text-sm">
                <div className="font-slab text-poster-ink">{renderDe(sub.example.de, word?.case)}</div>
                <div className="text-poster-ink/60 italic">{sub.example.en}</div>
              </div>
            )}
          </div>
        )}
      </div>
      )}
    </div>
  );
};
