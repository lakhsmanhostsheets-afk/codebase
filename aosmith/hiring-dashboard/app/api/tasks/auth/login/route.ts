import { NextResponse } from "next/server";
import { authenticateTasksUser, setTasksSessionCookie } from "@/lib/tasks/auth";
import { tasksApiError } from "@/lib/tasks/api";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email = String(body.email || "");
    const password = String(body.password || "");

    const user = await authenticateTasksUser(email, password);
    if (!user) {
      return NextResponse.json({ error: "Invalid credentials." }, { status: 401 });
    }

    await setTasksSessionCookie(user.id);
    return NextResponse.json({ user });
  } catch (error) {
    return tasksApiError(error, "Login failed.");
  }
}
