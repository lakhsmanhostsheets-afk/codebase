"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

export function NavigationProgress() {
  const pathname = usePathname();
  const [active, setActive] = useState(false);

  useEffect(() => {
    setActive(true);
    const timer = setTimeout(() => setActive(false), 500);
    return () => clearTimeout(timer);
  }, [pathname]);

  if (!active) return null;

  return (
    <div className="pointer-events-none absolute left-0 right-0 top-0 z-50 h-1 overflow-hidden">
      <div className="h-full w-full origin-left animate-[navload_0.5s_ease-out] bg-gradient-to-r from-indigo-500 via-violet-500 to-cyan-400" />
    </div>
  );
}
