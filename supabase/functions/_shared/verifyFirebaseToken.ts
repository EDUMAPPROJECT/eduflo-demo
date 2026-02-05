/**
 * Firebase ID Token 검증 (REST API 사용)
 * FIREBASE_API_KEY 시크릿 필요 (Firebase Console > 프로젝트 설정 > 일반 > 웹 API 키)
 */
const FIREBASE_LOOKUP_URL =
  "https://identitytoolkit.googleapis.com/v1/accounts:lookup";

export interface FirebaseTokenPayload {
  localId: string;
  phoneNumber?: string;
  email?: string;
}

export async function verifyFirebaseIdToken(
  idToken: string
): Promise<FirebaseTokenPayload | null> {
  const apiKey = Deno.env.get("FIREBASE_API_KEY");
  if (!apiKey) {
    console.error("FIREBASE_API_KEY is not set");
    return null;
  }
  try {
    const res = await fetch(`${FIREBASE_LOOKUP_URL}?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idToken }),
    });
    if (!res.ok) {
      const err = await res.text();
      console.error("Firebase lookup failed:", res.status, err);
      return null;
    }
    const data = await res.json();
    const users = data?.users;
    if (!users?.length) return null;
    const u = users[0];
    return {
      localId: u.localId ?? u.uid ?? "",
      phoneNumber: u.phoneNumber ?? undefined,
      email: u.email ?? undefined,
    };
  } catch (e) {
    console.error("verifyFirebaseIdToken error:", e);
    return null;
  }
}

export function normalizePhoneForDb(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.startsWith("82") && digits.length >= 11) return `+${digits}`;
  if (digits.startsWith("0")) return `+82${digits.slice(1)}`;
  return digits.length >= 10 ? `+82${digits}` : phone;
}