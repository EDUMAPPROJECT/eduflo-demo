
-- Create class_enrollments table to track user's enrolled classes
CREATE TABLE public.class_enrollments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, class_id)
);

-- Enable Row Level Security
ALTER TABLE public.class_enrollments ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view their own enrollments" 
ON public.class_enrollments 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own enrollments" 
ON public.class_enrollments 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own enrollments" 
ON public.class_enrollments 
FOR DELETE 
USING (auth.uid() = user_id);
