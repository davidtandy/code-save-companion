// @ts-nocheck
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { avatarSrc } from "./avatars";
import type { StudentIdentity } from "./StudentLobby";
import type { LiveSession } from "./LiveQuizProvider";
import type { WFragenQuestion } from "@/components/poster/quiz/quizData";
import { QuestionWordSVGMap, loadZones } from "@/components/poster/QuestionWordSVGMap";
import { useLiveQuiz } from "./LiveQuizProvider";

/** Set to true to restore the original SVG icon map for the wword step. */
const USE_SVG_MAP = false;

const W_EN: Record<string, string> = {
  WER: "who", WEN: "whom", WEM: "to whom", WO: "where", WOHIN: "where to", WANN: "when",
};

const W_PILL_EN: Record<string, string> = {
  WER: "who?", WEN: "whom?", WEM: "to whom?", WO: "where?", WOHIN: "where to?", WANN: "when?",
};

const WWORD_COLUMNS = [
  { color: "green",  words: ["WEN", "WOHIN"] },
  { color: "yellow", words: ["WER"] },
  { color: "purple", words: ["WEM", "WO", "WANN"] },
] as const;

type Props = {
  identity: StudentIdentity;
  session: LiveSession;
  myResponses: any[];
  submitting: boolean;
  onAnswer: (answer: string) => void;
};

