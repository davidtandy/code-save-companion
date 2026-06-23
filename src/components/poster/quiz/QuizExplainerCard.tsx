import { X, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useDraggable } from "./useDraggable";
import type { QuizQuestion, Gender } from "./quizData";
import type { CaseKey } from "../wordData";

const GENDER_BORDER: Record<Gender, string> = {
  m:  "border-gender-masc",
  f:  "border-gender-fem",
  n:  "border-gender-neut",
  pl: "border-gender-plural",
};
const GENDER_TEXT: Record<Gender, string> = {
  m:  "text-gender-masc",
  f:  "text-gender-fem",
  n:  "text-gender-neut",
  pl: "text-gender-plural",
};
const GENDER_TAG: Record<Gender, string> = { m: "(m)", f: "(f)", n: "(n)", pl: "(pl)" };
const GENDER_NAME: Record<Gender, string> = {
  m: "masculine (m)", f: "feminine (f)", n: "neuter (n)", pl: "plural (pl)",
};

const CASE_NAME = { nom: "Nominativ", akk: "Akkusativ", dat: "Dativ" } as const;
const CASE_CHIP = {
  nom: "bg-poster-yellow/30 text-poster-ink",
  akk: "bg-poster-green/30 text-poster-ink",
  dat: "bg-poster-purple/30 text-poster-ink",
} as const;

/** Case-tinted answer pill (matches the case the question is testing). */
const CASE_ANSWER: Record<CaseKey, string> = {
  nom: "border-poster-yellow bg-poster-yellow/25",
  akk: "border-poster-green bg-poster-green/20",
  dat: "border-poster-purple bg-poster-purple/20",
};

const AKK_PREPS = new Set(["für","gegen","ohne","um","durch","bis"]);
const DAT_PREPS = new Set(["mit","zu","von","bei","nach","aus","seit","ab","gegenüber","außer"]);
const SEIN_FORMS = new Set(["bin","bist","ist","sind","seid"]);

const PRONOUN_FORMS: Record<string, { nom: string; akk: string; dat: string }> = {
  "I":            { nom: "ich",  akk: "mich", dat: "mir" },
  "you":          { nom: "du",   akk: "dich", dat: "dir" },
  "he":           { nom: "er",   akk: "ihn",  dat: "ihm" },
  "she":          { nom: "sie",  akk: "sie",  dat: "ihr" },
  "it":           { nom: "es",   akk: "es",   dat: "ihm" },
  "we":           { nom: "wir",  akk: "uns",  dat: "uns" },
  "us":           { nom: "wir",  akk: "uns",  dat: "uns" },
  "you all":      { nom: "ihr",  akk: "euch", dat: "euch" },
  "them":         { nom: "sie",  akk: "sie",  dat: "ihnen" },
  "they":         { nom: "sie",  akk: "sie",  dat: "ihnen" },
  "you (formal)": { nom: "Sie",  akk: "Sie",  dat: "Ihnen" },
  "me":           { nom: "ich",  akk: "mich", dat: "mir" },
  "him":          { nom: "er",   akk: "ihn",  dat: "ihm" },
  "her":          { nom: "sie",  akk: "sie",  dat: "ihr" },
};

type Props = {
  question: QuizQuestion;
  correctCount: number;
  result?: "correct" | "wrong" | null;
  onNext: () => void;
  onExit: () => void;
};

const Pill = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <div className={cn("h-8 px-2 rounded-sm border-2 bg-white flex items-center font-slab font-semibold text-poster-ink text-sm", className)}>
    {children}
  </div>
);

const NeutralWord = ({ children }: { children: React.ReactNode }) => (
  <div className="h-8 px-2 rounded-sm border-2 border-poster-ink/15 bg-poster-ink/5 flex items-center font-slab text-poster-ink/80 text-sm whitespace-nowrap">
    {children}
  </div>
);

const splitWords = (s?: string) => (s ? s.trim().split(/\s+/) : []);

function prepCaseExplanation(token: string, caseKey: "nom" | "akk" | "dat") {
  if (SEIN_FORMS.has(token)) return `is a form of "sein" — the subject takes Nominativ.`;
  if (AKK_PREPS.has(token)) return `always takes Akkusativ.`;
  if (DAT_PREPS.has(token)) return `always takes Dativ.`;
  return `takes ${CASE_NAME[caseKey]}.`;
}

