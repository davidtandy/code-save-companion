// Hand-curated phrase bank for the Masked Prepositions quiz.
// Every item is a known-good German phrase — no on-the-fly generation.

import type { CaseKey } from "../wordData";

export type Gender = "m" | "f" | "n" | "pl";

export type QuizQuestion =
  | {
      kind: "pronoun";
      prep: { token: string; case: CaseKey };
      targetEn: string;
      correctPillId: string;
      /** Optional surrounding words (used for nominativ mini-sentences). */
      prefix?: string;
      suffix?: string;
      prefixEn?: string;
      suffixEn?: string;
    }
  | {
      kind: "article";
      prep: { token: string; case: CaseKey };
      nounDe: string;
      nounEn: string;
      nounArticle: string; // "der" / "ein" / etc., shown in prompt
      gender: Gender;
      correctPillId: string;
      prefix?: string;
      suffix?: string;
      prefixEn?: string;
      suffixEn?: string;
    };

// ---- shorthands ----
const akk = (token: string) => ({ token, case: "akk" as CaseKey });
const dat = (token: string) => ({ token, case: "dat" as CaseKey });
const nom = (token: string) => ({ token, case: "nom" as CaseKey });

// Pronoun pill ids (sub-word ids use "::" suffix from poster).
const P = {
  // Nominativ
  iN: "nom-ich", youN: "nom-du",
  heN: "nom-er::0", sheN: "nom-er::1", itN: "nom-er::2",
  weN: "nom-wir", yallN: "nom-ihr",
  theyN: "nom-sieSie::0", formalN: "nom-sieSie::1",
  // Akkusativ
  meA: "akk-mich", youA: "akk-dich",
  himA: "akk-ihn::0", herA: "akk-ihn::1", itA: "akk-ihn::2",
  usA: "akk-uns", yallA: "akk-euch",
  themA: "akk-sieSie::0", formalA: "akk-sieSie::1",
  // Dativ
  meD: "dat-mir", youD: "dat-dir",
  himD: "dat-ihm::0", herD: "dat-ihm::1", itD: "dat-ihm::2",
  usD: "dat-uns", yallD: "dat-euch",
  themD: "dat-ihnen::0", formalD: "dat-ihnen::1",
};

// ---- Nominativ items: mini-sentences (blank + sein-form + rest). ----
const nominativeItems: QuizQuestion[] = [
  // ich
  { kind: "pronoun", prep: nom("bin"), targetEn: "I", correctPillId: P.iN, suffix: "müde", suffixEn: "tired" },
  { kind: "pronoun", prep: nom("bin"), targetEn: "I", correctPillId: P.iN, suffix: "hungrig", suffixEn: "hungry" },
  { kind: "pronoun", prep: nom("bin"), targetEn: "I", correctPillId: P.iN, suffix: "Lehrer", suffixEn: "teacher" },
  // du
  { kind: "pronoun", prep: nom("bist"), targetEn: "you", correctPillId: P.youN, suffix: "mein Freund", suffixEn: "my friend" },
  { kind: "pronoun", prep: nom("bist"), targetEn: "you", correctPillId: P.youN, suffix: "sehr nett", suffixEn: "very nice" },
  { kind: "pronoun", prep: nom("bist"), targetEn: "you", correctPillId: P.youN, suffix: "warum traurig?", suffixEn: "why sad?" },
  // er / sie / es
  { kind: "pronoun", prep: nom("ist"), targetEn: "he", correctPillId: P.heN, suffix: "mein Bruder", suffixEn: "my brother" },
  { kind: "pronoun", prep: nom("ist"), targetEn: "he", correctPillId: P.heN, suffix: "heute krank", suffixEn: "sick today" },
  { kind: "pronoun", prep: nom("ist"), targetEn: "she", correctPillId: P.sheN, suffix: "Ärztin", suffixEn: "doctor" },
  { kind: "pronoun", prep: nom("ist"), targetEn: "she", correctPillId: P.sheN, suffix: "morgen in Berlin", suffixEn: "tomorrow in Berlin" },
  { kind: "pronoun", prep: nom("ist"), targetEn: "it", correctPillId: P.itN, suffix: "kalt", suffixEn: "cold" },
  { kind: "pronoun", prep: nom("ist"), targetEn: "it", correctPillId: P.itN, suffix: "ein gutes Buch", suffixEn: "a good book" },
  // wir
  { kind: "pronoun", prep: nom("sind"), targetEn: "we", correctPillId: P.weN, suffix: "eine Familie", suffixEn: "a family" },
  { kind: "pronoun", prep: nom("sind"), targetEn: "we", correctPillId: P.weN, suffix: "bereit", suffixEn: "ready" },
  // ihr
  { kind: "pronoun", prep: nom("seid"), targetEn: "you all", correctPillId: P.yallN, suffix: "willkommen", suffixEn: "welcome" },
  { kind: "pronoun", prep: nom("seid"), targetEn: "you all", correctPillId: P.yallN, suffix: "warum so spät?", suffixEn: "why so late?" },
  // sie (they)
  { kind: "pronoun", prep: nom("sind"), targetEn: "they", correctPillId: P.theyN, suffix: "meine Eltern", suffixEn: "my parents" },
  { kind: "pronoun", prep: nom("sind"), targetEn: "they", correctPillId: P.theyN, suffix: "Studenten", suffixEn: "students" },
  // Sie (formal)
  { kind: "pronoun", prep: nom("sind"), targetEn: "you (formal)", correctPillId: P.formalN, suffix: "sehr freundlich, Herr Müller", suffixEn: "very friendly, Mr. Müller" },
  { kind: "pronoun", prep: nom("sind"), targetEn: "you (formal)", correctPillId: P.formalN, suffix: "der Chef?", suffixEn: "the boss?" },
];

