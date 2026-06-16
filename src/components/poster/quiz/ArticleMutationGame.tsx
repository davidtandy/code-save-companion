import { forwardRef, useImperativeHandle, useRef, useState } from "react";
import { cn } from "@/lib/utils";

type Question = {
  source: string;
  target: string;
  correctId: string;
  answer: string;
};

const QUESTIONS: Question[] = [
  // Masculine NOM→AKK (def) — changes: der→den
  { source: "Der Hund schläft.", target: "Ich sehe _____ Hund.", correctId: "akk-den", answer: "den" },
  // Feminine NOM→AKK (def) — stays: die→die
  { source: "Die Frau wartet.", target: "Er liebt _____ Frau.", correctId: "akk-die", answer: "die" },
  // Neuter NOM→AKK (def) — stays: das→das
  { source: "Das Kind spielt.", target: "Ich sehe _____ Kind.", correctId: "akk-das", answer: "das" },
  // Masculine NOM→AKK (indef) — changes: ein→einen
  { source: "Ein Mann kommt.", target: "Sie sucht _____ Mann.", correctId: "akk-einen", answer: "einen" },
  // Feminine NOM→AKK (indef) — stays: eine→eine
  { source: "Eine Frau singt.", target: "Er liebt _____ Frau.", correctId: "akk-eine", answer: "eine" },
  // Masculine NOM→DAT (def) — changes: der→dem
  { source: "Der Lehrer erklärt.", target: "Er dankt _____ Lehrer.", correctId: "dat-dem", answer: "dem" },
  // Feminine NOM→DAT (def) — counterintuitive: die→der
  { source: "Die Ärztin hilft.", target: "Er vertraut _____ Ärztin.", correctId: "dat-der", answer: "der" },
  // Neuter NOM→DAT (def) — changes: das→dem
  { source: "Das Kind lacht.", target: "Sie hilft _____ Kind.", correctId: "dat-dem2", answer: "dem" },
  // Feminine NOM→DAT (indef) — changes: eine→einer
  { source: "Eine Frau wartet.", target: "Er dankt _____ Frau.", correctId: "dat-einer", answer: "einer" },
  // Neuter NOM→DAT (indef) — changes: ein→einem
  { source: "Ein Kind weint.", target: "Er hilft _____ Kind.", correctId: "dat-einem2", answer: "einem" },
  // Masculine AKK→NOM (def) — changes: den→der
  { source: "Sie sieht den Mann.", target: "_____ Mann schläft.", correctId: "nom-der", answer: "Der" },
  // Plural NOM→AKK (def) — stays: die→die
  { source: "Die Kinder lachen.", target: "Er sieht _____ Kinder.", correctId: "akk-diePl", answer: "die" },
];

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

type Feedback = "correct" | "wrong" | "revealed" | null;
type Props = { onFlash: (result: "correct" | "wrong", pillId: string) => void; onExit: () => void };

export type ArticleMutationHandle = { onPillTap: (id: string) => void };

