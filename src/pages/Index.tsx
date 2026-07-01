// @ts-nocheck
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Poster, POSTER_W, POSTER_H, type PosterHandle } from "@/components/poster/Poster";
import { SpotlightOverlay } from "@/components/poster/SpotlightOverlay";
import { InfoSheet, type SheetSide } from "@/components/poster/InfoSheet";

import { WORDS, resolveWord, type CaseKey } from "@/components/poster/wordData";
import { GROUPS, WORD_GROUP, ARTICLE_ROW, ARTICLE_ROW_MEMBERS, isArticlePill, type GroupId } from "@/components/poster/groupData";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Home, Menu, Play, Compass, HelpCircle, BookOpen, Target, Brain, ChevronDown, Navigation } from "lucide-react";
import type { CaseColorMode } from "@/components/poster/colorizeSentence";
import { buildMorphMap, selectionRevealsPossessiveRow, POSSESSIVE_IDS, EIN_ARTICLES } from "@/components/poster/morph";
import { useQuiz } from "@/components/poster/quiz/useQuiz";
import { QuizPromptCard } from "@/components/poster/quiz/QuizPromptCard";
import { QuizExplainerCard } from "@/components/poster/quiz/QuizExplainerCard";
import { FlourishTuner } from "@/components/poster/quiz/FlourishTuner";
import { LoadFlickerTuner } from "@/components/poster/quiz/LoadFlickerTuner";
import { IntroTour, TOUR_STEPS } from "@/components/poster/IntroTour";
import { usePortraitMobile, useIsLandscapeMobile } from "@/hooks/usePortraitMobile";
import { MobilePosterSlider, MOBILE_SLIDER_BAR_H } from "@/components/poster/MobilePosterSlider";
import { VerbCloudOverlay } from "@/components/poster/VerbCloudOverlay";
import { WFragenGame, type WFragenHandle } from "@/components/poster/quiz/WFragenGame";
import { PrepTrainerGame } from "@/components/poster/quiz/PrepTrainerGame";
import { QuestionWordTuner } from "@/components/poster/QuestionWordTuner";
import { loadZones, type QWZoneConfig } from "@/components/poster/QuestionWordSVGMap";
import bicycleSvg from "@/assets/poster/bicycle.svg";
import chefHatSvg from "@/assets/poster/chef-hat.svg";
import envelopeSvg from "@/assets/poster/envelope.svg";
import { CaseHeaderPopup, type IconRect } from "@/components/poster/CaseHeaderPopup";
import { WelcomeModal } from "@/components/WelcomeModal";
import { CursorDemo } from "@/components/CursorDemo";
import { IntroStage } from "@/components/IntroStage";
import { StudentLobby, type StudentIdentity } from "@/components/livequiz/StudentLobby";
import { TeacherPanel } from "@/components/livequiz/TeacherPanel";
import { TeacherPreviewPanel } from "@/components/livequiz/TeacherPreviewPanel";
import { LiveStudentOverlay } from "@/components/livequiz/LiveStudentOverlay";
import { LiveQuizProvider } from "@/components/livequiz/LiveQuizProvider";
import { getLatestActiveSession, joinSession } from "@/lib/livequiz.functions";
import { useServerFn } from "@tanstack/react-start";
import { RotatePrompt } from "@/components/RotatePrompt";
import { StepRepeatBackground } from "@/components/StepRepeatBackground";

function getLiveMode(): "student" | "teacher" | "preview" | null {
  if (typeof window === "undefined") return null;
  const p = new URLSearchParams(window.location.search);
  if (p.has("livequizteacher")) return "teacher";
  if (p.has("livequizteacherpreview")) return "preview";
  if (p.has("livequiz")) return "student";
  return null;
}

type Level = 0 | 1 | 2 | 3 | 4;

/** Indef article ids in left→right (AKK→NOM→DAT), top→bottom within each column. */
const INDEF_ART_IDS_LTR = [
  "akk-einen", "akk-eine", "akk-ein", "akk-none",
  "nom-ein",   "nom-eine",  "nom-ein2",  "nom-none",
  "dat-einem", "dat-einer", "dat-einem2", "dat-noneN",
] as const;

const CASE_LABEL: Record<string, string> = { akk: "Akkusativ", nom: "Nominativ", dat: "Dativ" };
const TYPE_LABEL: Record<string, string> = {
  pronoun: "pronoun",
  "article-def": "definite article",
  "article-indef": "indefinite article",
  preposition: "preposition",
  "preposition-2way": "two-way preposition",
  ending: "verb ending",
  possessive: "possessive",
};
function getHoverInfo(rawId: string) {
  const resolved = resolveWord(rawId);
  if (!resolved) return null;
  const { word, sub } = resolved;
  const id = word.id;
  let caseKey = word.case as string | undefined;
  if (!caseKey) {
    if (id.startsWith("twL-")) caseKey = "akk";
    else if (id.startsWith("twR-")) caseKey = "dat";
  }
  return {
    caseLine: caseKey ? CASE_LABEL[caseKey] : null,
    typeLine: TYPE_LABEL[word.type] ?? word.type,
    translation: sub?.translation ?? word.translation,
  };
}

type GameMode = "explore" | "learn-articles" | "practice-articles" | "question-words" | "prep-trainer";

const GAME_OPTIONS: { value: GameMode; label: string; icon: React.ElementType; description: string }[] = [
  { value: "explore",          label: "Explore",           icon: Compass,  description: "Browse the cheatsheet freely" },
  { value: "learn-articles",   label: "Learn the Cheatsheet",    icon: BookOpen, description: "Guided walkthrough of cases, pronouns & articles" },
  { value: "practice-articles",label: "Practice Articles", icon: Target,   description: "Test your article knowledge" },
  { value: "question-words",    label: "Question Words",    icon: Brain,          description: "Master WER, WEN, WEM and more" },
  { value: "prep-trainer",      label: "Prep Trainer",      icon: Navigation,     description: "Find where each preposition lives" },
];

const Index = () => {
  const [liveMode] = useState(() => getLiveMode());
  const [studentIdentity, setStudentIdentity] = useState<StudentIdentity | null>(() => {
    if (typeof window === "undefined") return null;
    try {
      const raw = localStorage.getItem("livequiz_student");
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (parsed?.session_id && parsed?.student_id) return parsed;
    } catch {}
    return null;
  });
  // true when identity was restored from localStorage and needs verification + rejoin
  const [verifying, setVerifying] = useState(() => {
    if (getLiveMode() !== "student") return false;
    try {
      const raw = localStorage.getItem("livequiz_student");
      if (!raw) return false;
      const parsed = JSON.parse(raw);
      return !!(parsed?.session_id && parsed?.student_id);
    } catch {}
    return false;
  });

  const lookupFn = useServerFn(getLatestActiveSession);
  const joinFn   = useServerFn(joinSession);

  useEffect(() => {
    if (!verifying || !studentIdentity) { setVerifying(false); return; }
    let cancelled = false;
    async function verify() {
      try {
        const latest = await lookupFn({});
        if (cancelled) return;
        if (!latest || latest.id !== studentIdentity.session_id) {
          // Session is stale or a new one started — drop back to lobby
          try { localStorage.removeItem("livequiz_student"); } catch {}
          setStudentIdentity(null);
        } else {
          // Re-register so the student appears in the teacher's joined count
          await joinFn({ data: {
            sessionId: studentIdentity.session_id,
            studentId: studentIdentity.student_id,
            studentName: studentIdentity.student_name,
            studentAvatar: studentIdentity.student_avatar,
          }});
        }
      } catch {}
      if (!cancelled) setVerifying(false);
    }
    verify();
    return () => { cancelled = true; };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (liveMode === "student" && verifying) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-poster-bg">
        <div className="text-poster-ink/40 text-sm font-medium">Rejoining…</div>
      </div>
    );
  }

  if (liveMode === "student" && !studentIdentity) {
    return <StudentLobby onJoined={setStudentIdentity} />;
  }

  return <Cheatsheet
    liveTeacher={liveMode === "teacher"}
    liveTeacherPreview={liveMode === "preview"}
    liveStudent={liveMode === "student" ? studentIdentity : null}
    onLiveLeave={liveMode === "student" ? () => {
      try { localStorage.removeItem("livequiz_student"); } catch {}
      setStudentIdentity(null);
    } : undefined}
  />;

};

