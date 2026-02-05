import "jsr:@supabase/functions-js/edge-runtime.d.ts"
/// <reference lib="deno.ns" />

import { firebaseAdmin } from "../_shared/firebaseAdmin.ts";

Deno.serve(async (req: Request) => {
  try {
    const authHeader = req.headers.get("authorization");

    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing Authorization header" }),
        { status: 401 }
      );
    }

    const idToken = authHeader.replace("Bearer ", "");

    const decoded = await firebaseAdmin.auth().verifyIdToken(idToken);

    return new Response(
      JSON.stringify({
        firebaseUid: decoded.uid,
        phoneNumber: decoded.phone_number,
      }),
      { headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: "Invalid or expired token" }),
      { status: 401 }
    );
  }
});