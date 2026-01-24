-- Add latitude and longitude columns to academies table for map markers
ALTER TABLE public.academies 
  ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION;

-- Add index for geospatial queries (only for records with location data)
CREATE INDEX IF NOT EXISTS idx_academies_location 
  ON public.academies(latitude, longitude) 
  WHERE latitude IS NOT NULL AND longitude IS NOT NULL;

-- Add comments for documentation
COMMENT ON COLUMN public.academies.latitude IS 'Academy location latitude coordinate (WGS84)';
COMMENT ON COLUMN public.academies.longitude IS 'Academy location longitude coordinate (WGS84)';