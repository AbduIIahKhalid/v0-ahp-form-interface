-- Drop existing policies
DROP POLICY IF EXISTS "experts_insert_public" ON public.experts;
DROP POLICY IF EXISTS "experts_select_admin" ON public.experts;
DROP POLICY IF EXISTS "ahp_submissions_insert_public" ON public.ahp_submissions;
DROP POLICY IF EXISTS "ahp_submissions_select_admin" ON public.ahp_submissions;

-- New RLS policies that allow anonymous inserts but require auth for selects
-- Allow anyone to insert experts (for public form submissions)
CREATE POLICY "experts_insert_anyone" ON public.experts
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Only authenticated users can view experts
CREATE POLICY "experts_select_authenticated" ON public.experts
  FOR SELECT
  TO authenticated
  USING (true);

-- Allow anyone to insert submissions (for public form submissions)
CREATE POLICY "ahp_submissions_insert_anyone" ON public.ahp_submissions
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Only authenticated users can view submissions
CREATE POLICY "ahp_submissions_select_authenticated" ON public.ahp_submissions
  FOR SELECT
  TO authenticated
  USING (true);
