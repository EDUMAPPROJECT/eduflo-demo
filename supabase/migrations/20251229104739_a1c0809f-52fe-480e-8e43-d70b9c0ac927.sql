-- Create teachers table
CREATE TABLE public.teachers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  academy_id UUID NOT NULL REFERENCES public.academies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  subject TEXT,
  bio TEXT,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create classes table
CREATE TABLE public.classes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  academy_id UUID NOT NULL REFERENCES public.academies(id) ON DELETE CASCADE,
  teacher_id UUID REFERENCES public.teachers(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  target_grade TEXT,
  schedule TEXT,
  fee INTEGER,
  description TEXT,
  is_recruiting BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.teachers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;

-- Teachers policies
CREATE POLICY "Anyone can view teachers"
ON public.teachers FOR SELECT
USING (true);

CREATE POLICY "Academy owners can insert teachers"
ON public.teachers FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.academies 
    WHERE academies.id = academy_id 
    AND academies.owner_id = auth.uid()
  )
);

CREATE POLICY "Academy owners can update their teachers"
ON public.teachers FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.academies 
    WHERE academies.id = academy_id 
    AND academies.owner_id = auth.uid()
  )
);

CREATE POLICY "Academy owners can delete their teachers"
ON public.teachers FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.academies 
    WHERE academies.id = academy_id 
    AND academies.owner_id = auth.uid()
  )
);

-- Classes policies
CREATE POLICY "Anyone can view classes"
ON public.classes FOR SELECT
USING (true);

CREATE POLICY "Academy owners can insert classes"
ON public.classes FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.academies 
    WHERE academies.id = academy_id 
    AND academies.owner_id = auth.uid()
  )
);

CREATE POLICY "Academy owners can update their classes"
ON public.classes FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.academies 
    WHERE academies.id = academy_id 
    AND academies.owner_id = auth.uid()
  )
);

CREATE POLICY "Academy owners can delete their classes"
ON public.classes FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.academies 
    WHERE academies.id = academy_id 
    AND academies.owner_id = auth.uid()
  )
);

-- Add triggers for updated_at
CREATE TRIGGER update_teachers_updated_at
BEFORE UPDATE ON public.teachers
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_classes_updated_at
BEFORE UPDATE ON public.classes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();