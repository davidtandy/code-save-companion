// Example sentences for morphed possessives, keyed by case + gender.
// Used by the morph-context info box.

import type { CaseKey } from "./wordData";
import { applyEnding, EIN_ARTICLES } from "./morph";

export type EndingGender = "m" | "f" | "n" | "pl";

/** Stem → English meaning (used for stem labels). */
export const STEM_EN: Record<string, string> = {
  mein: "my",
  dein: "your (informal)",
  sein: "his / its",      // gender-3rd-sg masculine/neuter owner
  ihr: "her / their / your (formal)",
  unser: "our",
  euer: "your (plural)",
  kein: "no / not a (negation)",
};

export const STEM_PERSON: Record<string, string> = {
  mein: "1st person (singular)",
  dein: "2nd person (singular)",
  sein: "3rd person (singular)",
  ihr: "3rd person (plural) / formal",
  unser: "1st person (plural)",
  euer: "2nd person (plural)",
  kein: "negation",
};

/** Possessive id → primary stem (used to pick examples). */
export const POSSESSIVE_STEM: Record<string, string> = {
  "pos-mein": "mein",
  "pos-dein": "dein",
  "pos-sein": "sein",
  "pos-unser": "unser",
  "pos-euer": "euer",
  "pos-ihr": "ihr",
  "pos-kein": "kein",
};

/** English equivalent per stem, in nominative singular contexts (rough gloss). */
const STEM_EN_SHORT: Record<string, string> = {
  mein: "my", dein: "your", sein: "his", ihr: "her", unser: "our", euer: "your", kein: "no",
};

const CASE_NAME: Record<CaseKey, string> = { nom: "nominative", akk: "accusative", dat: "dative" };
const GENDER_NAME: Record<EndingGender, string> = { m: "masculine", f: "feminine", n: "neuter", pl: "plural" };

/** Sentence templates: (de uses morphed form; en uses english possessive). */
type Tmpl = { de: (form: string) => string; en: (en: string) => string };
const TEMPLATES: Record<string, Tmpl> = {
  // Nominative
  "nom-m":  { de: (f) => `${cap(f)} Hund schläft.`,     en: (e) => `${cap(e)} dog is sleeping.` },
  "nom-f":  { de: (f) => `${cap(f)} Freundin lacht.`,   en: (e) => `${cap(e)} friend laughs.` },
  "nom-n":  { de: (f) => `${cap(f)} Auto ist neu.`,     en: (e) => `${cap(e)} car is new.` },
  "nom-pl": { de: (f) => `${cap(f)} Hunde spielen.`,    en: (e) => `${cap(e)} dogs are playing.` },
  // Accusative
  "akk-m":  { de: (f) => `Ich sehe ${f} Hund.`,         en: (e) => `I see ${e} dog.` },
  "akk-f":  { de: (f) => `Ich liebe ${f} Freundin.`,    en: (e) => `I love ${e} friend.` },
  "akk-n":  { de: (f) => `Ich habe ${f} Auto.`,         en: (e) => `I have ${e} car.` },
  "akk-pl": { de: (f) => `Ich liebe ${f} Hunde.`,       en: (e) => `I love ${e} dogs.` },
  // Dative
  "dat-m":  { de: (f) => `Ich helfe ${f} Hund.`,        en: (e) => `I help ${e} dog.` },
  "dat-f":  { de: (f) => `Ich helfe ${f} Freundin.`,    en: (e) => `I help ${e} friend.` },
  "dat-n":  { de: (f) => `Ich gebe ${f} Kind Wasser.`,  en: (e) => `I give ${e} child water.` },
  "dat-pl": { de: (f) => `Ich helfe ${f} Hunden.`,      en: (e) => `I help ${e} dogs.` },
};

function cap(s: string): string {
  return s.length ? s[0].toUpperCase() + s.slice(1) : s;
}

export type MorphInfo = {
  /** The possessive's primary stem (display form). */
  stem: string;
  /** English meaning of the stem. */
  stemEn: string;
  /** Person tag for the stem. */
  stemPerson: string;
  /** Ending applied to the stem (may be ""). */
  ending: string;
  /** Final morphed display form. */
  form: string;
  /** Whether this stem contracted (euer → eur-). */
  contracted: boolean;
  /** Case that the trigger article carries. */
  caseKey: CaseKey;
  /** Gender of the noun being modified. */
  gender: EndingGender;
  /** Trigger article id + display. */
  triggerId: string;
  triggerDisplay: string;
  caseName: string;
  genderName: string;
  exampleDe: string;
  exampleEn: string;
  /** The example noun (German + English), used to explain why this gender. */
  nounDe: string;
  nounEn: string;
};

