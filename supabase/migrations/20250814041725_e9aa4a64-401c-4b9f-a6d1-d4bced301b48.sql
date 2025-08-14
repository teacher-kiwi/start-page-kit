-- Add is_default column to questions table
ALTER TABLE public.questions 
ADD COLUMN is_default BOOLEAN NOT NULL DEFAULT false;

-- Set all existing questions as default questions
UPDATE public.questions 
SET is_default = true;