// ---- Pronoun items (Akk + Dat) ----
const pronounItems: QuizQuestion[] = [
  // Akk preps that take pronouns: für / gegen / ohne / um / durch
  ...(["für", "gegen", "ohne", "um", "durch"].flatMap((p) => [
    { kind: "pronoun" as const, prep: akk(p), targetEn: "me",            correctPillId: P.meA },
    { kind: "pronoun" as const, prep: akk(p), targetEn: "you",           correctPillId: P.youA },
    { kind: "pronoun" as const, prep: akk(p), targetEn: "him",           correctPillId: P.himA },
    { kind: "pronoun" as const, prep: akk(p), targetEn: "her",           correctPillId: P.herA },
    { kind: "pronoun" as const, prep: akk(p), targetEn: "us",            correctPillId: P.usA },
    { kind: "pronoun" as const, prep: akk(p), targetEn: "you all",       correctPillId: P.yallA },
    { kind: "pronoun" as const, prep: akk(p), targetEn: "them",          correctPillId: P.themA },
    { kind: "pronoun" as const, prep: akk(p), targetEn: "you (formal)",  correctPillId: P.formalA },
  ])),
  // Dat preps that take pronouns: mit / zu / von / bei / nach / aus
  ...(["mit", "zu", "von", "bei", "nach", "aus"].flatMap((p) => [
    { kind: "pronoun" as const, prep: dat(p), targetEn: "me",            correctPillId: P.meD },
    { kind: "pronoun" as const, prep: dat(p), targetEn: "you",           correctPillId: P.youD },
    { kind: "pronoun" as const, prep: dat(p), targetEn: "him",           correctPillId: P.himD },
    { kind: "pronoun" as const, prep: dat(p), targetEn: "her",           correctPillId: P.herD },
    { kind: "pronoun" as const, prep: dat(p), targetEn: "us",            correctPillId: P.usD },
    { kind: "pronoun" as const, prep: dat(p), targetEn: "you all",       correctPillId: P.yallD },
    { kind: "pronoun" as const, prep: dat(p), targetEn: "them",          correctPillId: P.themD },
    { kind: "pronoun" as const, prep: dat(p), targetEn: "you (formal)",  correctPillId: P.formalD },
  ])),
  // außer + people pronouns
  { kind: "pronoun", prep: dat("außer"), targetEn: "me",           correctPillId: P.meD },
  { kind: "pronoun", prep: dat("außer"), targetEn: "you",          correctPillId: P.youD },
  { kind: "pronoun", prep: dat("außer"), targetEn: "him",          correctPillId: P.himD },
  { kind: "pronoun", prep: dat("außer"), targetEn: "her",          correctPillId: P.herD },
  { kind: "pronoun", prep: dat("außer"), targetEn: "us",           correctPillId: P.usD },
  { kind: "pronoun", prep: dat("außer"), targetEn: "them",         correctPillId: P.themD },
  { kind: "pronoun", prep: dat("außer"), targetEn: "you (formal)", correctPillId: P.formalD },
  // gegenüber + people pronouns
  { kind: "pronoun", prep: dat("gegenüber"), targetEn: "me",       correctPillId: P.meD },
  { kind: "pronoun", prep: dat("gegenüber"), targetEn: "you",      correctPillId: P.youD },
  { kind: "pronoun", prep: dat("gegenüber"), targetEn: "him",      correctPillId: P.himD },
  { kind: "pronoun", prep: dat("gegenüber"), targetEn: "her",      correctPillId: P.herD },
  { kind: "pronoun", prep: dat("gegenüber"), targetEn: "us",       correctPillId: P.usD },
  { kind: "pronoun", prep: dat("gegenüber"), targetEn: "them",     correctPillId: P.themD },
  { kind: "pronoun", prep: dat("gegenüber"), targetEn: "you (formal)", correctPillId: P.formalD },
];

