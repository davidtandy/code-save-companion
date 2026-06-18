import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

const AKK_PREPS = ["für", "gegen", "um", "bis", "ohne", "durch"];
const DAT_PREPS = ["zu", "von", "mit", "bei", "nach", "seit", "ab", "aus", "gegenüber", "außer"];

type CaseKey = "akk" | "dat";
type Question = { prep: string; caseKey: CaseKey };
type Feedback = "idle" | "correct" | "wrong" | "revealed";

function shuffleQuestions(): Question[] {
  const all: Question[] = [
    ...AKK_PREPS.map(p => ({ prep: p, caseKey: "akk" as CaseKey })),
    ...DAT_PREPS.map(p => ({ prep: p, caseKey: "dat" as CaseKey })),
  ];
  for (let i = all.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [all[i], all[j]] = [all[j], all[i]];
  }
  return all;
}

type Props = { onExit: () => void };

export function PrepTrainerGame({ onExit }: Props) {
  const [entered, setEntered] = useState(false);
  const [questions, setQuestions] = useState<Question[]>(shuffleQuestions);
  const [phase, setPhase] = useState<"playing" | "end">("playing");
  const [qIndex, setQIndex] = useState(0);
  const [tries, setTries] = useState(0);
  const [feedback, setFeedback] = useState<Feedback>("idle");
  const [selectedPrep, setSelectedPrep] = useState<string | null>(null);
  const [correctCount, setCorrectCount] = useState(0);

  useEffect(() => {
    const id = requestAnimationFrame(() => setEntered(true));
    return () => cancelAnimationFrame(id);
  }, []);

  const q = questions[qIndex];
  const triesLeft = 3 - tries;

  function advance() {
    if (qIndex + 1 >= questions.length) {
      setPhase("end");
    } else {
      setQIndex(i => i + 1);
      setTries(0);
      setFeedback("idle");
      setSelectedPrep(null);
    }
  }

  function handleTap(prep: string) {
    if (feedback === "correct" || feedback === "revealed") return;
    setSelectedPrep(prep);
    if (prep === q.prep) {
      setCorrectCount(n => n + 1);
      setFeedback("correct");
      setTimeout(advance, 700);
    } else {
      const newTries = tries + 1;
      setTries(newTries);
      setFeedback("wrong");
      if (newTries >= 3) {
        setTimeout(() => setFeedback("revealed"), 500);
        setTimeout(advance, 1800);
      } else {
        setTimeout(() => { setFeedback("idle"); setSelectedPrep(null); }, 600);
      }
    }
  }

  function restart() {
    setQuestions(shuffleQuestions());
    setQIndex(0);
    setTries(0);
    setFeedback("idle");
    setSelectedPrep(null);
    setCorrectCount(0);
    setPhase("playing");
  }

  function prepClass(prep: string) {
    const isSelected = selectedPrep === prep;
    const isCorrect = prep === q.prep;
    const base = "w-full text-left px-3 py-2 text-sm font-medium rounded-lg transition-colors select-none";
    if (feedback === "correct" && isSelected)  return cn(base, "bg-green-400/70 text-white");
    if (feedback === "revealed" && isCorrect)  return cn(base, "bg-green-400/70 text-white");
    if (feedback === "wrong" && isSelected)    return cn(base, "bg-red-400/80 text-white prep-shake");
    if (feedback !== "idle" && !isSelected)    return cn(base, "opacity-30 cursor-default");
    return cn(base, "text-white/90 hover:bg-white/15 active:bg-white/25");
  }

  const ease = "cubic-bezier(0.34, 1.56, 0.64, 1)";

  if (phase === "end") {
    return (
      <div
        data-no-reset
        onClick={(e) => e.stopPropagation()}
        className="fixed inset-0 z-40 flex items-center justify-center"
        style={{ background: "rgba(0,0,0,0.6)" }}
      >
        <div className="bg-white rounded-2xl shadow-2xl px-8 py-7 text-center space-y-3 w-[min(90vw,300px)]">
          <div className="text-lg font-bold text-poster-ink">Round complete!</div>
          <div className="text-6xl font-bold text-poster-teal">
            {correctCount}
            <span className="text-2xl text-poster-ink/35">/{questions.length}</span>
          </div>
          <div className="text-sm text-poster-ink/50">found on first try</div>
          <div className="flex gap-2 pt-2">
            <button
              onClick={restart}
              className="flex-1 h-10 rounded-xl bg-poster-teal text-white text-sm font-medium hover:bg-poster-teal/90 transition-colors"
            >
              Play again
            </button>
            <button
              onClick={onExit}
              className="h-10 px-4 rounded-xl border border-poster-ink/20 text-sm text-poster-ink/60 hover:bg-poster-ink/5 transition-colors"
            >
              Exit
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      data-no-reset
      onClick={(e) => e.stopPropagation()}
      className="fixed inset-0 z-40 flex flex-col items-center justify-center gap-5 pointer-events-none"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0"
        style={{
          background: "rgba(0,0,0,0.62)",
          opacity: entered ? 1 : 0,
          transition: "opacity 0.45s ease-out",
        }}
      />

      {/* Prompt card */}
      <div
        className="relative z-10 pointer-events-auto bg-white rounded-2xl shadow-2xl px-8 py-5 text-center"
        style={{
          transform: entered ? "translateY(0)" : "translateY(-20px)",
          opacity: entered ? 1 : 0,
          transition: `transform 0.5s ${ease}, opacity 0.4s ease-out`,
          transitionDelay: "0.08s",
        }}
      >
        <div className="text-[10px] uppercase tracking-widest text-poster-ink/35 mb-2">
          {qIndex + 1} / {questions.length}
        </div>
        <div className="text-5xl font-display font-bold text-poster-ink tracking-wide">
          {q.prep}
        </div>
        <div className="flex items-center justify-center gap-1.5 mt-3">
          {[0, 1, 2].map(i => (
            <div
              key={i}
              className={cn(
                "w-2 h-2 rounded-full transition-colors duration-300",
                i < triesLeft ? "bg-poster-teal" : "bg-poster-ink/20",
              )}
            />
          ))}
        </div>
      </div>

      {/* Two strips */}
      <div className="relative z-10 pointer-events-auto flex gap-3 items-start">
        {/* AKK strip */}
        <div
          className="rounded-xl overflow-hidden shadow-2xl"
          style={{
            transform: entered ? "translateX(0) scale(1)" : "translateX(-70px) scale(0.88)",
            opacity: entered ? 1 : 0,
            transition: `transform 0.52s ${ease}, opacity 0.4s ease-out`,
          }}
        >
          <div className="bg-poster-green px-4 py-1.5 text-center">
            <span className="text-[10px] font-bold text-white/60 uppercase tracking-[0.18em]">Akkusativ</span>
          </div>
          <div className="bg-poster-green p-2 flex flex-col gap-0.5 min-w-[130px]">
            {AKK_PREPS.map(prep => (
              <button key={prep} onClick={() => handleTap(prep)} className={prepClass(prep)}>
                {prep}
              </button>
            ))}
          </div>
        </div>

        {/* DAT strip */}
        <div
          className="rounded-xl overflow-hidden shadow-2xl"
          style={{
            transform: entered ? "translateX(0) scale(1)" : "translateX(70px) scale(0.88)",
            opacity: entered ? 1 : 0,
            transition: `transform 0.52s ${ease}, opacity 0.4s ease-out`,
          }}
        >
          <div className="bg-poster-purple px-4 py-1.5 text-center">
            <span className="text-[10px] font-bold text-white/60 uppercase tracking-[0.18em]">Dativ</span>
          </div>
          <div className="bg-poster-purple p-2 flex flex-col gap-0.5 min-w-[130px]">
            {DAT_PREPS.map(prep => (
              <button key={prep} onClick={() => handleTap(prep)} className={prepClass(prep)}>
                {prep}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Exit */}
      <button
        onClick={onExit}
        className="relative z-10 pointer-events-auto text-xs text-white/40 hover:text-white/70 transition-colors"
        style={{
          opacity: entered ? 1 : 0,
          transition: "opacity 0.5s ease-out 0.3s",
        }}
      >
        Exit
      </button>
    </div>
  );
}