/** Full-screen flash overlay that appears on each new question then fades out. */
function QuizFlash({ text, idx }: { text: string; idx: number }) {
  const [phase, setPhase] = useState<"in" | "out" | "done">("in");

  useEffect(() => {
    setPhase("in");
    const t1 = setTimeout(() => setPhase("out"), 1500);
    const t2 = setTimeout(() => setPhase("done"), 2000);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [idx]);

  if (phase === "done") return null;

  return (
    <div className={cn(
      "fixed inset-0 z-[70] flex items-center justify-center pointer-events-auto",
      "bg-poster-bg/88 backdrop-blur-sm transition-opacity duration-500",
      phase === "out" ? "opacity-0" : "opacity-100",
    )}>
      <span className="quiz-flash-bounce text-center text-2xl font-bold uppercase tracking-widest text-poster-ink px-8">
        {text}
      </span>
    </div>
  );
}

const SCRAMBLE_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ#@%?!";

/** 3-column pill grid for selecting a W-question word. */
function WFragenWordPills({
  onTap, seenWords, disabled, normalizedLocal, normalizedWrong, animatingWord,
}: {
  onTap: (word: string) => void;
  seenWords: Set<string>;
  disabled: boolean;
  normalizedLocal: string | null;
  normalizedWrong: string | null;
  animatingWord: string | null;
}) {
  const [peeking, setPeeking] = useState(false);
  const [scrambleText, setScrambleText] = useState<string | null>(null);

  // Matrix-style character scramble when a correct answer is confirmed
  useEffect(() => {
    if (!animatingWord) { setScrambleText(null); return; }
    const len = animatingWord.length;
    let elapsed = 0;
    const tick = 45;
    const duration = 580;
    const id = setInterval(() => {
      elapsed += tick;
      if (elapsed >= duration) {
        clearInterval(id);
        setScrambleText(animatingWord); // lock to German word
      } else {
        setScrambleText(
          Array.from({ length: len }, () =>
            SCRAMBLE_CHARS[Math.floor(Math.random() * SCRAMBLE_CHARS.length)]
          ).join("")
        );
      }
    }, tick);
    return () => clearInterval(id);
  }, [animatingWord]);

  return (
    <div className="flex-1 flex flex-col px-4 pt-4 pb-2 gap-2 min-h-0">
      <div className="flex gap-3 flex-1 min-h-0">
        {WWORD_COLUMNS.map(({ color, words }) => (
          <div key={color} className="flex flex-col gap-3 flex-1 min-h-0">
            {words.map((word) => {
              const isAnimating = animatingWord === word;
              const showGerman  = seenWords.has(word) && !peeking;
              const label = isAnimating && scrambleText
                ? scrambleText
                : (showGerman ? word : W_PILL_EN[word]);
              const isWrong  = normalizedWrong === word;
              const isActive = normalizedLocal === word && !isWrong;

              return (
                <button
                  key={word}
                  onClick={() => onTap(word)}
                  disabled={disabled}
                  className={cn(
                    "flex-1 rounded-sm flex items-center justify-center text-white font-slab font-bold shadow-sm select-none text-base leading-tight px-2 transition-colors duration-150",
                    color === "green"  && "bg-poster-green",
                    color === "yellow" && "bg-poster-yellow",
                    color === "purple" && "bg-poster-purple",
                    isAnimating && "ring-4 ring-poster-teal ring-offset-2 font-mono tracking-widest",
                    isWrong  && "opacity-40 scale-95",
                    isActive && "opacity-70 scale-95",
                    disabled && !isAnimating && "opacity-50",
                  )}
                >
                  {label}
                </button>
              );
            })}
          </div>
        ))}
      </div>

      {/* Press-and-hold to peek at English labels */}
      <div className="flex justify-end shrink-0 pt-1">
        <button
          className={cn(
            "px-3 py-1.5 rounded-full text-xs font-medium select-none transition-colors",
            peeking
              ? "bg-poster-ink/20 text-poster-ink/80"
              : "bg-poster-ink/10 text-poster-ink/40",
          )}
          onPointerDown={() => setPeeking(true)}
          onPointerUp={() => setPeeking(false)}
          onPointerLeave={() => setPeeking(false)}
          onPointerCancel={() => setPeeking(false)}
        >
          {peeking ? "showing English" : "hold to peek"}
        </button>
      </div>
    </div>
  );
}

/** Shown after a correct wword answer: answer + points on left, live rankings on right. */
function WFragenPostAnswer({
  correctWord, points, leaderboard, studentId,
}: {
  correctWord: string;
  points: number;
  leaderboard: { id: string; name: string; avatar: string; points: number }[];
  studentId: string;
}) {
  return (
    <div className="flex-1 flex min-h-0 overflow-hidden">
      <div className="flex-1 flex flex-col items-center justify-center gap-3 px-6 text-center border-r border-poster-ink/10">
        <div className="text-5xl font-display font-bold text-poster-ink tracking-wide">{correctWord}</div>
        <div className="text-3xl font-bold text-poster-teal tabular-nums">+{points} pts</div>
        <div className="text-xs text-poster-ink/35 font-medium uppercase tracking-widest mt-1">
          Waiting for next question…
        </div>
      </div>
      <div className="flex-1 flex flex-col gap-1.5 px-3 py-4 overflow-y-auto">
        {leaderboard.map((entry, i) => (
          <div
            key={entry.id}
            className={cn(
              "flex items-center gap-2 px-2.5 py-1.5 rounded-full shrink-0",
              i === 0
                ? "bg-poster-yellow text-white"
                : entry.id === studentId
                ? "bg-poster-teal/15 ring-1 ring-poster-teal/40"
                : "bg-white/60",
            )}
          >
            <span className={cn(
              "text-xs font-bold w-4 text-center tabular-nums shrink-0",
              i === 0 ? "text-white" : "text-poster-ink/30",
            )}>{i + 1}</span>
            <img src={avatarSrc(entry.avatar)} alt="" className="w-5 h-5 shrink-0" draggable={false} />
            <span className={cn(
              "flex-1 text-xs font-semibold truncate",
              i === 0 ? "text-white" : "text-poster-ink",
            )}>{entry.name}</span>
            <span className={cn(
              "text-xs font-bold tabular-nums shrink-0",
              i === 0 ? "text-white" : "text-poster-ink",
            )}>{entry.points}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function StudentWFragenQuiz({ identity, session, myResponses, submitting, onAnswer }: Props) {
  const [localAnswer, setLocalAnswer] = useState<string | null>(null);
  const [seenWords, setSeenWords] = useState<Set<string>>(new Set());
  const [animatingWord, setAnimatingWord] = useState<string | null>(null);
  const [showPostAnswer, setShowPostAnswer] = useState(false);
  const { leaderboard } = useLiveQuiz();
  const zones = loadZones();

  const idx = session.current_question_index;
  const q = session.questions?.[idx] as WFragenQuestion | undefined;

  // Reset per question
  useEffect(() => {
    setLocalAnswer(null);
    setAnimatingWord(null);
    setShowPostAnswer(false);
  }, [idx]);

  // When a correct answer lands: play flip animation, then reveal post-answer screen
  const locked = !!myResponses.find((r) => r.question_index === idx)?.is_correct;

  useEffect(() => {
    if (!locked || !q) {
      setAnimatingWord(null);
      setShowPostAnswer(false);
      return;
    }
    const word = q.correctWWord?.toUpperCase();
    setAnimatingWord(word ?? null);
    // Update seenWords after scramble finishes (~580ms) so German word is locked in
    const t1 = setTimeout(() => {
      if (word) setSeenWords(prev => { const s = new Set(prev); s.add(word); return s; });
    }, 620);
    // Transition to post-answer shortly after scramble settles
    const t2 = setTimeout(() => {
      setAnimatingWord(null);
      setShowPostAnswer(true);
    }, 950);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [locked]); // eslint-disable-line react-hooks/exhaustive-deps

  const totalPoints = myResponses
    .filter((r) => r.question_index >= 0)
    .reduce((sum, r) => sum + (r.points || 0), 0);

  const myAnswer = myResponses.find((r) => r.question_index === idx);

  if (!q) {
    return (
      <div className="fixed inset-0 z-[60] flex items-center justify-center bg-poster-bg text-poster-ink/50">
        Waiting for next question…
      </div>
    );
  }

  const isArticleStep = q.step === "article";
  const flashText = isArticleStep
    ? `${q.correctWWord}? — ${W_EN[q.correctWWord] ?? ""} · tap the article`
    : "Tap the question word below";

  function handleTap(answer: string) {
    if (locked || submitting) return;
    setLocalAnswer(answer.toUpperCase());
    onAnswer(answer);
  }

  const normalizedLocal   = localAnswer?.toUpperCase() ?? null;
  const normalizedCorrect = myAnswer?.is_correct ? q.correctWWord?.toUpperCase() : null;
  const normalizedWrong   = (myAnswer && !myAnswer.is_correct && localAnswer) ? normalizedLocal : null;

  return (
    <div className={cn(
      "fixed inset-0 z-[60] flex flex-col",
      isArticleStep ? "pointer-events-none" : "bg-poster-bg",
    )}>

      {/* Header */}
      <div className="pointer-events-auto flex items-center px-4 py-2 bg-white/95 backdrop-blur-sm border-b border-poster-ink/10 shrink-0 gap-3">
        <div className="flex items-center gap-2 shrink-0">
          <img src={avatarSrc(identity.student_avatar)} alt="" className="w-7 h-7" draggable={false} />
          <span className="font-semibold text-sm text-poster-ink">{identity.student_name}</span>
        </div>
        <div className="flex-1 flex items-baseline flex-wrap gap-x-1 gap-y-0.5 justify-center min-w-0 text-sm font-bold text-poster-ink leading-tight">
          {q.pre && <span>{q.pre}</span>}
          <span className="inline-flex items-baseline gap-1 border-2 border-poster-teal/50 rounded px-1.5 py-0.5 bg-poster-teal/5">
            {q.boxedPre && <span>{q.boxedPre}</span>}
            {isArticleStep ? (
              <span className={cn(
                "border-b-2 min-w-[1.5rem] inline-block text-center leading-snug",
                locked ? "border-poster-teal text-poster-teal" : "border-poster-ink/30 text-poster-ink/30",
              )}>
                {locked ? q.answer : "   "}
              </span>
            ) : (
              <span>{q.answer}</span>
            )}
            <span>{q.boxedNoun}</span>
          </span>
          {q.post && <span>{q.post}</span>}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <div className="text-xs font-medium text-poster-ink/40">{idx + 1} / {session.questions.length}</div>
          <div className="px-3 py-1 rounded-full bg-poster-yellow text-white text-sm font-bold tabular-nums">{totalPoints} pts</div>
        </div>
      </div>

      {/* Wword step body */}
      {!isArticleStep && (
        locked && showPostAnswer ? (
          <WFragenPostAnswer
            correctWord={normalizedCorrect ?? ""}
            points={myAnswer?.points ?? 0}
            leaderboard={leaderboard}
            studentId={identity.student_id}
          />
        ) : USE_SVG_MAP ? (
          <div className="flex-1 flex flex-col justify-center min-h-0">
            <div className="px-3 pb-4">
              <QuestionWordSVGMap
                zones={zones}
                onWordClick={handleTap}
                activeWord={normalizedLocal}
                correctWord={null}
                wrongWord={normalizedWrong}
                gap={6}
                className="w-full"
              />
            </div>
          </div>
        ) : (
          <WFragenWordPills
            onTap={handleTap}
            seenWords={seenWords}
            disabled={locked || submitting}
            normalizedLocal={!locked ? normalizedLocal : null}
            normalizedWrong={!locked ? normalizedWrong : null}
            animatingWord={animatingWord}
          />
        )
      )}

      {/* Article step: transparent spacer */}
      {isArticleStep && <div className="flex-1" />}

      {/* Result bar: wword wrong attempt, or article step */}
      {myAnswer && (isArticleStep || !locked) && (
        <div className={cn(
          "pointer-events-auto px-6 py-4 text-center border-t shrink-0 transition-all duration-500",
          isArticleStep ? "bg-white/95 backdrop-blur-sm" : "",
          myAnswer.is_correct ? "border-poster-teal/20 bg-poster-teal/10" : "border-poster-red/20 bg-poster-red/10",
        )}>
          {myAnswer.is_correct ? (
            <div className="text-poster-teal font-bold text-2xl tracking-tight">✓ +{myAnswer.points} pts</div>
          ) : (
            <div className="text-poster-red font-bold text-xl">✗ Try again…</div>
          )}
          {locked && isArticleStep && (
            <div className="text-xs text-poster-ink/30 mt-1 font-medium">Waiting for next question…</div>
          )}
        </div>
      )}

      {/* Instruction flash */}
      <QuizFlash text={flashText} idx={idx} />
    </div>
  );
}
