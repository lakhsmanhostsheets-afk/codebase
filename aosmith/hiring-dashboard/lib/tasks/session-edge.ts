import { SESSION_MAX_AGE_SECONDS } from "@/lib/tasks/constants";

type SessionPayload = {
  userId: string;
  exp: number;
};

function getSecret() {
  return process.env.TASKS_SESSION_SECRET || "";
}

function base64UrlDecode(value: string) {
  const padded = value + "=".repeat((4 - (value.length % 4)) % 4);
  return atob(padded.replace(/-/g, "+").replace(/_/g, "/"));
}

function base64UrlEncode(bytes: Uint8Array) {
  return btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

async function sign(encoded: string, secret: string) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(encoded));
  return base64UrlEncode(new Uint8Array(signature));
}

export async function parseTasksSessionTokenEdge(token: string): Promise<SessionPayload | null> {
  const secret = getSecret();
  if (!secret || secret.length < 16) return null;

  const [encoded, signature] = token.split(".");
  if (!encoded || !signature) return null;

  const expected = await sign(encoded, secret);
  if (signature !== expected) return null;

  try {
    const json = base64UrlDecode(encoded);
    const payload = JSON.parse(json) as SessionPayload;
    if (!payload.userId || !payload.exp) return null;
    if (payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch {
    return null;
  }
}

export { SESSION_MAX_AGE_SECONDS };
