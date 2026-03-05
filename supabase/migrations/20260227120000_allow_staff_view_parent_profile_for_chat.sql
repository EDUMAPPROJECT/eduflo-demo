-- Allow academy staff (chat room 담당자) to view parent profiles for their assigned chat rooms
-- so that 부원장/강사 can see 학부모 nickname in admin chat room
CREATE POLICY "Academy staff can view parent profiles for their chat rooms"
ON public.profiles
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.chat_rooms cr
    WHERE cr.parent_id = profiles.id AND cr.staff_id = auth.uid()
  )
);
