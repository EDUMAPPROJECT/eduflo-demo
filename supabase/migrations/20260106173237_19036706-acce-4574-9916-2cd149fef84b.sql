-- Add policy for super admins to delete feed posts
CREATE POLICY "Super admins can delete any feed posts"
ON public.feed_posts
FOR DELETE
USING (is_super_admin(auth.uid()));