"use client";

import { useActionState } from "react";
import { loginAction } from "@/app/login/actions";

const initialState = { error: "" };

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(loginAction, initialState);

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-indigo-950 via-indigo-900 to-slate-900 px-4">
      <form action={formAction} className="w-full max-w-sm space-y-4 rounded-2xl border border-white/10 bg-white p-8 shadow-xl">
        <div className="text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-cyan-500 font-heading text-lg font-bold text-white">
            V5
          </div>
          <h1 className="font-heading text-xl font-bold text-slate-900">V5 Global Solutions</h1>
          <p className="mt-1 text-sm text-slate-600">Recruitment Hub — admin sign in</p>
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
