
CREATE TABLE public.quiz_session (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  host_token UUID NOT NULL DEFAULT gen_random_uuid(),
  phase TEXT NOT NULL DEFAULT 'lobby',
  current_question_index INTEGER NOT NULL DEFAULT 0,
  question_started_at TIMESTAMPTZ,
  timer_max_seconds INTEGER NOT NULL DEFAULT 30,
  questions JSONB NOT NULL DEFAULT '[]'::jsonb,
  game_mode TEXT NOT NULL DEFAULT 'classic',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT ALL ON public.quiz_session TO service_role;
ALTER TABLE public.quiz_session ENABLE ROW LEVEL SECURITY;
-- No policies: service_role bypasses RLS; no other role has access.

CREATE INDEX quiz_session_code_idx ON public.quiz_session(code);
CREATE INDEX quiz_session_created_at_idx ON public.quiz_session(created_at DESC);

CREATE TABLE public.quiz_responses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES public.quiz_session(id) ON DELETE CASCADE,
  student_id TEXT NOT NULL,
  student_name TEXT NOT NULL,
  student_avatar TEXT NOT NULL DEFAULT '',
  question_index INTEGER NOT NULL,
  answer TEXT NOT NULL,
  is_correct BOOLEAN NOT NULL DEFAULT false,
  response_ms INTEGER NOT NULL DEFAULT 0,
  points INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (session_id, student_id, question_index)
);
GRANT ALL ON public.quiz_responses TO service_role;
ALTER TABLE public.quiz_responses ENABLE ROW LEVEL SECURITY;
-- No policies: service_role bypasses RLS; no other role has access.

CREATE INDEX quiz_responses_session_idx ON public.quiz_responses(session_id);

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_quiz_session_updated_at
  BEFORE UPDATE ON public.quiz_session
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_quiz_responses_updated_at
  BEFORE UPDATE ON public.quiz_responses
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
