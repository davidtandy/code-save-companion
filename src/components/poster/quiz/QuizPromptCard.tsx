// @ts-nocheck
import React, { useEffect, useRef } from "react";
import { X, Flame, Search, SkipForward } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useDraggable } from "./useDraggable";
import type { QuizQuestion, Gender } from "./quizData";

const GENDER_BORDER: Record<Gender, string> = {
  m:  "border-gender-masc",
  f:  "border-gender-fem",
  n:  "border-gender-neut",
  pl: "border-gender-plural",
};

const GENDER_TEXT: Record<Gender, string> = {
  m:  "text-gender-masc",
  f:  "text-gender-fem",
  n:  "text-gender-neut",
  pl: "text-gender-plural",
};

const GENDER_TAG: Record<Gender, string> = { m: "(m)", f: "(f)", n: "(n)", pl: "(pl)" };

type LearnStep = 1 | 2 | 3 | 4;

type Props = {
  question: QuizQuestion;
  streak: number;
  onExit: () => void;
  onSkip: () => void;
  result?: "correct" | "wrong" | null;
  mode?: "practice" | "learn";
  learnStep?: LearnStep;
  totalLearnSteps?: number;
};

function articleHintEn(article: string): string {
  const a = article.toLowerCase();
  if (a.startsWith("ein")) return "a / an";
  return "the";
}

const PREP_EN: Record<string, string> = {
  für: "for", gegen: "against", ohne: "without", um: "around", durch: "through", bis: "until",
  mit: "with", zu: "to", von: "from", bei: "at", nach: "after", aus: "out of",
  seit: "since", ab: "from", gegenüber: "opposite", außer: "except",
  bin: "am", bist: "are", ist: "is", sind: "are", seid: "are",
};

const HintBelow = ({ children }: { children: React.ReactNode }) => (
  <div className="text-[10px] uppercase tracking-wide text-poster-ink/55 leading-none mt-1 text-center whitespace-nowrap">
    {children}
  </div>
);

const NeutralBox = ({ children }: { children: React.ReactNode }) => (
  <div className="h-9 px-2 rounded-sm border-2 border-poster-ink/15 bg-poster-ink/5 flex items-center font-slab text-poster-ink/80 text-sm whitespace-nowrap">
    {children}
  </div>
);

const PrepBox = ({ children }: { children: React.ReactNode }) => (
  <div className="h-9 px-2 rounded-sm border-2 border-poster-ink/25 bg-poster-ink/5 flex items-center font-slab font-bold text-poster-ink text-base whitespace-nowrap">
    {children}
  </div>
);

const BlankPill = () => (
  <div
    className="h-9 min-w-[4.5rem] rounded-sm border-2 border-dashed border-poster-ink/40 bg-white/60"
    aria-label="blank"
  />
);

const splitWords = (s?: string) => (s ? s.trim().split(/\s+/) : []);

