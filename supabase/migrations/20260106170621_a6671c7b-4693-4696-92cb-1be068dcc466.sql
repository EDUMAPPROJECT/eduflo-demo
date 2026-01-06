-- Add curriculum column to classes table for storing curriculum data as JSON array
ALTER TABLE public.classes 
ADD COLUMN curriculum jsonb DEFAULT '[]'::jsonb;

-- Add comment for documentation
COMMENT ON COLUMN public.classes.curriculum IS 'JSON array of curriculum steps, each with title and description';