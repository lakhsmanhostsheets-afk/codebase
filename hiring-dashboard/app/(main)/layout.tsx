import { AppSidebar } from "@/components/layout/app-sidebar";

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-dvh w-full overflow-hidden bg-slate-50">
      <AppSidebar />
      <div className="relative flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        {/* Subtle main-area backdrop */}
        <div
          className="pointer-events-none absolute inset-0 opacity-60"
          style={{
            backgroundImage:
              "radial-gradient(circle at 100% 0%, rgba(99,102,241,0.08) 0%, transparent 40%), radial-gradient(circle at 0% 100%, rgba(14,165,233,0.06) 0%, transparent 35%)",
          }}
        />
        <div className="relative z-10 flex min-h-0 flex-1 flex-col overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  );
}