/** Example noun per case×gender — must match TEMPLATES above. */
const NOUNS: Record<string, { de: string; en: string }> = {
  "nom-m":  { de: "Hund",     en: "dog" },
  "nom-f":  { de: "Freundin", en: "friend" },
  "nom-n":  { de: "Auto",     en: "car" },
  "nom-pl": { de: "Hunde",    en: "dogs" },
  "akk-m":  { de: "Hund",     en: "dog" },
  "akk-f":  { de: "Freundin", en: "friend" },
  "akk-n":  { de: "Auto",     en: "car" },
  "akk-pl": { de: "Hunde",    en: "dogs" },
  "dat-m":  { de: "Hund",     en: "dog" },
  "dat-f":  { de: "Freundin", en: "friend" },
  "dat-n":  { de: "Kind",     en: "child" },
  "dat-pl": { de: "Hunden",   en: "dogs" },
};

/** Map ein-article id → its case. (Mirrors EIN_ARTICLES color, but in case form.) */
const EIN_CASE: Record<string, CaseKey> = {
  "nom-ein": "nom", "nom-eine": "nom", "nom-ein2": "nom", "nom-none": "nom",
  "akk-einen": "akk", "akk-eine": "akk", "akk-ein": "akk", "akk-none": "akk",
  "dat-einem": "dat", "dat-einer": "dat", "dat-einem2": "dat", "dat-noneN": "dat",
};

const EIN_DISPLAY: Record<string, string> = {
  "nom-ein": "ein", "nom-eine": "eine", "nom-ein2": "ein", "nom-none": "— (kein-/possessive + -e)",
  "akk-einen": "einen", "akk-eine": "eine", "akk-ein": "ein", "akk-none": "— (+ -e)",
  "dat-einem": "einem", "dat-einer": "einer", "dat-einem2": "einem", "dat-noneN": "— (+ -en)",
};

export function buildMorphInfo(
  possessiveId: string,
  einArticleId: string,
  /** Optional override stem (e.g. a specific sub-token like "ihr" inside pos-sein). */
  stemOverride?: string,
): MorphInfo | null {
  const baseStem = POSSESSIVE_STEM[possessiveId];
  const art = EIN_ARTICLES.find((a) => a.id === einArticleId);
  if (!baseStem || !art) return null;
  // Use the override (sub-token) when provided; otherwise the pill's primary stem.
  // STEM_EN/STEM_PERSON lookups use lowercase to match the table keys ("ihr", "sein").
  const stemRaw = stemOverride ?? baseStem;
  const stemKey = stemRaw.toLowerCase();
  const ending = art.ending;
  const form = applyEnding(stemRaw, ending);
  const head = ending ? form.slice(0, form.length - ending.length) : form;
  const contracted = stemKey === "euer" && !!ending;
  const caseKey = EIN_CASE[einArticleId] ?? "nom";
  const gender = (art.gender ?? "m") as EndingGender;
  const tmpl = TEMPLATES[`${caseKey}-${gender}`] ?? TEMPLATES["nom-m"];
  const enWord = STEM_EN_SHORT[stemKey] ?? STEM_EN_SHORT[baseStem] ?? "my";
  return {
    stem: head,
    stemEn: STEM_EN[stemKey] ?? STEM_EN[baseStem] ?? "",
    stemPerson: STEM_PERSON[stemKey] ?? STEM_PERSON[baseStem] ?? "",
    ending,
    form,
    contracted,
    caseKey,
    gender,
    triggerId: einArticleId,
    triggerDisplay: EIN_DISPLAY[einArticleId] ?? einArticleId,
    caseName: CASE_NAME[caseKey],
    genderName: GENDER_NAME[gender],
    exampleDe: tmpl.de(form),
    exampleEn: tmpl.en(enWord),
    nounDe: (NOUNS[`${caseKey}-${gender}`] ?? NOUNS["nom-m"]).de,
    nounEn: (NOUNS[`${caseKey}-${gender}`] ?? NOUNS["nom-m"]).en,
  };
}
