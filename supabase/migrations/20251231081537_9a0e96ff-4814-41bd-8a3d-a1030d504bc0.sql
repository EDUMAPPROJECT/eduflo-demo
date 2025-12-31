-- Fix 1: Update RLS policies for academies to prevent manipulation of NULL owner_id records
-- Drop existing policies
DROP POLICY IF EXISTS "Admin can update their own academies" ON academies;
DROP POLICY IF EXISTS "Admin can delete their own academies" ON academies;
DROP POLICY IF EXISTS "Admin can insert academies" ON academies;

-- Recreate policies with explicit NULL check
CREATE POLICY "Admin can update their own academies" 
ON academies 
FOR UPDATE 
USING (owner_id IS NOT NULL AND auth.uid() = owner_id AND has_role(auth.uid(), 'admin'));

CREATE POLICY "Admin can delete their own academies" 
ON academies 
FOR DELETE 
USING (owner_id IS NOT NULL AND auth.uid() = owner_id AND has_role(auth.uid(), 'admin'));

CREATE POLICY "Admin can insert academies" 
ON academies 
FOR INSERT 
WITH CHECK (auth.uid() = owner_id AND has_role(auth.uid(), 'admin'));

-- Fix 2: Add database constraints for input length validation
-- Consultations table
ALTER TABLE consultations ADD CONSTRAINT consultations_student_name_length CHECK (length(student_name) <= 100);
ALTER TABLE consultations ADD CONSTRAINT consultations_message_length CHECK (message IS NULL OR length(message) <= 1000);
ALTER TABLE consultations ADD CONSTRAINT consultations_student_grade_length CHECK (student_grade IS NULL OR length(student_grade) <= 50);

-- Seminar applications table
ALTER TABLE seminar_applications ADD CONSTRAINT seminar_apps_student_name_length CHECK (length(student_name) <= 100);
ALTER TABLE seminar_applications ADD CONSTRAINT seminar_apps_message_length CHECK (message IS NULL OR length(message) <= 500);
ALTER TABLE seminar_applications ADD CONSTRAINT seminar_apps_student_grade_length CHECK (student_grade IS NULL OR length(student_grade) <= 50);
ALTER TABLE seminar_applications ADD CONSTRAINT seminar_apps_attendee_count_range CHECK (attendee_count >= 1 AND attendee_count <= 10);

-- Posts table
ALTER TABLE posts ADD CONSTRAINT posts_title_length CHECK (length(title) <= 200);
ALTER TABLE posts ADD CONSTRAINT posts_content_length CHECK (content IS NULL OR length(content) <= 5000);

-- Teachers table
ALTER TABLE teachers ADD CONSTRAINT teachers_name_length CHECK (length(name) <= 100);
ALTER TABLE teachers ADD CONSTRAINT teachers_bio_length CHECK (bio IS NULL OR length(bio) <= 1000);
ALTER TABLE teachers ADD CONSTRAINT teachers_subject_length CHECK (subject IS NULL OR length(subject) <= 100);

-- Classes table
ALTER TABLE classes ADD CONSTRAINT classes_name_length CHECK (length(name) <= 200);
ALTER TABLE classes ADD CONSTRAINT classes_description_length CHECK (description IS NULL OR length(description) <= 2000);
ALTER TABLE classes ADD CONSTRAINT classes_schedule_length CHECK (schedule IS NULL OR length(schedule) <= 200);
ALTER TABLE classes ADD CONSTRAINT classes_fee_range CHECK (fee IS NULL OR (fee >= 0 AND fee <= 100000000));

-- Academies table
ALTER TABLE academies ADD CONSTRAINT academies_name_length CHECK (length(name) <= 200);
ALTER TABLE academies ADD CONSTRAINT academies_description_length CHECK (description IS NULL OR length(description) <= 2000);
ALTER TABLE academies ADD CONSTRAINT academies_address_length CHECK (address IS NULL OR length(address) <= 500);

-- Seminars table
ALTER TABLE seminars ADD CONSTRAINT seminars_title_length CHECK (length(title) <= 200);
ALTER TABLE seminars ADD CONSTRAINT seminars_description_length CHECK (description IS NULL OR length(description) <= 2000);
ALTER TABLE seminars ADD CONSTRAINT seminars_location_length CHECK (location IS NULL OR length(location) <= 200);
ALTER TABLE seminars ADD CONSTRAINT seminars_capacity_range CHECK (capacity IS NULL OR (capacity >= 1 AND capacity <= 1000));