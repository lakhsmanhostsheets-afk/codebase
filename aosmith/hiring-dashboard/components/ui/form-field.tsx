import { cn } from "@/lib/utils";

type FormFieldProps = {
  label: string;
  children: React.ReactNode;
  className?: string;
  hint?: string;
};

export function FormField({ label, children, className, hint }: FormFieldProps) {
  return (
    <label className={cn("block space-y-1.5", className)}>
      <span className="text-sm font-medium text-slate-700">{label}</span>
      {children}
      {hint ? <span className="block text-xs text-slate-500">{hint}</span> : null}
    </label>
  );
}

export const inputClassName =
  "h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm shadow-sm outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100";
