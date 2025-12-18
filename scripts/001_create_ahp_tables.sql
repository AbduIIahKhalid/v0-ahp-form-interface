-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create experts table to track all AHP submissions from different experts
CREATE TABLE IF NOT EXISTS public.experts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  expert_name TEXT NOT NULL,
  expert_email TEXT,
  submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create AHP submissions table to store detailed evaluation data
CREATE TABLE IF NOT EXISTS public.ahp_submissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  expert_id UUID NOT NULL REFERENCES public.experts(id) ON DELETE CASCADE,
  
  -- Criteria matrix comparisons (upper triangular)
  criteria_matrix JSONB NOT NULL,
  
  -- Alternative comparisons for each criterion
  coding_hours_matrix JSONB NOT NULL,
  study_hours_matrix JSONB NOT NULL,
  attendance_matrix JSONB NOT NULL,
  
  -- Calculated results
  final_scores JSONB NOT NULL,
  ranking JSONB NOT NULL,
  consistency_ratios JSONB NOT NULL,
  
  -- Full calculation details for admin view
  calculation_details JSONB,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_experts_submitted_at ON public.experts(submitted_at DESC);
CREATE INDEX IF NOT EXISTS idx_ahp_submissions_expert_id ON public.ahp_submissions(expert_id);
CREATE INDEX IF NOT EXISTS idx_ahp_submissions_created_at ON public.ahp_submissions(created_at DESC);

-- Enable Row Level Security
ALTER TABLE public.experts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ahp_submissions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for experts table
-- Allow anyone to insert (public submissions)
CREATE POLICY "experts_insert_public" ON public.experts
  FOR INSERT
  WITH CHECK (true);

-- Only authenticated admin users can view all experts
CREATE POLICY "experts_select_admin" ON public.experts
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- RLS Policies for ahp_submissions table
-- Allow anyone to insert (public submissions)
CREATE POLICY "ahp_submissions_insert_public" ON public.ahp_submissions
  FOR INSERT
  WITH CHECK (true);

-- Only authenticated admin users can view all submissions
CREATE POLICY "ahp_submissions_select_admin" ON public.ahp_submissions
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- Comments for documentation
COMMENT ON TABLE public.experts IS 'Stores information about experts who submit AHP evaluations';
COMMENT ON TABLE public.ahp_submissions IS 'Stores detailed AHP evaluation data from each expert';
