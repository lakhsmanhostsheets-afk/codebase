import { NextResponse } from "next/server";
import { z } from "zod";
import { requireTasksUser } from "@/lib/tasks/auth";
import { tasksApiError } from "@/lib/tasks/api";
import { addTaskNote, listTaskNotes } from "@/lib/tasks/notes";

const noteSchema = z.object({ body: z.string().min(1) });

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: RouteContext) {
  try {
    const user = await requireTasksUser();
    const { id } = await context.params;
    const notes = await listTaskNotes(id, user.id, user);
    if (!notes) {
      return NextResponse.json({ error: "Task not found." }, { status: 404 });
    }
    return NextResponse.json({ notes });
  } catch (error) {
    return tasksApiError(error);
  }
}

export async function POST(request: Request, context: RouteContext) {
  try {
    const user = await requireTasksUser();
    const { id } = await context.params;
    const body = noteSchema.parse(await request.json());
    const note = await addTaskNote(id, user.id, user, body.body);
    if (!note) {
      return NextResponse.json({ error: "Task not found." }, { status: 404 });
    }
    return NextResponse.json({ note });
  } catch (error) {
    return tasksApiError(error, "Failed to add note.");
  }
}
