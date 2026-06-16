// Rich data for every interactive cell on the poster.
// Used by InfoCard at zoom level 2 (single-rectangle deep-dive).

export type CaseKey = "akk" | "nom" | "dat";
export type WordType =
  | "pronoun"
  | "article-def"
  | "article-indef"
  | "preposition"
  | "preposition-2way"
  | "ending"
  | "possessive"
  | "header"
  | "verb";

export type SubWord = {
  /** the visible token (no separator) */
  token: string;
  /** gender of this specific sub-token, drives hover stroke color */
  gender: "m" | "f" | "n" | "pl" | "formal";
  translation: string;
  note?: string;
  example?: { de: string; en: string };
};

export type WordDatum = {
  /** unique id for refs / state */
  id: string;
  /** display text */
  display: string;
  /** English meaning */
  translation: string;
  case?: CaseKey;
  type: WordType;
  note?: string;
  example?: { de: string; en: string };
  /** Optional per-token breakdown (Level 4). Order matches display tokens split by " · " or " / ". */
  subWords?: SubWord[];
};

export const WORDS: Record<string, WordDatum> = {
  // ===== Akkusativ pronouns =====
  "akk-mich":   { id: "akk-mich",   display: "mich",        translation: "me",                       case: "akk", type: "pronoun", note: "1st person singular", example: { de: "Er sieht mich.", en: "He sees me." } },
  "akk-dich":   { id: "akk-dich",   display: "dich",        translation: "you (informal)",           case: "akk", type: "pronoun", note: "2nd person singular", example: { de: "Ich liebe dich.", en: "I love you." } },
  "akk-ihn":    { id: "akk-ihn",    display: "ihn • sie • es", translation: "him / her / it",         case: "akk", type: "pronoun", note: "3rd person singular (m / f / n)", example: { de: "Ich kenne ihn.", en: "I know him." },
    subWords: [
      { token: "ihn", gender: "m", translation: "him", note: "Akkusativ — masculine 3rd person singular.", example: { de: "Ich kenne ihn.", en: "I know him." } },
      { token: "sie", gender: "f", translation: "her", note: "Akkusativ — feminine 3rd person singular.", example: { de: "Ich sehe sie.", en: "I see her." } },
      { token: "es",  gender: "n", translation: "it",  note: "Akkusativ — neuter 3rd person singular.",   example: { de: "Ich lese es.", en: "I'm reading it." } },
    ] },
  "akk-uns":    { id: "akk-uns",    display: "uns",         translation: "us",                       case: "akk", type: "pronoun", note: "1st person plural", example: { de: "Sie ruft uns.", en: "She calls us." } },
  "akk-euch":   { id: "akk-euch",   display: "euch",        translation: "you all",                  case: "akk", type: "pronoun", note: "2nd person plural", example: { de: "Ich sehe euch.", en: "I see you all." } },
  "akk-sieSie": { id: "akk-sieSie", display: "sie • Sie",   translation: "them / you (formal)",      case: "akk", type: "pronoun", note: "3rd plural / formal", example: { de: "Ich frage Sie.", en: "I'm asking you (formal)." },
    subWords: [
      { token: "sie", gender: "pl",     translation: "them",        note: "Akkusativ — 3rd person plural.", example: { de: "Ich sehe sie.", en: "I see them." } },
      { token: "Sie", gender: "formal", translation: "you (formal)", note: "Akkusativ — formal 'you' (always capitalized).", example: { de: "Ich frage Sie.", en: "I'm asking you (formal)." } },
    ] },

  // ===== Akkusativ articles =====
  "akk-einen": { id: "akk-einen", display: "einen", translation: "a / an (m)",   case: "akk", type: "article-indef", note: "Indefinite, masculine. The -en ending marks Akkusativ.", example: { de: "Ich habe einen Hund.", en: "I have a dog." } },
  "akk-den":   { id: "akk-den",   display: "den",   translation: "the (m)",      case: "akk", type: "article-def",   note: "Definite, masculine.", example: { de: "Ich sehe den Mann.", en: "I see the man." } },
  "akk-eine":  { id: "akk-eine",  display: "eine",  translation: "a / an (f)",   case: "akk", type: "article-indef", example: { de: "Ich habe eine Idee.", en: "I have an idea." } },
  "akk-die":   { id: "akk-die",   display: "die",   translation: "the (f)",      case: "akk", type: "article-def",   example: { de: "Ich kaufe die Blume.", en: "I'm buying the flower." } },
  "akk-ein":   { id: "akk-ein",   display: "ein",   translation: "a / an (n)",   case: "akk", type: "article-indef", example: { de: "Ich lese ein Buch.", en: "I'm reading a book." } },
  "akk-das":   { id: "akk-das",   display: "das",   translation: "the (n)",      case: "akk", type: "article-def",   example: { de: "Ich öffne das Fenster.", en: "I open the window." } },
  "akk-none":  { id: "akk-none",  display: "—",     translation: "(none — plural has no indefinite article)", case: "akk", type: "article-indef", note: "Plural has no indefinite article. For possessives, add -e (meine, deine, seine Hunde).", example: { de: "Ich habe Hunde.", en: "I have dogs." } },
  "akk-diePl": { id: "akk-diePl", display: "die",   translation: "the (plural)", case: "akk", type: "article-def",   example: { de: "Ich mag die Hunde.", en: "I like the dogs." } },

  // ===== Akkusativ prepositions =====
  "akk-prep-für":   { id: "akk-prep-für",   display: "für",   translation: "for",            case: "akk", type: "preposition", note: "Always takes Akkusativ.", example: { de: "Das ist für dich.", en: "That's for you." } },
  "akk-prep-gegen": { id: "akk-prep-gegen", display: "gegen", translation: "against",        case: "akk", type: "preposition", example: { de: "Wir spielen gegen sie.", en: "We're playing against them." } },
  "akk-prep-um":    { id: "akk-prep-um",    display: "um",    translation: "around / at (time)", case: "akk", type: "preposition", example: { de: "Es geht um mich.", en: "It's about me." } },
  "akk-prep-bis":   { id: "akk-prep-bis",   display: "bis",   translation: "until",          case: "akk", type: "preposition", note: "Often used with time/place expressions; rarely with personal pronouns.", example: { de: "Bis morgen!", en: "Until tomorrow!" } },
  "akk-prep-ohne":  { id: "akk-prep-ohne",  display: "ohne",  translation: "without",        case: "akk", type: "preposition", example: { de: "Ohne dich.", en: "Without you." } },
  "akk-prep-durch": { id: "akk-prep-durch", display: "durch", translation: "through",        case: "akk", type: "preposition", example: { de: "Durch den Park.", en: "Through the park." } },

  // ===== Nominativ pronouns + endings =====
  "nom-ich":   { id: "nom-ich",   display: "ich",        translation: "I",                  case: "nom", type: "pronoun", example: { de: "Ich bin müde.", en: "I'm tired." } },
  "nom-du":    { id: "nom-du",    display: "du",         translation: "you (informal)",     case: "nom", type: "pronoun", example: { de: "Du bist nett.", en: "You're nice." } },
  "nom-er":    { id: "nom-er",    display: "er • sie • es", translation: "he / she / it",     case: "nom", type: "pronoun", note: "3rd singular", example: { de: "Er kommt.", en: "He's coming." },
    subWords: [
      { token: "er",  gender: "m", translation: "he",  note: "Nominativ — masculine 3rd person singular.", example: { de: "Er kommt.", en: "He's coming." } },
      { token: "sie", gender: "f", translation: "she", note: "Nominativ — feminine 3rd person singular.",  example: { de: "Sie singt.", en: "She sings." } },
      { token: "es",  gender: "n", translation: "it",  note: "Nominativ — neuter 3rd person singular.",    example: { de: "Es regnet.", en: "It's raining." } },
    ] },
  "nom-wir":   { id: "nom-wir",   display: "wir",        translation: "we",                 case: "nom", type: "pronoun", example: { de: "Wir gehen.", en: "We're going." } },
  "nom-ihr":   { id: "nom-ihr",   display: "ihr",        translation: "you all",            case: "nom", type: "pronoun", example: { de: "Ihr seid hier.", en: "You all are here." } },
  "nom-sieSie":{ id: "nom-sieSie",display: "sie • Sie",  translation: "they / you (formal)",case: "nom", type: "pronoun", example: { de: "Sie sind nett.", en: "They are nice." },
    subWords: [
      { token: "sie", gender: "pl",     translation: "they",         note: "Nominativ — 3rd person plural.", example: { de: "Sie sind nett.", en: "They are nice." } },
      { token: "Sie", gender: "formal", translation: "you (formal)", note: "Nominativ — formal 'you' (always capitalized).", example: { de: "Sie sind sehr nett.", en: "You are very nice (formal)." } },
    ] },

  "nom-end-e":   { id: "nom-end-e",   display: "-e",   translation: "verb ending for ich",  case: "nom", type: "ending", example: { de: "ich mache", en: "I do" } },
  "nom-end-st":  { id: "nom-end-st",  display: "-st",  translation: "verb ending for du",   case: "nom", type: "ending", example: { de: "du machst", en: "you do" } },
  "nom-end-t":   { id: "nom-end-t",   display: "-t",   translation: "verb ending for er/sie/es and ihr", case: "nom", type: "ending", example: { de: "er macht / ihr macht", en: "he does / you all do" } },
  "nom-end-en":  { id: "nom-end-en",  display: "-en",  translation: "verb ending for wir and sie/Sie",   case: "nom", type: "ending", example: { de: "wir machen", en: "we do" } },
  "nom-end-t2":  { id: "nom-end-t2",  display: "-t",   translation: "verb ending for ihr",  case: "nom", type: "ending", example: { de: "ihr macht", en: "you all do" } },
  "nom-end-en2": { id: "nom-end-en2", display: "-en",  translation: "verb ending for sie/Sie", case: "nom", type: "ending", example: { de: "sie machen", en: "they do" } },

  // ===== Nominativ articles =====
  "nom-ein":   { id: "nom-ein",   display: "ein",  translation: "a (m)",   case: "nom", type: "article-indef", example: { de: "Ein Mann lacht.", en: "A man laughs." } },
  "nom-der":   { id: "nom-der",   display: "der",  translation: "the (m)", case: "nom", type: "article-def",   example: { de: "Der Mann lacht.", en: "The man laughs." } },
  "nom-eine":  { id: "nom-eine",  display: "eine", translation: "a (f)",   case: "nom", type: "article-indef", example: { de: "Eine Frau singt.", en: "A woman sings." } },
  "nom-die":   { id: "nom-die",   display: "die",  translation: "the (f)", case: "nom", type: "article-def",   example: { de: "Die Frau singt.", en: "The woman sings." } },
  "nom-ein2":  { id: "nom-ein2",  display: "ein",  translation: "a (n)",   case: "nom", type: "article-indef", example: { de: "Ein Kind spielt.", en: "A child plays." } },
  "nom-das":   { id: "nom-das",   display: "das",  translation: "the (n)", case: "nom", type: "article-def",   example: { de: "Das Kind spielt.", en: "The child plays." } },
  "nom-none":  { id: "nom-none",  display: "—",    translation: "(plural has no indefinite article)", case: "nom", type: "article-indef", note: "Plural has no indefinite article. For possessives, add -e (meine, deine, seine Hunde).", example: { de: "Kinder spielen.", en: "Children play." } },
  "nom-diePl": { id: "nom-diePl", display: "die",  translation: "the (pl)",case: "nom", type: "article-def",   example: { de: "Die Kinder spielen.", en: "The children play." } },

  // ===== Dativ pronouns =====
  "dat-mir":  { id: "dat-mir",  display: "mir",            translation: "to me",                case: "dat", type: "pronoun", example: { de: "Gib mir das Buch.", en: "Give me the book." } },
  "dat-dir":  { id: "dat-dir",  display: "dir",            translation: "to you (informal)",    case: "dat", type: "pronoun", example: { de: "Ich helfe dir.", en: "I'm helping you." } },
  "dat-ihm":  { id: "dat-ihm",  display: "ihm • ihr • ihm",translation: "to him / to her / to it", case: "dat", type: "pronoun", note: "3rd singular dative", example: { de: "Ich gebe ihm das Buch.", en: "I give him the book." },
    subWords: [
      { token: "ihm", gender: "m", translation: "to him", note: "Dativ — masculine 3rd person singular.", example: { de: "Ich gebe ihm das Buch.", en: "I give him the book." } },
      { token: "ihr", gender: "f", translation: "to her", note: "Dativ — feminine 3rd person singular.",  example: { de: "Ich gebe ihr Blumen.", en: "I give her flowers." } },
      { token: "ihm", gender: "n", translation: "to it",  note: "Dativ — neuter 3rd person singular (e.g. das Kind → ihm).", example: { de: "Ich gebe ihm Wasser.", en: "I give it water." } },
    ] },
  "dat-uns":  { id: "dat-uns",  display: "uns",            translation: "to us",                case: "dat", type: "pronoun", example: { de: "Sie hilft uns.", en: "She helps us." } },
  "dat-euch": { id: "dat-euch", display: "euch",           translation: "to you all",           case: "dat", type: "pronoun", example: { de: "Ich danke euch.", en: "I thank you all." } },
  "dat-ihnen":{ id: "dat-ihnen",display: "ihnen • Ihnen",  translation: "to them / to you (formal)", case: "dat", type: "pronoun", example: { de: "Ich antworte ihnen.", en: "I answer them." },
    subWords: [
      { token: "ihnen", gender: "pl",     translation: "to them",         note: "Dativ — 3rd person plural.", example: { de: "Ich antworte ihnen.", en: "I answer them." } },
      { token: "Ihnen", gender: "formal", translation: "to you (formal)", note: "Dativ — formal 'you' (always capitalized).", example: { de: "Ich danke Ihnen.", en: "I thank you (formal)." } },
    ] },

  // ===== Dativ articles =====
  "dat-einem":  { id: "dat-einem",  display: "einem", translation: "to a (m)",  case: "dat", type: "article-indef", note: "Indefinite, masculine — -em marks Dativ.", example: { de: "Ich gebe einem Mann das Buch.", en: "I give a man the book." } },
  "dat-dem":    { id: "dat-dem",    display: "dem",   translation: "to the (m)",case: "dat", type: "article-def", example: { de: "Ich helfe dem Mann.", en: "I help the man." } },
  "dat-einer":  { id: "dat-einer",  display: "einer", translation: "to a (f)",  case: "dat", type: "article-indef", example: { de: "Ich gebe einer Frau Blumen.", en: "I give a woman flowers." } },
  "dat-der":    { id: "dat-der",    display: "der",   translation: "to the (f)",case: "dat", type: "article-def", example: { de: "Ich danke der Frau.", en: "I thank the woman." } },
  "dat-einem2": { id: "dat-einem2", display: "einem", translation: "to a (n)",  case: "dat", type: "article-indef", example: { de: "Ich gebe einem Kind ein Buch.", en: "I give a child a book." } },
  "dat-dem2":   { id: "dat-dem2",   display: "dem",   translation: "to the (n)",case: "dat", type: "article-def", example: { de: "Ich helfe dem Kind.", en: "I help the child." } },
  "dat-noneN":  { id: "dat-noneN",  display: "—…n",   translation: "(no indef. plural; noun adds -n)", case: "dat", type: "article-indef", note: "Plural has no indefinite article. For possessives, add -en (meinen, deinen, seinen Kindern). The noun also takes -n in Dativ plural.", example: { de: "Ich gebe Kindern Bücher.", en: "I give children books." } },
  "dat-denN":   { id: "dat-denN",   display: "den…n", translation: "to the (pl)", case: "dat", type: "article-def",   note: "Plural nouns add -n in Dativ.", example: { de: "Ich helfe den Kindern.", en: "I help the children." } },

  // ===== Dativ prepositions =====
  "dat-prep-zu":        { id: "dat-prep-zu",        display: "zu",        translation: "to",            case: "dat", type: "preposition", example: { de: "Ich komme zu dir.", en: "I'm coming to you." } },
  "dat-prep-von":       { id: "dat-prep-von",       display: "von",       translation: "from / of",     case: "dat", type: "preposition", example: { de: "Ein Brief von mir.", en: "A letter from me." } },
  "dat-prep-mit":       { id: "dat-prep-mit",       display: "mit",       translation: "with",          case: "dat", type: "preposition", example: { de: "Komm mit uns!", en: "Come with us!" } },
  "dat-prep-bei":       { id: "dat-prep-bei",       display: "bei",       translation: "at / near",     case: "dat", type: "preposition", example: { de: "Ich bin bei dir.", en: "I'm at your place." } },
  "dat-prep-nach":      { id: "dat-prep-nach",      display: "nach",      translation: "after / to",    case: "dat", type: "preposition", example: { de: "Nach dir komme ich.", en: "I'll come after you." } },
  "dat-prep-seit":      { id: "dat-prep-seit",      display: "seit",      translation: "since / for",   case: "dat", type: "preposition", note: "Usually with time expressions, not pronouns.", example: { de: "Seit gestern.", en: "Since yesterday." } },
  "dat-prep-ab":        { id: "dat-prep-ab",        display: "ab",        translation: "from (time)",   case: "dat", type: "preposition", note: "Usually with time/place expressions, not pronouns.", example: { de: "Ab Montag arbeite ich.", en: "From Monday I'm working." } },
  "dat-prep-aus":       { id: "dat-prep-aus",       display: "aus",       translation: "out of / from", case: "dat", type: "preposition", example: { de: "Das kommt aus mir.", en: "That comes from me." } },
  "dat-prep-gegenüber": { id: "dat-prep-gegenüber", display: "gegenüber", translation: "opposite",      case: "dat", type: "preposition", example: { de: "Mir gegenüber sitzt sie.", en: "She sits opposite me." } },
  "dat-prep-außer":     { id: "dat-prep-außer",     display: "außer",     translation: "except",        case: "dat", type: "preposition", example: { de: "Außer mir kommt niemand.", en: "Nobody is coming except me." } },

  // ===== Two-way prepositions (Wechselpräpositionen) =====
  // Left set (under Akk)
  "twL-in":       { id: "twL-in",       display: "in",       translation: "in / into",        type: "preposition-2way", note: "Akk for movement, Dativ for location.", example: { de: "Ich gehe in den Park.", en: "I go into the park." } },
  "twL-auf":      { id: "twL-auf",      display: "auf",      translation: "on / onto",        type: "preposition-2way", example: { de: "Ich lege das Buch auf den Tisch.", en: "I put the book on the table." } },
  "twL-an":       { id: "twL-an",       display: "an",       translation: "at / on",          type: "preposition-2way", example: { de: "Ich hänge es an die Wand.", en: "I hang it on the wall." } },
  "twL-unter":    { id: "twL-unter",    display: "unter",    translation: "under",            type: "preposition-2way", example: { de: "Stell es unter den Tisch.", en: "Put it under the table." } },
  "twL-neben":    { id: "twL-neben",    display: "neben",    translation: "next to",          type: "preposition-2way", example: { de: "Stell es neben den Stuhl.", en: "Put it next to the chair." } },
  "twL-hinter":   { id: "twL-hinter",   display: "hinter",   translation: "behind",           type: "preposition-2way", example: { de: "Geh hinter das Haus.", en: "Go behind the house." } },
  "twL-unter2":   { id: "twL-unter2",   display: "unter",    translation: "under (repeated)", type: "preposition-2way", example: { de: "Leg es unter das Bett.", en: "Put it under the bed." } },
  "twL-über":     { id: "twL-über",     display: "über",     translation: "over / above",     type: "preposition-2way", example: { de: "Häng es über die Tür.", en: "Hang it over the door." } },
  "twL-vor":      { id: "twL-vor",      display: "vor",      translation: "in front of / before", type: "preposition-2way", example: { de: "Stell dich vor die Tür.", en: "Stand in front of the door." } },
  "twL-zwischen": { id: "twL-zwischen", display: "zwischen", translation: "between",          type: "preposition-2way", example: { de: "Stell es zwischen die Stühle.", en: "Put it between the chairs." } },
  // Right set (under Dat) — same words, separate ids for refs
  "twR-in":       { id: "twR-in",       display: "in",       translation: "in / into",        type: "preposition-2way", example: { de: "Ich bin in dem Park.", en: "I'm in the park." } },
  "twR-auf":      { id: "twR-auf",      display: "auf",      translation: "on / onto",        type: "preposition-2way", example: { de: "Das Buch liegt auf dem Tisch.", en: "The book is on the table." } },
  "twR-an":       { id: "twR-an",       display: "an",       translation: "at / on",          type: "preposition-2way", example: { de: "Es hängt an der Wand.", en: "It hangs on the wall." } },
  "twR-unter":    { id: "twR-unter",    display: "unter",    translation: "under",            type: "preposition-2way", example: { de: "Es liegt unter dem Tisch.", en: "It lies under the table." } },
  "twR-neben":    { id: "twR-neben",    display: "neben",    translation: "next to",          type: "preposition-2way", example: { de: "Es steht neben dem Stuhl.", en: "It stands next to the chair." } },
  "twR-hinter":   { id: "twR-hinter",   display: "hinter",   translation: "behind",           type: "preposition-2way", example: { de: "Es ist hinter dem Haus.", en: "It is behind the house." } },
  "twR-unter2":   { id: "twR-unter2",   display: "unter",    translation: "under (repeated)", type: "preposition-2way", example: { de: "Es ist unter dem Bett.", en: "It's under the bed." } },
  "twR-über":     { id: "twR-über",     display: "über",     translation: "over / above",     type: "preposition-2way", example: { de: "Es hängt über der Tür.", en: "It hangs over the door." } },
  "twR-vor":      { id: "twR-vor",      display: "vor",      translation: "in front of / before", type: "preposition-2way", example: { de: "Ich stehe vor der Tür.", en: "I'm standing in front of the door." } },
  "twR-zwischen": { id: "twR-zwischen", display: "zwischen", translation: "between",          type: "preposition-2way", example: { de: "Es steht zwischen den Stühlen.", en: "It's between the chairs." } },

  // ===== Possessives =====
  "pos-mein":  { id: "pos-mein",  display: "mein",            translation: "my",                  type: "possessive", example: { de: "Mein Hund ist nett.", en: "My dog is nice." } },
  "pos-dein":  { id: "pos-dein",  display: "dein",            translation: "your (informal)",     type: "possessive", example: { de: "Wo ist dein Buch?", en: "Where is your book?" } },
  "pos-sein":  { id: "pos-sein",  display: "sein • ihr • sein", translation: "his / her / its",   type: "possessive", example: { de: "Sein Auto ist neu.", en: "His car is new." },
    subWords: [
      { token: "sein", gender: "m", translation: "his", note: "Possessive stem when the owner is masculine.", example: { de: "Sein Auto ist neu.", en: "His car is new." } },
      { token: "ihr",  gender: "f", translation: "her", note: "Possessive stem when the owner is feminine.",  example: { de: "Ihr Auto ist neu.", en: "Her car is new." } },
      { token: "sein", gender: "n", translation: "its", note: "Possessive stem when the owner is neuter.",    example: { de: "Sein Dach ist rot.", en: "Its roof is red." } },
    ] },
  "pos-unser": { id: "pos-unser", display: "unser",           translation: "our",                 type: "possessive", example: { de: "Unser Haus ist groß.", en: "Our house is big." } },
  "pos-euer":  { id: "pos-euer",  display: "euer",            translation: "your (plural)",       type: "possessive", example: { de: "Euer Lehrer ist nett.", en: "Your teacher is nice." } },
  "pos-ihr":   { id: "pos-ihr",   display: "ihr • Ihr",       translation: "their / your (formal)", type: "possessive", example: { de: "Ihr Hund schläft.", en: "Their dog is sleeping." },
    subWords: [
      { token: "ihr", gender: "pl",     translation: "their",        note: "Possessive stem for a plural owner (sie = they).", example: { de: "Ihr Hund schläft.", en: "Their dog is sleeping." } },
      { token: "Ihr", gender: "formal", translation: "your (formal)", note: "Possessive stem for formal 'you' (always capitalized).", example: { de: "Ist das Ihr Auto?", en: "Is that your car (formal)?" } },
    ] },
  "pos-kein":  { id: "pos-kein",  display: "kein",            translation: "no / not a (negation)", type: "possessive", note: "Negates a noun. Takes the same case endings as ein- and the possessives.", example: { de: "Ich habe kein Auto.", en: "I have no car." } },

  // ===== Verb stamps =====
  "verb-lieben": {
    id: "verb-lieben", display: "lieben", translation: "to love",
    case: "akk", type: "verb",
    note: "Takes a direct object in Akkusativ — the thing/person being loved.",
    example: { de: "Ich liebe dich.", en: "I love you." },
  },
  "verb-geben": {
    id: "verb-geben", display: "geben", translation: "to give",
    case: "dat", type: "verb",
    note: "Takes a Dativ recipient (to whom) plus an Akkusativ direct object (what is given).",
    example: { de: "Ich gebe dir das Buch.", en: "I give you the book." },
  },
};

