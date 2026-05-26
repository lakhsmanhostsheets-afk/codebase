"use client";

import { useActionState } from "react";
import { loginAction } from "@/app/login/actions";

const initialState = { error: "" };

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(loginAction, initialState);

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-indigo-950 via-indigo-900 to-slate-900 px-4">
      <form action={formAction} className="w-full max-w-sm space-y-4 rounded-2xl border border-white/10 bg-white p-8 shadow-xl">
        <div>
          <h1 className="text-xl font-semibold">Admin Login</h1>
          <p className="text-sm text-muted-foreground">
            Sign in with the admin credentials from environment variables.
          </p>
        </div>

        <input
          name="email"
          type="email"
          required
          placeholder="Email"
          className="h-10 w-full rounded-md border px-3 text-sm"
        />
        <input
          name="password"
          type="password"
          required
          placeholder="Password"
          className="h-10 w-full rounded-md border px-3 text-sm"
        />

        {state.error ? <p className="text-sm text-red-600">{state.error}</p> : null}

        <button
          type="submit"
          disabled={pending}
          className="h-10 w-full rounded-md bg-primary text-sm font-medium text-primary-foreground"
        >
          {pending ? "Signing in..." : "Sign In"}
        </button>
      </form>
    </main>
  );
}
