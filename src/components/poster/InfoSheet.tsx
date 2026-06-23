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
  caseColorMode?: CaseColorMode | null;
  /** When set + word is a possessive, render the morph-context view. */
  morphContextId?: string | null;
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
  open, level, activeCase, group, word, sub, side, caseColorMode = null,
  morphContextId = null, onBack, onClose,
}: Props) => {
  const [collapsed, setCollapsed] = useState(false);
  const [morphTab, setMorphTab] = useState<"breakdown" | "explanation">("breakdown");
  // Auto-expand and reset morph tab when content changes
  useEffect(() => { setCollapsed(false); setMorphTab("breakdown"); }, [level, group?.id, word?.id, sub?.token, morphContextId]);

  // Detect morph context (possessive opened in the shadow of an ein-article click).
  const morph = (level === 3 && word && word.id.startsWith("pos-") && morphContextId)
    ? buildMorphInfo(word.id, morphContextId)
    : null;

  // Detect base possessive view (no morph, no inherent case).
  const isPossessiveBase = level === 3 && word && word.id.startsWith("pos-") && !morph;

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

  // Position + size
  const sliver = 32;
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
    "fixed z-30 bg-white shadow-2xl pointer-events-auto transition-transform duration-300 ease-out flex flex-col",
    side === "bottom" && "left-0 right-0 bottom-0 rounded-t-2xl border-t-4",
    side === "left"   && "left-0 top-0 rounded-r-2xl border-r-4",
    side === "right"  && "right-0 top-0 rounded-l-2xl border-l-4",
    accent,
  );
  const wrapperStyle: React.CSSProperties = {
    ...transformStyle,
    ...(side === "bottom"
      ? { maxHeight: "33.333vh" }
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

  return (
    <div className={wrapperCls} style={wrapperStyle} data-no-reset onClick={(e) => e.stopPropagation()}>
      {/* Collapse handle */}
      <button
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
      </button>

      <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            {level > 1 && (
              <button
                onClick={onBack}
                className="inline-flex items-center text-xs text-poster-ink/60 mb-1 active:scale-95"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
                {level === 4 && word ? `Back to ${word.display}` : level === 3 && group ? `Back to ${group.name}` : `Back to ${info.name}`}
              </button>
            )}
            <div className="font-display font-bold text-lg text-poster-ink leading-tight">
              {level === 1 && info.name}
              {level === 2 && (group?.name ?? info.name)}
              {level === 3 && (morph ? morph.form : (word?.display ?? "—"))}
              {level === 4 && (sub?.token ?? "—")}
              <span className="ml-2 text-xs font-body font-normal text-poster-ink/60">
                {level === 1
                  ? info.questions
                  : level === 4 && sub
                    ? GENDER_LABEL[sub.gender]
                    : isPossessiveBase
                      ? "Possessive"
                      : morph
                        ? `${morph.caseName} · ${morph.genderName}`
                        : info.name}
              </span>
            </div>
            {personForCurrent && (
              <div className="text-[11px] text-poster-ink/70 mt-0.5">
                {renderPerson(personForCurrent)}
              </div>
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
            <div className="bg-poster-bg rounded-lg px-3 py-2 mt-2 text-poster-ink/80 text-xs italic">
              {info.iconHint}
            </div>
          </div>
        )}
        {level === 2 && group && (
          <div className="mt-2 text-sm text-poster-ink/80">{group.description}</div>
        )}

        {/* Level 3: morph-context view */}
        {level === 3 && morph && (
          <div className="mt-3 text-sm text-poster-ink/80">
            {/* Tabs */}
            <div className="flex gap-1 border-b border-poster-ink/10 mb-3">
              {(["breakdown", "explanation"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setMorphTab(t)}
                  className={cn(
                    "px-3 py-1.5 text-xs font-semibold rounded-t-md transition-colors",
                    morphTab === t
                      ? "bg-poster-bg text-poster-ink border-b-2 border-poster-ink"
                      : "text-poster-ink/50 hover:text-poster-ink/80",
                  )}
                >
                  {t === "breakdown" ? "Breakdown" : "Explanation"}
                </button>
              ))}
            </div>

            {morphTab === "breakdown" && (
              <div className="space-y-2">
                <div className="font-slab text-base text-poster-ink">
                  <span>{morph.stem}</span>
                  <span className="font-bold text-poster-ink">{morph.ending || "∅"}</span>
                </div>
                <div className="space-y-1.5 pl-1">
                  <div className="flex gap-2">
                    <span className="font-mono text-poster-ink font-semibold w-16 shrink-0">{morph.stem}-</span>
                    <span className="text-poster-ink/75">stem — {morph.stemEn} ({morph.stemPerson})</span>
                  </div>
                  <div className="flex gap-2">
                    <span className="font-mono text-poster-ink font-semibold w-16 shrink-0">
                      {morph.ending ? `-${morph.ending}` : "∅"}
                    </span>
                    <span className="text-poster-ink/75">
                      {morph.ending
                        ? <>{morph.genderName} {morph.caseName} ending — because the noun (<em>{morph.nounDe}</em>, "{morph.nounEn}") is {morph.genderName}. Copied from <em>{morph.triggerDisplay}</em>.</>
                        : <>no ending — <em>{morph.triggerDisplay}</em> takes none in {morph.genderName} {morph.caseName} (the noun <em>{morph.nounDe}</em>, "{morph.nounEn}", is {morph.genderName}).</>}
                    </span>
                  </div>
                </div>
                <div className="bg-poster-bg rounded-lg px-3 py-2 mt-2 text-sm">
                  <div className="font-slab text-poster-ink">{renderDe(morph.exampleDe, morph.caseKey)}</div>
                  <div className="text-poster-ink/60 italic">{morph.exampleEn}</div>
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

        {/* Level 3: standard word view (non-morph) */}
        {level === 3 && word && !morph && (
          <div className="mt-2 text-sm text-poster-ink/80 space-y-1.5">
            <div>
              <span className="font-semibold text-poster-ink">{word.translation}</span>
              <span className="text-poster-ink/50 text-xs"> · {TYPE_LABEL[word.type] ?? word.type}</span>
            </div>
            {isPossessiveBase && (
              <div className="text-poster-ink/70 text-xs italic">
                Endings change with the noun's case + gender. Example below uses nominative.
              </div>
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
        {level === 4 && sub && (
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
    </div>
  );
};