/** Resolve a possibly-composite id ("akk-ihn::1") to its parent word + sub-word index. */
export function resolveWord(id: string | null): { word: WordDatum | null; sub: SubWord | null; subIndex: number | null; parentId: string | null } {
  if (!id) return { word: null, sub: null, subIndex: null, parentId: null };
  if (id.includes("::")) {
    const [parent, idxStr] = id.split("::");
    const w = WORDS[parent];
    const i = Number(idxStr);
    return { word: w ?? null, sub: w?.subWords?.[i] ?? null, subIndex: i, parentId: parent };
  }
  return { word: WORDS[id] ?? null, sub: null, subIndex: null, parentId: id };
}

// ===== Gender map =====
// Marks each cell that carries grammatical gender meaning.
// "mixed" = the cell shows m/f/n forms together (e.g. "ihn • sie • es"),
// rendered with a multi-color border/badge.
export type Gender = "m" | "f" | "n" | "pl" | "mixed";

export const WORD_GENDER: Record<string, Gender> = {
  // Akk articles
  "akk-einen":"m","akk-den":"m","akk-eine":"f","akk-die":"f",
  "akk-ein":"n","akk-das":"n","akk-none":"pl","akk-diePl":"pl",
  // Akk pronouns
  "akk-ihn":"mixed", // ihn • sie • es
  "akk-sieSie":"pl",
  // Nom articles
  "nom-ein":"m","nom-der":"m","nom-eine":"f","nom-die":"f",
  "nom-ein2":"n","nom-das":"n","nom-none":"pl","nom-diePl":"pl",
  // Nom pronouns
  "nom-er":"mixed", // er • sie • es
  "nom-sieSie":"pl",
  // Nom endings (gendered with the pronoun row)
  "nom-end-t":"mixed",
  "nom-end-en2":"pl",
  // Dat articles
  "dat-einem":"m","dat-dem":"m","dat-einer":"f","dat-der":"f",
  "dat-einem2":"n","dat-dem2":"n","dat-noneN":"pl","dat-denN":"pl",
  // Dat pronouns
  "dat-ihm":"mixed", // ihm • ihr • ihm
  "dat-ihnen":"pl",
  // Possessives are stems — gender comes from the noun's ending, not shown here.
  "pos-sein":"mixed", // sein • ihr • sein (the row itself shows m/f/n)
};

