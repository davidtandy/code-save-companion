import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import { cn } from "@/lib/utils";

function TrickleText({ children }: { children: string }) {
  const words = children.split(" ");
  const [visibleCount, setVisibleCount] = useState(0);

  useEffect(() => {
    setVisibleCount(0);
    const timers = words.map((_, i) =>
      setTimeout(() => setVisibleCount(i + 1), i * 75),
    );
    return () => timers.forEach(clearTimeout);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <span aria-label={children}>
      {words.map((word, i) => (
        <span key={i}>
          <span
            className={cn(
              "inline-block transition-all duration-200",
              i < visibleCount ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2",
            )}
          >
            {word}
          </span>
          {i < words.length - 1 && " "}
        </span>
      ))}
    </span>
  );
}

type CaseKey = "akk" | "nom" | "dat";

type Question = {
  prep: string;
  meaning: string;
  targetCase: CaseKey;
  contextSentence?: string;
  sentence: string;
  correctId: string;
  answer: string;
};

const CASE_LABEL: Record<CaseKey, string> = {
  akk: "Akkusativ",
  nom: "Nominativ",
  dat: "Dativ",
};

function getCaseFromId(id: string): CaseKey | null {
  if (id.startsWith("akk-") || id.startsWith("twL-")) return "akk";
  if (id.startsWith("dat-") || id.startsWith("twR-")) return "dat";
  if (id.startsWith("nom-")) return "nom";
  return null;
}

const QUESTIONS: Question[] = [
  // DAT-only
  { prep: "mit",   meaning: "with",          targetCase: "dat", sentence: "Er spielt mit _____ Hund.",             correctId: "dat-dem",    answer: "dem"   },
  { prep: "von",   meaning: "from / of",     targetCase: "dat", sentence: "Das ist ein Brief von _____ Lehrerin.", correctId: "dat-der",    answer: "der"   },
  { prep: "bei",   meaning: "at / with",     targetCase: "dat", sentence: "Sie wohnt bei _____ Freundin.",         correctId: "dat-einer",  answer: "einer" },
  { prep: "seit",  meaning: "since / for",   targetCase: "dat", sentence: "Er lernt Deutsch seit _____ Jahr.",     correctId: "dat-einem2", answer: "einem" },
  { prep: "aus",   meaning: "out of / from", targetCase: "dat", sentence: "Sie kommt aus _____ Stadt.",            correctId: "dat-der",    answer: "der"   },
  { prep: "zu",    meaning: "to",            targetCase: "dat", sentence: "Er geht zu _____ Arzt.",               correctId: "dat-dem",    answer: "dem"   },
  // AKK-only
  { prep: "für",   meaning: "for",           targetCase: "akk", sentence: "Das ist ein Geschenk für _____ Mutter.", correctId: "akk-eine", answer: "eine" },
  { prep: "durch", meaning: "through",       targetCase: "akk", sentence: "Wir fahren durch _____ Wald.",           correctId: "akk-den",  answer: "den"  },
  { prep: "ohne",  meaning: "without",       targetCase: "akk", sentence: "Er kommt ohne _____ Schwester.",         correctId: "akk-eine", answer: "eine" },
  { prep: "gegen", meaning: "against",       targetCase: "akk", sentence: "Sie spielen gegen _____ Mannschaft.",   correctId: "akk-die",  answer: "die"  },
  { prep: "um",    meaning: "around / at",   targetCase: "akk", sentence: "Wir sitzen um _____ Tisch.",             correctId: "akk-den",  answer: "den"  },
  // Two-way
  { prep: "in",  meaning: "in (location)",    targetCase: "dat", contextSentence: "Das Buch liegt in _____ Schule.",    sentence: "Das Buch liegt in _____ Schule.",    correctId: "dat-der", answer: "der" },
  { prep: "in",  meaning: "into (direction)", targetCase: "akk", contextSentence: "Er geht in _____ Schule.",           sentence: "Er geht in _____ Schule.",           correctId: "akk-die", answer: "die" },
  { prep: "auf", meaning: "on (location)",    targetCase: "dat", contextSentence: "Das Glas steht auf _____ Tisch.",    sentence: "Das Glas steht auf _____ Tisch.",    correctId: "dat-dem", answer: "dem" },
  { prep: "auf", meaning: "onto (direction)", targetCase: "akk", contextSentence: "Sie legt das Glas auf _____ Tisch.", sentence: "Sie legt das Glas auf _____ Tisch.", correctId: "akk-den", answer: "den" },
  { prep: "an",  meaning: "at (location)",    targetCase: "dat", contextSentence: "Das Bild hängt an _____ Wand.",     sentence: "Das Bild hängt an _____ Wand.",     correctId: "dat-der", answer: "der" },
  { prep: "an",  meaning: "onto (direction)", targetCase: "akk", contextSentence: "Er hängt das Bild an _____ Wand.", sentence: "Er hängt das Bild an _____ Wand.",  correctId: "akk-die", answer: "die" },
];

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

type Step = "case" | "article";
type Feedback = "correct" | "wrong" | "revealed" | null;
type Props = {
  onFlash: (result: "correct" | "wrong", pillId: string) => void;
  onStepChange?: (step: Step, caseKey?: CaseKey) => void;
  onExit: () => void;
};

export type PrepLockHandle = { onPillTap: (id: string) => void };

export const PrepLockGame = forwardRef<PrepLockHandle, Props>(({ onFlash, onStepChange, onExit }, ref) => {
  const [questions, setQuestions] = useState(() => shuffle(QUESTIONS));
  const [index, setIndex] = useState(0);
  const [step, setStep] = useState<Step>("case");
  const [tries, setTries] = useState(0);
  const [feedback, setFeedback] = useState<Feedback>(null);
  const [caseLabel, setCaseLabel] = useState<string | null>(null);
  const [gamePhase, setGamePhase] = useState<"quiz" | "end">("quiz");
  const [score, setScore] = useState({ correct: 0, wrong: 0 });

  const stateRef = useRef({ index, step, tries, feedback, questions, gamePhase });
  stateRef.current = { index, step, tries, feedback, questions, gamePhase };
  const onFlashRef = useRef(onFlash);
  onFlashRef.current = onFlash;
  const onStepChangeRef = useRef(onStepChange);
  onStepChangeRef.current = onStepChange;

  function changeStep(s: Step, caseKey?: CaseKey) {
    setStep(s);
    onStepChangeRef.current?.(s, caseKey);
  }

  function doAdvance() {
    const { index, questions } = stateRef.current;
    if (index + 1 >= questions.length) {
      setGamePhase("end");
    } else {
      setIndex((i) => i + 1);
      changeStep("case");
      setCaseLabel(null);
      setTries(0);
      setFeedback(null);
    }
  }

  function transitionToArticle(targetCase: CaseKey) {
    changeStep("article", targetCase);
    setCaseLabel(CASE_LABEL[targetCase]);
    setTries(0);
    setFeedback(null);
  }

  useImperativeHandle(ref, () => ({
    onPillTap(id: string) {
      const { step, feedback, tries, questions, index, gamePhase } = stateRef.current;
      if (gamePhase !== "quiz") return;
      if (feedback === "correct" || feedback === "revealed") return;

      const q = questions[index];

      if (step === "case") {
        const clickedCase = getCaseFromId(id);
        if (clickedCase === q.targetCase) {
          onFlashRef.current("correct", id);
          setFeedback("correct");
          setTimeout(() => transitionToArticle(q.targetCase), 650);
        } else {
          onFlashRef.current("wrong", id);
          const newTries = tries + 1;
          setTries(newTries);
          setFeedback("wrong");
          if (newTries >= 3) {
            setTimeout(() => setFeedback("revealed"), 700);
            setTimeout(() => transitionToArticle(q.targetCase), 2000);
          } else {
            setTimeout(() => setFeedback(null), 600);
          }
        }
      } else {
        const isCorrect = id === q.correctId;
        if (isCorrect) {
          onFlashRef.current("correct", id);
          setFeedback("correct");
          setScore((s) => ({ ...s, correct: s.correct + 1 }));
          setTimeout(doAdvance, 900);
        } else {
          onFlashRef.current("wrong", id);
          const newTries = tries + 1;
          setTries(newTries);
          setFeedback("wrong");
          if (newTries >= 3) {
            setScore((s) => ({ ...s, wrong: s.wrong + 1 }));
            setTimeout(() => setFeedback("revealed"), 700);
            setTimeout(doAdvance, 2200);
          } else {
            setTimeout(() => setFeedback(null), 600);
          }
        }
      }
    },
  }), []); // eslint-disable-line react-hooks/exhaustive-deps

  function restart() {
    setQuestions(shuffle(QUESTIONS));
    setIndex(0);
    changeStep("case");
    setTries(0);
    setFeedback(null);
    setCaseLabel(null);
    setScore({ correct: 0, wrong: 0 });
    setGamePhase("quiz");
  }

  if (gamePhase === "end") {
    return (
      <div
        data-no-reset
        onClick={(e) => e.stopPropagation()}
        className="fixed z-40 bottom-3 left-1/2 -translate-x-1/2 w-[min(92vw,460px)] bg-white rounded-xl shadow-2xl border border-poster-ink/15 px-6 py-5 select-none text-center space-y-3"
      >
        <div className="text-base font-display font-bold text-poster-ink">Round complete!</div>
        <div className="text-sm text-poster-ink/60">
          {score.correct} correct · {score.wrong} missed out of {questions.length}
        </div>
        <div className="flex gap-2">
          <button onClick={restart} className="flex-1 h-9 rounded-lg bg-poster-teal text-white text-sm font-medium hover:bg-poster-teal/90 transition-colors">
            Play again
          </button>
          <button onClick={onExit} className="h-9 px-4 rounded-lg border border-poster-ink/20 text-sm text-poster-ink/60 hover:bg-poster-ink/5 transition-colors">
            Exit
          </button>
        </div>
      </div>
    );
  }

  const q = questions[index];
  const triesLeft = 3 - tries;
  const isArticleStep = step === "article";
  const filled = feedback === "correct" || feedback === "revealed";

  const instructionText =
    feedback === "correct"  ? (isArticleStep ? "Correct!" : `${CASE_LABEL[q.targetCase]}! Now pick the article`)
    : feedback === "wrong"    ? (triesLeft > 0 ? `${triesLeft} ${triesLeft === 1 ? "try" : "tries"} left` : "...")
    : feedback === "revealed" ? (isArticleStep ? `The answer was: ${q.answer}` : `It's ${CASE_LABEL[q.targetCase]}`)
    : isArticleStep           ? "Click the exact article above"
    :                           "Which case? Click any pill from that zone";

  return (
    <div
      data-no-reset
      onClick={(e) => e.stopPropagation()}
      className={cn(
        "fixed z-40 bottom-3 left-1/2 -translate-x-1/2 w-[min(92vw,480px)] bg-white rounded-xl shadow-2xl border px-5 py-4 select-none transition-colors duration-200",
        feedback === "correct"  && "border-green-300",
        feedback === "wrong"    && "border-red-300",
        feedback === "revealed" && "border-amber-300",
        !feedback               && "border-poster-ink/15",
      )}
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-[11px] text-poster-ink/40 uppercase tracking-widest">
          Preposition Lock · {index + 1} / {questions.length}
        </span>
        <button onClick={onExit} className="text-[11px] text-poster-ink/40 hover:text-poster-ink/70 transition-colors">
          Exit
        </button>
      </div>

      <div className="mb-3">
        <div className="flex items-baseline gap-2">
          <span className="font-display font-bold text-4xl text-poster-teal tracking-wide">{q.prep}</span>
          <span className="text-sm text-poster-ink/50">· {q.meaning}</span>
        </div>

        {!isArticleStep && q.contextSentence && (
          <div className="mt-1.5 text-sm text-poster-ink/70 italic">{q.contextSentence}</div>
        )}

        {isArticleStep && (
          <div className="mt-2 space-y-1.5">
            <div className="text-xs font-semibold text-green-700">✓ {caseLabel}</div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-[10px] text-poster-ink/25 shrink-0">↳</span>
              <span className="text-base font-semibold text-poster-ink">
                {q.sentence.replace("_____", filled ? "·····" : "_____")}
              </span>
              {filled && (
                <span className={cn(
                  "text-base font-bold",
                  feedback === "correct"  && "text-green-600",
                  feedback === "revealed" && "text-amber-600",
                )}>
                  {q.answer}
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      <div className={cn(
        "text-center rounded-lg py-3 transition-colors",
        feedback === "correct"  && "bg-green-50 text-green-700",
        feedback === "wrong"    && "bg-red-50 text-red-600",
        feedback === "revealed" && "bg-amber-50 text-amber-700",
        !feedback               && "bg-poster-bg text-poster-ink/50",
      )}>
        <span className="text-base font-semibold">
          <TrickleText key={instructionText}>{instructionText}</TrickleText>
        </span>
      </div>
    </div>
  );
});

PrepLockGame.displayName = "PrepLockGame";
