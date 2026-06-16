// @ts-nocheck
import { useEffect, useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { AVATARS } from "./avatars";
import { useServerFn } from "@tanstack/react-start";
import { getPublicSession, joinSession } from "@/lib/livequiz.functions";

const STORAGE_KEY = "livequiz_student";

export type StudentIdentity = {
  student_id: string;
  student_name: string;
  student_avatar: string;
  session_id: string;
  session_code: string;
};

function getOrCreateStudentId(): string {
  try {
    const raw = localStorage.getItem("livequiz_student_id");
    if (raw) return raw;
    const id = crypto.randomUUID();
    localStorage.setItem("livequiz_student_id", id);
    return id;
  } catch { return crypto.randomUUID(); }
}

type Props = {
  onJoined: (identity: StudentIdentity) => void;
};

export function StudentLobby({ onJoined }: Props) {
  const initialCode = useMemo(() => {
    const u = new URL(window.location.href);
    return (u.searchParams.get("code") ?? "").toUpperCase();
  }, []);
  const [code, setCode] = useState(initialCode);
  const [name, setName] = useState("");
  const [avatar, setAvatar] = useState<string>(AVATARS[0].key);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const lookupFn = useServerFn(getPublicSession);
  const joinFn   = useServerFn(joinSession);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const prev = JSON.parse(raw);
      if (prev?.session_code === code) {
        setName(prev.student_name ?? "");
        setAvatar(prev.student_avatar ?? AVATARS[0].key);
      }
    } catch {}
  }, [code]);

  async function handleJoin() {
    setError(null);
    if (!code.trim() || !name.trim()) { setError("Enter a code and your name."); return; }
    setBusy(true);
    try {
      const sess = await lookupFn({ data: { code: code.trim().toUpperCase() } });
      if (!sess) { setError("Session not found."); setBusy(false); return; }
      const student_id = getOrCreateStudentId();
      const identity: StudentIdentity = {
        student_id,
        student_name: name.trim(),
        student_avatar: avatar,
        session_id: (sess as any).id,
        session_code: (sess as any).code,
      };
      await joinFn({ data: {
        sessionId: identity.session_id,
        studentId: student_id,
        studentName: identity.student_name,
        studentAvatar: identity.student_avatar,
      }});
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(identity)); } catch {}
      onJoined(identity);
    } catch (e: any) {
      setError(e?.message ?? "Couldn't join session.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-poster-bg">
      <div className="w-full max-w-sm space-y-8">

        {/* Header */}
        <div className="text-center space-y-1">
          <div className="text-5xl font-bold text-poster-ink tracking-tight">genau.</div>
          <div className="text-poster-ink/50 text-base font-medium">Live Quiz</div>
        </div>

        {/* Session code — only show if not pre-filled from QR */}
        {!initialCode && (
          <div className="space-y-2">
            <div className="text-xs uppercase tracking-widest text-poster-ink/40 font-semibold px-1">Session code</div>
            <input
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="ABC123"
              maxLength={6}
              className="w-full py-4 px-6 rounded-full bg-white/80 border border-poster-ink/10 text-poster-ink font-bold text-2xl text-center tracking-widest placeholder:text-poster-ink/20 outline-none focus:ring-2 focus:ring-poster-teal/30"
            />
          </div>
        )}

        {/* Name */}
        <div className="space-y-2">
          <div className="text-xs uppercase tracking-widest text-poster-ink/40 font-semibold px-1">Your name</div>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Type your name"
            maxLength={20}
            autoFocus
            className="w-full py-4 px-6 rounded-full bg-white/80 border border-poster-ink/10 text-poster-ink font-semibold text-lg placeholder:text-poster-ink/30 outline-none focus:ring-2 focus:ring-poster-teal/30"
          />
        </div>

        {/* Avatar grid */}
        <div className="space-y-3">
          <div className="text-xs uppercase tracking-widest text-poster-ink/40 font-semibold px-1">Pick an avatar</div>
          <div className="grid grid-cols-4 gap-3">
            {AVATARS.map((a) => (
              <button
                key={a.key}
                onClick={() => setAvatar(a.key)}
                className={cn(
                  "aspect-square rounded-2xl p-3 flex items-center justify-center transition-all duration-200",
                  avatar === a.key
                    ? "bg-poster-yellow scale-105 shadow-lg"
                    : "bg-white/60 hover:bg-white/90 active:scale-95",
                )}
              >
                <img src={a.src} alt={a.label} className="w-full h-full object-contain" draggable={false} />
              </button>
            ))}
          </div>
        </div>

        {error && (
          <div className="text-center text-poster-red text-sm font-medium">{error}</div>
        )}

        {/* Join */}
        <button
          onClick={handleJoin}
          disabled={busy}
          className="w-full py-4 rounded-full bg-poster-teal text-white font-bold text-lg hover:bg-poster-teal/90 active:bg-poster-teal/80 transition-colors disabled:opacity-50"
        >
          {busy ? "Joining…" : "Join →"}
        </button>

      </div>
    </div>
  );
}
