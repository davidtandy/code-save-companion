// @ts-nocheck
import { useState } from "react";
import { TeacherPanel } from "@/components/livequiz/TeacherPanel";
import { TeacherPreviewPanel } from "@/components/livequiz/TeacherPreviewPanel";
import { StudentLobby, type StudentIdentity } from "@/components/livequiz/StudentLobby";
import { StudentQuiz } from "@/components/livequiz/StudentQuiz";

function getMode(): "teacher" | "preview" | "student" | null {
  if (typeof window === "undefined") return null;
  const p = new URLSearchParams(window.location.search);
  if (p.has("teacher")) return "teacher";
  if (p.has("preview")) return "preview";
  if (p.has("student")) return "student";
  return null;
}

export default function Index() {
  const [mode] = useState(() => getMode());
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

  function handleLeave() {
    try { localStorage.removeItem("livequiz_student"); } catch {}
    setStudentIdentity(null);
  }

  if (mode === "teacher") return <TeacherPanel />;
  if (mode === "preview") return <TeacherPreviewPanel />;

  if (mode === "student" || studentIdentity) {
    if (!studentIdentity) return <StudentLobby onJoined={setStudentIdentity} />;
    return <StudentQuiz identity={studentIdentity} onLeave={handleLeave} />;
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-8 bg-poster-bg p-8">
      <div className="text-center space-y-2">
        <h1 className="text-4xl font-bold text-poster-ink tracking-tight">German Article Quiz</h1>
        <p className="text-poster-ink/50 text-base">Live classroom quiz — articles &amp; pronouns</p>
      </div>
      <div className="flex flex-col gap-3 w-full max-w-xs">
        <a
          href="?teacher"
          className="w-full py-4 rounded-xl bg-poster-teal text-white font-bold text-center text-lg hover:bg-poster-teal/90 transition-colors"
        >
          Teacher
        </a>
        <a
          href="?student"
          className="w-full py-4 rounded-xl bg-poster-yellow text-white font-bold text-center text-lg hover:bg-poster-yellow/90 transition-colors"
        >
          Join as Student
        </a>
        <a
          href="?preview"
          className="w-full py-4 rounded-xl border-2 border-poster-ink/20 text-poster-ink/60 font-semibold text-center text-base hover:bg-poster-ink/5 transition-colors"
        >
          Preview
        </a>
      </div>
    </div>
  );
}
