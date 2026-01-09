import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface AuthSettingsRequest {
  auto_confirm_email: boolean;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get the authorization header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "No authorization header" }),
        {
          status: 401,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Create Supabase client with the user's token
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    
    // Verify user is super admin using their token
    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: { Authorization: authHeader },
      },
    });

    const { data: { user }, error: userError } = await userClient.auth.getUser();
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        {
          status: 401,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Check if user is super admin
    const serviceClient = createClient(supabaseUrl, supabaseServiceKey);
    const { data: roleData, error: roleError } = await serviceClient
      .from("user_roles")
      .select("is_super_admin")
      .eq("user_id", user.id)
      .maybeSingle();

    if (roleError || !roleData?.is_super_admin) {
      return new Response(
        JSON.stringify({ error: "Forbidden: Super admin access required" }),
        {
          status: 403,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Parse request body
    const { auto_confirm_email }: AuthSettingsRequest = await req.json();

    if (typeof auto_confirm_email !== "boolean") {
      return new Response(
        JSON.stringify({ error: "Invalid auto_confirm_email value" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Update auth settings using the Management API
    // Note: This uses the Supabase service role to update project settings
    const projectRef = Deno.env.get("SUPABASE_PROJECT_REF") || supabaseUrl.split("//")[1].split(".")[0];
    
    // We'll update the platform_settings table and rely on the database setting
    // The actual Supabase Auth configuration needs to be managed via dashboard or API
    // For now, we store the preference and the frontend handles the flow accordingly
    
    const { error: updateError } = await serviceClient
      .from("platform_settings")
      .upsert({
        key: "email_verification_enabled",
        value: !auto_confirm_email, // If auto_confirm is true, verification is disabled
        description: "회원가입 시 이메일 인증 필수 여부",
        updated_by: user.id,
      }, {
        onConflict: "key"
      });

    if (updateError) {
      console.error("Error updating platform settings:", updateError);
      return new Response(
        JSON.stringify({ error: "Failed to update settings" }),
        {
          status: 500,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    console.log(`Auth settings updated: auto_confirm_email=${auto_confirm_email}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: auto_confirm_email 
          ? "이메일 자동 확인이 활성화되었습니다" 
          : "이메일 인증이 필요합니다"
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: unknown) {
    console.error("Error in update-auth-settings function:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
