-- Allow parents to delete their own pending consultations
CREATE POLICY "Parents can delete their pending consultations"
ON public.consultations
FOR DELETE
USING (auth.uid() = parent_id AND status = 'pending');