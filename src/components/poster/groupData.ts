// Maps each word id to its visually-bordered group id, plus group metadata.
import type { CaseKey } from "./wordData";

export type GroupId =
  | "g-akk-pron" | "g-akk-art" | "g-akk-prep" | "g-twL"
  | "g-nom-pron" | "g-nom-art" | "g-pos"
  | "g-dat-pron" | "g-dat-art" | "g-dat-prep" | "g-twR"
  // single-row pair groups inside g-nom-pron
  | "nom-row-ich" | "nom-row-du" | "nom-row-er"
  | "nom-row-wir" | "nom-row-ihr" | "nom-row-sie"
  // article sub-row tier (def / indef) inside g-{case}-art
  | "nom-art-row-def" | "nom-art-row-indef"
  | "akk-art-row-def" | "akk-art-row-indef"
  | "dat-art-row-def" | "dat-art-row-indef";

export type GroupInfo = {
  id: GroupId;
  name: string;
  description: string;
  case: CaseKey | null; // null = standalone (possessives, two-way preps)
};

export const GROUPS: Record<GroupId, GroupInfo> = {
  "g-akk-pron": { id: "g-akk-pron", name: "Akkusativ pronouns", description: "Personal pronouns when used as the direct object (the thing being acted upon).", case: "akk" },
  "g-akk-art":  { id: "g-akk-art",  name: "Akkusativ articles", description: "Definite (den, die, das) and indefinite (einen, eine, ein) articles in the Akkusativ case.", case: "akk" },
  "g-akk-prep": { id: "g-akk-prep", name: "Akkusativ prepositions", description: "Always followed by Akkusativ: für, gegen, um, bis, ohne, durch.", case: "akk" },
  "g-twL":      { id: "g-twL",      name: "Two-way prepositions", description: "These take Akkusativ when there's motion (wohin?) and Dativ when there's location (wo?).", case: "akk" },
  "g-twR":      { id: "g-twR",      name: "Two-way prepositions", description: "These take Akkusativ when there's motion (wohin?) and Dativ when there's location (wo?).", case: "dat" },

  "g-nom-pron": { id: "g-nom-pron", name: "Nominativ pronouns + verb endings", description: "Subject pronouns and the verb ending each one triggers.", case: "nom" },
  "g-nom-art":  { id: "g-nom-art",  name: "Nominativ articles", description: "Definite (der, die, das) and indefinite (ein, eine) articles in the Nominativ case.", case: "nom" },
  "g-pos":      { id: "g-pos",      name: "Possessives", description: "Possessive stems (mein, dein, sein…). Add the case ending of the noun's gender.", case: "nom" },

  "g-dat-pron": { id: "g-dat-pron", name: "Dativ pronouns", description: "Personal pronouns when used as the indirect object (the recipient).", case: "dat" },
  "g-dat-art":  { id: "g-dat-art",  name: "Dativ articles", description: "Definite (dem, der) and indefinite (einem, einer) articles in the Dativ case.", case: "dat" },
  "g-dat-prep": { id: "g-dat-prep", name: "Dativ prepositions", description: "Always followed by Dativ: zu, von, mit, bei, nach, seit, ab, aus, gegenüber, außer.", case: "dat" },

  "nom-row-ich": { id: "nom-row-ich", name: "ich + -e", description: "1st person singular: pronoun and matching verb ending.", case: "nom" },
  "nom-row-du":  { id: "nom-row-du",  name: "du + -st", description: "2nd person singular: pronoun and matching verb ending.", case: "nom" },
  "nom-row-er":  { id: "nom-row-er",  name: "er/sie/es + -t", description: "3rd person singular: pronoun and matching verb ending.", case: "nom" },
  "nom-row-wir": { id: "nom-row-wir", name: "wir + -en", description: "1st person plural: pronoun and matching verb ending.", case: "nom" },
  "nom-row-ihr": { id: "nom-row-ihr", name: "ihr + -t", description: "2nd person plural: pronoun and matching verb ending.", case: "nom" },
  "nom-row-sie": { id: "nom-row-sie", name: "sie/Sie + -en", description: "3rd plural / formal: pronoun and matching verb ending.", case: "nom" },

  "nom-art-row-def":   { id: "nom-art-row-def",   name: "Nominativ definite articles",   description: "der, die, das, die (pl) — used when the noun is known/specific.", case: "nom" },
  "nom-art-row-indef": { id: "nom-art-row-indef", name: "Nominativ indefinite articles", description: "ein, eine, ein, — (no plural) — used for an unspecified noun.", case: "nom" },
  "akk-art-row-def":   { id: "akk-art-row-def",   name: "Akkusativ definite articles",   description: "den, die, das, die (pl).", case: "akk" },
  "akk-art-row-indef": { id: "akk-art-row-indef", name: "Akkusativ indefinite articles", description: "einen, eine, ein, — (no plural).", case: "akk" },
  "dat-art-row-def":   { id: "dat-art-row-def",   name: "Dativ definite articles",       description: "dem, der, dem, den + -n.", case: "dat" },
  "dat-art-row-indef": { id: "dat-art-row-indef", name: "Dativ indefinite articles",     description: "einem, einer, einem, — + -n.", case: "dat" },
};

