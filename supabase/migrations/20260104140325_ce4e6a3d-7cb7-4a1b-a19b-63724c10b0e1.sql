-- Add is_super_admin column to user_roles table
ALTER TABLE public.user_roles 
ADD COLUMN IF NOT EXISTS is_super_admin boolean DEFAULT false;

-- Create function to check if user is super admin
CREATE OR REPLACE FUNCTION public.is_super_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND is_super_admin = true
  )
$$;

-- Drop existing policies and recreate with super admin check
DROP POLICY IF EXISTS "Super admins can view all verifications" ON public.business_verifications;
CREATE POLICY "Super admins can view all verifications" 
ON public.business_verifications 
FOR SELECT 
USING (public.is_super_admin(auth.uid()));

DROP POLICY IF EXISTS "Super admins can update verification status" ON public.business_verifications;
CREATE POLICY "Super admins can update all verifications" 
ON public.business_verifications 
FOR UPDATE 
USING (public.is_super_admin(auth.uid()));