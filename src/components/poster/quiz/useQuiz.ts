// @ts-nocheck
import { useCallback, useRef, useState } from "react";
import { generateQuestion, articlePillGender, isIndefArticlePill, LEARN_QUESTIONS, type QuizQuestion } from "./quizData";
import { WORDS, type CaseKey } from "../wordData";
import { WORD_GROUP, GROUPS } from "../groupData";

export type QuizResult = "correct" | "wrong";
export type QuizPhase = "prompt" | "explainer" | "learnComplete";
export type QuizMode = "practice" | "learn";
export type LearnStep = 1 | 2 | 3 | 4;
export type QuizOptions = { includeNom?: boolean; mode?: QuizMode };

export type LearnTap =
  | { kind: "case"; caseKey: CaseKey }
  | { kind: "word"; id: string }
  | { kind: "group"; groupType: "pronouns" | "articles" }
  | { kind: "column"; columnType: "defArticles" | "indefArticles" };

export type LearnNavigate =
  | { kind: "section"; caseKey: CaseKey }
  | { kind: "group"; groupId: string }
  | { kind: "articleRow"; rowId: string };

export type LearnTapOutcome =
  | { result: "wrong" }
  | { result: "advance"; nextStep: LearnStep; navigate?: LearnNavigate | null }
  | { result: "final" };

const WRONG_LIMIT = 3;

function caseOfPill(id: string): CaseKey | null {
  const parent = id.split("::")[0];
  const w = WORDS[parent];
  if (w?.case) return w.case;
  const g = WORD_GROUP[parent];
  if (g) return GROUPS[g].case ?? null;
  return null;
}