// ===== Case-level info (for zoom level 1) =====
export const CASE_INFO: Record<CaseKey, {
  name: string;
  questions: string;
  english: string;
  role: string;
  rule: string;
  iconHint: string;
}> = {
  akk: {
    name: "Akkusativ",
    questions: "WEN? WOHIN?",
    english: "whom? / where to?",
    role: "Direct object",
    rule: "Use Akkusativ for the thing receiving the action — and after für, gegen, um, bis, ohne, durch.",
    iconHint: "🚲 The bicycle stands for direction & movement — wohin? where TO? Akkusativ goes places.",
  },
  nom: {
    name: "Nominativ",
    questions: "WER?",
    english: "who?",
    role: "Subject",
    rule: "Use Nominativ for the subject — the doer of the action. Verb endings agree with this pronoun.",
    iconHint: "👨‍🍳 The chef's hat is the one DOING the cooking — the subject, the actor.",
  },
  dat: {
    name: "Dativ",
    questions: "WEM? WO? WANN?",
    english: "to whom? where? when?",
    role: "Indirect object",
    rule: "Use Dativ for the recipient — and after zu, von, mit, bei, nach, seit, ab, aus, gegenüber, außer.",
    iconHint: "✉️ The envelope is mail you SEND TO someone — the recipient is in Dativ.",
  },
};
