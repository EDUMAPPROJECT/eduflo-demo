import "jsr:@supabase/functions-js/edge-runtime.d.ts"
/// <reference lib="deno.ns" />

// Firebase Admin SDK is currently disabled
// To enable, configure FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY secrets
// and update firebaseAdmin.ts

Deno.serve(async (req: Request) => {
  try {
    const authHeader = req.headers.get("authorization");

    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing Authorization header" }),
        { status: 401 }
      );
    }

    // Firebase verification is currently disabled
    // Return error until Firebase is properly configured
    return new Response(
      JSON.stringify({ 
        error: "Firebase phone verification is not configured. Please set up Firebase Admin SDK credentials." 
      }),
      { status: 503, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: "Invalid or expired token" }),
      { status: 401 }
    );
  }
});