// ---- Definite article items ----
const A_DEF: Record<Gender, string> = { m: "akk-den", f: "akk-die", n: "akk-das", pl: "akk-diePl" };
const D_DEF: Record<Gender, string> = { m: "dat-dem", f: "dat-der", n: "dat-dem2", pl: "dat-denN" };

const akkDefArticleItems: QuizQuestion[] = [
  // für
  { kind: "article", prep: akk("für"), nounDe: "Mann",     nounEn: "man",      nounArticle: "den", gender: "m",  correctPillId: A_DEF.m },
  { kind: "article", prep: akk("für"), nounDe: "Frau",     nounEn: "woman",    nounArticle: "die", gender: "f",  correctPillId: A_DEF.f },
  { kind: "article", prep: akk("für"), nounDe: "Kind",     nounEn: "child",    nounArticle: "das", gender: "n",  correctPillId: A_DEF.n },
  { kind: "article", prep: akk("für"), nounDe: "Kinder",   nounEn: "children", nounArticle: "die", gender: "pl", correctPillId: A_DEF.pl },
  { kind: "article", prep: akk("für"), nounDe: "Hund",     nounEn: "dog",      nounArticle: "den", gender: "m",  correctPillId: A_DEF.m },
  { kind: "article", prep: akk("für"), nounDe: "Blume",    nounEn: "flower",   nounArticle: "die", gender: "f",  correctPillId: A_DEF.f },
  { kind: "article", prep: akk("für"), nounDe: "Buch",     nounEn: "book",     nounArticle: "das", gender: "n",  correctPillId: A_DEF.n },
  { kind: "article", prep: akk("für"), nounDe: "Lehrer",   nounEn: "teacher",  nounArticle: "den", gender: "m",  correctPillId: A_DEF.m },
  { kind: "article", prep: akk("für"), nounDe: "Schwester",nounEn: "sister",   nounArticle: "die", gender: "f",  correctPillId: A_DEF.f },
  { kind: "article", prep: akk("für"), nounDe: "Auto",     nounEn: "car",      nounArticle: "das", gender: "n",  correctPillId: A_DEF.n },
  // gegen
  { kind: "article", prep: akk("gegen"), nounDe: "Mann",   nounEn: "man",   nounArticle: "den", gender: "m", correctPillId: A_DEF.m },
  { kind: "article", prep: akk("gegen"), nounDe: "Frau",   nounEn: "woman", nounArticle: "die", gender: "f", correctPillId: A_DEF.f },
  { kind: "article", prep: akk("gegen"), nounDe: "Tisch",  nounEn: "table", nounArticle: "den", gender: "m", correctPillId: A_DEF.m },
  { kind: "article", prep: akk("gegen"), nounDe: "Wand",   nounEn: "wall",  nounArticle: "die", gender: "f", correctPillId: A_DEF.f },
  { kind: "article", prep: akk("gegen"), nounDe: "Auto",   nounEn: "car",   nounArticle: "das", gender: "n", correctPillId: A_DEF.n },
  { kind: "article", prep: akk("gegen"), nounDe: "Lehrer", nounEn: "teacher", nounArticle: "den", gender: "m", correctPillId: A_DEF.m },
  // ohne
  { kind: "article", prep: akk("ohne"), nounDe: "Hund",    nounEn: "dog",      nounArticle: "den", gender: "m", correctPillId: A_DEF.m },
  { kind: "article", prep: akk("ohne"), nounDe: "Buch",    nounEn: "book",     nounArticle: "das", gender: "n", correctPillId: A_DEF.n },
  { kind: "article", prep: akk("ohne"), nounDe: "Frau",    nounEn: "woman",    nounArticle: "die", gender: "f", correctPillId: A_DEF.f },
  { kind: "article", prep: akk("ohne"), nounDe: "Kinder",  nounEn: "children", nounArticle: "die", gender: "pl", correctPillId: A_DEF.pl },
  { kind: "article", prep: akk("ohne"), nounDe: "Schlüssel", nounEn: "key",    nounArticle: "den", gender: "m", correctPillId: A_DEF.m },
  { kind: "article", prep: akk("ohne"), nounDe: "Brille",  nounEn: "glasses",  nounArticle: "die", gender: "f", correctPillId: A_DEF.f },
  // um
  { kind: "article", prep: akk("um"), nounDe: "Park",      nounEn: "park",  nounArticle: "den", gender: "m", correctPillId: A_DEF.m },
  { kind: "article", prep: akk("um"), nounDe: "Haus",      nounEn: "house", nounArticle: "das", gender: "n", correctPillId: A_DEF.n },
  { kind: "article", prep: akk("um"), nounDe: "Tisch",     nounEn: "table", nounArticle: "den", gender: "m", correctPillId: A_DEF.m },
  { kind: "article", prep: akk("um"), nounDe: "Ecke",      nounEn: "corner", nounArticle: "die", gender: "f", correctPillId: A_DEF.f },
  { kind: "article", prep: akk("um"), nounDe: "Schule",    nounEn: "school", nounArticle: "die", gender: "f", correctPillId: A_DEF.f },
  // durch
  { kind: "article", prep: akk("durch"), nounDe: "Park",   nounEn: "park",  nounArticle: "den", gender: "m", correctPillId: A_DEF.m },
  { kind: "article", prep: akk("durch"), nounDe: "Haus",   nounEn: "house", nounArticle: "das", gender: "n", correctPillId: A_DEF.n },
  { kind: "article", prep: akk("durch"), nounDe: "Tür",    nounEn: "door",  nounArticle: "die", gender: "f", correctPillId: A_DEF.f },
  { kind: "article", prep: akk("durch"), nounDe: "Wald",   nounEn: "forest", nounArticle: "den", gender: "m", correctPillId: A_DEF.m },
  { kind: "article", prep: akk("durch"), nounDe: "Stadt",  nounEn: "city",  nounArticle: "die", gender: "f", correctPillId: A_DEF.f },
  // bis (rare with definite articles; use idiomatic place/time)
  { kind: "article", prep: akk("bis"), nounDe: "Park",     nounEn: "park",  nounArticle: "den", gender: "m", correctPillId: A_DEF.m },
  { kind: "article", prep: akk("bis"), nounDe: "Bahnhof",  nounEn: "station", nounArticle: "den", gender: "m", correctPillId: A_DEF.m },
  { kind: "article", prep: akk("bis"), nounDe: "Schule",   nounEn: "school", nounArticle: "die", gender: "f", correctPillId: A_DEF.f },
];

