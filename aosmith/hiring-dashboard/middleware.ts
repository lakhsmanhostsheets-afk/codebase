import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { TASKS_SESSION_COOKIE } from "@/lib/tasks/constants";
import { parseTasksSessionTokenEdge } from "@/lib/tasks/session-edge";

const SESSION_COOKIE = "hd_session";

function expectedHiringToken() {
  const email = process.env.ADMIN_EMAIL || "";
  const password = process.env.ADMIN_PASSWORD || "";
  return btoa(`${email}:${password}`);
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/_next") || pathname === "/favicon.ico") {
    return NextResponse.next();
  }

  if (pathname.startsWith("/tasks") || pathname.startsWith("/api/tasks")) {
    if (
      pathname === "/tasks/login" ||
      pathname.startsWith("/api/tasks/auth/login")
    ) {
      return NextResponse.next();
    }

    if (pathname.startsWith("/api/tasks")) {
      return NextResponse.next();
    }

    const token = request.cookies.get(TASKS_SESSION_COOKIE)?.value;
    const session = token ? await parseTasksSessionTokenEdge(token) : null;
    if (!session) {
      return NextResponse.redirect(new URL("/tasks/login", request.url));
    }

    return NextResponse.next();
  }

  if (pathname.startsWith("/login") || pathname.startsWith("/api")) {
    return NextResponse.next();
  }

  const token = request.cookies.get(SESSION_COOKIE)?.value;
  if (token !== expectedHiringToken()) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