/** Group id that a word belongs to at Level 2 zoom. */
export const WORD_GROUP: Record<string, GroupId> = {
  // Akk pronouns
  "akk-mich":"g-akk-pron","akk-dich":"g-akk-pron","akk-ihn":"g-akk-pron",
  "akk-uns":"g-akk-pron","akk-euch":"g-akk-pron","akk-sieSie":"g-akk-pron",
  // Akk articles
  "akk-einen":"g-akk-art","akk-den":"g-akk-art","akk-eine":"g-akk-art","akk-die":"g-akk-art",
  "akk-ein":"g-akk-art","akk-das":"g-akk-art","akk-none":"g-akk-art","akk-diePl":"g-akk-art",
  // Akk preps
  "akk-prep-für":"g-akk-prep","akk-prep-gegen":"g-akk-prep","akk-prep-um":"g-akk-prep",
  "akk-prep-bis":"g-akk-prep","akk-prep-ohne":"g-akk-prep","akk-prep-durch":"g-akk-prep",
  // Two-way left
  "twL-in":"g-twL","twL-auf":"g-twL","twL-an":"g-twL","twL-unter":"g-twL","twL-neben":"g-twL",
  "twL-hinter":"g-twL","twL-unter2":"g-twL","twL-über":"g-twL","twL-vor":"g-twL","twL-zwischen":"g-twL",
  // Two-way right
  "twR-in":"g-twR","twR-auf":"g-twR","twR-an":"g-twR","twR-unter":"g-twR","twR-neben":"g-twR",
  "twR-hinter":"g-twR","twR-unter2":"g-twR","twR-über":"g-twR","twR-vor":"g-twR","twR-zwischen":"g-twR",

  // Nom pronouns + endings (per-row groups)
  "nom-ich":"nom-row-ich","nom-end-e":"nom-row-ich",
  "nom-du":"nom-row-du","nom-end-st":"nom-row-du",
  "nom-er":"nom-row-er","nom-end-t":"nom-row-er",
  "nom-wir":"nom-row-wir","nom-end-en":"nom-row-wir",
  "nom-ihr":"nom-row-ihr","nom-end-t2":"nom-row-ihr",
  "nom-sieSie":"nom-row-sie","nom-end-en2":"nom-row-sie",
  // Nom articles
  "nom-ein":"g-nom-art","nom-der":"g-nom-art","nom-eine":"g-nom-art","nom-die":"g-nom-art",
  "nom-ein2":"g-nom-art","nom-das":"g-nom-art","nom-none":"g-nom-art","nom-diePl":"g-nom-art",
  // Possessives
  "pos-mein":"g-pos","pos-dein":"g-pos","pos-sein":"g-pos",
  "pos-unser":"g-pos","pos-euer":"g-pos","pos-ihr":"g-pos","pos-kein":"g-pos",


  // Dat pronouns
  "dat-mir":"g-dat-pron","dat-dir":"g-dat-pron","dat-ihm":"g-dat-pron",
  "dat-uns":"g-dat-pron","dat-euch":"g-dat-pron","dat-ihnen":"g-dat-pron",
  // Dat articles
  "dat-einem":"g-dat-art","dat-dem":"g-dat-art","dat-einer":"g-dat-art","dat-der":"g-dat-art",
  "dat-einem2":"g-dat-art","dat-dem2":"g-dat-art","dat-noneN":"g-dat-art","dat-denN":"g-dat-art",
  // Dat preps
  "dat-prep-zu":"g-dat-prep","dat-prep-von":"g-dat-prep","dat-prep-mit":"g-dat-prep",
  "dat-prep-bei":"g-dat-prep","dat-prep-nach":"g-dat-prep","dat-prep-seit":"g-dat-prep",
  "dat-prep-ab":"g-dat-prep","dat-prep-aus":"g-dat-prep","dat-prep-gegenüber":"g-dat-prep",
  "dat-prep-außer":"g-dat-prep",
};

/** Sub-row map (def / indef) for every article pill. */
export const ARTICLE_ROW: Record<string, GroupId> = {
  // Nom — def
  "nom-der": "nom-art-row-def", "nom-die": "nom-art-row-def",
  "nom-das": "nom-art-row-def", "nom-diePl": "nom-art-row-def",
  // Nom — indef
  "nom-ein": "nom-art-row-indef", "nom-eine": "nom-art-row-indef",
  "nom-ein2": "nom-art-row-indef", "nom-none": "nom-art-row-indef",
  // Akk — def
  "akk-den": "akk-art-row-def", "akk-die": "akk-art-row-def",
  "akk-das": "akk-art-row-def", "akk-diePl": "akk-art-row-def",
  // Akk — indef
  "akk-einen": "akk-art-row-indef", "akk-eine": "akk-art-row-indef",
  "akk-ein": "akk-art-row-indef", "akk-none": "akk-art-row-indef",
  // Dat — def
  "dat-dem": "dat-art-row-def", "dat-der": "dat-art-row-def",
  "dat-dem2": "dat-art-row-def", "dat-denN": "dat-art-row-def",
  // Dat — indef
  "dat-einem": "dat-art-row-indef", "dat-einer": "dat-art-row-indef",
  "dat-einem2": "dat-art-row-indef", "dat-noneN": "dat-art-row-indef",
};

/** Member pill ids for each article sub-row (used to compute a virtual bbox). */
export const ARTICLE_ROW_MEMBERS: Record<string, string[]> = (() => {
  const out: Record<string, string[]> = {};
  for (const [pillId, rowId] of Object.entries(ARTICLE_ROW)) {
    (out[rowId] ??= []).push(pillId);
  }
  return out;
})();

export function isArticlePill(id: string): boolean {
  return Object.prototype.hasOwnProperty.call(ARTICLE_ROW, id);
}
