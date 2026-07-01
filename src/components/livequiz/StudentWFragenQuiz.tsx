// @ts-nocheck
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { avatarSrc } from "./avatars";
import type { StudentIdentity } from "./StudentLobby";
import type { LiveSession } from "./LiveQuizProvider";
import type { WFragenQuestion } from "@/components/poster/quiz/quizData";
import { QuestionWordSVGMap, loadZones } from "@/components/poster/QuestionWordSVGMap";

const W_EN: Record<string, string> = {
  WER: "who", WEN: "whom", WEM: "to whom", WO: "where", WOHIN: "where to",
};

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

export function StudentWFragenQuiz({ identity, session, myResponses, submitting, onAnswer }: Props) {
  const [localAnswer, setLocalAnswer] = useState<string | null>(null);
  const zones = loadZones();

  const idx = session.current_question_index;
  const q = session.questions?.[idx] as WFragenQuestion | undefined;

  const totalPoints = myResponses
    .filter((r) => r.question_index >= 0)
    .reduce((sum, r) => sum + (r.points || 0), 0);

  const myAnswer = myResponses.find((r) => r.question_index === idx);
  const locked = !!myAnswer?.is_correct;

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
    // Article step: transparent + pointer-events-none so the cheatsheet shows through and is tappable.
    // Wword step: opaque background covers the cheatsheet.
    <div className={cn(
      "fixed inset-0 z-[60] flex flex-col",
      isArticleStep ? "pointer-events-none" : "bg-poster-bg",
    )}>

      {/* Header: name | sentence | counter+score */}
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
                {locked ? q.answer : "   "}
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

      {/* Wword step: SVG map */}
      {!isArticleStep && (
        <>
          <div className="flex-1 flex flex-col justify-center min-h-0">
            <div className="px-3 pb-4">
              <QuestionWordSVGMap
                zones={zones}
                onWordClick={handleTap}
                activeWord={!locked ? normalizedLocal : null}
                correctWord={locked ? normalizedCorrect : null}
                wrongWord={!locked ? normalizedWrong : null}
                gap={6}
                className="w-full"
              />
            </div>
          </div>
        </>
      )}

      {/* Article step: transparent spacer so cheatsheet shows through */}
      {isArticleStep && <div className="flex-1" />}

      {/* Result */}
      {myAnswer && (
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
          {locked && (
            <div className="text-xs text-poster-ink/30 mt-1 font-medium">Waiting for next question…</div>
          )}
        </div>
      )}

      {/* Instruction flash */}
      <QuizFlash text={flashText} idx={idx} />
    </div>
  );
}
