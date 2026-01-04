import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export const useSuperAdmin = () => {
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkSuperAdmin = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) {
          setIsSuperAdmin(false);
          setLoading(false);
          return;
        }

        const { data, error } = await supabase
          .from('user_roles')
          .select('is_super_admin')
          .eq('user_id', session.user.id)
          .maybeSingle();

        if (error) {
          console.error('Error checking super admin:', error);
          setIsSuperAdmin(false);
        } else {
          setIsSuperAdmin(data?.is_super_admin === true);
        }
      } catch (error) {
        console.error('Error:', error);
        setIsSuperAdmin(false);
      } finally {
        setLoading(false);
      }
    };

    checkSuperAdmin();
  }, []);

  return { isSuperAdmin, loading };
};
