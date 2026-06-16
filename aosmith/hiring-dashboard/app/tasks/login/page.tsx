"use client";

import { useActionState } from "react";
import { tasksLoginAction } from "@/app/tasks/login/actions";

const initialState = { error: "" };

export default function TasksLoginPage() {
  const [state, formAction, pending] = useActionState(tasksLoginAction, initialState);

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-950 px-4">
      <form
        action={formAction}
        className="w-full max-w-sm space-y-4 rounded-2xl border border-white/10 bg-white p-8 shadow-xl"
      >
        <div className="text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 font-heading text-lg font-bold text-white">
            T
          </div>
          <h1 className="font-heading text-xl font-bold text-slate-900">Task Tracker</h1>
          <p className="mt-1 text-sm text-slate-600">Sign in to manage your tasks</p>
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
          className="h-10 w-full rounded-md bg-emerald-600 text-sm font-medium text-white"
        >
          {pending ? "Signing in..." : "Sign In"}
        </button>

        <p className="text-center text-xs text-slate-500">
          First admin is created from TASKS_ADMIN_EMAIL / TASKS_ADMIN_PASSWORD env vars.
        </p>
      </form>
    </main>
  );
}
