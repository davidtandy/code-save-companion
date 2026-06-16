
-- 1. Add host_token to quiz_session
ALTER TABLE public.quiz_session
  ADD COLUMN IF NOT EXISTS host_token text NOT NULL DEFAULT gen_random_uuid()::text;

-- 2. Drop permissive public policies
DROP POLICY IF EXISTS "anyone can create sessions" ON public.quiz_session;
DROP POLICY IF EXISTS "anyone can read sessions" ON public.quiz_session;
DROP POLICY IF EXISTS "anyone can update sessions" ON public.quiz_session;
DROP POLICY IF EXISTS "anyone can read responses" ON public.quiz_responses;
DROP POLICY IF EXISTS "anyone can insert responses" ON public.quiz_responses;

-- 3. Revoke anon/authenticated access; only service_role (server fns) may touch these tables.
REVOKE ALL ON public.quiz_session FROM anon, authenticated, PUBLIC;
REVOKE ALL ON public.quiz_responses FROM anon, authenticated, PUBLIC;
GRANT ALL ON public.quiz_session TO service_role;
GRANT ALL ON public.quiz_responses TO service_role;

-- 4. RLS stays enabled; with no policies + no grants, only service_role can access.
ALTER TABLE public.quiz_session ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_responses ENABLE ROW LEVEL SECURITY;
