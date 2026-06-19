// @ts-nocheck
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import type { QuizQuestion } from "@/components/poster/quiz/quizData";
import { pillsForQuestion, eliminationOrder, PILL_LABEL } from "./scoring";

type Props = {
  question: QuizQuestion;
  questionStartedAt: number; // ms epoch
  timerMaxMs: number;
  locked: boolean;
  lockedPillId: string | null;
  onAnswer: (pillId: string) => void;
};

export function LivePillBoard({ question, questionStartedAt, timerMaxMs, locked, lockedPillId, onAnswer }: Props) {
  const pills = pillsForQuestion(question);
  const elimOrder = eliminationOrder(question, pills);
  const [zoomed, setZoomed] = useState<string | null>(null);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const t = window.setInterval(() => setNow(Date.now()), 200);
    return () => window.clearInterval(t);
  }, []);

  // Reset zoom when question changes
  useEffect(() => { setZoomed(null); }, [question.correctPillId, question.prep.token]);

  const elapsed = Math.max(0, now - questionStartedAt);
  // Reveal wrong pills progressively. Start eliminating at 30% of timer, finish by 95%.
  const elimStart = timerMaxMs * 0.3;
  const elimEnd = timerMaxMs * 0.95;
  const progress = Math.min(1, Math.max(0, (elapsed - elimStart) / (elimEnd - elimStart)));
  const eliminatedCount = Math.min(elimOrder.length - 1, Math.floor(progress * elimOrder.length));
  const eliminated = new Set(elimOrder.slice(0, eliminatedCount));

  const timeLeft = Math.max(0, timerMaxMs - elapsed);
  const timeRatio = Math.max(0, Math.min(1, timeLeft / timerMaxMs));

  function handleTap(pillId: string) {
    if (locked) return;
    if (eliminated.has(pillId)) return;
    if (zoomed !== pillId) { setZoomed(pillId); return; }
    onAnswer(pillId);
  }

  const isPronoun = question.kind === "pronoun";
  const prompt = isPronoun
    ? `${question.prefix ?? ""} ${question.prep.token} ___ ${question.suffix ?? ""}`.trim()
    : `${question.prefix ?? ""} ${question.prep.token} ___ ${question.nounDe}${question.suffix ? " " + question.suffix : ""}`.trim();
  const promptEn = isPronoun
    ? question.targetEn
    : `${question.nounArticle} ${question.nounEn}`;

  return (
    <div className="flex flex-col h-full w-full">
      {/* Timer */}
      <div className="h-1 bg-muted relative overflow-hidden">
        <div
          className="absolute inset-y-0 left-0 bg-primary transition-[width] duration-200 ease-linear"
          style={{ width: `${timeRatio * 100}%` }}
        />
      </div>
      {/* Prompt */}
      <div className="px-4 py-6 text-center">
        <div className="text-3xl font-bold leading-tight">{prompt}</div>
        <div className="text-sm text-muted-foreground mt-2">{promptEn}</div>
      </div>
      {/* Pill grid */}
      <div className="flex-1 px-3 pb-6 overflow-y-auto">
        <div className="grid grid-cols-3 gap-2 max-w-md mx-auto">
          {pills.map((id) => {
            const isElim = eliminated.has(id);
            const isZoom = zoomed === id;
            const isLocked = lockedPillId === id;
            const isCorrect = locked && id === question.correctPillId;
            const isWrong = isLocked && id !== question.correctPillId;
            return (
              <button
                key={id}
                onClick={() => handleTap(id)}
                disabled={locked || isElim}
                className={cn(
                  "rounded-2xl py-4 px-2 text-lg font-semibold border-2 transition-all duration-200",
                  "bg-card text-card-foreground border-border",
                  isElim && "opacity-25 grayscale",
                  isZoom && !locked && "scale-110 bg-primary/10 border-primary shadow-lg",
                  isLocked && !isCorrect && "border-destructive bg-destructive/10",
                  isCorrect && "border-green-500 bg-green-500/20",
                  isWrong && "border-destructive bg-destructive/20",
                )}
              >
                {PILL_LABEL[id] ?? id}
              </button>
            );
          })}
        </div>
        {!locked && zoomed && (
          <div className="text-center text-xs text-muted-foreground mt-4">
            Tap again to confirm
          </div>
        )}
      </div>
    </div>
  );
}
