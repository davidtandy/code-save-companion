import { useState } from "react";
import { cn } from "@/lib/utils";

type CaseColor = "nom" | "akk" | null;

const WORDS = [
  { word: "WER",   meaning: "who (subject)",              mnemonic: "WER = WORker — the one doing the work.",                                                                  caseColor: "nom" as CaseColor },
  { word: "WEN",   meaning: "whom (direct object)",        mnemonic: "WEN is the one getting went after. No M — the action hits directly, no \"to/for\" middleman.",            caseColor: "akk" as CaseColor },
  { word: "WEM",   meaning: "to/for whom (indirect object)",mnemonic: "WEM has M for Mail — you send something TO them. Rhymes with \"them.\"",                                 caseColor: "akk" as CaseColor },
  { word: "WAS",   meaning: "what",                        mnemonic: "WHAT with a German accent.",                                                                               caseColor: null  as CaseColor },
  { word: "WO",    meaning: "where (location)",             mnemonic: "WHOA — stop moving. Just a location.",                                                                    caseColor: null  as CaseColor },
  { word: "WOHIN", meaning: "where to (direction)",         mnemonic: "\"where IN\" — going into somewhere.",                                                                    caseColor: null  as CaseColor },
  { word: "WANN",  meaning: "when",                         mnemonic: "\"when, man?\"",                                                                                          caseColor: null  as CaseColor },
];

function answerButtonClass(
  answer: string,
  selectedAnswer: string | null,
  feedback: "correct" | "wrong" | "revealed" | null,
  correctAnswer: string,
  isWordToMeaning: boolean,
) {
  const isSelected = selectedAnswer === answer;
  const isCorrect = answer === correctAnswer;
  const entry = WORDS.find((w) => (isWordToMeaning ? w.meaning === answer : w.word === answer));
  const base = "w-full text-left px-3 py-2 rounded-lg border text-sm transition-colors";
  if (feedback === "correct" && isSelected)    return cn(base, "bg-green-50 border-green-400 text-green-700 font-semibold");
  if (feedback === "revealed" && isCorrect)    return cn(base, "bg-green-50 border-green-400 text-green-700 font-semibold");
  if (feedback === "wrong" && isSelected)      return cn(base, "bg-red-50 border-red-300 text-red-600");
  if (feedback === "revealed" && !isCorrect)   return cn(base, "border-poster-ink/10 text-poster-ink/30");
  if (entry?.caseColor === "nom") return cn(base, "bg-yellow-50 border-yellow-300 text-yellow-900 hover:bg-yellow-100");
  if (entry?.caseColor === "akk") return cn(base, "bg-green-50 border-green-300 text-green-900 hover:bg-green-100");
  return cn(base, "border-poster-ink/15 text-poster-ink hover:bg-poster-bg");
}

type Direction = "word-to-meaning" | "meaning-to-word";
type Question = { direction: Direction; promptIndex: number };
type Feedback = "correct" | "wrong" | "revealed" | null;

function generateQuestions(): Question[] {
  const qs: Question[] = [];
  for (let i = 0; i < WORDS.length; i++) {
    qs.push({ direction: "word-to-meaning", promptIndex: i });
    qs.push({ direction: "meaning-to-word", promptIndex: i });
  }
  for (let i = qs.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [qs[i], qs[j]] = [qs[j], qs[i]];
  }
  return qs;
}

type Props = { onExit: () => void };