const datDefArticleItems: QuizQuestion[] = [
  // mit
  { kind: "article", prep: dat("mit"), nounDe: "Mann",     nounEn: "man",      nounArticle: "dem", gender: "m",  correctPillId: D_DEF.m },
  { kind: "article", prep: dat("mit"), nounDe: "Frau",     nounEn: "woman",    nounArticle: "der", gender: "f",  correctPillId: D_DEF.f },
  { kind: "article", prep: dat("mit"), nounDe: "Kind",     nounEn: "child",    nounArticle: "dem", gender: "n",  correctPillId: D_DEF.n },
  { kind: "article", prep: dat("mit"), nounDe: "Kindern",  nounEn: "children", nounArticle: "den", gender: "pl", correctPillId: D_DEF.pl },
  { kind: "article", prep: dat("mit"), nounDe: "Hund",     nounEn: "dog",      nounArticle: "dem", gender: "m",  correctPillId: D_DEF.m },
  { kind: "article", prep: dat("mit"), nounDe: "Buch",     nounEn: "book",     nounArticle: "dem", gender: "n",  correctPillId: D_DEF.n },
  { kind: "article", prep: dat("mit"), nounDe: "Bruder",   nounEn: "brother",  nounArticle: "dem", gender: "m",  correctPillId: D_DEF.m },
  { kind: "article", prep: dat("mit"), nounDe: "Schwester",nounEn: "sister",   nounArticle: "der", gender: "f",  correctPillId: D_DEF.f },
  { kind: "article", prep: dat("mit"), nounDe: "Auto",     nounEn: "car",      nounArticle: "dem", gender: "n",  correctPillId: D_DEF.n },
  // zu
  { kind: "article", prep: dat("zu"), nounDe: "Mann",      nounEn: "man",     nounArticle: "dem", gender: "m", correctPillId: D_DEF.m },
  { kind: "article", prep: dat("zu"), nounDe: "Frau",      nounEn: "woman",   nounArticle: "der", gender: "f", correctPillId: D_DEF.f },
  { kind: "article", prep: dat("zu"), nounDe: "Park",      nounEn: "park",    nounArticle: "dem", gender: "m", correctPillId: D_DEF.m },
  { kind: "article", prep: dat("zu"), nounDe: "Haus",      nounEn: "house",   nounArticle: "dem", gender: "n", correctPillId: D_DEF.n },
  { kind: "article", prep: dat("zu"), nounDe: "Schule",    nounEn: "school",  nounArticle: "der", gender: "f", correctPillId: D_DEF.f },
  { kind: "article", prep: dat("zu"), nounDe: "Bahnhof",   nounEn: "station", nounArticle: "dem", gender: "m", correctPillId: D_DEF.m },
  // von
  { kind: "article", prep: dat("von"), nounDe: "Mann",     nounEn: "man",     nounArticle: "dem", gender: "m", correctPillId: D_DEF.m },
  { kind: "article", prep: dat("von"), nounDe: "Frau",     nounEn: "woman",   nounArticle: "der", gender: "f", correctPillId: D_DEF.f },
  { kind: "article", prep: dat("von"), nounDe: "Haus",     nounEn: "house",   nounArticle: "dem", gender: "n", correctPillId: D_DEF.n },
  { kind: "article", prep: dat("von"), nounDe: "Kind",     nounEn: "child",   nounArticle: "dem", gender: "n", correctPillId: D_DEF.n },
  { kind: "article", prep: dat("von"), nounDe: "Lehrer",   nounEn: "teacher", nounArticle: "dem", gender: "m", correctPillId: D_DEF.m },
  { kind: "article", prep: dat("von"), nounDe: "Stadt",    nounEn: "city",    nounArticle: "der", gender: "f", correctPillId: D_DEF.f },
  // bei
  { kind: "article", prep: dat("bei"), nounDe: "Mann",     nounEn: "man",     nounArticle: "dem", gender: "m", correctPillId: D_DEF.m },
  { kind: "article", prep: dat("bei"), nounDe: "Frau",     nounEn: "woman",   nounArticle: "der", gender: "f", correctPillId: D_DEF.f },
  { kind: "article", prep: dat("bei"), nounDe: "Park",     nounEn: "park",    nounArticle: "dem", gender: "m", correctPillId: D_DEF.m },
  { kind: "article", prep: dat("bei"), nounDe: "Arzt",     nounEn: "doctor",  nounArticle: "dem", gender: "m", correctPillId: D_DEF.m },
  { kind: "article", prep: dat("bei"), nounDe: "Bank",     nounEn: "bank",    nounArticle: "der", gender: "f", correctPillId: D_DEF.f },
  // nach
  { kind: "article", prep: dat("nach"), nounDe: "Park",    nounEn: "park",    nounArticle: "dem", gender: "m", correctPillId: D_DEF.m },
  { kind: "article", prep: dat("nach"), nounDe: "Haus",    nounEn: "house",   nounArticle: "dem", gender: "n", correctPillId: D_DEF.n },
  { kind: "article", prep: dat("nach"), nounDe: "Essen",   nounEn: "meal",    nounArticle: "dem", gender: "n", correctPillId: D_DEF.n },
  { kind: "article", prep: dat("nach"), nounDe: "Schule",  nounEn: "school",  nounArticle: "der", gender: "f", correctPillId: D_DEF.f },
  // aus
  { kind: "article", prep: dat("aus"), nounDe: "Haus",     nounEn: "house",   nounArticle: "dem", gender: "n", correctPillId: D_DEF.n },
  { kind: "article", prep: dat("aus"), nounDe: "Park",     nounEn: "park",    nounArticle: "dem", gender: "m", correctPillId: D_DEF.m },
  { kind: "article", prep: dat("aus"), nounDe: "Stadt",    nounEn: "city",    nounArticle: "der", gender: "f", correctPillId: D_DEF.f },
  { kind: "article", prep: dat("aus"), nounDe: "Tasche",   nounEn: "bag",     nounArticle: "der", gender: "f", correctPillId: D_DEF.f },
  // seit
  { kind: "article", prep: dat("seit"), nounDe: "Sommer",  nounEn: "summer",  nounArticle: "dem", gender: "m", correctPillId: D_DEF.m },
  { kind: "article", prep: dat("seit"), nounDe: "Krieg",   nounEn: "war",     nounArticle: "dem", gender: "m", correctPillId: D_DEF.m },
  { kind: "article", prep: dat("seit"), nounDe: "Geburt",  nounEn: "birth",   nounArticle: "der", gender: "f", correctPillId: D_DEF.f },
  { kind: "article", prep: dat("seit"), nounDe: "Treffen", nounEn: "meeting", nounArticle: "dem", gender: "n", correctPillId: D_DEF.n },
  // ab
  { kind: "article", prep: dat("ab"), nounDe: "Bahnhof",   nounEn: "station", nounArticle: "dem", gender: "m", correctPillId: D_DEF.m },
  { kind: "article", prep: dat("ab"), nounDe: "Sommer",    nounEn: "summer",  nounArticle: "dem", gender: "m", correctPillId: D_DEF.m },
  { kind: "article", prep: dat("ab"), nounDe: "ersten Mai",nounEn: "first of May", nounArticle: "dem", gender: "m", correctPillId: D_DEF.m },
  // gegenüber
  { kind: "article", prep: dat("gegenüber"), nounDe: "Mann", nounEn: "man",   nounArticle: "dem", gender: "m", correctPillId: D_DEF.m },
  { kind: "article", prep: dat("gegenüber"), nounDe: "Frau", nounEn: "woman", nounArticle: "der", gender: "f", correctPillId: D_DEF.f },
  { kind: "article", prep: dat("gegenüber"), nounDe: "Park", nounEn: "park",  nounArticle: "dem", gender: "m", correctPillId: D_DEF.m },
  { kind: "article", prep: dat("gegenüber"), nounDe: "Haus", nounEn: "house", nounArticle: "dem", gender: "n", correctPillId: D_DEF.n },
  // außer
  { kind: "article", prep: dat("außer"), nounDe: "Mann",    nounEn: "man",      nounArticle: "dem", gender: "m",  correctPillId: D_DEF.m },
  { kind: "article", prep: dat("außer"), nounDe: "Kind",    nounEn: "child",    nounArticle: "dem", gender: "n",  correctPillId: D_DEF.n },
  { kind: "article", prep: dat("außer"), nounDe: "Kindern", nounEn: "children", nounArticle: "den", gender: "pl", correctPillId: D_DEF.pl },
  { kind: "article", prep: dat("außer"), nounDe: "Lehrer",  nounEn: "teacher",  nounArticle: "dem", gender: "m",  correctPillId: D_DEF.m },
];

