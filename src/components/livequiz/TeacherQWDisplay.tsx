// @ts-nocheck
import type { QWQuestion } from "@/components/poster/quiz/quizData";

type Props = {
  q: QWQuestion;
  questionIndex: number;
  totalQuestions: number;
  responses: any[];
  showBreakdown: boolean;
  answeredThisQ: number;
  participantCount: number;
};

export function TeacherQWDisplay({
  q,
  questionIndex,
  totalQuestions,
  responses,
  showBreakdown,
  answeredThisQ,
  participantCount,
}: Props) {
  const isWordToMeaning = q.direction === "word-to-meaning";
  const prompt = isWordToMeaning ? q.word : q.meaning;
  const subLabel = isWordToMeaning ? "What does this mean?" : "Which word is this?";

  const currentResponses = responses.filter((r) => r.question_index === questionIndex);
  const optionCounts = q.options.map((opt) => ({
    opt,
    count: currentResponses.filter((r) => r.answer === opt).length,
    isCorrect: opt === q.correctAnswer,
  }));
  const maxCount = Math.max(...optionCounts.map((c) => c.count), 1);

  return (
    <>
      <div className="text-[10px] uppercase tracking-widest text-poster-ink/50 font-semibold bg-white/70 backdrop-blur-sm rounded-full px-3 py-1">
        Q{questionIndex + 1} / {totalQuestions}
        {" · "}{answeredThisQ} / {participantCount} answered
      </div>
      <div className="text-[11px] uppercase tracking-widest text-poster-ink/35">
        {subLabel}
      </div>
      <div className="text-5xl font-bold text-poster-ink leading-snug tracking-tight drop-shadow-sm">
        {prompt}
      </div>
      <div className="w-full max-w-[320px] space-y-1">
        {optionCounts.map(({ opt, count, isCorrect }) => {
          const barPct = Math.round((count / maxCount) * 100);
          const revealed = showBreakdown && isCorrect;
          return (
            <div
              key={opt}
              className="relative rounded-lg overflow-hidden text-xs font-semibold px-3 py-1.5 text-left"
              style={{
                background: revealed ? "rgba(0,180,140,0.08)" : "rgba(0,0,0,0.04)",
                color: revealed ? "#00b09b" : "rgba(10,10,20,0.55)",
              }}
            >
              <div
                className="absolute inset-y-0 left-0 transition-all duration-700"
                style={{
                  width: `${barPct}%`,
                  background: revealed ? "rgba(0,180,140,0.22)" : "rgba(0,0,0,0.07)",
                }}
              />
              <div className="relative flex justify-between gap-3">
                <span>{opt}</span>
                <span>{count}</span>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
