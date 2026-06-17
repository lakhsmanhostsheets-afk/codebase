import { PageHeader } from "@/components/layout/page-header";
import { TaskForm } from "@/components/tasks/task-form";
import { AccessDenied } from "@/components/tasks/access-denied";
import { requireTasksUser } from "@/lib/tasks/auth";
import { canCreateTasksForUser } from "@/lib/tasks/permissions";

export default async function NewTaskPage() {
  const user = await requireTasksUser();
  if (!canCreateTasksForUser(user)) {
    return (
      <>
        <PageHeader title="New Task" description="Create a task and assign it to yourself or a teammate." />
        <div className="p-6">
          <AccessDenied message="You do not have permission to create tasks." />
        </div>
      </>
    );
  }

  return (
    <>
      <PageHeader title="New Task" description="Create a task and assign it to yourself or a teammate." />
      <div className="p-6">
        <TaskForm mode="create" />
      </div>
    </>
  );
}
