import { TasksSidebar } from "@/components/tasks/tasks-sidebar";

export default function TasksWorkspaceLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-dvh w-full overflow-hidden bg-slate-50">
      <TasksSidebar />
      <div className="min-h-0 min-w-0 flex-1 overflow-y-auto">{children}</div>
    </div>
  );
}
