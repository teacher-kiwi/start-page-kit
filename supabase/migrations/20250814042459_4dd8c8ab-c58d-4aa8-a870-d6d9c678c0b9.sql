-- Remove polarity columns from questions and survey_questions tables
ALTER TABLE public.questions DROP COLUMN IF EXISTS polarity;
ALTER TABLE public.survey_questions DROP COLUMN IF EXISTS polarity;