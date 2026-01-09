-- Drop conflicting policies
DROP POLICY IF EXISTS "Admin can insert academies" ON public.academies;
DROP POLICY IF EXISTS "Super admins can insert academies" ON public.academies;
DROP POLICY IF EXISTS "Admins can create academies" ON public.academies;

-- Create a single unified INSERT policy for academies
CREATE POLICY "Users can create academies" 
ON public.academies 
FOR INSERT 
TO authenticated
WITH CHECK (
  -- Super admins can create academies without owner restriction
  public.is_super_admin(auth.uid()) 
  OR 
  -- Regular admins can only create academy for themselves
  (public.has_role(auth.uid(), 'admin') AND owner_id = auth.uid())
);