import { cookies } from "next/headers";

const SESSION_COOKIE = "hd_session";

function getExpectedToken() {
  const email = process.env.ADMIN_EMAIL || "";
  const password = process.env.ADMIN_PASSWORD || "";
  return Buffer.from(`${email}:${password}`).toString("base64");
}

export function createSessionToken(email: string, password: string) {
  return Buffer.from(`${email}:${password}`).toString("base64");
}

export async function setSessionCookie(token: string) {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
  });
}

export async function clearSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}

export async function isAuthenticated() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  return token === getExpectedToken();
}