// ---- Indefinite article items ----
const A_INDEF: Record<Exclude<Gender, "pl">, string> = { m: "akk-einen", f: "akk-eine", n: "akk-ein" };
const D_INDEF: Record<Exclude<Gender, "pl">, string> = { m: "dat-einem", f: "dat-einer", n: "dat-einem2" };

const akkIndefArticleItems: QuizQuestion[] = [
  // für
  { kind: "article", prep: akk("für"), nounDe: "Mann",    nounEn: "man",    nounArticle: "einen", gender: "m", correctPillId: A_INDEF.m },
  { kind: "article", prep: akk("für"), nounDe: "Frau",    nounEn: "woman",  nounArticle: "eine",  gender: "f", correctPillId: A_INDEF.f },
  { kind: "article", prep: akk("für"), nounDe: "Kind",    nounEn: "child",  nounArticle: "ein",   gender: "n", correctPillId: A_INDEF.n },
  { kind: "article", prep: akk("für"), nounDe: "Hund",    nounEn: "dog",    nounArticle: "einen", gender: "m", correctPillId: A_INDEF.m },
  { kind: "article", prep: akk("für"), nounDe: "Buch",    nounEn: "book",   nounArticle: "ein",   gender: "n", correctPillId: A_INDEF.n },
  { kind: "article", prep: akk("für"), nounDe: "Freund",  nounEn: "friend", nounArticle: "einen", gender: "m", correctPillId: A_INDEF.m },
  { kind: "article", prep: akk("für"), nounDe: "Lehrerin",nounEn: "teacher (f)", nounArticle: "eine", gender: "f", correctPillId: A_INDEF.f },
  // gegen
  { kind: "article", prep: akk("gegen"), nounDe: "Mann",  nounEn: "man",   nounArticle: "einen", gender: "m", correctPillId: A_INDEF.m },
  { kind: "article", prep: akk("gegen"), nounDe: "Tisch", nounEn: "table", nounArticle: "einen", gender: "m", correctPillId: A_INDEF.m },
  { kind: "article", prep: akk("gegen"), nounDe: "Wand",  nounEn: "wall",  nounArticle: "eine",  gender: "f", correctPillId: A_INDEF.f },
  { kind: "article", prep: akk("gegen"), nounDe: "Auto",  nounEn: "car",   nounArticle: "ein",   gender: "n", correctPillId: A_INDEF.n },
  // ohne
  { kind: "article", prep: akk("ohne"), nounDe: "Hund",   nounEn: "dog",    nounArticle: "einen", gender: "m", correctPillId: A_INDEF.m },
  { kind: "article", prep: akk("ohne"), nounDe: "Buch",   nounEn: "book",   nounArticle: "ein",   gender: "n", correctPillId: A_INDEF.n },
  { kind: "article", prep: akk("ohne"), nounDe: "Blume",  nounEn: "flower", nounArticle: "eine",  gender: "f", correctPillId: A_INDEF.f },
  { kind: "article", prep: akk("ohne"), nounDe: "Schlüssel", nounEn: "key", nounArticle: "einen", gender: "m", correctPillId: A_INDEF.m },
  // um
  { kind: "article", prep: akk("um"), nounDe: "Tisch",    nounEn: "table",  nounArticle: "einen", gender: "m", correctPillId: A_INDEF.m },
  { kind: "article", prep: akk("um"), nounDe: "Ecke",     nounEn: "corner", nounArticle: "eine",  gender: "f", correctPillId: A_INDEF.f },
  // durch
  { kind: "article", prep: akk("durch"), nounDe: "Park",  nounEn: "park",   nounArticle: "einen", gender: "m", correctPillId: A_INDEF.m },
  { kind: "article", prep: akk("durch"), nounDe: "Haus",  nounEn: "house",  nounArticle: "ein",   gender: "n", correctPillId: A_INDEF.n },
  { kind: "article", prep: akk("durch"), nounDe: "Tür",   nounEn: "door",   nounArticle: "eine",  gender: "f", correctPillId: A_INDEF.f },
  { kind: "article", prep: akk("durch"), nounDe: "Wald",  nounEn: "forest", nounArticle: "einen", gender: "m", correctPillId: A_INDEF.m },
];

