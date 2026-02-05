import admin from "firebase-admin";

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: Deno.env.get("FIREBASE_PROJECT_ID"),
      clientEmail: Deno.env.get("FIREBASE_CLIENT_EMAIL"),
      privateKey: Deno.env
        .get("FIREBASE_PRIVATE_KEY")
        ?.replace(/\\n/g, "\n"),
    }),
  });
}

export const firebaseAdmin = admin;