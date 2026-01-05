-- Fix verification documents storage policy to use is_super_admin() instead of role='admin'
-- This ensures only super admins can view all verification documents

-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Super admins can view verification documents" ON storage.objects;

-- Create corrected policy that properly checks super admin status
CREATE POLICY "Super admins can view verification documents"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'verification-documents'
  AND public.is_super_admin(auth.uid())
);