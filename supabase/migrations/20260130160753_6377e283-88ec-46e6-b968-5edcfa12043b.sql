-- Add grade column to academy_members for display purposes (vice_owner, teacher, admin)
-- The role column remains for owner/admin distinction, grade is for display title

ALTER TABLE public.academy_members 
ADD COLUMN IF NOT EXISTS grade TEXT DEFAULT 'admin';

-- Add comment for clarity
COMMENT ON COLUMN public.academy_members.grade IS 'Display grade: vice_owner (부원장), teacher (강사), admin (관리자). Only applies to non-owner members.';