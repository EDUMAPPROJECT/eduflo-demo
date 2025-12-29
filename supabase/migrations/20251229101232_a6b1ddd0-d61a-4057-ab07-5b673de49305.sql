-- Remove NOT NULL constraint from owner_id column
ALTER TABLE public.academies 
ALTER COLUMN owner_id DROP NOT NULL;

-- Set default value to NULL
ALTER TABLE public.academies 
ALTER COLUMN owner_id SET DEFAULT NULL;