const datIndefArticleItems: QuizQuestion[] = [
  // mit
  { kind: "article", prep: dat("mit"), nounDe: "Mann",    nounEn: "man",    nounArticle: "einem", gender: "m", correctPillId: D_INDEF.m },
  { kind: "article", prep: dat("mit"), nounDe: "Frau",    nounEn: "woman",  nounArticle: "einer", gender: "f", correctPillId: D_INDEF.f },
  { kind: "article", prep: dat("mit"), nounDe: "Kind",    nounEn: "child",  nounArticle: "einem", gender: "n", correctPillId: D_INDEF.n },
  { kind: "article", prep: dat("mit"), nounDe: "Hund",    nounEn: "dog",    nounArticle: "einem", gender: "m", correctPillId: D_INDEF.m },
  { kind: "article", prep: dat("mit"), nounDe: "Buch",    nounEn: "book",   nounArticle: "einem", gender: "n", correctPillId: D_INDEF.n },
  { kind: "article", prep: dat("mit"), nounDe: "Freundin",nounEn: "friend (f)", nounArticle: "einer", gender: "f", correctPillId: D_INDEF.f },
  // zu
  { kind: "article", prep: dat("zu"), nounDe: "Mann",     nounEn: "man",    nounArticle: "einem", gender: "m", correctPillId: D_INDEF.m },
  { kind: "article", prep: dat("zu"), nounDe: "Frau",     nounEn: "woman",  nounArticle: "einer", gender: "f", correctPillId: D_INDEF.f },
  { kind: "article", prep: dat("zu"), nounDe: "Treffen",  nounEn: "meeting",nounArticle: "einem", gender: "n", correctPillId: D_INDEF.n },
  // von
  { kind: "article", prep: dat("von"), nounDe: "Mann",    nounEn: "man",    nounArticle: "einem", gender: "m", correctPillId: D_INDEF.m },
  { kind: "article", prep: dat("von"), nounDe: "Frau",    nounEn: "woman",  nounArticle: "einer", gender: "f", correctPillId: D_INDEF.f },
  { kind: "article", prep: dat("von"), nounDe: "Kind",    nounEn: "child",  nounArticle: "einem", gender: "n", correctPillId: D_INDEF.n },
  // bei
  { kind: "article", prep: dat("bei"), nounDe: "Mann",    nounEn: "man",    nounArticle: "einem", gender: "m", correctPillId: D_INDEF.m },
  { kind: "article", prep: dat("bei"), nounDe: "Freund",  nounEn: "friend", nounArticle: "einem", gender: "m", correctPillId: D_INDEF.m },
  { kind: "article", prep: dat("bei"), nounDe: "Tante",   nounEn: "aunt",   nounArticle: "einer", gender: "f", correctPillId: D_INDEF.f },
  // nach
  { kind: "article", prep: dat("nach"), nounDe: "Essen",  nounEn: "meal",   nounArticle: "einem", gender: "n", correctPillId: D_INDEF.n },
  { kind: "article", prep: dat("nach"), nounDe: "Stunde", nounEn: "hour",   nounArticle: "einer", gender: "f", correctPillId: D_INDEF.f },
  // aus
  { kind: "article", prep: dat("aus"), nounDe: "Haus",    nounEn: "house",  nounArticle: "einem", gender: "n", correctPillId: D_INDEF.n },
  { kind: "article", prep: dat("aus"), nounDe: "Tasche",  nounEn: "bag",    nounArticle: "einer", gender: "f", correctPillId: D_INDEF.f },
  // seit
  { kind: "article", prep: dat("seit"), nounDe: "Jahr",   nounEn: "year",   nounArticle: "einem", gender: "n", correctPillId: D_INDEF.n },
  { kind: "article", prep: dat("seit"), nounDe: "Woche",  nounEn: "week",   nounArticle: "einer", gender: "f", correctPillId: D_INDEF.f },
  { kind: "article", prep: dat("seit"), nounDe: "Monat",  nounEn: "month",  nounArticle: "einem", gender: "m", correctPillId: D_INDEF.m },
];