export function useQuiz() {
  const [active, setActive] = useState(false);
  const [mode, setMode] = useState<QuizMode>("practice");
  const [question, setQuestion] = useState<QuizQuestion | null>(null);
  const [phase, setPhase] = useState<QuizPhase>("prompt");
  const [correctCount, setCorrectCount] = useState(0);
  const [wrongCount, setWrongCount] = useState(0);
  const [lastResult, setLastResult] = useState<QuizResult | null>(null);
  const [learnStep, setLearnStep] = useState<LearnStep>(1);
  const [questionEpoch, setQuestionEpoch] = useState(0);
  const optsRef = useRef<QuizOptions>({ includeNom: false, mode: "practice" });
  const learnIndexRef = useRef(0);

  const start = useCallback((opts: QuizOptions = {}) => {
    const m: QuizMode = opts.mode ?? "practice";
    optsRef.current = { includeNom: opts.includeNom === true, mode: m };
    setMode(m);
    setActive(true);
    setCorrectCount(0);
    setWrongCount(0);
    setLastResult(null);
    setPhase("prompt");
    setLearnStep(1);
    learnIndexRef.current = 0;
    setQuestion(generateQuestion(null, { ...optsRef.current, learnIndex: 0 }));
    setQuestionEpoch((n) => n + 1);
  }, []);

  const exit = useCallback(() => {
    setActive(false);
    setQuestion(null);
    setLastResult(null);
    setPhase("prompt");
    setLearnStep(1);
  }, []);

  const flashPill = useCallback((pillId: string, result: QuizResult) => {
    const el = document.querySelector<HTMLElement>(`[data-cell-id="${CSS.escape(pillId)}"]`);
    if (!el) return;
    const cls = result === "correct" ? "quiz-flash-correct" : "quiz-flash-wrong";
    el.classList.remove(cls);
    void el.offsetWidth;
    el.classList.add(cls);
    window.setTimeout(() => el.classList.remove(cls), 1600);
  }, []);

  const flashPrep = useCallback((prepToken: string) => {
    const all = document.querySelectorAll<HTMLElement>("[data-cell-id]");
    all.forEach((el) => {
      const id = el.getAttribute("data-cell-id") ?? "";
      if (id.includes(`-prep-${prepToken}`)) {
        el.classList.add("quiz-prep-reveal");
        window.setTimeout(() => el.classList.remove("quiz-prep-reveal"), 1200);
      }
    });
  }, []);

  /** Practice-mode pill check (single-shot answer). */
  const checkAnswer = useCallback(
    (pillId: string): QuizResult | null => {
      if (!active || !question || phase !== "prompt" || mode !== "practice") return null;
      if (pillId === question.correctPillId) {
        flashPill(pillId, "correct");
        flashPrep(question.prep.token);
        setLastResult("correct");
        setCorrectCount((n) => n + 1);
        window.setTimeout(() => setPhase("explainer"), 600);
        return "correct";
      }
      flashPill(pillId, "wrong");
      setLastResult("wrong");
      setWrongCount((n) => {
        const next = n + 1;
        if (next >= WRONG_LIMIT) {
          window.setTimeout(() => setPhase("explainer"), 600);
        }
        return next;
      });
      return "wrong";
    },
    [active, question, phase, mode, flashPill, flashPrep],
  );

  /** Learn-mode tap router. Returns what the caller should do (navigate or not). */
  const checkLearnTap = useCallback(
    (tap: LearnTap): LearnTapOutcome => {
      if (!active || !question || phase !== "prompt" || mode !== "learn") return { result: "wrong" };
      const correctCase = question.prep.case;
      const isPronoun = question.kind === "pronoun";

      // Step 1 — pick the case
      if (learnStep === 1) {
        const tappedCase: CaseKey | null =
          tap.kind === "case" ? tap.caseKey :
          caseOfPill(tap.id);
        if (tappedCase === correctCase) {
          setLearnStep(2);
          return { result: "advance", nextStep: 2, navigate: { kind: "section", caseKey: correctCase } };
        }
        if (tap.kind === "word") flashPill(tap.id, "wrong");
        return { result: "wrong" };
      }

      // Step 2: group rectangle tap (pronouns vs articles)
      if (learnStep === 2 && tap.kind === "group") {
        if (isPronoun) {
          if (tap.groupType === "pronouns") {
            setLearnStep(4);
            return { result: "advance", nextStep: 4, navigate: { kind: "group", groupId: `g-${correctCase}-pron` } };
          }
          return { result: "wrong" };
        }
        if (tap.groupType === "articles") {
          setLearnStep(3);
          return { result: "advance", nextStep: 3, navigate: { kind: "group", groupId: `g-${correctCase}-art` } };
        }
        return { result: "wrong" };
      }

      // Step 3: column rectangle tap (def vs indef)
      if (learnStep === 3 && tap.kind === "column") {
        const wantIndef = isIndefArticlePill(question.correctPillId);
        const correct = (wantIndef && tap.columnType === "indefArticles") || (!wantIndef && tap.columnType === "defArticles");
        if (correct) {
          setLearnStep(4);
          const rowId = `${correctCase}-art-row-${wantIndef ? "indef" : "def"}`;
          return { result: "advance", nextStep: 4, navigate: { kind: "articleRow", rowId } };
        }
        return { result: "wrong" };
      }

      // Steps 2/3/4 require tapping a pill
      if (tap.kind !== "word") return { result: "wrong" };
      const pillId = tap.id;
      const parent = pillId.split("::")[0];
      const pillCase = caseOfPill(pillId);
      if (pillCase !== correctCase) {
        flashPill(pillId, "wrong");
        return { result: "wrong" };
      }

      if (learnStep === 2 && question.kind === "article") {
        const isArticleGroup = WORD_GROUP[parent] === `g-${correctCase}-art`;
        if (isArticleGroup) {
          setLearnStep(3);
          return { result: "advance", nextStep: 3, navigate: { kind: "group", groupId: `g-${correctCase}-art` } };
        }
        flashPill(pillId, "wrong");
        return { result: "wrong" };
      }

      if (learnStep === 3 && question.kind === "article") {
        const wantIndef = isIndefArticlePill(question.correctPillId);
        const gotIndef = isIndefArticlePill(parent);
        const isArticleGroup = WORD_GROUP[parent] === `g-${correctCase}-art`;
        if (isArticleGroup && wantIndef === gotIndef) {
          setLearnStep(4);
          const rowId = `${correctCase}-art-row-${wantIndef ? "indef" : "def"}`;
          return { result: "advance", nextStep: 4, navigate: { kind: "articleRow", rowId } };
        }
        flashPill(pillId, "wrong");
        return { result: "wrong" };
      }


      // Step 4 — exact pill
      if (parent === question.correctPillId || pillId === question.correctPillId) {
        flashPill(question.correctPillId, "correct");
        flashPrep(question.prep.token);
        setLastResult("correct");
        setCorrectCount((n) => n + 1);
        window.setTimeout(() => setPhase("explainer"), 600);
        return { result: "final" };
      }
      flashPill(pillId, "wrong");
      return { result: "wrong" };
    },
    [active, question, phase, mode, learnStep, flashPill, flashPrep],
  );

  const next = useCallback(() => {
    setLastResult(null);
    setWrongCount(0);
    setLearnStep(1);
    if (optsRef.current.mode === "learn") {
      learnIndexRef.current = learnIndexRef.current + 1;
      const len = LEARN_QUESTIONS.length;
      if (learnIndexRef.current >= len) {
        try { localStorage.setItem("learnModeSeen", "1"); } catch { /* noop */ }
        setPhase("learnComplete");
        return;
      }
      setQuestion(generateQuestion(null, { ...optsRef.current, learnIndex: learnIndexRef.current }));
      setPhase("prompt");
      setQuestionEpoch((n) => n + 1);
      return;
    }
    setQuestion((prev) => generateQuestion(prev, optsRef.current));
    setPhase("prompt");
    setQuestionEpoch((n) => n + 1);
  }, []);

  const continueToPractice = useCallback(() => {
    optsRef.current = { ...optsRef.current, mode: "practice" };
    learnIndexRef.current = 0;
    setMode("practice");
    setLastResult(null);
    setWrongCount(0);
    setLearnStep(1);
    setQuestion(generateQuestion(null, optsRef.current));
    setPhase("prompt");
    setQuestionEpoch((n) => n + 1);
  }, []);

  const skip = useCallback(() => {
    if (!active || !question) return;
    setLastResult("wrong");
    setPhase("explainer");
  }, [active, question]);

  return {
    active,
    mode,
    question,
    phase,
    correctCount,
    wrongCount,
    lastResult,
    learnStep,
    learnIndex: learnIndexRef.current,
    questionEpoch,
    totalLearnSteps: question?.kind === "pronoun" ? 3 : 4,
    start,
    exit,
    checkAnswer,
    checkLearnTap,
    next,
    continueToPractice,
    skip,
  };
}
