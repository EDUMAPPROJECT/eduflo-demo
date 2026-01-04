-- Add RLS policy for user_roles to allow reading is_super_admin for self
DROP POLICY IF EXISTS "Users can view their own super admin status" ON public.user_roles;
CREATE POLICY "Users can view their own super admin status" 
ON public.user_roles 
FOR SELECT 
USING (auth.uid() = user_id);