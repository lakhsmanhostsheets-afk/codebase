import { NextResponse } from "next/server";
import { clearTasksSessionCookie } from "@/lib/tasks/auth";

export async function POST() {
  await clearTasksSessionCookie();
  return NextResponse.json({ ok: true });
}
