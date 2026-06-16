import { NextResponse } from "next/server";

export function tasksApiError(error: unknown, fallback = "Request failed.") {
  const message = error instanceof Error ? error.message : fallback;
  if (message === "Unauthorized") {
    return NextResponse.json({ error: message }, { status: 401 });
  }
  if (message === "Forbidden") {
    return NextResponse.json({ error: message }, { status: 403 });
  }
  return NextResponse.json({ error: message }, { status: 400 });
}