export const QUIZ_BANK: QuizQuestion[] = [
  ...nominativeItems,
  ...pronounItems,
  ...akkDefArticleItems,
  ...datDefArticleItems,
  ...akkIndefArticleItems,
  ...datIndefArticleItems,
];

// Case-bucketed banks for balanced sampling.
const NOM_BANK = QUIZ_BANK.filter((q) => q.prep.case === "nom");
const AKK_BANK = QUIZ_BANK.filter((q) => q.prep.case === "akk");
const DAT_BANK = QUIZ_BANK.filter((q) => q.prep.case === "dat");

// ---- Learn-mode curated questions (3 cases × 3 types). ----
// Trigger-then-blank layout so the existing prompt card renders cleanly.
export const LEARN_QUESTIONS: QuizQuestion[] = [
  // 1-3: pronouns (nom, akk, dat)
  { kind: "pronoun", prep: nom("bin"), targetEn: "I", correctPillId: P.iN, suffix: "müde", suffixEn: "tired" },
  { kind: "pronoun", prep: akk("für"), targetEn: "you", correctPillId: P.youA, prefix: "ich bin", prefixEn: "I am" },
  { kind: "pronoun", prep: dat("mit"), targetEn: "me", correctPillId: P.meD, prefix: "komm", prefixEn: "come" },
  // 4-6: definite articles (nom, akk, dat)
  { kind: "article", prep: nom("ist"), nounDe: "Kaffee", nounEn: "coffee", nounArticle: "der", gender: "m", correctPillId: "nom-der", suffix: "lecker", suffixEn: "tasty" },
  { kind: "article", prep: akk("für"), nounDe: "Mann",   nounEn: "man",    nounArticle: "den",  gender: "m", correctPillId: A_DEF.m, prefix: "das ist", prefixEn: "that is" },
  { kind: "article", prep: dat("mit"), nounDe: "Kind",   nounEn: "child",  nounArticle: "dem",  gender: "n", correctPillId: D_DEF.n, prefix: "ich spiele", prefixEn: "I play" },
  // 7-9: indefinite articles (nom, akk, dat)
  { kind: "article", prep: nom("ist"), nounDe: "Elefant", nounEn: "elephant",   nounArticle: "ein",   gender: "m", correctPillId: "nom-ein", suffix: "groß", suffixEn: "big" },
  { kind: "article", prep: akk("für"), nounDe: "Kuchen", nounEn: "cake",   nounArticle: "einen", gender: "m", correctPillId: A_INDEF.m, prefix: "das ist", prefixEn: "that is" },
  { kind: "article", prep: dat("mit"), nounDe: "Freundin", nounEn: "friend", nounArticle: "einer", gender: "f", correctPillId: D_INDEF.f, prefix: "ich rede", prefixEn: "I talk" },
];

