// @ts-nocheck
import { LIVE_QUIZ_BANK, type QuizQuestion } from "@/components/poster/quiz/quizData";
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
  // nom verb endings
  "nom-end-e": "-e", "nom-end-st": "-st", "nom-end-t": "-t", "nom-end-en": "-en",
  "nom-end-t2": "-t", "nom-end-en2": "-en",
  // possessives
  "pos-mein": "mein", "pos-dein": "dein", "pos-sein": "sein/ihr",
  "pos-unser": "unser", "pos-euer": "euer", "pos-ihr": "ihr/Ihr", "pos-kein": "kein",
};

const POSSESSIVE_PILLS = ["pos-mein", "pos-dein", "pos-sein", "pos-unser", "pos-euer", "pos-ihr", "pos-kein"];
const NOM_ENDING_PILLS = ["nom-end-e", "nom-end-st", "nom-end-t", "nom-end-en", "nom-end-t2", "nom-end-en2"];

/** Every pill ID on the cheatsheet, across all cases and row types. */
export const ALL_PILLS: string[] = [
  ...PRONOUN_PILLS.nom, ...PRONOUN_PILLS.akk, ...PRONOUN_PILLS.dat,
  ...ARTICLE_PILLS.nom, ...ARTICLE_PILLS.akk, ...ARTICLE_PILLS.dat,
  ...POSSESSIVE_PILLS,
  ...NOM_ENDING_PILLS,
];

const PRONOUN_ID_SET = new Set<string>([
  ...PRONOUN_PILLS.nom, ...PRONOUN_PILLS.akk, ...PRONOUN_PILLS.dat,
]);

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
  const correct = q.correctPillId;
  return wrong.sort((a, b) => similarity(a, correct) - similarity(b, correct));
}

/**
 * Full-cheatsheet elimination order — spans all pills across all cases.
 * Tier 0 (eliminated first): wrong row type (articles when answer is pronoun, vice versa)
 * Tier 1: same row type, wrong case
 * Tier 2: same row type, same case (direct competitors, eliminated last)
 * Within each tier, least label-similar to correct answer goes first.
 */
export function eliminationOrderFull(q: QuizQuestion): string[] {
  return eliminationTiersData(q).order;
}

/** Absolute-time thresholds for each elimination wave. */
export const ELIM_T1_MS =  2000; // nom verb endings fade
export const ELIM_T2_MS =  5000; // possessives fade
export const ELIM_T3_MS =  8000; // first half wrong-type + nom articles
export const ELIM_T4_MS = 12000; // second half wrong-type + nom articles
export const ELIM_T5_MS = 15000; // first half wrong-case
export const ELIM_T6_MS = 18000; // second half wrong-case
export const ELIM_T7_MS = 20000; // same-case individuals start

/**
 * Returns the elimination order in 5 tiers:
 *   0: nom verb endings (first — always irrelevant for article questions)
 *   1: possessives (second)
 *   2: wrong row-type pronouns + nom articles for non-nom questions
 *   3: same type, wrong case
 *   4: same type, same case (direct competitors, last)
 */
export function eliminationTiersData(q: QuizQuestion): {
  order: string[];
  tier0Count: number;
  tier1Count: number;
  tier2Count: number;
  tier3Count: number;
  tier4Count: number;
} {
  const correct = q.correctPillId;
  const correctCase = correct.split("-")[0] as CaseKey;
  const correctIsPronoun = PRONOUN_ID_SET.has(correct);

  const wrong = ALL_PILLS.filter((p) => p !== correct);

  function pillTier(pill: string): number {
    const pillCase = pill.split("-")[0] as CaseKey;
    const pillIsPronoun = PRONOUN_ID_SET.has(pill);
    if (pill.startsWith("nom-end-")) return 0;
    if (pill.startsWith("pos-")) return 1;
    if (pillIsPronoun !== correctIsPronoun) return 2;
    if (pillCase === "nom" && correctCase !== "nom") return 2;
    if (pillCase !== correctCase) return 3;
    return 4;
  }

  let tier0Count = 0, tier1Count = 0, tier2Count = 0, tier3Count = 0;
  for (const pill of wrong) {
    const t = pillTier(pill);
    if (t === 0) tier0Count++;
    else if (t === 1) tier1Count++;
    else if (t === 2) tier2Count++;
    else if (t === 3) tier3Count++;
  }
  const tier4Count = wrong.length - tier0Count - tier1Count - tier2Count - tier3Count;

  const order = [...wrong].sort((a, b) => {
    const ta = pillTier(a), tb = pillTier(b);
    if (ta !== tb) return ta - tb;
    return similarity(a, correct) - similarity(b, correct);
  });

  return { order, tier0Count, tier1Count, tier2Count, tier3Count, tier4Count };
}

/**
 * Given elapsed time, returns how many pills should currently be greyed.
 * t=2s:  nom endings (all at once)
 * t=5s:  possessives (all at once)
 * t=8s:  first half wrong-type + nom articles
 * t=12s: second half wrong-type + nom articles
 * t=15s: first half wrong-case
 * t=18s: second half wrong-case
 * t=20s+: same-case, one at a time to timer end
 */
export function computeElimCount(
  elapsedMs: number,
  timerMaxMs: number,
  tier0Count: number,
  tier1Count: number,
  tier2Count: number,
  tier3Count: number,
  tier4Count: number,
): number {
  const t01  = tier0Count + tier1Count;
  const t012 = t01  + tier2Count;
  const t0123 = t012 + tier3Count;
  const t2half = Math.floor(tier2Count / 2);
  const t3half = Math.floor(tier3Count / 2);
  if (elapsedMs < ELIM_T1_MS) return 0;
  if (elapsedMs < ELIM_T2_MS) return tier0Count;
  if (elapsedMs < ELIM_T3_MS) return t01;
  if (elapsedMs < ELIM_T4_MS) return t01 + t2half;
  if (elapsedMs < ELIM_T5_MS) return t012;
  if (elapsedMs < ELIM_T6_MS) return t012 + t3half;
  if (elapsedMs < ELIM_T7_MS) return t0123;
  const availableMs = Math.max(1, timerMaxMs - ELIM_T7_MS);
  const progress = Math.min(1, (elapsedMs - ELIM_T7_MS) / availableMs);
  return t0123 + Math.floor(progress * tier4Count);
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

/** Sample N questions from LIVE_QUIZ_BANK. */
export function sampleQuestions(count: number): QuizQuestion[] {
  const seed = Date.now() & 0xffff;
  const idx = new Set<number>();
  let s = seed;
  while (idx.size < Math.min(count, LIVE_QUIZ_BANK.length)) {
    s = (s * 9301 + 49297) % 233280;
    idx.add(Math.floor((s / 233280) * LIVE_QUIZ_BANK.length));
  }
  return [...idx].map((i) => LIVE_QUIZ_BANK[i]);
}
