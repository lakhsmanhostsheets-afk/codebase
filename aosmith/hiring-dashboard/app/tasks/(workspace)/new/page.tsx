import { PageHeader } from "@/components/layout/page-header";
import { TaskForm } from "@/components/tasks/task-form";

export default function NewTaskPage() {
  return (
    <>
      <PageHeader title="New Task" description="Create a task and assign it to yourself or a teammate." />
      <div className="p-6">
        <TaskForm mode="create" />
      </div>
    </>
  );
}
