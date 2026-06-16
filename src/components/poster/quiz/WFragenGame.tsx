import React, { forwardRef, useImperativeHandle, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import type { CaseKey } from "../wordData";

type WWord = "Wer" | "Wen" | "Wem" | "Wo" | "Wohin";
type GameStep = "wword" | "article";
type Feedback = "correct" | "wrong" | "revealed" | null;

type Question = {
  pre: string;
  boxedPre?: string;   // preposition inside the box, before the article blank
  boxedNoun: string;
  post: string;
  correctWWord: WWord;
  correctPillId: string;
  answer: string;
  caseKey: CaseKey;
};

const W_WORDS: WWord[] = ["Wen", "Wohin", "Wer", "Wo", "Wem"];

const W_EN: Record<WWord, string> = {
  Wer: "who",
  Wen: "whom",
  Wem: "to whom",
  Wo: "where",
  Wohin: "where to",
};

const QUESTIONS: Question[] = [
  { pre: "",                     boxedNoun: "Lehrer",  post: " erklärt die Aufgabe.", correctWWord: "Wer",   correctPillId: "nom-der",  answer: "Der",  caseKey: "nom" },
  { pre: "",                     boxedNoun: "Frau",    post: " öffnet die Tür.",      correctWWord: "Wer",   correctPillId: "nom-eine", answer: "Eine", caseKey: "nom" },
  { pre: "",                     boxedNoun: "Kind",    post: " spielt im Park.",      correctWWord: "Wer",   correctPillId: "nom-das",  answer: "Das",  caseKey: "nom" },
  { pre: "Er besucht ",          boxedNoun: "Freundin",post: ".",                     correctWWord: "Wen",   correctPillId: "akk-eine", answer: "eine", caseKey: "akk" },
  { pre: "Er sieht ",            boxedNoun: "Lehrer",  post: ".",                     correctWWord: "Wen",   correctPillId: "akk-den",  answer: "den",  caseKey: "akk" },
  { pre: "Sie besucht ",         boxedNoun: "Ärztin",  post: ".",                     correctWWord: "Wen",   correctPillId: "akk-die",  answer: "die",  caseKey: "akk" },
  { pre: "Er dankt ",            boxedNoun: "Lehrerin",post: ".",                     correctWWord: "Wem",   correctPillId: "dat-der",  answer: "der",  caseKey: "dat" },
  { pre: "Sie hilft ",           boxedNoun: "Mann",    post: ".",                     correctWWord: "Wem",   correctPillId: "dat-einem",answer: "einem",caseKey: "dat" },
  { pre: "Er zeigt ",            boxedNoun: "Kind",    post: " das Bild.",            correctWWord: "Wem",   correctPillId: "dat-dem2", answer: "dem",  caseKey: "dat" },
  { pre: "Das Buch liegt ",      boxedPre: "auf",      boxedNoun: "Tisch",  post: ".",correctWWord: "Wo",    correctPillId: "dat-dem",  answer: "dem",  caseKey: "dat" },
  { pre: "Er steht ",            boxedPre: "vor",      boxedNoun: "Tür",    post: ".",correctWWord: "Wo",    correctPillId: "dat-der",  answer: "der",  caseKey: "dat" },
  { pre: "Das Kind schläft ",    boxedPre: "in",       boxedNoun: "Bett",   post: ".",correctWWord: "Wo",    correctPillId: "dat-dem2", answer: "dem",  caseKey: "dat" },
  { pre: "Er stellt die Vase ",  boxedPre: "auf",      boxedNoun: "Regal",  post: ".",correctWWord: "Wohin", correctPillId: "akk-das",  answer: "das",  caseKey: "akk" },
  { pre: "Er legt das Buch ",    boxedPre: "auf",      boxedNoun: "Tisch",  post: ".",correctWWord: "Wohin", correctPillId: "akk-den",  answer: "den",  caseKey: "akk" },
  { pre: "Sie geht ",            boxedPre: "in",       boxedNoun: "Schule", post: ".",correctWWord: "Wohin", correctPillId: "akk-die",  answer: "die",  caseKey: "akk" },
];

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

type Props = {
  onFlash: (result: "correct" | "wrong", pillId: string) => void;
  onExit: () => void;
  onStepChange: (step: GameStep, caseKey?: CaseKey) => void;
};

export type WFragenHandle = { onPillTap: (id: string) => void };

export const WFragenGame = forwardRef<WFragenHandle, Props>(({ onFlash, onExit, onStepChange }, ref) => {
  const [questions, setQuestions] = useState(() => shuffle(QUESTIONS));
  const [index, setIndex] = useState(0);
  const [gameStep, setGameStep] = useState<GameStep>("wword");
  const [wFeedback, setWFeedback] = useState<Feedback>(null);
  const [wTries, setWTries] = useState(0);
  const [artFeedback, setArtFeedback] = useState<Feedback>(null);
  const [artTries, setArtTries] = useState(0);
  const [hoveredW, setHoveredW] = useState<WWord | null>(null);
  const [phase, setPhase] = useState<"quiz" | "end">("quiz");
  const [score, setScore] = useState({ correct: 0, wrong: 0 });
  const [totalAnswered, setTotalAnswered] = useState(0);

  const stateRef = useRef({ index, gameStep, wFeedback, wTries, artFeedback, artTries, questions, phase });
  const onFlashRef = useRef(onFlash);
  const onStepChangeRef = useRef(onStepChange);
  onFlashRef.current = onFlash;
  onStepChangeRef.current = onStepChange;
  stateRef.current = { index, gameStep, wFeedback, wTries, artFeedback, artTries, questions, phase };

  function doAdvance(correct: boolean) {
    const { index, questions } = stateRef.current;
    setScore(s => ({ correct: s.correct + (correct ? 1 : 0), wrong: s.wrong + (correct ? 0 : 1) }));
    setTotalAnswered(n => n + 1);
    if (index + 1 >= questions.length) {
      setPhase("end");
    } else {
      setIndex(i => i + 1);
      setGameStep("wword");
      setWFeedback(null);
      setWTries(0);
      setArtFeedback(null);
      setArtTries(0);
      onStepChangeRef.current("wword");
    }
  }

  function handleWTap(w: WWord) {
    const { gameStep, wFeedback, wTries, questions, index, phase } = stateRef.current;
    if (phase !== "quiz" || gameStep !== "wword") return;
    if (wFeedback === "correct" || wFeedback === "revealed") return;
    const q = questions[index];
    if (w === q.correctWWord) {
      setWFeedback("correct");
      setTimeout(() => {
        setGameStep("article");
        setWFeedback(null);
        setWTries(0);
        onStepChangeRef.current("article", q.caseKey);
      }, 700);
    } else {
      const newTries = wTries + 1;
      setWTries(newTries);
      setWFeedback("wrong");
      if (newTries >= 3) {
        setTimeout(() => setWFeedback("revealed"), 700);
        setTimeout(() => doAdvance(false), 2200);
      } else {
        setTimeout(() => setWFeedback(null), 600);
      }
    }
  }

  useImperativeHandle(ref, () => ({
    onPillTap(id: string) {
      const { gameStep, questions, index, phase, artFeedback, artTries } = stateRef.current;
      if (phase !== "quiz" || gameStep !== "article") return;
      if (artFeedback === "correct" || artFeedback === "revealed") return;
      const q = questions[index];
      if (id === q.correctPillId) {
        onFlashRef.current("correct", id);
        setArtFeedback("correct");
        setTimeout(() => doAdvance(true), 900);
      } else {
        onFlashRef.current("wrong", id);
        const newTries = artTries + 1;
        setArtTries(newTries);
        setArtFeedback("wrong");
        if (newTries >= 3) {
          setTimeout(() => setArtFeedback("revealed"), 700);
          setTimeout(() => doAdvance(false), 2200);
        } else {
          setTimeout(() => setArtFeedback(null), 600);
        }
      }
    }
  }), []); // eslint-disable-line react-hooks/exhaustive-deps

  function restart() {
    setQuestions(shuffle(QUESTIONS));
    setIndex(0);
    setGameStep("wword");
    setWFeedback(null);
    setWTries(0);
    setArtFeedback(null);
    setArtTries(0);
    setPhase("quiz");
    setScore({ correct: 0, wrong: 0 });
    setTotalAnswered(0);
    onStepChange("wword");
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
  const showEn = totalAnswered < 5;
  const wDone = wFeedback === "correct" || wFeedback === "revealed" || gameStep === "article";
  const artFilled = artFeedback === "correct" || artFeedback === "revealed";
  const wTriesLeft = 3 - wTries;
  const artTriesLeft = 3 - artTries;

  const bannerClass = (() => {
    if (wFeedback === "correct") return "bg-green-50 text-green-700";
    if (wFeedback === "wrong") return "bg-red-50 text-red-600";
    if (wFeedback === "revealed") return "bg-amber-50 text-amber-700";
    if (gameStep === "article" && !artFeedback) return "bg-poster-teal/10 text-poster-teal";
    if (artFeedback === "correct") return "bg-green-50 text-green-700";
    if (artFeedback === "wrong") return "bg-red-50 text-red-600";
    if (artFeedback === "revealed") return "bg-amber-50 text-amber-700";
    return "bg-poster-bg text-poster-ink/60";
  })();

  const bannerText = (() => {
    if (gameStep === "wword" && !wFeedback) return "What question word asks about the boxed noun?";
    if (wFeedback === "correct") return `${q.correctWWord}? ✓ — now tap the article on the poster ↑`;
    if (wFeedback === "wrong") return wTriesLeft > 0 ? `${wTriesLeft} ${wTriesLeft === 1 ? "try" : "tries"} left` : "...";
    if (wFeedback === "revealed") return `The answer was: ${q.correctWWord}?`;
    if (gameStep === "article" && !artFeedback) return "Tap the correct article on the poster ↑";
    if (artFeedback === "correct") return "Correct!";
    if (artFeedback === "wrong") return artTriesLeft > 0 ? `${artTriesLeft} ${artTriesLeft === 1 ? "try" : "tries"} left` : "...";
    if (artFeedback === "revealed") return `The answer was: "${q.answer}"`;
    return "";
  })();

  return (
    <div
      data-no-reset
      onClick={(e) => e.stopPropagation()}
      className={cn(
        "fixed z-40 bottom-3 left-1/2 -translate-x-1/2 w-[min(92vw,500px)] bg-white rounded-xl shadow-2xl border px-5 py-4 select-none transition-colors duration-200",
        (wFeedback === "correct" || artFeedback === "correct") && "border-green-300",
        (wFeedback === "wrong" || artFeedback === "wrong") && "border-red-300",
        (wFeedback === "revealed" || artFeedback === "revealed") && "border-amber-300",
        gameStep === "article" && !artFeedback && wFeedback !== "wrong" && "border-poster-teal/40",
        !wFeedback && !artFeedback && gameStep === "wword" && "border-poster-ink/15",
      )}
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-[11px] text-poster-ink/40 uppercase tracking-widest">
          W-Fragen · {index + 1} / {questions.length}
        </span>
        <div className="flex items-center gap-3">
          <button onClick={() => doAdvance(false)} className="text-[11px] text-poster-ink/40 hover:text-poster-ink/70 transition-colors">
            Skip
          </button>
          <button onClick={onExit} className="text-[11px] text-poster-ink/40 hover:text-poster-ink/70 transition-colors">
            Exit
          </button>
        </div>
      </div>

      <div className="text-lg font-bold text-poster-ink mb-3 flex items-baseline flex-wrap gap-x-1.5 gap-y-1">
        {q.pre && <span>{q.pre}</span>}
        <span className={cn(
          "inline-flex items-baseline gap-1.5 border-2 rounded px-2 py-0.5 bg-poster-teal/5 text-base leading-snug transition-colors",
          gameStep === "article" && !artFeedback ? "border-poster-teal/60" : "border-poster-teal/40",
        )}>
          {q.boxedPre && <span className="text-poster-ink">{q.boxedPre}</span>}
          <div className="flex flex-col items-center">
            <span className={cn(
              "border-b-2 min-w-[3rem] inline-block text-center leading-snug transition-colors",
              artFilled && artFeedback === "correct" && "border-green-400 text-green-600 font-bold",
              artFilled && artFeedback === "revealed" && "border-amber-400 text-amber-600 font-bold",
              !artFilled && "border-poster-ink/30 text-poster-ink/30",
            )}>
              {artFilled ? q.answer : " "}
            </span>
            {!artFilled && (
              <span className="text-[10px] text-poster-ink/40 leading-none">
                {q.answer.toLowerCase().startsWith("ein") ? "a/an" : "the"}
              </span>
            )}
          </div>
          <span className="text-poster-ink">{q.boxedNoun}</span>
        </span>
        {q.post && <span>{q.post}</span>}
      </div>

      <div
        className={cn("text-[13px] font-medium text-center rounded-lg py-1.5 mb-3 transition-colors", bannerClass)}
        style={{ "--quiz-trickle-iterations": "infinite", "--quiz-trickle-initial-delay": "0" } as React.CSSProperties}
      >
        <span key={`${index}-${gameStep}-${wFeedback}-${artFeedback}`}>
          {Array.from(bannerText).map((ch, i) => (
            <span
              key={i}
              className="quiz-trickle-letter"
              style={{ animationDelay: `calc(${i} * var(--quiz-trickle-stagger, 13) * 1ms)` }}
            >
              {ch}
            </span>
          ))}
        </span>
      </div>

      <div className="flex gap-1.5 justify-center flex-wrap">
        {W_WORDS.map((w) => {
          const isCorrect = w === q.correctWWord;
          return (
            <button
              key={w}
              onClick={() => handleWTap(w)}
              disabled={wDone}
              onMouseEnter={() => setHoveredW(w)}
              onMouseLeave={() => setHoveredW(null)}
              className={cn(
                "flex flex-col items-center px-3 py-1.5 rounded-lg border-2 text-sm font-semibold transition-all",
                !wDone && "border-poster-ink/20 text-poster-ink hover:bg-poster-bg hover:border-poster-teal",
                wDone && isCorrect && "border-green-400 bg-green-50 text-green-700",
                wDone && !isCorrect && "border-poster-ink/10 text-poster-ink/25",
              )}
            >
              <span>{w}?</span>
              <span className={cn("text-[9px] font-normal leading-none mt-0.5 transition-opacity", (showEn || hoveredW === w) ? "opacity-60" : "opacity-0")}>
                {W_EN[w]}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
});

WFragenGame.displayName = "WFragenGame";
