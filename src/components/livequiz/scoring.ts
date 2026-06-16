// @ts-nocheck
import { QUIZ_BANK, type QuizQuestion } from "@/components/poster/quiz/quizData";
import type { CaseKey } from "@/components/poster/wordData";

/** Pill option choices per case for each question kind. */
const PRONOUN_PILLS: Record<CaseKey, string[]> = {
  nom: ["nom-ich", "nom-du", "nom-er::0", "nom-er::1", "nom-er::2", "nom-wir", "nom-ihr", "nom-sieSie::0", "nom-sieSie::1"],
  akk: ["akk-mich", "akk-dich", "akk-ihn::0", "akk-ihn::1", "akk-ihn::2", "akk-uns", "akk-euch", "akk-sieSie::0", "akk-sieSie::1"],
  dat: ["dat-mir", "dat-dir", "dat-ihm::0", "dat-ihm::1", "dat-ihm::2", "dat-uns", "dat-euch", "dat-ihnen::0", "dat-ihnen::1"],
};

const ARTICLE_PILLS: Record<CaseKey, string[]> = {
  nom: ["nom-der", "nom-die", "nom-das", "nom-diePl", "nom-ein", "nom-eine", "nom-ein2", "nom-none"],
  akk: ["akk-den", "akk-die", "akk-das", "akk-diePl", "akk-einen", "akk-eine", "akk-ein", "akk-none"],
  dat: ["dat-dem", "dat-der", "dat-dem2", "dat-denN", "dat-einem", "dat-einer", "dat-einem2", "dat-noneN"],
};

export const PILL_LABEL: Record<string, string> = {
  // pronouns nom
  "nom-ich": "ich", "nom-du": "du", "nom-er::0": "er", "nom-er::1": "sie", "nom-er::2": "es",
  "nom-wir": "wir", "nom-ihr": "ihr", "nom-sieSie::0": "sie", "nom-sieSie::1": "Sie",
  // pronouns akk
  "akk-mich": "mich", "akk-dich": "dich", "akk-ihn::0": "ihn", "akk-ihn::1": "sie", "akk-ihn::2": "es",
  "akk-uns": "uns", "akk-euch": "euch", "akk-sieSie::0": "sie", "akk-sieSie::1": "Sie",
  // pronouns dat
  "dat-mir": "mir", "dat-dir": "dir", "dat-ihm::0": "ihm", "dat-ihm::1": "ihr", "dat-ihm::2": "ihm",
  "dat-uns": "uns", "dat-euch": "euch", "dat-ihnen::0": "ihnen", "dat-ihnen::1": "Ihnen",
  // articles
  "nom-der": "der", "nom-die": "die", "nom-das": "das", "nom-diePl": "die",
  "nom-ein": "ein", "nom-eine": "eine", "nom-ein2": "ein", "nom-none": "—",
  "akk-den": "den", "akk-die": "die", "akk-das": "das", "akk-diePl": "die",
  "akk-einen": "einen", "akk-eine": "eine", "akk-ein": "ein", "akk-none": "—",
  "dat-dem": "dem", "dat-der": "der", "dat-dem2": "dem", "dat-denN": "den",
  "dat-einem": "einem", "dat-einer": "einer", "dat-einem2": "einem", "dat-noneN": "—",
};

/** Get pill options for a given question (correct + distractors). */
export function pillsForQuestion(q: QuizQuestion): string[] {
  const set = q.kind === "pronoun" ? PRONOUN_PILLS[q.prep.case] : ARTICLE_PILLS[q.prep.case];
  // Shuffle deterministically by question signature
  const seed = (q.prep.token + q.correctPillId).split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  return seededShuffle(set, seed);
}

function seededShuffle<T>(arr: T[], seed: number): T[] {
  const out = [...arr];
  let s = seed;
  for (let i = out.length - 1; i > 0; i--) {
    s = (s * 9301 + 49297) % 233280;
    const j = Math.floor((s / 233280) * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/** Elimination order — most obviously wrong first, confusable last. */
export function eliminationOrder(q: QuizQuestion, pills: string[]): string[] {
  const wrong = pills.filter((p) => p !== q.correctPillId);
  // Confusability: same case-form letter cluster keeps until end. Simple heuristic:
  // articles → those with similar ending stay last; pronouns → similar letter prefix last.
  const correct = q.correctPillId;
  return wrong.sort((a, b) => similarity(a, correct) - similarity(b, correct));
}

function similarity(a: string, b: string): number {
  const la = (PILL_LABEL[a] ?? "").toLowerCase();
  const lb = (PILL_LABEL[b] ?? "").toLowerCase();
  let s = 0;
  const n = Math.min(la.length, lb.length);
  for (let i = 0; i < n; i++) if (la[i] === lb[i]) s++;
  if (la.endsWith(lb.slice(-2)) || lb.endsWith(la.slice(-2))) s += 1;
  return s;
}

/** Speed-weighted score: full credit fast, decays to small bonus by timer end. */
export function scoreFor(correct: boolean, elapsedMs: number, timerMaxMs: number): number {
  if (!correct) return 0;
  const ratio = Math.max(0, 1 - elapsedMs / timerMaxMs);
  return 500 + Math.round(500 * ratio);
}

/** Sample N questions deterministically from QUIZ_BANK. */
export function sampleQuestions(count: number): QuizQuestion[] {
  const seed = Date.now() & 0xffff;
  const idx = new Set<number>();
  let s = seed;
  while (idx.size < Math.min(count, QUIZ_BANK.length)) {
    s = (s * 9301 + 49297) % 233280;
    idx.add(Math.floor((s / 233280) * QUIZ_BANK.length));
  }
  return [...idx].map((i) => QUIZ_BANK[i]);
}
