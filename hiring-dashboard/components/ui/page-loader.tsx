import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export function PageLoader({
  label = "Loading…",
  className,
  overlay = false,
}: {
  label?: string;
  className?: string;
  overlay?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 text-indigo-700",
        overlay && "absolute inset-0 z-20 rounded-2xl bg-white/80 backdrop-blur-sm",
        className,
      )}
    >
      <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      <p className="text-sm font-medium text-slate-600">{label}</p>
    </div>
  );
}