function sameItem(a: QuizQuestion, b: QuizQuestion): boolean {
  if (a.kind !== b.kind) return false;
  if (a.prep.token !== b.prep.token) return false;
  if (a.kind === "pronoun" && b.kind === "pronoun") return a.targetEn === b.targetEn && a.suffix === b.suffix && a.prefix === b.prefix;
  if (a.kind === "article" && b.kind === "article") return a.nounDe === b.nounDe && a.nounArticle === b.nounArticle;
  return false;
}

export type GenerateOptions = { includeNom?: boolean; mode?: "practice" | "learn"; learnIndex?: number };

export function generateQuestion(prev?: QuizQuestion | null, opts: GenerateOptions = {}): QuizQuestion {
  if (opts.mode === "learn") {
    const i = ((opts.learnIndex ?? 0) % LEARN_QUESTIONS.length + LEARN_QUESTIONS.length) % LEARN_QUESTIONS.length;
    return LEARN_QUESTIONS[i];
  }
  const includeNom = opts.includeNom !== false;
  for (let i = 0; i < 12; i++) {
    const r = Math.random();
    let bank: QuizQuestion[];
    if (includeNom) {
      bank = r < 1 / 3 ? NOM_BANK : r < 2 / 3 ? AKK_BANK : DAT_BANK;
    } else {
      bank = r < 0.5 ? AKK_BANK : DAT_BANK;
    }
    const q = bank[Math.floor(Math.random() * bank.length)];
    if (!prev || !sameItem(q, prev)) return q;
  }
  return QUIZ_BANK[Math.floor(Math.random() * QUIZ_BANK.length)];
}

/** Helpers for Learn-mode tap validation against the active question. */
const INDEF_RE = /^[a-z]+-ein/;
export function isIndefArticlePill(id: string): boolean {
  return INDEF_RE.test(id);
}

const ARTICLE_GENDER: Record<string, Gender> = {
  // Nom
  "nom-der": "m", "nom-die": "f", "nom-das": "n", "nom-diePl": "pl",
  "nom-ein": "m", "nom-eine": "f", "nom-ein2": "n",
  // Akk
  "akk-den": "m", "akk-die": "f", "akk-das": "n", "akk-diePl": "pl",
  "akk-einen": "m", "akk-eine": "f", "akk-ein": "n",
  // Dat
  "dat-dem": "m", "dat-der": "f", "dat-dem2": "n", "dat-denN": "pl",
  "dat-einem": "m", "dat-einer": "f", "dat-einem2": "n",
};
export function articlePillGender(id: string): Gender | null {
  return ARTICLE_GENDER[id] ?? null;
}

