-- Allow users to delete their own seminar applications
CREATE POLICY "Users can delete their own applications"
ON public.seminar_applications
FOR DELETE
USING (auth.uid() = user_id);