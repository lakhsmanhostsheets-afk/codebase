"use server";

import { redirect } from "next/navigation";
import { authenticateTasksUser, setTasksSessionCookie } from "@/lib/tasks/auth";

export async function tasksLoginAction(_: unknown, formData: FormData) {
  const email = String(formData.get("email") || "");
  const password = String(formData.get("password") || "");

  try {
    const bootstrapEmail = (process.env.TASKS_ADMIN_EMAIL || "").trim();
    const bootstrapPassword = process.env.TASKS_ADMIN_PASSWORD || "";
    if (!bootstrapEmail || !bootstrapPassword) {
      return {
        error: "Server misconfigured: TASKS_ADMIN_EMAIL and TASKS_ADMIN_PASSWORD must be set.",
      };
    }

    const user = await authenticateTasksUser(email, password);
    if (!user) {
      return { error: "Invalid credentials." };
    }
    await setTasksSessionCookie(user.id);
    redirect("/tasks");
  } catch (error) {
    if (error instanceof Error && error.message === "NEXT_REDIRECT") throw error;
    const message = error instanceof Error ? error.message : "Login failed.";
    if (message.includes("TASKS_SESSION_SECRET")) {
      return { error: "Server misconfigured: TASKS_SESSION_SECRET is missing." };
    }
    return { error: message };
  }
}
