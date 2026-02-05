import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";
import {
  verifyFirebaseIdToken,
  normalizePhoneForDb,
} from "../_shared/verifyFirebaseToken.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }

  try {
    const body = (await req.json()) as { idToken?: string; role?: string };
    const idToken = body?.idToken;

    if (!idToken || typeof idToken !== "string") {
      return new Response(
        JSON.stringify({ error: "idToken이 필요합니다" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const payload = await verifyFirebaseIdToken(idToken);
    if (!payload?.localId) {
      return new Response(
        JSON.stringify({ error: "유효하지 않거나 만료된 토큰입니다" }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const phone = payload.phoneNumber
      ? normalizePhoneForDb(payload.phoneNumber)
      : null;
    if (!phone) {
      return new Response(
        JSON.stringify({ error: "휴대폰 번호 정보를 찾을 수 없습니다" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    const { data: profileByE164 } = await supabase
      .from("profiles")
      .select("id")
      .eq("phone", phone)
      .maybeSingle();

    let profile = profileByE164;
    if (!profile && phone.startsWith("+82")) {
      const altPhone = "0" + phone.slice(3);
      const res = await supabase
        .from("profiles")
        .select("id")
        .eq("phone", altPhone)
        .maybeSingle();
      profile = res.data;
    }

    if (!profile) {
      return new Response(
        JSON.stringify({ error: "가입된 휴대폰 번호가 아닙니다" }),
        { status: 404, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (e) {
    console.error("firebase-login error:", e);
    return new Response(
      JSON.stringify({ error: "서버 오류가 발생했습니다" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
});