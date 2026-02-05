-- Add custom_questions column to seminars table for custom questions (up to 3)
ALTER TABLE public.seminars 
ADD COLUMN custom_questions text[] DEFAULT NULL;

COMMENT ON COLUMN public.seminars.custom_questions IS 'Custom questions (up to 3) that parents must answer when applying';

-- Add custom_answers column to seminar_applications table
ALTER TABLE public.seminar_applications 
ADD COLUMN custom_answers jsonb DEFAULT NULL;

COMMENT ON COLUMN public.seminar_applications.custom_answers IS 'Answers to custom questions as key-value pairs';