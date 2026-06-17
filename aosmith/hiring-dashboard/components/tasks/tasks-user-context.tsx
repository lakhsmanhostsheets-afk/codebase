"use client";

import { createContext, useContext } from "react";

export type TasksUser = {
  id: string;
  name: string;
  designation: string | null;
  email: string;
  role: "ADMIN" | "MEMBER";
  canCreateTask: boolean;
  canAssignTask: boolean;
  canViewAllTasks: boolean;
};

type TasksUserContextValue = {
  user: TasksUser | null;
  loading: boolean;
};

const TasksUserContext = createContext<TasksUserContextValue>({
  user: null,
  loading: true,
});

export function TasksUserProvider({
  user,
  loading,
  children,
}: TasksUserContextValue & { children: React.ReactNode }) {
  return <TasksUserContext.Provider value={{ user, loading }}>{children}</TasksUserContext.Provider>;
}

export function useTasksUser() {
  return useContext(TasksUserContext);
}
