// @ts-nocheck
import { useState } from "react";
import { cn } from "@/lib/utils";
import { avatarSrc } from "./avatars";
import type { StudentIdentity } from "./StudentLobby";
import type { LiveSession } from "./LiveQuizProvider";
import type { QWQuestion } from "@/components/poster/quiz/quizData";
import { QuestionWordSVGMap, loadZones } from "@/components/poster/QuestionWordSVGMap";

type Props = {
  identity: StudentIdentity;
  session: LiveSession;
  myResponses: any[];
  submitting: boolean;
  onAnswer: (answer: string) => void;
};

export function StudentQWQuiz({ identity, session, myResponses, submitting, onAnswer }: Props) {
  const [localAnswer, setLocalAnswer] = useState<string | null>(null);
  const zones = loadZones();

  const idx = session.current_question_index;
  const q = session.questions?.[idx] as QWQuestion | undefined;

  const totalPoints = myResponses
    .filter((r) => r.question_index >= 0)
    .reduce((sum, r) => sum + (r.points || 0), 0);

  const myAnswer = myResponses.find((r) => r.question_index === idx);
  const locked = !!myAnswer?.is_correct;

  if (!q) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-poster-bg text-poster-ink/50">
        Waiting for next question…
      </div>
    );
  }

  const isWordToMeaning = q.direction === "word-to-meaning";
  const prompt = isWordToMeaning ? q.word : q.meaning;
  const subLabel = isWordToMeaning ? "What does this mean?" : "Which word is this?";

  function handleTap(word: string) {
    if (locked || submitting) return;
    setLocalAnswer(word);
    onAnswer(word);
  }

  // Normalize: SVG zones are uppercase, correctAnswer may vary
  const normalizedLocal   = localAnswer?.toUpperCase() ?? null;
  const normalizedCorrect = myAnswer?.is_correct ? q.correctAnswer?.toUpperCase() : null;
  const normalizedWrong   = (myAnswer && !myAnswer.is_correct && localAnswer) ? normalizedLocal : null;

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

      {/* Prompt */}
      <div className="flex flex-col items-center justify-center px-5 pt-8 pb-4 gap-2 shrink-0">
        <div className="text-[11px] uppercase tracking-widest text-poster-ink/35">
          {subLabel}
        </div>
        <div className="text-5xl font-display font-bold text-poster-ink tracking-wide">
          {prompt}
        </div>
      </div>

      {/* SVG click map — fills remaining space */}
      <div className="flex-1 flex flex-col justify-center px-3 pb-6 min-h-0">
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
