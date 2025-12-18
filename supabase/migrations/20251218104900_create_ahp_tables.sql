-- Create experts table
CREATE TABLE IF NOT EXISTS public.experts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create ahp_submissions table
CREATE TABLE IF NOT EXISTS public.ahp_submissions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    expert_id UUID REFERENCES public.experts(id) ON DELETE CASCADE,
    criteria_matrix JSONB NOT NULL,
    alternatives_matrix JSONB NOT NULL,
    weights JSONB NOT NULL,
    results JSONB NOT NULL,
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on tables
ALTER TABLE public.experts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ahp_submissions ENABLE ROW LEVEL SECURITY;