"use server";

import { redirect } from "next/navigation";
import { createSessionToken, setSessionCookie } from "@/lib/auth";

export async function loginAction(_: unknown, formData: FormData) {
  const email = String(formData.get("email") || "");
  const password = String(formData.get("password") || "");
  const expectedEmail = process.env.ADMIN_EMAIL || "";
  const expectedPassword = process.env.ADMIN_PASSWORD || "";

  if (email !== expectedEmail || password !== expectedPassword) {
    return { error: "Invalid credentials." };
  }

  const token = createSessionToken(email, password);
  await setSessionCookie(token);
  redirect("/");
}
