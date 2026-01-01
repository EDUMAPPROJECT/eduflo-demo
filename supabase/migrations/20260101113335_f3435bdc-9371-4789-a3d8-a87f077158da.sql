-- Fix signup trigger function: auth.users rows don't have NEW.phone
-- Use raw_user_meta_data for optional fields and guard enum casting.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_phone text;
  v_user_name text;
  v_role_text text;
  v_role app_role;
BEGIN
  v_phone := NULLIF(btrim(COALESCE(NEW.raw_user_meta_data ->> 'phone', '')), '');
  v_user_name := NULLIF(btrim(COALESCE(NEW.raw_user_meta_data ->> 'user_name', '')), '');
  v_role_text := btrim(COALESCE(NEW.raw_user_meta_data ->> 'role', ''));

  v_role := CASE
    WHEN v_role_text IN ('admin', 'parent') THEN v_role_text::app_role
    ELSE 'parent'::app_role
  END;

  INSERT INTO public.profiles (id, phone, email, user_name)
  VALUES (
    NEW.id,
    v_phone,
    NEW.email,
    v_user_name
  )
  ON CONFLICT (id) DO UPDATE
  SET phone = EXCLUDED.phone,
      email = EXCLUDED.email,
      user_name = EXCLUDED.user_name,
      updated_at = now();

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, v_role)
  ON CONFLICT (user_id) DO UPDATE
  SET role = EXCLUDED.role;

  RETURN NEW;
END;
$$;