export const QuizPromptCard = ({ question, streak, onExit, onSkip, result, mode = "practice", learnStep = 4, totalLearnSteps = 4 }: Props) => {
  const prepEn = PREP_EN[question.prep.token] ?? "";
  const prefix = question.prefix;
  const suffix = question.suffix;
  const prefixEn = question.prefixEn;
  const suffixEn = question.suffixEn;
  const { dragStyle, dragHandlers } = useDraggable(question);
  const isLearn = mode === "learn";
  const peekBtnRef = useRef<HTMLButtonElement>(null);

  const handlePeekDown = (e: React.PointerEvent) => {
    e.preventDefault();
    document.documentElement.classList.add("quiz-peek");
    (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
  };
  const handlePeekUp = () => {
    document.documentElement.classList.remove("quiz-peek");
  };

  // Idle nudge: in learn mode, wiggle the peek button every 10s until the user
  // interacts with this card. Resets on any pointerdown in the card.
  const lastInteractRef = useRef<number>(Date.now());
  useEffect(() => {
    if (!isLearn) return;
    lastInteractRef.current = Date.now();
    const interval = window.setInterval(() => {
      if (Date.now() - lastInteractRef.current < 9500) return;
      const el = peekBtnRef.current;
      if (!el) return;
      el.classList.remove("quiz-peek-nudge");
      void el.offsetWidth;
      el.classList.add("quiz-peek-nudge");
      window.setTimeout(() => el.classList.remove("quiz-peek-nudge"), 850);
    }, 10000);
    return () => window.clearInterval(interval);
  }, [isLearn, learnStep, question]);

  const markInteract = () => { lastInteractRef.current = Date.now(); };

  const PRAISE: Record<2 | 3 | 4, string> = { 2: "Nice!", 3: "Yes!", 4: "Great!" };

  const learnPrompt = (): React.ReactNode => {
    if (!isLearn) return "Tap the matching pill on the poster:";
    if (learnStep === 1) {
      const isVerb = question.prep.case === "nom";
      const label = isVerb ? "verb" : "preposition";
      return (
        <>Tap the case section the {label} (<strong className="font-slab text-poster-ink">{question.prep.token}</strong>) triggers.</>
      );
    }
    const praise = PRAISE[learnStep as 2 | 3 | 4];
    const step2Body = question.kind === "pronoun" ? "Tap the Pronouns group." : "Tap the Articles group.";
    const body =
      learnStep === 2 ? step2Body
      : learnStep === 3 ? "Tap one of the columns \u2014 the \u201Ca/an\u201D column or the \u201Cthe\u201D column."
      : question.kind === "pronoun"
        ? "Now tap the matching pronoun on the poster."
        : "Now tap the article that matches the gender of the noun.";
    return (
      <><strong className="font-display font-bold text-poster-ink">{praise}</strong> {body}</>
    );
  };

  const trickleNode = (node: React.ReactNode, ctr: { i: number }): React.ReactNode => {
    if (typeof node === "string") {
      return Array.from(node).map((ch) => {
        const i = ctr.i++;
        return (
          <span
            key={`t-${i}`}
            className="quiz-trickle-letter"
            style={{ animationDelay: `calc((${i} * var(--quiz-trickle-stagger, 12) + var(--quiz-trickle-initial-delay, 0)) * 1ms)` }}
          >
            {ch}
          </span>
        );
      });
    }
    if (Array.isArray(node)) return node.map((n) => trickleNode(n, ctr));
    if (React.isValidElement(node)) {
      return React.cloneElement(node, { key: `t-el-${ctr.i++}` }, trickleNode(node.props.children, ctr));
    }
    return node;
  };

  return (
    <div
      data-no-reset
      onClick={(e) => e.stopPropagation()}
      onPointerDown={markInteract}
      style={dragStyle}
      {...dragHandlers}
      className={cn(
        "fixed z-40 rounded-xl shadow-2xl border px-4 py-3 transition-colors duration-200 select-none",
        // default: bottom-center
        "bottom-3 left-1/2 -translate-x-1/2 w-[min(92vw,460px)]",
        // landscape phones: dock right
        "landscape:max-[500px]:bottom-1/2 landscape:max-[500px]:right-2 landscape:max-[500px]:left-auto landscape:max-[500px]:translate-x-0 landscape:max-[500px]:translate-y-1/2 landscape:max-[500px]:w-[min(60vw,360px)]",
        result === "correct" ? "bg-poster-green border-poster-green" :
        result === "wrong"   ? "bg-poster-red-deep border-poster-red-deep" :
        "bg-white border-poster-ink/15",
      )}
    >
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="text-[10px] uppercase tracking-wide font-display font-bold text-poster-ink/60">
          {isLearn ? `Learn · Step ${totalLearnSteps === 3 && learnStep === 4 ? 3 : learnStep} of ${totalLearnSteps}` : "Masked Prepositions"}
        </div>
        <div className="flex items-center gap-1">
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-poster-ink mr-1">
            <Flame className="h-3.5 w-3.5 text-poster-red-deep" />
            {streak}
          </span>
          <Button
            ref={peekBtnRef}
            size="icon"
            variant="ghost"
            className="h-7 w-7"
            aria-label="Peek (hold to reveal)"
            onPointerDown={(e) => { markInteract(); handlePeekDown(e); }}
            onPointerUp={handlePeekUp}
            onPointerLeave={handlePeekUp}
            onPointerCancel={handlePeekUp}
          >
            <Search className="h-4 w-4" />
          </Button>
          <Button size="icon" variant="ghost" onClick={onSkip} className="h-7 w-7" aria-label="Skip">
            <SkipForward className="h-4 w-4" />
          </Button>
          <Button size="icon" variant="ghost" onClick={onExit} className="h-7 w-7" aria-label="Exit quiz">
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="text-sm font-semibold text-poster-ink/70 mb-2">{isLearn ? <span key={`tr-${question.correctPillId}-${learnStep}`}>{trickleNode(learnPrompt(), { i: 0 })}</span> : learnPrompt()}</div>

      <div className="flex items-start justify-center gap-1.5 pb-1 flex-wrap">
        {(() => {
          const isNom = question.prep.case === "nom";
          const prefixSlots = splitWords(prefix).map((w, i) => {
            const enWords = splitWords(prefixEn);
            return (
              <div key={`pre-${i}`} className="flex flex-col items-center">
                <NeutralBox>{w}</NeutralBox>
                <HintBelow>{enWords[i] ?? "\u00A0"}</HintBelow>
              </div>
            );
          });
          const verbSlot = (
            <div key="prep" className="flex flex-col items-center">
              <PrepBox>{question.prep.token}</PrepBox>
              <HintBelow>{prepEn || "\u00A0"}</HintBelow>
            </div>
          );
          const blankGroup = question.kind === "pronoun" ? (
            <div key="blank" className="flex flex-col items-center">
              <BlankPill />
              <HintBelow>{question.targetEn}</HintBelow>
            </div>
          ) : (() => {
            const g: Gender = question.gender ?? "n";
            return (
              <React.Fragment key="blank">
                <div className="flex flex-col items-center">
                  <BlankPill />
                  <HintBelow>{articleHintEn(question.nounArticle)}</HintBelow>
                </div>
                <div className="flex flex-col items-center">
                  <div
                    className={cn(
                      "h-9 px-2 rounded-sm border-2 bg-white flex items-center gap-1 font-slab font-semibold",
                      GENDER_BORDER[g],
                      GENDER_TEXT[g],
                    )}
                  >
                    <span>{question.nounDe}</span>
                    <span className={cn("text-[10px] font-body font-normal", GENDER_TEXT[g])}>{GENDER_TAG[g]}</span>
                  </div>
                  <HintBelow>{question.nounEn}</HintBelow>
                </div>
              </React.Fragment>
            );
          })();
          const suffixSlots = splitWords(suffix).map((w, i) => {
            const enWords = splitWords(suffixEn);
            return (
              <div key={`suf-${i}`} className="flex flex-col items-center">
                <NeutralBox>{w}</NeutralBox>
                <HintBelow>{enWords[i] ?? "\u00A0"}</HintBelow>
              </div>
            );
          });
          // Nominativ: blank leads, then verb, then suffix (prefix unused).
          // Akk/Dat: prefix → verb → blank → suffix.
          return isNom
            ? <>{blankGroup}{verbSlot}{suffixSlots}</>
            : <>{prefixSlots}{verbSlot}{blankGroup}{suffixSlots}</>;
        })()}
      </div>
    </div>
  );
};
