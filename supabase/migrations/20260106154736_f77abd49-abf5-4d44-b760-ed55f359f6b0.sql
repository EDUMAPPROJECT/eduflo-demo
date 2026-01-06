-- Add seminar_id column to feed_posts for linking to seminars
ALTER TABLE public.feed_posts 
ADD COLUMN seminar_id UUID REFERENCES public.seminars(id) ON DELETE SET NULL;

-- Add index for faster lookups
CREATE INDEX idx_feed_posts_seminar_id ON public.feed_posts(seminar_id);