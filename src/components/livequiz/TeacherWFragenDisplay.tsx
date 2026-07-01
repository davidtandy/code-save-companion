// @ts-nocheck
import { cn } from "@/lib/utils";
import { PILL_LABEL } from "./scoring";
import type { WFragenQuestion } from "@/components/poster/quiz/quizData";

type Props = {
  q: WFragenQuestion;
  questionIndex: number;
  totalQuestions: number;
  responses: any[];
  showBreakdown: boolean;
  answeredThisQ: number;
  participantCount: number;
};

const W_EN: Record<string, string> = {
  WER: "who", WEN: "whom", WEM: "to whom", WO: "where", WOHIN: "where to",
};

export function TeacherWFragenDisplay({
  q, questionIndex, totalQuestions, responses, showBreakdown, answeredThisQ, participantCount,
}: Props) {
  const isWword = q.step === "wword";
  const currentResponses = responses.filter((r) => r.question_index === questionIndex);

  const options = isWword
    ? ["WER", "WEN", "WEM", "WO", "WOHIN"]
    : Object.entries(PILL_LABEL)
        .filter(([id]) => id.startsWith(q.caseKey + "-"))
        .map(([id, label]) => ({ id, label }));

  const maxCount = Math.max(
    ...currentResponses.map((r) => {
      const key = r.answer?.toUpperCase();
      return currentResponses.filter((x) => x.answer?.toUpperCase() === key).length;
    }),
    1
  );

  return (
    <>
      <div className="text-[10px] uppercase tracking-widest text-poster-ink/50 font-semibold bg-white/70 backdrop-blur-sm rounded-full px-3 py-1">
        Q{questionIndex + 1} / {totalQuestions}
        {" · "}{answeredThisQ} / {participantCount} answered
        {" · "}<span className={cn(isWword ? "text-poster-teal" : "text-poster-yellow")}>
          {isWword ? "question word" : "article"}
        </span>
      </div>

      {/* Sentence */}
      <div className="text-3xl font-bold text-poster-ink leading-snug tracking-tight drop-shadow-sm flex items-baseline flex-wrap gap-x-1.5 justify-center">
        {q.pre && <span>{q.pre}</span>}
        <span className="inline-flex items-baseline gap-1.5 border-2 border-poster-teal/50 rounded px-2 py-0.5 bg-poster-teal/5 text-2xl">
          {q.boxedPre && <span>{q.boxedPre}</span>}
          {isWword ? (
            // Word step doesn't test the article — just show it plainly so the sentence reads naturally.
            <span>{q.answer}</span>
          ) : showBreakdown ? (
            <span className="text-poster-teal font-bold">{q.answer}</span>
          ) : (
            <span className="text-poster-ink/30 border-b-2 border-poster-ink/30 min-w-[2rem] inline-block text-center">
              {(q.answer ?? "").toLowerCase().startsWith("ein") ? "a/an" : "the"}
            </span>
          )}
          <span>{q.boxedNoun}</span>
        </span>
        {q.post && <span>{q.post}</span>}
      </div>

      {/* W-word indicator (on article step) */}
      {!isWword && (
        <div className="text-sm text-poster-ink/50 font-medium">
          <span className="font-bold text-poster-teal">{q.correctWWord}?</span>
          {" "}— {W_EN[q.correctWWord]}
        </div>
      )}

      {/* Answer distribution */}
      <div className="w-full max-w-[300px] space-y-1">
        {isWword
          ? options.map((word) => {
              const count = currentResponses.filter((r) => r.answer?.toUpperCase() === word).length;
              const barPct = Math.round((count / maxCount) * 100);
              const revealed = showBreakdown && word === q.correctWWord;
              return (
                <div key={word} className="relative rounded-lg overflow-hidden text-xs font-semibold px-3 py-1.5 text-left"
                  style={{ background: revealed ? "rgba(0,180,140,0.08)" : "rgba(0,0,0,0.04)", color: revealed ? "#00b09b" : "rgba(10,10,20,0.55)" }}>
                  <div className="absolute inset-y-0 left-0 transition-all duration-700"
                    style={{ width: `${barPct}%`, background: revealed ? "rgba(0,180,140,0.22)" : "rgba(0,0,0,0.07)" }} />
                  <div className="relative flex justify-between gap-3">
                    <span>{word}? <span className="opacity-50 font-normal">({W_EN[word]})</span></span>
                    <span>{count}</span>
                  </div>
                </div>
              );
            })
          : options.slice(0, 8).map(({ id, label }) => {
              const count = currentResponses.filter((r) => r.answer?.toUpperCase() === id.toUpperCase()).length;
              const barPct = Math.round((count / maxCount) * 100);
              const revealed = showBreakdown && id === q.correctPillId;
              return (
                <div key={id} className="relative rounded-lg overflow-hidden text-xs font-semibold px-3 py-1.5 text-left"
                  style={{ background: revealed ? "rgba(0,180,140,0.08)" : "rgba(0,0,0,0.04)", color: revealed ? "#00b09b" : "rgba(10,10,20,0.55)" }}>
                  <div className="absolute inset-y-0 left-0 transition-all duration-700"
                    style={{ width: `${barPct}%`, background: revealed ? "rgba(0,180,140,0.22)" : "rgba(0,0,0,0.07)" }} />
                  <div className="relative flex justify-between gap-3">
                    <span>{label}</span>
                    <span>{count}</span>
                  </div>
                </div>
              );
            })
        }
      </div>
    </>
  );
}