const Cheatsheet = ({ liveTeacher, liveTeacherPreview, liveStudent, onLiveLeave }: {
  liveTeacher: boolean;
  liveTeacherPreview?: boolean;
  liveStudent?: StudentIdentity | null;
  onLiveLeave?: () => void;
}) => {
  const [genderOn, setGenderOn] = useState(false);
  const [caseColorOn, setCaseColorOn] = useState(true);
  const [caseColorMode, setCaseColorMode] = useState<CaseColorMode>("tokens");
  const [zoom, setZoom] = useState(1);
  const [level, setLevel] = useState<Level>(0);
  const [activeCase, setActiveCase] = useState<CaseKey | null>(null);
  const [activeGroup, setActiveGroup] = useState<GroupId | null>(null);
  const [activeArticleRow, setActiveArticleRow] = useState<GroupId | null>(null);
  const [activeWordId, setActiveWordId] = useState<string | null>(null);
  const [cutout, setCutout] = useState<{ left: number; top: number; width: number; height: number } | null>(null);
  const [endingCuts, setEndingCuts] = useState<{ left: number; top: number; width: number; height: number }[]>([]);
  const [sheetSide, setSheetSide] = useState<SheetSide>("bottom");
  const [anchorRect, setAnchorRect] = useState<DOMRect | null>(null);
  /** When set, the active possessive is shown in morph context (case/color from this trigger ein-article). */
  const [morphContextId, setMorphContextId] = useState<string | null>(null);
  const [pinnedPossId, setPinnedPossId] = useState<string | null>(null);
  const [quizIncludeNom, setQuizIncludeNom] = useState(false);
  const [quizMode, setQuizMode] = useState<"practice" | "learn">("practice");
  const quiz = useQuiz();
  /** Intro tour state. */
  const [tourActive, setTourActive] = useState(false);
  const [tourStep, setTourStep] = useState(0);
  /** Portrait mobile slider state. */
  const isPortraitMobile = usePortraitMobile();
  const isLandscapeMobile = useIsLandscapeMobile();
  const quizFillMode = !!liveStudent && isLandscapeMobile;
  const [infoLayout, setInfoLayout] = useState(1);
  /** True once the zoom-in animation completes; gates InfoSheet visibility on mobile. */
  const [mobileInfoVisible, setMobileInfoVisible] = useState(false);
  const [verbCloudOpen, setVerbCloudOpen] = useState(false);
  const [gameMode, setGameMode] = useState<GameMode>("explore");
  const wFragenRef = useRef<WFragenHandle>(null);
  const [qwZones, setQwZones] = useState<QWZoneConfig>(loadZones);
  const [qwSelectedWord, setQwSelectedWord] = useState<string | null>(null);
  const [qwCorrectWord, setQwCorrectWord]   = useState<string | null>(null);
  const [qwWrongWord, setQwWrongWord]       = useState<string | null>(null);
  // Tuner disabled for now — zone coordinates have been baked into DEFAULT_ZONES.
  const [showQwTuner, setShowQwTuner] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);
  const [showCursorDemo, setShowCursorDemo] = useState(false);
  const [showIntroStage, setShowIntroStage] = useState(false);
  const [introNomOnly, setIntroNomOnly] = useState(false);
  const [learnLockedGroup, setLearnLockedGroup] = useState<string | null>(null);
  const [learnLockedRow, setLearnLockedRow] = useState<string | null>(null);
  const learnDimConfig = useMemo(() => {
    if (!quiz.active || quiz.mode !== "learn" || quiz.phase !== "prompt" || !quiz.question) return null;
    return { step: quiz.learnStep, case: quiz.question.prep.case, group: learnLockedGroup, row: learnLockedRow, correctPillId: quiz.learnStep >= 4 ? quiz.question.correctPillId : null };
  }, [quiz.active, quiz.mode, quiz.phase, quiz.question, quiz.learnStep, learnLockedGroup, learnLockedRow]);

  function triggerFlash(result: "correct" | "wrong", pillId: string) {
    posterRef.current?.rippleFrom(pillId, result);
  }

  function handleGameMode(mode: GameMode) {
    setGameMode(mode);
    if (mode === "explore") { if (quiz.active) quiz.exit(); goOverview(); }
    else if (mode === "learn-articles") { setQuizMode("learn"); goOverview(); quiz.start({ includeNom: quizIncludeNom, mode: "learn" }); }
    else if (mode === "practice-articles") { setQuizMode("practice"); goOverview(); quiz.start({ includeNom: quizIncludeNom, mode: "practice" }); }
    else if (mode === "question-words") { if (quiz.active) quiz.exit(); }
  }

  // Mutual exclusion: reset solo games when live quiz is active
  useEffect(() => {
    if (liveTeacher || liveTeacherPreview || !!liveStudent) {
      setGameMode("explore");
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const [casePopup, setCasePopup] = useState<{ caseKey: CaseKey; iconRect: IconRect } | null>(null);
  const CASE_ICONS: Record<CaseKey, string> = { akk: bicycleSvg, nom: chefHatSvg, dat: envelopeSvg };
  type Rect = { left: number; top: number; width: number; height: number };
  const [tourCutouts, setTourCutouts] = useState<Rect[]>([]);
  const [hoverTooltip, setHoverTooltip] = useState<{ id: string; x: number; y: number } | null>(null);
  const [peekTooltip, setPeekTooltip] = useState<{ id: string; x: number; y: number } | null>(null);

  /** Map of ein-article id → its grammatical case (used for morph context). */
  const EIN_CASE: Record<string, CaseKey> = {
    "nom-ein": "nom", "nom-eine": "nom", "nom-ein2": "nom", "nom-none": "nom",
    "akk-einen": "akk", "akk-eine": "akk", "akk-ein": "akk", "akk-none": "akk",
    "dat-einem": "dat", "dat-einer": "dat", "dat-einem2": "dat", "dat-noneN": "dat",
  };
  const einIds = useMemo(() => new Set(EIN_ARTICLES.map((a) => a.id)), []);

  const posterRef = useRef<PosterHandle>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const liveQuizSubmit = useRef<((pillId: string) => void) | null>(null);

  /** Flourish state: bumped each time we want a re-cascade. */
  const [flourishEpoch, setFlourishEpoch] = useState(0);
  const [flourishIds, setFlourishIds] = useState<string[]>([]);
  const flourish = useMemo(() => ({
    epoch: flourishEpoch,
    indices: new Map(flourishIds.map((id, i) => [id, i] as const)),
  }), [flourishEpoch, flourishIds]);

  /** Decide sheet side based on click position relative to viewport. */
  const sideForPoint = useCallback((clientX: number, clientY: number): SheetSide => {
    const isPortrait = window.innerHeight >= window.innerWidth;
    if (isPortrait) return "bottom";
    return clientX < window.innerWidth / 2 ? "right" : "left";
  }, []);

  const measureEndingCuts = useCallback(() => {
    const root = posterRef.current?.getRoot();
    if (!root) return [];
    const rRoot = root.getBoundingClientRect();
    const s = rRoot.width / POSTER_W || 1;
    const els = root.querySelectorAll<HTMLElement>("[data-poster-ending]");
    const cuts: { left: number; top: number; width: number; height: number }[] = [];
    els.forEach((el) => {
      const r = el.getBoundingClientRect();
      cuts.push({
        left: (r.left - rRoot.left) / s,
        top: (r.top - rRoot.top) / s,
        width: r.width / s,
        height: r.height / s,
      });
    });
    return cuts;
  }, []);

  const goOverview = useCallback(() => {
    setLevel(0); setActiveCase(null); setActiveGroup(null); setActiveArticleRow(null); setActiveWordId(null); setCutout(null);
    setMorphContextId(null); setPinnedPossId(null);
  }, []);

  const goSection = useCallback((c: CaseKey) => {
    const rect = posterRef.current?.getRect(`zone-${c}`) ?? null;
    setLevel(1); setActiveCase(c); setActiveGroup(null); setActiveArticleRow(null); setActiveWordId(null);
    setMorphContextId(null);
    if (rect) setCutout(rect);
  }, []);

  const goGroup = useCallback((g: GroupId) => {
    const info = GROUPS[g];
    const rect = posterRef.current?.getRect(g) ?? null;
    setLevel(2); setActiveGroup(g); setActiveArticleRow(null); setActiveWordId(null);
    setMorphContextId(null);
    if (info.case) setActiveCase(info.case);
    if (rect) setCutout(rect);
  }, []);

  /** Article sub-row drill (between Block and Pill). */
  const goArticleRow = useCallback((rowId: GroupId) => {
    const m = /^(nom|akk|dat)-art-row-/.exec(rowId);
    if (!m) return;
    const c = m[1] as CaseKey;
    const blockGroup = `g-${c}-art` as GroupId;
    const rect = posterRef.current?.getRect(rowId) ?? null;
    setLevel(2);
    setActiveCase(c);
    setActiveGroup(blockGroup);
    setActiveArticleRow(rowId);
    setActiveWordId(null);
    setMorphContextId(null);
    if (rect) setCutout(rect);
  }, []);

  const handleLearnOverlayCaseTap = useCallback((c: CaseKey): "correct" | "wrong" => {
    const out = quiz.checkLearnTap({ kind: "case", caseKey: c });
    if (out.result === "advance" && out.navigate?.kind === "section") goSection(out.navigate.caseKey);
    return out.result === "wrong" ? "wrong" : "correct";
  }, [quiz, goSection]);

  const handleLearnOverlayGroupTap = useCallback((groupType: "pronouns" | "articles"): "correct" | "wrong" => {
    const out = quiz.checkLearnTap({ kind: "group", groupType });
    if (out.result === "advance") {
      if (out.navigate?.kind === "group") { setLearnLockedGroup(out.navigate.groupId); goGroup(out.navigate.groupId as GroupId); }
      else if (out.navigate?.kind === "articleRow") { setLearnLockedRow(out.navigate.rowId); goArticleRow(out.navigate.rowId as GroupId); }
    }
    return out.result === "wrong" ? "wrong" : "correct";
  }, [quiz, goGroup, goArticleRow]);

  const handleLearnOverlayColumnTap = useCallback((columnType: "defArticles" | "indefArticles"): "correct" | "wrong" => {
    const out = quiz.checkLearnTap({ kind: "column", columnType });
    if (out.result === "advance" && out.navigate?.kind === "articleRow") {
      setLearnLockedRow(out.navigate.rowId);
      goArticleRow(out.navigate.rowId as GroupId);
    }
    return out.result === "wrong" ? "wrong" : "correct";
  }, [quiz, goArticleRow]);

  const learnOverlayConfig = useMemo(() => {
    if (!quiz.active || quiz.mode !== "learn" || quiz.phase !== "prompt" || !quiz.question || isPortraitMobile) return null;
    if (quiz.learnStep !== 1 && quiz.learnStep !== 2 && quiz.learnStep !== 3) return null;
    return {
      step: quiz.learnStep as 1 | 2 | 3,
      case: quiz.question.prep.case,
      transparent: quiz.learnIndex >= 3,
      onCaseTap: handleLearnOverlayCaseTap,
      onGroupTap: handleLearnOverlayGroupTap,
      onColumnTap: handleLearnOverlayColumnTap,
    };
  }, [quiz.active, quiz.mode, quiz.phase, quiz.question, quiz.learnStep, quiz.learnIndex, isPortraitMobile, handleLearnOverlayCaseTap, handleLearnOverlayGroupTap, handleLearnOverlayColumnTap]);

  const goWord = useCallback((id: string) => {
    const w = WORDS[id]; if (!w) return;
    const groupId = WORD_GROUP[id];
    const isNomRow = groupId?.startsWith("nom-row-");
    const spotlightId = isNomRow ? groupId! : id;
    const rect = posterRef.current?.getRect(spotlightId) ?? null;
    const c = w.case ?? (groupId ? GROUPS[groupId].case : null) ?? activeCase;
    if (c && c !== activeCase) setActiveCase(c);
    setActiveGroup(groupId ?? null);
    setLevel(3);
    setActiveWordId(id);
    if (rect) setCutout(rect);
  }, [activeCase]);

  const goSubWord = useCallback((subId: string) => {
    const { word, sub, parentId } = resolveWord(subId);
    if (!word || !sub || !parentId) return;
    const groupId = WORD_GROUP[parentId];
    const c = word.case ?? (groupId ? GROUPS[groupId].case : null) ?? activeCase;
    if (c && c !== activeCase) setActiveCase(c);
    setActiveGroup(groupId ?? null);
    setLevel(4);
    setActiveWordId(subId);
    const rect = posterRef.current?.getRect(subId) ?? null;
    if (rect) setCutout(rect);
  }, [activeCase]);

  const handleTapCase = (_c: CaseKey) => {
    // Drill levels disabled.
  };

  const handleTapWord = (id: string, _e?: React.MouseEvent) => {
    // In live quiz student mode, pill taps are for answering only — no popups.
    if (liveStudent) return;
    const root = id.includes("::") ? id.split("::")[0] : id;
    const isEin = einIds.has(root);
    const isPoss = root.startsWith("pos-");

    // ── Possessive tap — always pins (radio-style) ────────────────────────
    if (isPoss) {
      if (pinnedPossId === root) {
        // Re-tap same → unpin; if an ein-article was the context, revert to it
        setPinnedPossId(null);
        if (morphContextId) {
          setActiveWordId(morphContextId);
          setLevel(3);
          const einGroupId = WORD_GROUP[morphContextId];
          if (einGroupId) setActiveGroup(einGroupId as GroupId);
          setMorphContextId(null);
        } else {
          setActiveWordId(null); setLevel(0); setActiveCase(null);
          setActiveGroup(null);
        }
      } else {
        // Pin this possessive; if an ein-article was active use it as morph context
        const prevEin = activeWordId !== null && einIds.has(activeWordId) ? activeWordId : null;
        setPinnedPossId(root);
        setActiveWordId(root);
        setLevel(3);
        const groupId = WORD_GROUP[root];
        if (groupId) setActiveGroup(groupId as GroupId);
        if (prevEin) setMorphContextId(prevEin);
        else if (!pinnedPossId) setMorphContextId(null); // fresh pin, no prior context
        // switching possessives keeps existing morphContextId
      }
      return;
    }

    // ── Ein-article tap while a possessive is pinned ──────────────────────
    if (isEin && pinnedPossId) {
      if (morphContextId === root) {
        setMorphContextId(null); // toggle off same ein-article
      } else {
        setMorphContextId(root);
        const einCase = EIN_CASE[root];
        if (einCase) setActiveCase(einCase as CaseKey);
      }
      setActiveWordId(pinnedPossId); // keep pin focused in InfoSheet
      setLevel(3);
      return;
    }

    // ── Default: clears any pin, then normal toggle/select ────────────────
    if (activeWordId === root) {
      setPinnedPossId(null);
      setActiveWordId(null); setLevel(0); setActiveCase(null);
      setActiveGroup(null); setMorphContextId(null);
    } else {
      setPinnedPossId(null);
      setMorphContextId(null);
      setActiveWordId(root);
      setLevel(3);
      const groupId = WORD_GROUP[root];
      const c = (groupId ? GROUPS[groupId]?.case : null) ?? null;
      if (c) setActiveCase(c as CaseKey);
      if (groupId) setActiveGroup(groupId as GroupId);
      const rect = posterRef.current?.getRect(root) ?? null;
      if (rect) setCutout(rect);
    }
  };


  const goBackLevel = useCallback(() => {
    if (level === 4 && activeWordId) {
      const { parentId } = resolveWord(activeWordId);
      if (parentId) { goWord(parentId); return; }
    }
    if (level === 3) {
      if (activeArticleRow) {
        const rect = posterRef.current?.getRect(activeArticleRow) ?? null;
        setLevel(2); setActiveWordId(null);
        if (rect) setCutout(rect);
        return;
      }
      if (activeGroup) { goGroup(activeGroup); return; }
      if (activeCase)  { goSection(activeCase); return; }
    }
    if (level === 2 && activeArticleRow) {
      setActiveArticleRow(null);
      const rect = activeGroup ? posterRef.current?.getRect(activeGroup) ?? null : null;
      if (rect) setCutout(rect);
      return;
    }
    if (level === 2 && activeCase) { goSection(activeCase); return; }
    goOverview();
  }, [activeArticleRow, activeCase, activeGroup, activeWordId, goGroup, goOverview, goSection, goWord, level]);

  const didPanRef = useRef(false);
  const handleTapBackground = () => {
    if (didPanRef.current) { didPanRef.current = false; return; }
    goOverview();
  };

  /** Quiz-aware case tap — shared by landscape Poster and portrait carousel. */
  const handlePosterTapCase = (c: CaseKey) => {
    if (quiz.active && quiz.mode === "learn") {
      const out = quiz.checkLearnTap({ kind: "case", caseKey: c });
      if (out.result === "advance" && out.navigate?.kind === "section") goSection(out.navigate.caseKey);
      return;
    }
    handleTapCase(c);
  };

  function handleTapQuestionWord(word: string) {
    setQwSelectedWord(word);
    setQwCorrectWord(null);
    setQwWrongWord(null);
    wFragenRef.current?.onWordTap(word);
    // brief highlight then clear — feedback comes back via the game card
    setTimeout(() => setQwSelectedWord(null), 800);
  }

  /** Quiz-aware word tap — shared by landscape Poster and portrait carousel. */
  const handlePosterTapWord = (id: string) => {
    if (liveQuizSubmit.current) {
      liveQuizSubmit.current(id);
      return;
    }
    if (gameMode === "question-words") {
      wFragenRef.current?.onPillTap(id);
      return;
    }
    if (quiz.active) {
      if (quiz.mode === "learn") {
        const out = quiz.checkLearnTap({ kind: "word", id });
        if (out.result === "advance" || out.result === "final") {
          posterRef.current?.rippleFrom(id, "correct");
          if (out.result === "advance") {
            if (out.navigate?.kind === "group") setLearnLockedGroup(out.navigate.groupId);
            if (out.navigate?.kind === "articleRow") setLearnLockedRow(out.navigate.rowId);
          }
        } else if (out.result === "wrong") {
          posterRef.current?.rippleFrom(id, "wrong");
        }
        if (out.result === "advance" && out.navigate) {
          if (out.navigate.kind === "section") goSection(out.navigate.caseKey);
          else if (out.navigate.kind === "group") goGroup(out.navigate.groupId as GroupId);
          else if (out.navigate.kind === "articleRow") goArticleRow(out.navigate.rowId as GroupId);
        }
        return;
      }
      const result = quiz.checkAnswer(id);
      if (result) posterRef.current?.rippleFrom(id, result);
      return;
    }
    handleTapWord(id);
  };

  /** Re-trigger flourish when active selection morph state changes. */
  const prevActiveRef = useRef<string | null>(null);
  useEffect(() => {
    const prev = prevActiveRef.current;
    const curr = activeWordId;
    prevActiveRef.current = curr;
    const wasEin = prev !== null && einIds.has(prev);
    const isEin  = curr !== null && einIds.has(curr);
    if (wasEin || isEin) {
      setFlourishIds([...POSSESSIVE_IDS]);
      setFlourishEpoch((n) => n + 1);
      // Link-burst on possessives (inset ring) after React commits the remounted buttons.
      // 6 possessives, ~800ms total wave → 160ms stagger per pill.
      const t = setTimeout(() => {
        posterRef.current?.fireLinkBurst(POSSESSIVE_IDS, 160);
      }, 0);
      return () => clearTimeout(t);
    }
  }, [activeWordId]);

  /** When a possessive is pinned, burst all indef articles left→right.
   *  12 pills, ~800ms total wave → 70ms stagger per pill. */
  useEffect(() => {
    if (!pinnedPossId) return;
    posterRef.current?.fireLinkBurst(INDEF_ART_IDS_LTR, 70);
  }, [pinnedPossId]);

  /** Hide mobile info box whenever we return to overview. */
  useEffect(() => {
    if (isPortraitMobile && level === 0) setMobileInfoVisible(false);
  }, [level, isPortraitMobile]);

  /** Reset poster spotlight and learn dim on every new learn-mode question. */
  useEffect(() => {
    if (quiz.active && quiz.mode === "learn") goOverview();
    setLearnLockedGroup(null);
    setLearnLockedRow(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quiz.questionEpoch]);

  /** Reset poster spotlight when learn mode completes. */
  useEffect(() => {
    if (quiz.phase === "learnComplete") goOverview();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quiz.phase]);

  /** Hold the correct pill green during the explainer phase. */
  useEffect(() => {
    if (quiz.mode !== "learn" || !quiz.question) return;
    const id = quiz.question.correctPillId;
    const el = document.querySelector<HTMLElement>(`[data-cell-id="${CSS.escape(id)}"]`);
    if (!el) return;
    if (quiz.phase === "explainer") {
      el.classList.add("pill-correct-pulse");
    } else {
      el.classList.remove("pill-correct-pulse");
    }
    return () => { el.classList.remove("pill-correct-pulse"); };
  }, [quiz.phase, quiz.question, quiz.mode]);

  /** Re-measure cutout after layout shifts. */
  useEffect(() => {
    if (level === 0) return;
    let id: string | null = null;
    if (level === 1 && activeCase) id = `zone-${activeCase}`;
    else if (level === 2 && activeArticleRow) id = activeArticleRow;
    else if (level === 2 && activeGroup) id = activeGroup;
    else if ((level === 3 || level === 4) && activeWordId) {
      if (activeWordId.includes("::")) id = activeWordId;
      else { const g = WORD_GROUP[activeWordId]; id = g?.startsWith("nom-row-") ? g : activeWordId; }
    }
    if (!id) return;
    const handle = () => {
      const rect = posterRef.current?.getRect(id!);
      if (rect) setCutout(rect);
    };
    window.addEventListener("resize", handle);
    return () => window.removeEventListener("resize", handle);
  }, [level, activeCase, activeGroup, activeWordId]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") goBackLevel(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [goBackLevel]);

  /** On every load: run intro tour (auto-starts quiz on tour end). */
  // DISABLED: useEffect(() => {
  //   const t = setTimeout(() => setTourActive(true), 2600);
  //   return () => clearTimeout(t);
  // }, []);

  /** Recompute tour spotlights on step change / resize. */
  useEffect(() => {
    if (!tourActive) { setTourCutouts([]); return; }
    const apply = () => {
      const tids = TOUR_STEPS[tourStep]?.targetIds ?? [];
      const rects: Rect[] = [];
      for (const tid of tids) {
        const r = posterRef.current?.getRect(tid);
        if (r) rects.push({ left: r.left, top: r.top, width: r.width, height: r.height });
      }
      setTourCutouts(rects);
    };
    apply();
    const t = setTimeout(apply, 80);
    window.addEventListener("resize", apply);
    return () => { clearTimeout(t); window.removeEventListener("resize", apply); };
  }, [tourActive, tourStep]);

  /** Side-effects per tour step (e.g. simulate clicking nom-ein to morph possessives). */
  useEffect(() => {
    if (!tourActive) return;
    const stp = TOUR_STEPS[tourStep];
    const triggerId =
      stp?.onEnterId === "activate-nom-ein" ? "nom-ein" :
      stp?.onEnterId === "activate-dat-einem" ? "dat-einem" : null;
    if (triggerId) {
      const triggerCase: CaseKey = triggerId.startsWith("dat") ? "dat" : "nom";
      setActiveCase(triggerCase);
      setActiveGroup("g-pos");
      setActiveArticleRow(null);
      setActiveWordId(triggerId);
      setLevel(3);
      const rect = posterRef.current?.getRect(triggerId);
      if (rect) setCutout(rect);
    } else {
      if (activeWordId === "nom-ein" || activeWordId === "dat-einem") goOverview();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tourActive, tourStep]);

  /** Compute viewport rect for the current tour step's primary target. */
  const getTourTargetViewportRect = useCallback((): DOMRect | null => {
    const tids = TOUR_STEPS[tourStep]?.targetIds ?? [];
    if (tids.length === 0) return null;
    const root = posterRef.current?.getRoot();
    if (!root) return null;
    // Union of all DOM rects.
    let l = Infinity, t = Infinity, r = -Infinity, b = -Infinity;
    let any = false;
    for (const id of tids) {
      let els: HTMLElement[] = [];
      if (id.startsWith("zone-")) {
        const e = root.querySelector(`[data-zone="${id}"]`) as HTMLElement | null;
        if (e) els = [e];
      } else if (id.startsWith("g-") || id.startsWith("nom-row-")) {
        const e = root.querySelector(`[data-group="${id}"]`) as HTMLElement | null;
        if (e) els = [e];
      } else if (ARTICLE_ROW_MEMBERS[id]) {
        for (const mid of ARTICLE_ROW_MEMBERS[id]) {
          const e = document.querySelector(`[data-cell-id="${mid}"]`) as HTMLElement | null;
          if (e) els.push(e);
        }
      } else {
        const e = document.querySelector(`[data-cell-id="${id}"]`) as HTMLElement | null;
        if (e) els = [e];
      }
      for (const el of els) {
        const rect = el.getBoundingClientRect();
        any = true;
        l = Math.min(l, rect.left); t = Math.min(t, rect.top);
        r = Math.max(r, rect.right); b = Math.max(b, rect.bottom);
      }
    }
    if (!any) return null;
    return new DOMRect(l, t, r - l, b - t);
  }, [tourStep]);


  const endTour = useCallback(() => {
    setTourActive(false);
    setTourCutouts([]);
    goOverview();
    try { localStorage.setItem("introTourSeen", "1"); } catch { /* noop */ }
    // Auto-start quiz when tour ends.
    if (!quiz.active) {
      let m: "learn" | "practice" = "practice";
      try { if (!localStorage.getItem("learnModeSeen")) m = "learn"; } catch { /* noop */ }
      setQuizMode(m);
      quiz.start({ includeNom: quizIncludeNom, mode: m });
    }
  }, [quiz, quizIncludeNom, goOverview]);

  const restartTour = useCallback(() => {
    if (quiz.active) quiz.exit();
    setTourStep(0);
    setTourActive(true);
  }, [quiz]);


  // Hold the welcome modal off-screen until the poster's load-in pill flicker
  // (Poster.tsx — 2500ms) finishes, so it doesn't cover the animation.
  useEffect(() => {
    const t = setTimeout(() => setShowWelcome(true), 2500);
    return () => clearTimeout(t);
  }, []);

  function closeWelcome() {
    setShowWelcome(false);
    try { localStorage.setItem("welcomeSeen", "1"); } catch { /* noop */ }
  }

  function dismissWelcome(andTour = false) {
    closeWelcome();
    if (andTour) { setShowIntroStage(true); return; }
    setShowCursorDemo(true);
  }


  useEffect(() => {
    const on = activeGroup === "g-pos" || (activeWordId?.startsWith("pos-") ?? false);
    if (!on) { setEndingCuts([]); return; }
    const apply = () => setEndingCuts(measureEndingCuts());
    apply();
    const t = setTimeout(apply, 520);
    window.addEventListener("resize", apply);
    return () => { clearTimeout(t); window.removeEventListener("resize", apply); };
  }, [activeGroup, activeWordId, level, measureEndingCuts]);

  /** Compute fit-to-stage scale. */
  const [fitScale, setFitScale] = useState(1);
  useEffect(() => {
    const fit = () => {
      const stage = stageRef.current?.getBoundingClientRect();
      if (!stage) return;
      const margin = quizFillMode ? 4 : 16;
      const fitW = quizFillMode ? POSTER_W - 56 : POSTER_W;
      const fitH = POSTER_H;
      // quizFill: fit both dimensions so all pills stay on screen without panning
      const s = quizFillMode
        ? Math.min(1, (stage.width - margin * 2) / fitW, (stage.height - margin * 2) / (POSTER_H - 120))
        : Math.min(1, (stage.width - margin * 2) / fitW, (stage.height - margin * 2) / fitH);
      setFitScale(s);
    };
    fit();
    window.addEventListener("resize", fit);
    return () => window.removeEventListener("resize", fit);
  }, [quizFillMode]);

  /** Always-on pan offset (px, in stage coords). */
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const panState = useRef<{ active: boolean; startX: number; startY: number; baseX: number; baseY: number; pointers: Map<number, { x: number; y: number }>; pinchDist: number; pinchZoom: number; moved: boolean }>({
    active: false, startX: 0, startY: 0, baseX: 0, baseY: 0, pointers: new Map(), pinchDist: 0, pinchZoom: 1, moved: false,
  });

  const onStagePointerDown = (e: React.PointerEvent) => {
    // Allow drag-to-pan from anywhere — pills, groups, headers. If the pointer
    // moves past the threshold the resulting click is swallowed by onClickCapture.
    panState.current.pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    panState.current.moved = false;
    if (panState.current.pointers.size === 1) {
      // Always start a single-finger pan on touch — even from pills. If the finger
      // moves past the threshold we'll capture and swallow the pill click.
      panState.current.active = true;
      panState.current.startX = e.clientX;
      panState.current.startY = e.clientY;
      panState.current.baseX = pan.x;
      panState.current.baseY = pan.y;
    } else if (panState.current.pointers.size === 2) {
      panState.current.active = false;
      const pts = Array.from(panState.current.pointers.values());
      panState.current.pinchDist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
      panState.current.pinchZoom = zoom;
    }
  };


  const onStagePointerMove = (e: React.PointerEvent) => {
    if (!panState.current.pointers.has(e.pointerId)) return;
    panState.current.pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (panState.current.pointers.size === 2) {
      const pts = Array.from(panState.current.pointers.values());
      const d = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
      if (panState.current.pinchDist > 0) {
        const next = Math.max(0.5, Math.min(3, panState.current.pinchZoom * (d / panState.current.pinchDist)));
        setZoom(next);
        panState.current.moved = true;
      }
      return;
    }
    if (!panState.current.active) return;
    const dx = e.clientX - panState.current.startX;
    const dy = e.clientY - panState.current.startY;
    if (Math.hypot(dx, dy) > 8) panState.current.moved = true;
    setPan({ x: panState.current.baseX + dx, y: panState.current.baseY + dy });
  };

  const onStagePointerUp = (e: React.PointerEvent) => {
    panState.current.pointers.delete(e.pointerId);
    if (panState.current.pointers.size === 0) {
      panState.current.active = false;
      if (panState.current.moved) {
        didPanRef.current = true;
      } else if (liveQuizSubmit.current) {
        // Fire live-quiz answer on pointerUp (before synthetic click) for zero perceived delay
        const el = (e.target as HTMLElement).closest("[data-cell-id]") as HTMLElement | null;
        if (el?.dataset.cellId) {
          liveQuizSubmit.current(el.dataset.cellId);
          didPanRef.current = true; // suppress the subsequent click event
        }
      }
    }
  };

  const onStageWheel = (e: React.WheelEvent) => {
    // Stage wheel is now handled by the global non-passive listener below.
    // Keep this as a no-op fallback for plain wheel scroll prevention.
    if (e.ctrlKey || e.metaKey) {
      const next = Math.max(0.5, Math.min(3, zoom * (1 - e.deltaY * 0.002)));
      setZoom(next);
    }
  };

  /** Global pinch / ctrl-wheel zoom — preventDefault stops the browser zooming the whole page. */
  useEffect(() => {
    const onWheel = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        setZoom((z) => Math.max(0.5, Math.min(3, z * (1 - e.deltaY * 0.002))));
      }
    };
    let gestureBaseZoom = 1;
    const onGestureStart = (e: Event) => { e.preventDefault(); gestureBaseZoom = zoom; };
    const onGestureChange = (e: Event) => {
      e.preventDefault();
      const scale = (e as unknown as { scale?: number }).scale ?? 1;
      setZoom(Math.max(0.5, Math.min(3, gestureBaseZoom * scale)));
    };
    const onGestureEnd = (e: Event) => e.preventDefault();
    document.addEventListener("wheel", onWheel, { passive: false });
    document.addEventListener("gesturestart", onGestureStart as EventListener, { passive: false });
    document.addEventListener("gesturechange", onGestureChange as EventListener, { passive: false });
    document.addEventListener("gestureend", onGestureEnd as EventListener, { passive: false });
    return () => {
      document.removeEventListener("wheel", onWheel);
      document.removeEventListener("gesturestart", onGestureStart as EventListener);
      document.removeEventListener("gesturechange", onGestureChange as EventListener);
      document.removeEventListener("gestureend", onGestureEnd as EventListener);
    };
  }, [zoom]);

  const renderedScale = fitScale * zoom;

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | null = null;
    let origin = { x: 0, y: 0 };
    let cancelled = false;

    function onTouchStart(e: TouchEvent) {
      const el = (e.target as HTMLElement).closest("[data-cell-id]") as HTMLElement | null;
      const id = el?.dataset.cellId;
      if (!id) return;
      const t = e.touches[0];
      origin = { x: t.clientX, y: t.clientY };
      cancelled = false;
      const cx = t.clientX, cy = t.clientY;
      timer = setTimeout(() => { if (!cancelled) setPeekTooltip({ id, x: cx, y: cy }); }, 500);
    }
    function onTouchMove(e: TouchEvent) {
      if (!timer || cancelled) return;
      const t = e.touches[0];
      if (Math.hypot(t.clientX - origin.x, t.clientY - origin.y) > 15) {
        cancelled = true;
        clearTimeout(timer);
        timer = null;
      }
    }
    function onTouchEnd() {
      if (timer) { clearTimeout(timer); timer = null; }
      setPeekTooltip(null);
    }

    document.addEventListener("touchstart", onTouchStart, { passive: true });
    document.addEventListener("touchmove", onTouchMove, { passive: true });
    document.addEventListener("touchend", onTouchEnd);
    document.addEventListener("touchcancel", onTouchEnd);
    return () => {
      document.removeEventListener("touchstart", onTouchStart);
      document.removeEventListener("touchmove", onTouchMove);
      document.removeEventListener("touchend", onTouchEnd);
      document.removeEventListener("touchcancel", onTouchEnd);
    };
  }, []); // setPeekTooltip is a stable useState setter

  /** Compute tiered spotlight rects for the overlay. Recomputed on every render
   *  (cheap — getBoundingClientRect calls). */
  const tiered = (() => {
    if (level === 0) return { caseRect: null, groupRect: null, wordRect: null, subRect: null };
    const root = posterRef.current;
    const get = (id: string | null) => (root && id ? root.getRect(id) : null);
    const caseRect = activeCase ? get(`zone-${activeCase}`) : null;
    let groupId: string | null = null;
    if (level >= 2 && activeGroup) groupId = activeGroup;
    else if ((level === 3 || level === 4) && activeWordId) {
      const parent = activeWordId.split("::")[0];
      const g = WORD_GROUP[parent];
      if (g) groupId = g;
    }
    const groupRect = level >= 2 ? get(groupId) : null;
    let wordRectId: string | null = null;
    if (level >= 3 && activeWordId) {
      const parent = activeWordId.split("::")[0];
      const g = WORD_GROUP[parent];
      wordRectId = g?.startsWith("nom-row-") ? g : parent;
    }
    const wordRect = get(wordRectId);
    const subRect = (level === 4 && activeWordId?.includes("::")) ? get(activeWordId) : null;
    return { caseRect, groupRect, wordRect, subRect };
  })();

  const mainContent = (
    <>
    {liveTeacher && <TeacherPanel />}
    {liveTeacherPreview && <TeacherPreviewPanel />}
    {liveStudent && (
      <LiveStudentOverlay
        identity={liveStudent}
        onLeave={onLiveLeave ?? (() => {})}
        onSetSubmit={(fn) => { liveQuizSubmit.current = fn; }}
        quizFillMode={quizFillMode}
      />
    )}
    {!liveStudent && !liveTeacher && !liveTeacherPreview && showWelcome && (
      <WelcomeModal onDismiss={() => dismissWelcome(false)} onBackdropDismiss={closeWelcome} onTour={() => dismissWelcome(true)} isMobile={isPortraitMobile} />
    )}
    {!liveStudent && !liveTeacher && !liveTeacherPreview && showCursorDemo && (
      <CursorDemo isMobile={isPortraitMobile} onDone={() => setShowCursorDemo(false)} onReset={goOverview} />
    )}
    {!liveStudent && !liveTeacher && showIntroStage && (
      <IntroStage onComplete={() => {
        try { localStorage.setItem("introStageSeen", "1"); } catch { /* noop */ }
        setShowIntroStage(false);
        setIntroNomOnly(true);
        // Give the user a beat to land on the Nominativ column before
        // Akkusativ and Dativ fade in (see `.intro-nom-only` in index.css).
        setTimeout(() => setIntroNomOnly(false), 1200);
        // After 5 seconds, auto-launch the same cursor demo that "Jump right
        // in" triggers from the welcome modal.
        setTimeout(() => setShowCursorDemo(true), 5000);
      }} />
    )}
    <main
      className={cn("h-[100dvh] w-screen overflow-hidden flex flex-col relative isolate", introNomOnly && "intro-nom-only")}
      onClick={(e) => {
        const t = e.target as HTMLElement;
        if (t.closest("button, [role='button'], a, input, select, textarea, [data-no-reset]")) return;
        if (didPanRef.current) { didPanRef.current = false; return; }
        if (level !== 0) goOverview();
      }}
    >
      <StepRepeatBackground />
      <header className="shrink-0 bg-poster-bg/95 backdrop-blur border-b border-poster-ink/10 px-3 py-2 flex items-center justify-between gap-2" style={quizFillMode ? { display: "none" } : undefined}>
        <div className="font-display font-bold text-poster-teal text-sm leading-tight">
          German Grammar Cheatsheet
        </div>
        <div className="flex items-center gap-1.5 text-[11px] text-poster-ink/60">
          {level !== 0 && !quiz.active && (
            <Button size="sm" variant="ghost" onClick={goOverview} className="h-7 px-2 text-xs text-poster-ink">
              <Home className="h-3 w-3 mr-1" /> Overview
            </Button>
          )}

          {/* Game selector */}
          {(() => {
            const current = GAME_OPTIONS.find((o) => o.value === gameMode)!;
            const CurrentIcon = current.icon;
            const [gameModeOpen, setGameModeOpen] = useState(false);
            return (
              <Popover open={gameModeOpen} onOpenChange={setGameModeOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className="h-7 px-2 text-[11px] gap-1.5">
                    <CurrentIcon className="h-3 w-3" />
                    {current.label}
                    <ChevronDown className="h-3 w-3 opacity-40" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent align="start" className="w-72 p-2">
                  <div className="text-[10px] uppercase tracking-widest text-poster-ink/40 font-semibold mb-2 px-1">Mode</div>
                  <div className="grid grid-cols-2 gap-1.5">
                    {GAME_OPTIONS.map((opt) => {
                      const Icon = opt.icon;
                      const isActive = gameMode === opt.value;
                      return (
                        <button
                          key={opt.value}
                          onClick={() => { handleGameMode(opt.value); setGameModeOpen(false); }}
                          className={cn(
                            "flex flex-col items-start gap-1 p-2.5 rounded-lg text-left transition-colors border",
                            isActive
                              ? "bg-poster-teal/10 border-poster-teal/30"
                              : "bg-poster-bg/60 border-transparent hover:bg-poster-bg hover:border-poster-ink/10",
                          )}
                        >
                          <Icon className={cn("h-4 w-4 shrink-0", isActive ? "text-poster-teal" : "text-poster-ink/40")} />
                          <div className={cn("text-[11px] font-semibold leading-tight", isActive ? "text-poster-teal" : "text-poster-ink")}>
                            {opt.label}
                          </div>
                          <div className="text-[10px] text-poster-ink/45 leading-tight">{opt.description}</div>
                        </button>
                      );
                    })}
                  </div>
                </PopoverContent>
              </Popover>
            );
          })()}

          {/* Restart tour */}
          <Button size="icon" variant="ghost" className="h-7 w-7 text-poster-ink" onClick={restartTour} aria-label="Restart tour">
            <HelpCircle className="h-4 w-4" />
          </Button>

          {/* Hamburger settings */}
          <Popover>
            <PopoverTrigger asChild>
              <Button size="icon" variant="outline" className="h-7 w-7" aria-label="Settings">
                <Menu className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-64 space-y-3 text-xs">
              <div>
                <Label className="text-[11px] text-poster-ink">Zoom</Label>
                <Slider min={0.5} max={3} step={0.05} value={[zoom]} onValueChange={([v]) => setZoom(v)} aria-label="Zoom" className="mt-1" />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="gender-colors" className="text-[11px] text-poster-ink cursor-pointer">Gender colors</Label>
                <Switch id="gender-colors" checked={genderOn} onCheckedChange={setGenderOn} />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="case-colors" className="text-[11px] text-poster-ink cursor-pointer">Case colors</Label>
                <Switch id="case-colors" checked={caseColorOn} onCheckedChange={setCaseColorOn} />
              </div>
              {caseColorOn && (
                <div>
                  <Label className="text-[11px] text-poster-ink">Case color scope</Label>
                  <select
                    value={caseColorMode}
                    onChange={(e) => setCaseColorMode(e.target.value as CaseColorMode)}
                    className="mt-1 w-full text-[11px] bg-white border border-poster-ink/20 rounded px-1.5 py-1 text-poster-ink"
                  >
                    <option value="tokens">Case-bearing only</option>
                    <option value="phrase">Whole phrase</option>
                    <option value="all">Every word</option>
                  </select>
                </div>
              )}
              <div className="pt-2 border-t border-poster-ink/10 space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="quiz-include-nom" className="text-[11px] text-poster-ink cursor-pointer">Include Nominativ</Label>
                  <Switch id="quiz-include-nom" checked={quizIncludeNom} onCheckedChange={(v) => { setQuizIncludeNom(v); if (quiz.active) quiz.start({ includeNom: v, mode: quizMode }); }} />
                </div>
                <Button size="sm" variant="outline" className="w-full h-8 text-xs" onClick={restartTour}>
                  <Play className="h-3 w-3 mr-1" /> Restart tour
                </Button>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </header>


      {isPortraitMobile ? (
        <MobilePosterSlider
          posterRef={posterRef}
          activeCase={activeCase}
          activeWordId={activeWordId}
          morphContextId={morphContextId}
          pinnedPossId={pinnedPossId}
          level={level}
          cutout={level !== 0 ? cutout : null}
          extraCutouts={[
            ...endingCuts,
            ...((activeWordId && EIN_ARTICLES.some((a) => a.id === activeWordId))
              ? (() => {
                  const r = posterRef.current?.getRect("g-pos");
                  const rects: { left: number; top: number; width: number; height: number }[] = [];
                  if (r) rects.push(r);
                  return rects;
                })()
              : []),
          ]}
          onTapCase={handlePosterTapCase}
          onTapWord={handlePosterTapWord}
          onTapBackground={handleTapBackground}
          genderOn={genderOn}
          morphMap={buildMorphMap(activeWordId, morphContextId)}
          quizBlur={quiz.active}
          quizActive={quiz.active}
          tourActive={tourActive}
          tourCutouts={tourCutouts}
          onInfoLayout={setInfoLayout}
          onInfoReady={() => setMobileInfoVisible(true)}
          onTapVerbCloud={() => setVerbCloudOpen(true)}
        />
      ) : (
        <div
          ref={stageRef}
          className="flex-1 min-h-0 relative overflow-hidden flex items-center justify-center touch-none"
          onPointerDownCapture={(e) => {
            setSheetSide(sideForPoint(e.clientX, e.clientY));
            const el = (e.target as HTMLElement).closest("[data-cell-id], [data-zone]") as HTMLElement | null;
            setAnchorRect(el?.getBoundingClientRect() ?? null);
          }}
          onClickCapture={(e) => {
            // If a pan happened, swallow the click so it doesn't drill into a pill.
            if (didPanRef.current) {
              e.stopPropagation();
              e.preventDefault();
              didPanRef.current = false;
            }
          }}
          onPointerDown={onStagePointerDown}
          onPointerMove={onStagePointerMove}
          onPointerUp={onStagePointerUp}
          onPointerCancel={onStagePointerUp}
          onWheel={onStageWheel}
          onMouseMove={(e) => {
            const el = (e.target as HTMLElement).closest("[data-cell-id]") as HTMLElement | null;
            const id = el?.dataset.cellId ?? null;
            if (id) setHoverTooltip({ id, x: e.clientX, y: e.clientY });
            else setHoverTooltip(null);
          }}
          onMouseLeave={() => setHoverTooltip(null)}
          onClick={(e) => {
            if (didPanRef.current) { didPanRef.current = false; return; }
            const t = e.target as HTMLElement;
            if (t.closest("button, [role='button'], a, input, select, textarea")) return;
            goOverview();
          }}
        >
          <div
            style={{
              width: POSTER_W,
              height: quizFillMode ? POSTER_H - 120 : POSTER_H,
              transform: `translate(${pan.x + (liveTeacher ? 230 : 0)}px, ${pan.y + (quizFillMode ? 40 : 0)}px) scale(${renderedScale})`,
              transformOrigin: "center center",
            }}
            className="relative shrink-0"
          >
            <Poster
              ref={posterRef}
              activeCase={activeCase}
              activeWordId={activeWordId}
              morphContextId={morphContextId}
              pinnedPossId={pinnedPossId}
              onTapCase={handlePosterTapCase}
              onTapWord={handlePosterTapWord}
              onTapBackground={handleTapBackground}
              onTapVerbCloud={() => setVerbCloudOpen(true)}
              onTapCaseIcon={(c, rect) => setCasePopup({ caseKey: c, iconRect: rect })}
              caseHoverDim={quiz.active && quiz.mode === "learn" && quiz.learnStep === 1 && !learnOverlayConfig}
              pinnedCase={
                (quiz.active && quiz.mode === "learn" && quiz.learnStep >= 2 && quiz.question ? quiz.question.prep.case : null)
              }
              learnDim={learnDimConfig}
              learnOverlay={learnOverlayConfig}
              genderMode={!genderOn ? "off" : level >= 2 ? "always" : "hover"}
              morphMap={buildMorphMap(activeWordId, morphContextId)}
              flourish={flourish}
              quizBlur={quiz.active}
              quizActive={quiz.active}
              hidePossessives={!!liveStudent}
              quizFill={quizFillMode}
              onTapQuestionWord={gameMode === "question-words" ? handleTapQuestionWord : undefined}
              questionWordSelected={gameMode === "question-words" ? qwSelectedWord : null}
              questionWordCorrect={gameMode === "question-words" ? qwCorrectWord : null}
              questionWordWrong={gameMode === "question-words" ? qwWrongWord : null}
              questionWordZones={qwZones}
            />
          </div>
        </div>
      )}

      {!isPortraitMobile && hoverTooltip && (() => {
        const info = getHoverInfo(hoverTooltip.id);
        if (!info) return null;
        return (
          <div
            className="fixed pointer-events-none z-50 bg-white/95 backdrop-blur-sm border border-poster-ink/15 rounded-lg shadow-md px-2.5 py-1.5 max-w-[200px]"
            style={{ left: hoverTooltip.x + 14, top: hoverTooltip.y + 14 }}
          >
            {info.caseLine && (
              <div className="text-[11px] font-bold text-poster-ink leading-tight">{info.caseLine}</div>
            )}
            <div className="text-[10px] text-poster-ink/55 leading-tight">{info.typeLine}</div>
            {info.translation && (
              <div className="text-[10px] text-poster-ink/70 font-medium leading-tight mt-0.5 pt-0.5 border-t border-poster-ink/10">
                {info.translation}
              </div>
            )}
          </div>
        );
      })()}

      {peekTooltip && (() => {
        const info = getHoverInfo(peekTooltip.id);
        if (!info) return null;
        const tipX = Math.max(8, Math.min(peekTooltip.x - 80, window.innerWidth - 210));
        const tipY = Math.max(8, peekTooltip.y - 12);
        return (
          <div
            className="fixed pointer-events-none z-50 bg-white/97 backdrop-blur-sm border border-poster-ink/15 rounded-xl shadow-xl px-3 py-2 max-w-[200px]"
            style={{ left: tipX, top: tipY, transform: "translateY(-100%)" }}
          >
            {info.caseLine && (
              <div className="text-[12px] font-bold text-poster-ink leading-tight">{info.caseLine}</div>
            )}
            <div className="text-[11px] text-poster-ink/55 leading-tight">{info.typeLine}</div>
            {info.translation && (
              <div className="text-[11px] text-poster-ink/75 font-medium leading-tight mt-1 pt-1 border-t border-poster-ink/10">
                {info.translation}
              </div>
            )}
          </div>
        );
      })()}

      {tourActive && (
        <IntroTour
          step={tourStep}
          onBack={() => setTourStep((s) => Math.max(0, s - 1))}
          onNext={() => {
            if (tourStep < TOUR_STEPS.length - 1) setTourStep((s) => s + 1);
            else endTour();
          }}
          onSkip={endTour}
          getTargetViewportRect={getTourTargetViewportRect}
        />
      )}

      {level !== 0 && (() => {
        const resolved = activeWordId ? resolveWord(activeWordId) : null;
        const sheetCase: CaseKey = (activeCase ?? "nom") as CaseKey;
        return (
          <InfoSheet
            open={isPortraitMobile ? (mobileInfoVisible && level >= 3 && !!resolved?.word) : (gameMode !== "learn-articles" && gameMode !== "practice-articles" && gameMode !== "question-words")}
            level={level as 1 | 2 | 3 | 4}
            activeCase={sheetCase}
            group={activeArticleRow ? GROUPS[activeArticleRow] : (activeGroup ? GROUPS[activeGroup] : null)}
            word={resolved?.word ?? null}
            sub={resolved?.sub ?? null}
            side={sheetSide}
            anchorRect={isPortraitMobile ? null : anchorRect}
            caseColorMode={caseColorOn ? caseColorMode : null}
            morphContextId={morphContextId}
            quizActive={quiz.active}
            bottomOffset={isPortraitMobile ? MOBILE_SLIDER_BAR_H : 0}
            infoLayout={isPortraitMobile ? infoLayout : 1}
            isPinned={!!pinnedPossId}
            onBack={goBackLevel}
            onClose={isPortraitMobile ? goBackLevel : goOverview}
          />
        );
      })()}

      {quiz.active && quiz.phase === "prompt" && quiz.question && (
        <QuizPromptCard
          question={quiz.question}
          streak={quiz.correctCount}
          onExit={quiz.exit}
          onSkip={quiz.skip}
          result={quiz.lastResult}
          mode={quiz.mode}
          learnStep={quiz.learnStep}
          totalLearnSteps={quiz.totalLearnSteps}
        />
      )}
      {quiz.active && quiz.phase === "explainer" && quiz.question && (
        <QuizExplainerCard
          question={quiz.question}
          correctCount={quiz.correctCount}
          result={quiz.lastResult}
          onNext={quiz.next}
          onExit={quiz.exit}
        />
      )}
      {quiz.active && quiz.phase === "learnComplete" && (
        <div
          data-no-reset
          onClick={(e) => e.stopPropagation()}
          className="fixed z-40 bottom-3 left-1/2 -translate-x-1/2 w-[min(92vw,460px)] bg-white rounded-xl shadow-2xl border border-poster-ink/15 px-4 py-4 select-none"
        >
          <div className="text-center space-y-3">
            <div className="text-base font-display font-bold text-poster-ink">Learn mode complete!</div>
            <div className="text-xs text-poster-ink/60">You&rsquo;ve worked through all the learn questions. Ready to practice on your own?</div>
            <div className="flex gap-2">
              <Button className="flex-1 h-8 text-xs" onClick={quiz.continueToPractice}>Practice Mode</Button>
              <Button variant="ghost" className="h-8 text-xs" onClick={quiz.exit}>Exit</Button>
            </div>
          </div>
        </div>
      )}
      {gameMode === "question-words" && (
        <WFragenGame
          ref={wFragenRef}
          onFlash={triggerFlash}
          onStepChange={(step, caseKey) => {
            if (step === "article" && caseKey) goSection(caseKey);
            else goOverview();
          }}
          onExit={() => setGameMode("explore")}
        />
      )}
      {gameMode === "prep-trainer" && (
        <PrepTrainerGame onExit={() => setGameMode("explore")} />
      )}
      {showQwTuner && (
        <QuestionWordTuner
          onClose={() => setShowQwTuner(false)}
          onChange={(z) => setQwZones(z)}
        />
      )}
      {!isPortraitMobile && <FlourishTuner />}
      {!isPortraitMobile && <LoadFlickerTuner />}
      {verbCloudOpen && <VerbCloudOverlay onClose={() => setVerbCloudOpen(false)} />}
      {!isPortraitMobile && casePopup && (
        <CaseHeaderPopup
          caseKey={casePopup.caseKey}
          iconSrc={CASE_ICONS[casePopup.caseKey]}
          iconRect={casePopup.iconRect}
          onClose={() => setCasePopup(null)}
        />)}
      <RotatePrompt />
    </main>
    </>
  );

  return liveStudent ? (
    <LiveQuizProvider sessionId={liveStudent.session_id} studentId={liveStudent.student_id}>
      {mainContent}
    </LiveQuizProvider>
  ) : mainContent;
};

export default Index;