export const ArticleMutationGame = forwardRef<ArticleMutationHandle, Props>(
  ({ onFlash, onExit }, ref) => {
    const [questions, setQuestions] = useState(() => shuffle(QUESTIONS));
    const [index, setIndex] = useState(0);
    const [tries, setTries] = useState(0);
    const [feedback, setFeedback] = useState<Feedback>(null);
    const [phase, setPhase] = useState<"quiz" | "end">("quiz");
    const [score, setScore] = useState({ correct: 0, wrong: 0 });

    const stateRef = useRef({ index, tries, feedback, questions, phase });
    const onFlashRef = useRef(onFlash);
    onFlashRef.current = onFlash;
    stateRef.current = { index, tries, feedback, questions, phase };

    function doAdvance() {
      const { index, questions } = stateRef.current;
      if (index + 1 >= questions.length) {
        setPhase("end");
      } else {
        setIndex((i) => i + 1);
        setTries(0);
        setFeedback(null);
      }
    }

    useImperativeHandle(ref, () => ({
      onPillTap(id: string) {
        const { feedback, tries, questions, index, phase } = stateRef.current;
        if (phase !== "quiz") return;
        if (feedback === "correct" || feedback === "revealed") return;
        const q = questions[index];
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
      },
    }), []); // eslint-disable-line react-hooks/exhaustive-deps

    function restart() {
      setQuestions(shuffle(QUESTIONS));
      setIndex(0);
      setTries(0);
      setFeedback(null);
      setScore({ correct: 0, wrong: 0 });
      setPhase("quiz");
    }

    if (phase === "end") {
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
            <button
              onClick={restart}
              className="flex-1 h-9 rounded-lg bg-poster-teal text-white text-sm font-medium hover:bg-poster-teal/90 transition-colors"
            >
              Play again
            </button>
            <button
              onClick={onExit}
              className="h-9 px-4 rounded-lg border border-poster-ink/20 text-sm text-poster-ink/60 hover:bg-poster-ink/5 transition-colors"
            >
              Exit
            </button>
          </div>
        </div>
      );
    }

    const q = questions[index];
    const triesLeft = 3 - tries;
    const filled = feedback === "correct" || feedback === "revealed";

    return (
      <div
        data-no-reset
        onClick={(e) => e.stopPropagation()}
        className={cn(
          "fixed z-40 bottom-3 left-1/2 -translate-x-1/2 w-[min(92vw,480px)] bg-white rounded-xl shadow-2xl border px-5 py-4 select-none transition-colors duration-200",
          feedback === "correct" && "border-green-300",
          feedback === "wrong" && "border-red-300",
          feedback === "revealed" && "border-amber-300",
          !feedback && "border-poster-ink/15",
        )}
      >
        <div className="flex items-center justify-between mb-4">
          <span className="text-[11px] text-poster-ink/40 uppercase tracking-widest">
            Article Mutation · {index + 1} / {questions.length}
          </span>
          <button onClick={onExit} className="text-[11px] text-poster-ink/40 hover:text-poster-ink/70 transition-colors">
            Exit
          </button>
        </div>

        <div className="space-y-1.5 mb-4">
          <div className="text-base text-poster-ink/80">{q.source}</div>
          <div className="flex items-baseline gap-1.5 flex-wrap">
            <span className="text-xs text-poster-ink/30 shrink-0">↳</span>
            {(() => {
              const [before, after] = q.target.split("_____");
              const articleHint = q.answer.toLowerCase().startsWith("ein") ? "a/an" : "the";
              return (
                <>
                  {before && <span className="text-lg font-semibold text-poster-ink">{before}</span>}
                  <div className="flex flex-col items-center">
                    {filled ? (
                      <span className={cn(
                        "text-lg font-bold",
                        feedback === "correct" && "text-green-600",
                        feedback === "revealed" && "text-amber-600",
                      )}>
                        {q.answer}
                      </span>
                    ) : (
                      <>
                        <span className="text-lg font-semibold text-poster-ink">_____</span>
                        <span className="text-[10px] text-poster-ink/40 leading-none">{articleHint}</span>
                      </>
                    )}
                  </div>
                  {after && <span className="text-lg font-semibold text-poster-ink">{after}</span>}
                </>
              );
            })()}
          </div>
        </div>

        <div className={cn(
          "text-[11px] text-center rounded-lg py-1.5 transition-colors",
          feedback === "correct" && "bg-green-50 text-green-700",
          feedback === "wrong" && "bg-red-50 text-red-600",
          feedback === "revealed" && "bg-amber-50 text-amber-700",
          !feedback && "bg-poster-bg text-poster-ink/40",
        )}>
          {feedback === "correct" && "Correct!"}
          {feedback === "wrong" && (triesLeft > 0 ? `${triesLeft} ${triesLeft === 1 ? "try" : "tries"} left` : "...")}
          {feedback === "revealed" && `The answer was: ${q.answer}`}
          {!feedback && "Click the correct article on the poster ↑"}
        </div>
      </div>
    );
  }
);

ArticleMutationGame.displayName = "ArticleMutationGame";
