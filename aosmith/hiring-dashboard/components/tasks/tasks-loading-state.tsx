"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

const LOADING_QUOTES = [
  "Small wins compound into big outcomes.",
  "Progress beats perfection every day.",
  "Focus on one task and finish strong.",
  "Consistency is the real productivity hack.",
];

export function TasksLoadingState({ label = "Loading tasks..." }: { label?: string }) {
  const [quoteIndex, setQuoteIndex] = useState(0);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setQuoteIndex((index) => (index + 1) % LOADING_QUOTES.length);
    }, 2200);

    return () => window.clearInterval(interval);
  }, []);

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-center gap-3 text-indigo-600">
        <Loader2 className="h-5 w-5 animate-spin" />
        <p className="text-sm font-medium text-slate-700">{label}</p>
      </div>
      <p className="mt-3 text-sm text-slate-500">{LOADING_QUOTES[quoteIndex]}</p>

      <div className="mt-6 space-y-3">
        <div className="h-10 animate-pulse rounded-lg bg-slate-100" />
        <div className="h-10 animate-pulse rounded-lg bg-slate-100" />
        <div className="h-10 animate-pulse rounded-lg bg-slate-100" />
        <div className="h-10 animate-pulse rounded-lg bg-slate-100" />
      </div>
    </div>
  );
}
