// @ts-nocheck
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { avatarSrc } from "./avatars";
import type { StudentIdentity } from "./StudentLobby";
import type { LiveSession } from "./LiveQuizProvider";
import type { WFragenQuestion } from "@/components/poster/quiz/quizData";
import { QuestionWordSVGMap, loadZones } from "@/components/poster/QuestionWordSVGMap";
import { LivePillBoard } from "./LivePillBoard";
import type { QuizQuestion } from "@/components/poster/quiz/quizData";

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

export function StudentWFragenQuiz({ identity, session, myResponses, submitting, onAnswer }: Props) {
  const [localAnswer, setLocalAnswer] = useState<string | null>(null);
  const [hintVisible, setHintVisible] = useState(false);
  const zones = loadZones();

  const isHardArticle = q?.level === "hard" && q?.step === "article";

  useEffect(() => {
    if (!isHardArticle) { setHintVisible(false); return; }
    setHintVisible(false);
    const t = setTimeout(() => setHintVisible(true), 15_000);
    return () => clearTimeout(t);
  }, [session.current_question_index, isHardArticle]);

  const idx = session.current_question_index;
  const q = session.questions?.[idx] as WFragenQuestion | undefined;

  const totalPoints = myResponses
    .filter((r) => r.question_index >= 0)
    .reduce((sum, r) => sum + (r.points || 0), 0);

  const myAnswer = myResponses.find((r) => r.question_index === idx);
  const locked = !!myAnswer?.is_correct;

  const startedAt = session.question_started_at
    ? new Date(session.question_started_at).getTime()
    : Date.now();
  const timerMaxMs = (session.timer_max_seconds || 30) * 1000;

  if (!q) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-poster-bg text-poster-ink/50">
        Waiting for next question…
      </div>
    );
  }

  function handleTap(answer: string) {
    if (locked || submitting) return;
    setLocalAnswer(answer.toUpperCase());
    onAnswer(answer);
  }

  const normalizedLocal   = localAnswer?.toUpperCase() ?? null;
  const normalizedCorrect = myAnswer?.is_correct ? q.correctWWord?.toUpperCase() : null;
  const normalizedWrong   = (myAnswer && !myAnswer.is_correct && localAnswer) ? normalizedLocal : null;

  // Adapt WFragenQuestion to QuizQuestion shape so LivePillBoard can derive pills
  const articleQ: QuizQuestion = {
    kind: "article",
    prep: { token: q.correctWWord + String(q.sentenceIndex), case: q.caseKey },
    correctPillId: q.correctPillId,
  };

  return (
    <div className="min-h-screen flex flex-col bg-poster-bg">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-white/70 border-b border-poster-ink/10 shrink-0">
        <div className="flex items-center gap-2">
          <img src={avatarSrc(identity.student_avatar)} alt="" className="w-8 h-8" draggable={false} />
          <span className="font-semibold text-sm text-poster-ink">{identity.student_name}</span>
        </div>
        <div className="text-xs font-medium text-poster-ink/40">
          {idx + 1} / {session.questions.length}
        </div>
        <div className="px-3 py-1 rounded-full bg-poster-yellow text-white text-sm font-bold tabular-nums">
          {totalPoints} pts
        </div>
      </div>

      {/* Sentence */}
      <div className="px-5 pt-5 pb-2 shrink-0">
        <div className="text-lg font-bold text-poster-ink flex items-baseline flex-wrap gap-x-1.5 gap-y-1 justify-center">
          {q.pre && <span>{q.pre}</span>}
          <span className="inline-flex items-baseline gap-1.5 border-2 border-poster-teal/50 rounded px-2 py-0.5 bg-poster-teal/5">
            {q.boxedPre && <span>{q.boxedPre}</span>}
            {q.step === "article" && (
              <span className="text-poster-ink/30 border-b-2 border-poster-ink/30 min-w-[2rem] inline-block text-center text-sm">
                {q.answer.toLowerCase().startsWith("ein") ? "a/an" : "the"}
              </span>
            )}
            <span>{q.boxedNoun}</span>
          </span>
          {q.post && <span>{q.post}</span>}
        </div>

        {/* Step label */}
        <div className="text-center mt-2">
          {q.step === "wword" ? (
            <span className="text-[11px] uppercase tracking-widest text-poster-ink/35">
              Tap the question word below
            </span>
          ) : (
            <span
              className="text-[11px] uppercase tracking-widest text-poster-teal/70 transition-opacity duration-1000"
              style={{ opacity: isHardArticle ? (hintVisible ? 1 : 0) : 1 }}
            >
              <span className="font-bold">{q.correctWWord}?</span> — {W_EN[q.correctWWord]} · now tap the article
            </span>
          )}
        </div>
      </div>

      {/* Interaction area */}
      <div className="flex-1 flex flex-col justify-center min-h-0">
        {q.step === "wword" ? (
          /* SVG click map */
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
        ) : (
          /* Article step — LivePillBoard */
          <LivePillBoard
            question={articleQ}
            questionStartedAt={startedAt}
            timerMaxMs={timerMaxMs}
            locked={locked}
            lockedPillId={myAnswer?.answer ?? null}
            onAnswer={handleTap}
          />
        )}
      </div>

      {/* Result */}
      {myAnswer && (
        <div className={cn(
          "px-6 py-4 text-center border-t shrink-0 transition-all duration-500",
          myAnswer.is_correct ? "bg-poster-teal/10 border-poster-teal/20" : "bg-poster-red/10 border-poster-red/20",
        )}>
          {myAnswer.is_correct ? (
            <div className="text-poster-teal font-bold text-2xl tracking-tight">
              ✓ +{myAnswer.points} pts
            </div>
          ) : (
            <div className="text-poster-red font-bold text-xl">
              ✗ Try again…
            </div>
          )}
          {locked && (
            <div className="text-xs text-poster-ink/30 mt-1 font-medium">
              Waiting for next question…
            </div>
          )}
        </div>
      )}
    </div>
  );
}
