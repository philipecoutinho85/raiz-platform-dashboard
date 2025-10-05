-- Add tour completion tracking to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS has_completed_tour BOOLEAN DEFAULT FALSE;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_tour_completed 
ON public.profiles(has_completed_tour);