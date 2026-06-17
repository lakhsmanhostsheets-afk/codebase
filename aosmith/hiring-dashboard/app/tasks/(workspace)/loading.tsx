import { PageLoader } from "@/components/ui/page-loader";

export default function TasksWorkspaceLoading() {
  return (
    <div className="p-6">
      <PageLoader label="Loading workspace..." />
    </div>
  );
}
