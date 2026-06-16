import { CASE_INFO, type CaseKey, type SubWord, type WordDatum } from "./wordData";
import type { GroupInfo } from "./groupData";
import { Button } from "@/components/ui/button";
import { ChevronLeft, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { colorizeSentence, type CaseColorMode } from "./colorizeSentence";

type Props = {
  level: 1 | 2 | 3 | 4;
  activeCase: CaseKey;
  group?: GroupInfo | null;
  word?: WordDatum | null;
  /** When level === 4, the selected sub-token. */
  sub?: SubWord | null;
  /** Where to anchor the card. "bottom" = original wide card. */
  placement?: "bottom" | "left" | "right";
  /** When set, color-code example-sentence words by case. */
  caseColorMode?: CaseColorMode | null;
  onBack: () => void;
  onClose: () => void;
};

const TYPE_LABEL: Record<string, string> = {
  pronoun: "Pronoun",
  "article-def": "Definite article",
  "article-indef": "Indefinite article",
  preposition: "Preposition",
  "preposition-2way": "Two-way preposition",
  ending: "Verb ending",
  possessive: "Possessive",
  header: "Question word",
  verb: "Verb",
};

const GENDER_LABEL: Record<SubWord["gender"], string> = {
  m: "masculine", f: "feminine", n: "neuter", pl: "plural", formal: "formal",
};

export const InfoCard = ({ level, activeCase, group, word, sub, placement = "bottom", caseColorMode = null, onBack, onClose }: Props) => {
  const renderDe = (de: string, hint?: CaseKey | null) =>
    caseColorMode ? colorizeSentence(de, caseColorMode, hint ?? activeCase) : de;
  const info = CASE_INFO[activeCase];
  const accent =
    activeCase === "akk"
      ? "border-poster-green text-poster-green"
      : activeCase === "nom"
      ? "border-poster-yellow text-poster-yellow"
      : "border-poster-purple text-poster-purple";

  // Container positioning per placement
  const wrapperCls = placement === "bottom"
    ? "fixed left-0 right-0 bottom-0 z-30 pointer-events-none"
    : placement === "left"
    ? "fixed left-0 top-0 bottom-0 z-30 pointer-events-none flex items-center"
    : "fixed right-0 top-0 bottom-0 z-30 pointer-events-none flex items-center";

  const innerCls = placement === "bottom"
    ? "mx-auto max-w-2xl px-4 pb-4 pointer-events-auto w-full"
    : "px-3 py-4 pointer-events-auto max-h-[92%] inline-flex";

  // Side panels: shrink to content, capped at ~28vw wide and 92vh tall.
  const cardCls = placement === "bottom"
    ? `rounded-2xl border-l-4 bg-white shadow-2xl px-6 py-5 ${accent}`
    : `${placement === "left" ? "border-l-0 border-r-4 rounded-r-2xl" : "border-r-0 border-l-4 rounded-l-2xl"} bg-white shadow-2xl px-5 py-5 ${accent} max-h-full overflow-y-auto`;

  const sideStyle = placement === "bottom"
    ? undefined
    : { maxWidth: "min(28vw, 420px)", minWidth: 220, width: "max-content" as const };

  // Compact density logic only for bottom
  const contentLen =
    (level === 1 ? (info.rule?.length ?? 0) + (info.english?.length ?? 0) + (info.role?.length ?? 0) : 0) +
    (level === 2 && group ? (group.description?.length ?? 0) : 0) +
    (level === 3 && word ? (word.translation?.length ?? 0) + (word.note?.length ?? 0) + (word.example?.de?.length ?? 0) + (word.example?.en?.length ?? 0) : 0) +
    (level === 4 && sub ? (sub.translation?.length ?? 0) + (sub.note?.length ?? 0) + (sub.example?.de?.length ?? 0) + (sub.example?.en?.length ?? 0) : 0);

  const dense = placement === "bottom" && contentLen > 180;
  const veryDense = placement === "bottom" && contentLen > 280;
  const titleSize = veryDense ? "text-lg" : dense ? "text-xl" : "text-2xl";
  const metaSize = veryDense ? "text-xs" : "text-sm";
  const bodySize = veryDense ? "text-sm" : dense ? "text-[15px]" : "text-base";
  const exampleSize = veryDense ? "text-sm" : "text-base";
  const hintSize = "text-xs";

  return (
    <div className={wrapperCls}>
      <div className={innerCls} style={sideStyle}>
        <div className={cn(cardCls, "flex flex-col")}>
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              {level > 1 && (
                <button
                  onClick={onBack}
                  className="inline-flex items-center text-sm text-poster-ink/60 mb-1.5 active:scale-95"
                >
                  <ChevronLeft className="h-4 w-4" />
                  {level === 4 && word ? ` Back to ${word.display}` : level === 3 && group ? ` Back to ${group.name}` : ` Back to ${info.name}`}
                </button>
              )}
              <div className={`font-display font-bold ${titleSize} text-poster-ink leading-tight`}>
                {level === 1 && info.name}
                {level === 2 && (group?.name ?? info.name)}
                {level === 3 && (word?.display ?? "—")}
                {level === 4 && (sub?.token ?? "—")}
                <span className={`ml-2 ${metaSize} font-body font-normal text-poster-ink/60`}>
                  {level === 1 ? info.questions : level === 4 && sub ? GENDER_LABEL[sub.gender] : info.name}
                </span>
              </div>
            </div>
            <Button
              size="icon"
              variant="ghost"
              onClick={onClose}
              className="h-9 w-9 shrink-0 text-poster-ink/60"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {level === 1 && (
            <div className={`mt-2 ${bodySize} text-poster-ink/80 leading-snug space-y-1.5`}>
              <div><span className="font-semibold">{info.english}</span> · {info.role}</div>
              <div className="text-poster-ink/70">{info.rule}</div>
              <div className={`${hintSize} text-poster-ink/50 italic pt-1`}>Tap a group to zoom in.</div>
            </div>
          )}

          {level === 2 && group && (
            <div className={`mt-2 ${bodySize} text-poster-ink/80 leading-snug space-y-1.5`}>
              <div className="text-poster-ink/70">{group.description}</div>
              <div className={`${hintSize} text-poster-ink/50 italic pt-1`}>Tap any word for details.</div>
            </div>
          )}

          {level === 3 && word && (
            <div className={`mt-2 ${bodySize} text-poster-ink/80 leading-snug space-y-1.5`}>
              <div>
                <span className="font-semibold text-poster-ink">{word.translation}</span>
                <span className={`text-poster-ink/50 ${metaSize}`}> · {TYPE_LABEL[word.type] ?? word.type}</span>
              </div>
              {word.note && <div className="text-poster-ink/70">{word.note}</div>}
              {word.example && (
                <div className={`bg-poster-bg rounded-lg px-3 py-2 mt-2 ${exampleSize}`}>
                  <div className="font-slab text-poster-ink">{renderDe(word.example.de, word.case)}</div>
                  <div className="text-poster-ink/60 italic">{word.example.en}</div>
                </div>
              )}
              {word.subWords && (
                <div className={`${hintSize} text-poster-ink/50 italic pt-1`}>Tap a single word inside the pill for the gendered form.</div>
              )}
            </div>
          )}

          {level === 4 && sub && (
            <div className={`mt-2 ${bodySize} text-poster-ink/80 leading-snug space-y-1.5`}>
              <div>
                <span className="font-semibold text-poster-ink">{sub.translation}</span>
                <span className={`text-poster-ink/50 ${metaSize}`}> · {GENDER_LABEL[sub.gender]}</span>
              </div>
              {sub.note && <div className="text-poster-ink/70">{sub.note}</div>}
              {sub.example && (
                <div className={`bg-poster-bg rounded-lg px-3 py-2 mt-2 ${exampleSize}`}>
                  <div className="font-slab text-poster-ink">{renderDe(sub.example.de, word?.case)}</div>
                  <div className="text-poster-ink/60 italic">{sub.example.en}</div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
