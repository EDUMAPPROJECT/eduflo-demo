-- Create chat_rooms table
CREATE TABLE public.chat_rooms (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  academy_id UUID NOT NULL REFERENCES public.academies(id) ON DELETE CASCADE,
  parent_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(academy_id, parent_id)
);

-- Create messages table
CREATE TABLE public.messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  chat_room_id UUID NOT NULL REFERENCES public.chat_rooms(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL,
  content TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.chat_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Chat rooms policies
CREATE POLICY "Parents can view their chat rooms"
ON public.chat_rooms
FOR SELECT
USING (auth.uid() = parent_id);

CREATE POLICY "Academy owners can view chat rooms for their academies"
ON public.chat_rooms
FOR SELECT
USING (EXISTS (
  SELECT 1 FROM academies
  WHERE academies.id = chat_rooms.academy_id
  AND academies.owner_id = auth.uid()
));

CREATE POLICY "Parents can create chat rooms"
ON public.chat_rooms
FOR INSERT
WITH CHECK (auth.uid() = parent_id);

-- Messages policies
CREATE POLICY "Chat participants can view messages"
ON public.messages
FOR SELECT
USING (EXISTS (
  SELECT 1 FROM chat_rooms
  WHERE chat_rooms.id = messages.chat_room_id
  AND (chat_rooms.parent_id = auth.uid() OR EXISTS (
    SELECT 1 FROM academies
    WHERE academies.id = chat_rooms.academy_id
    AND academies.owner_id = auth.uid()
  ))
));

CREATE POLICY "Chat participants can send messages"
ON public.messages
FOR INSERT
WITH CHECK (
  auth.uid() = sender_id AND
  EXISTS (
    SELECT 1 FROM chat_rooms
    WHERE chat_rooms.id = messages.chat_room_id
    AND (chat_rooms.parent_id = auth.uid() OR EXISTS (
      SELECT 1 FROM academies
      WHERE academies.id = chat_rooms.academy_id
      AND academies.owner_id = auth.uid()
    ))
  )
);

CREATE POLICY "Recipients can mark messages as read"
ON public.messages
FOR UPDATE
USING (EXISTS (
  SELECT 1 FROM chat_rooms
  WHERE chat_rooms.id = messages.chat_room_id
  AND (chat_rooms.parent_id = auth.uid() OR EXISTS (
    SELECT 1 FROM academies
    WHERE academies.id = chat_rooms.academy_id
    AND academies.owner_id = auth.uid()
  ))
));

-- Enable realtime for messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;

-- Update timestamp trigger
CREATE TRIGGER update_chat_rooms_updated_at
BEFORE UPDATE ON public.chat_rooms
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();