export function QuestionWordGame({ onExit }: Props) {
  const [phase, setPhase] = useState<"study" | "quiz" | "end">("study");
  const [studyIndex, setStudyIndex] = useState(0);
  const [questions, setQuestions] = useState<Question[]>(generateQuestions);
  const [quizIndex, setQuizIndex] = useState(0);
  const [tries, setTries] = useState(0);
  const [showHint, setShowHint] = useState(false);
  const [feedback, setFeedback] = useState<Feedback>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [score, setScore] = useState({ correct: 0, wrong: 0 });

  function advance() {
    if (quizIndex + 1 >= questions.length) {
      setPhase("end");
    } else {
      setQuizIndex((i) => i + 1);
      setTries(0);
      setShowHint(false);
      setFeedback(null);
      setSelectedAnswer(null);
    }
  }

  function handleAnswer(answer: string) {
    if (feedback === "correct" || feedback === "revealed") return;
    const q = questions[quizIndex];
    const w = WORDS[q.promptIndex];
    const correct = q.direction === "word-to-meaning" ? answer === w.meaning : answer === w.word;
    setSelectedAnswer(answer);
    if (correct) {
      setFeedback("correct");
      setScore((s) => ({ ...s, correct: s.correct + 1 }));
      setTimeout(advance, 900);
    } else {
      const newTries = tries + 1;
      setTries(newTries);
      setFeedback("wrong");
      if (newTries >= 3) {
        setScore((s) => ({ ...s, wrong: s.wrong + 1 }));
        setTimeout(() => setFeedback("revealed"), 700);
        setTimeout(advance, 2200);
      } else {
        setTimeout(() => { setFeedback(null); setSelectedAnswer(null); }, 600);
      }
    }
  }

  function restart() {
    setPhase("study");
    setStudyIndex(0);
    setQuestions(generateQuestions());
    setQuizIndex(0);
    setTries(0);
    setShowHint(false);
    setFeedback(null);
    setSelectedAnswer(null);
    setScore({ correct: 0, wrong: 0 });
  }

  // ── Study phase ──────────────────────────────────────────────────────────
  if (phase === "study") {
    const w = WORDS[studyIndex];
    return (
      <div
        data-no-reset
        onClick={(e) => e.stopPropagation()}
        className="fixed z-40 bottom-3 left-1/2 -translate-x-1/2 w-[min(92vw,460px)] bg-white rounded-xl shadow-2xl border border-poster-ink/15 px-6 py-5 select-none"
      >
        <div className="flex items-center justify-between mb-4">
          <span className="text-[11px] text-poster-ink/40 uppercase tracking-widest">
            Question Words · {studyIndex + 1} of {WORDS.length}
          </span>
          <button onClick={onExit} className="text-[11px] text-poster-ink/40 hover:text-poster-ink/70 transition-colors">
            Exit
          </button>
        </div>

        <div className="text-center space-y-2 mb-5">
          <div className="font-display font-bold text-5xl text-poster-teal tracking-wide">{w.word}</div>
          <div className="text-base font-semibold text-poster-ink">{w.meaning}</div>
          <div className="text-sm text-poster-ink/55 italic leading-snug">{w.mnemonic}</div>
        </div>

        <div className="flex gap-2">
          {studyIndex > 0 && (
            <button
              onClick={() => setStudyIndex((i) => i - 1)}
              className="flex-1 h-9 rounded-lg border border-poster-ink/20 text-sm text-poster-ink/60 hover:bg-poster-ink/5 transition-colors"
            >
              Back
            </button>
          )}
          {studyIndex < WORDS.length - 1 ? (
            <button
              onClick={() => setStudyIndex((i) => i + 1)}
              className="flex-1 h-9 rounded-lg bg-poster-teal text-white text-sm font-medium hover:bg-poster-teal/90 transition-colors"
            >
              Next
            </button>
          ) : (
            <button
              onClick={() => setPhase("quiz")}
              className="flex-1 h-9 rounded-lg bg-poster-teal text-white text-sm font-medium hover:bg-poster-teal/90 transition-colors"
            >
              Start Quiz →
            </button>
          )}
        </div>
      </div>
    );
  }

  // ── End phase ─────────────────────────────────────────────────────────────
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

  // ── Quiz phase ────────────────────────────────────────────────────────────
  const q = questions[quizIndex];
  const w = WORDS[q.promptIndex];
  const isWordToMeaning = q.direction === "word-to-meaning";
  const prompt = isWordToMeaning ? w.word : w.meaning;
  const answers = isWordToMeaning ? WORDS.map((x) => x.meaning) : WORDS.map((x) => x.word);
  const correctAnswer = isWordToMeaning ? w.meaning : w.word;
  const triesLeft = 3 - tries;

  return (
    <div
      data-no-reset
      onClick={(e) => e.stopPropagation()}
      className="fixed z-40 bottom-3 left-1/2 -translate-x-1/2 w-[min(92vw,480px)] bg-white rounded-xl shadow-2xl border border-poster-ink/15 px-5 py-4 select-none"
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-[11px] text-poster-ink/40 uppercase tracking-widest">
          {quizIndex + 1} / {questions.length}
        </span>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowHint((h) => !h)}
            className="text-[11px] text-poster-teal hover:underline transition-colors"
          >
            {showHint ? "hide hint" : "hint"}
          </button>
          <button onClick={onExit} className="text-[11px] text-poster-ink/40 hover:text-poster-ink/70 transition-colors">
            Exit
          </button>
        </div>
      </div>

      {showHint && (
        <div className="mb-3 px-3 py-2 bg-poster-bg rounded-lg text-[11px] text-poster-ink/60 italic leading-snug">
          {w.mnemonic}
        </div>
      )}

      <div className="text-center mb-4">
        <div className={cn(
          "font-display font-bold tracking-wide",
          isWordToMeaning ? "text-4xl text-poster-teal" : "text-lg text-poster-ink",
        )}>
          {prompt}
        </div>
        {tries > 0 && feedback !== "correct" && feedback !== "revealed" && (
          <div className="text-[11px] text-poster-ink/40 mt-1">
            {triesLeft} {triesLeft === 1 ? "try" : "tries"} left
          </div>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        {answers.map((answer) => (
          <button
            key={answer}
            onClick={() => handleAnswer(answer)}
            className={answerButtonClass(answer, selectedAnswer, feedback, correctAnswer, isWordToMeaning)}
          >
            {answer}
          </button>
        ))}
      </div>
    </div>
  );
}
