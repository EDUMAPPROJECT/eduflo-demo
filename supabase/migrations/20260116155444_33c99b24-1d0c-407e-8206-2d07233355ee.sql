-- Add banner_image column to academies table for rectangular banner image
ALTER TABLE public.academies ADD COLUMN IF NOT EXISTS banner_image text;