export const QuizExplainerCard = ({ question, correctCount, result, onNext, onExit }: Props) => {
  const caseKey = question.prep.case;
  const wasCorrect = result === "correct";
  const { dragStyle, dragHandlers } = useDraggable(question);
  const answerCls = CASE_ANSWER[caseKey as CaseKey];

  // Build full sentence preview with the answer filled in.
  let sentenceNodes: React.ReactNode[] = [];
  let answer = "?";
  const isNom = caseKey === "nom";
  if (question.kind === "pronoun") {
    const forms = PRONOUN_FORMS[question.targetEn];
    answer = forms ? forms[caseKey as "nom" | "akk" | "dat"] : "?";
    sentenceNodes = isNom
      ? [
          <Pill key="ans" className={answerCls}>{answer}</Pill>,
          <NeutralWord key="prep">{question.prep.token}</NeutralWord>,
          ...splitWords(question.suffix).map((w, i) => <NeutralWord key={`suf-${i}`}>{w}</NeutralWord>),
        ]
      : [
          ...splitWords(question.prefix).map((w, i) => <NeutralWord key={`pre-${i}`}>{w}</NeutralWord>),
          <NeutralWord key="prep">{question.prep.token}</NeutralWord>,
          <Pill key="ans" className={answerCls}>{answer}</Pill>,
          ...splitWords(question.suffix).map((w, i) => <NeutralWord key={`suf-${i}`}>{w}</NeutralWord>),
        ];
  } else {
    const g: Gender = question.gender ?? "n";
    answer = question.nounArticle ?? "";
    const articlePill = <Pill key="art" className={answerCls}>{answer}</Pill>;
    const nounPill = (
      <Pill key="noun" className={cn(GENDER_BORDER[g], GENDER_TEXT[g])}>
        <span>{question.nounDe}</span>
        <span className={cn("ml-1 text-[10px] font-body font-normal", GENDER_TEXT[g])}>{GENDER_TAG[g]}</span>
      </Pill>
    );
    sentenceNodes = isNom
      ? [
          articlePill,
          nounPill,
          <NeutralWord key="prep">{question.prep.token}</NeutralWord>,
          ...splitWords(question.suffix).map((w, i) => <NeutralWord key={`suf-${i}`}>{w}</NeutralWord>),
        ]
      : [
          ...splitWords(question.prefix).map((w, i) => <NeutralWord key={`pre-${i}`}>{w}</NeutralWord>),
          <NeutralWord key="prep">{question.prep.token}</NeutralWord>,
          articlePill,
          nounPill,
          ...splitWords(question.suffix).map((w, i) => <NeutralWord key={`suf-${i}`}>{w}</NeutralWord>),
        ];
  }

  // Build the 3-step walkthrough.
  let intro = "";
  let steps: React.ReactNode[] = [];

  if (question.kind === "article") {
    const g: Gender = question.gender ?? "n";
    intro = "We have to think of both sides of the article — the preposition before it and the noun after it.";
    steps = [
      <><b>Case from the preposition.</b> <span className="font-slab">"{question.prep.token}"</span> {prepCaseExplanation(question.prep.token, caseKey)}</>,
      <><b>Gender of the noun.</b> <span className="font-slab">"{question.nounDe}"</span> is <b>{GENDER_NAME[g]}</b>.</>,
      <><b>Pick the article.</b> {CASE_NAME[caseKey]} + {GENDER_NAME[g]} → <span className="font-slab font-bold">{answer}</span>.</>,
    ];
  } else if (SEIN_FORMS.has(question.prep.token)) {
    intro = "With \"sein\", the subject is always in the Nominativ case.";
    steps = [
      <><b>Verb signals Nominativ.</b> <span className="font-slab">"{question.prep.token}"</span> is a form of <span className="font-slab">"sein"</span> → subject case.</>,
      <><b>Meaning.</b> You want to say <b>"{question.targetEn}"</b>.</>,
      <><b>Pick the pronoun.</b> "{question.targetEn}" in Nominativ → <span className="font-slab font-bold">{answer}</span>.</>,
    ];
  } else {
    intro = "Same idea — the preposition decides the case, then we pick the pronoun form.";
    const forms = PRONOUN_FORMS[question.targetEn];
    const otherForms = forms
      ? (["nom", "akk", "dat"] as const)
          .filter((c) => c !== caseKey)
          .map((c) => `${forms[c]} (${CASE_NAME[c]})`)
          .join(", ")
      : "";
    steps = [
      <><b>Case from the preposition.</b> <span className="font-slab">"{question.prep.token}"</span> {prepCaseExplanation(question.prep.token, caseKey)}</>,
      <><b>Meaning.</b> You want to say <b>"{question.targetEn}"</b>.</>,
      <>
        <b>Pick the pronoun.</b> "{question.targetEn}" in {CASE_NAME[caseKey]} → <span className="font-slab font-bold">{answer}</span>.
        {otherForms && <span className="block text-poster-ink/55 text-[11px] mt-0.5">Compare: {otherForms}.</span>}
      </>,
    ];
  }

  return (
    <div
      data-no-reset
      onClick={(e) => e.stopPropagation()}
      style={dragStyle}
      {...dragHandlers}
      className={cn(
        "fixed z-40 bg-white shadow-2xl border border-poster-ink/15 rounded-xl px-4 py-3 select-none",
        "bottom-3 left-1/2 -translate-x-1/2 w-[min(92vw,460px)]",
        "landscape:max-[500px]:bottom-1/2 landscape:max-[500px]:right-2 landscape:max-[500px]:left-auto landscape:max-[500px]:translate-x-0 landscape:max-[500px]:translate-y-1/2 landscape:max-[500px]:w-[min(60vw,360px)] landscape:max-[500px]:max-h-[96vh] landscape:max-[500px]:overflow-y-auto",
      )}
    >
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-2">
          <span className={cn(
            "text-xs font-display font-bold px-1.5 py-0.5 rounded",
            wasCorrect ? "bg-poster-ink/10 text-poster-ink" : "bg-poster-red/30 text-poster-ink",
          )}>
            {wasCorrect ? "Right!" : "Not quite."}
          </span>
          <span className={cn("text-[10px] uppercase tracking-wide font-display font-bold px-1.5 py-0.5 rounded", CASE_CHIP[caseKey])}>
            {CASE_NAME[caseKey]}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <Button size="sm" onClick={onNext} className="h-7 px-2 text-xs">
            Next <ArrowRight className="h-3 w-3 ml-1" />
          </Button>
          <Button size="icon" variant="ghost" onClick={onExit} className="h-7 w-7" aria-label="Exit quiz">
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="flex items-center justify-center gap-1.5 flex-wrap py-1 mb-2">
        {sentenceNodes}
      </div>

      <div className="text-xs text-poster-ink/80 leading-snug space-y-1.5">
        <p>{intro}</p>
        <ol className="list-decimal list-inside space-y-1 pl-1">
          {steps.map((s, i) => <li key={i}>{s}</li>)}
        </ol>
        <div className="text-[11px] text-poster-ink/55 pt-1">Correct: {correctCount}</div>
      </div>
    </div>
  );
};
