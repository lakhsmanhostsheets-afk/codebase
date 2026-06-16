import { NextResponse } from "next/server";
import { z } from "zod";
import type { OpsFieldType } from "@prisma/client";
import { requireTasksAdmin } from "@/lib/tasks/auth";
import { tasksApiError } from "@/lib/tasks/api";
import {
  createFieldDefinition,
  deleteFieldDefinition,
  listFieldDefinitions,
  updateFieldDefinition,
} from "@/lib/tasks/fields";

const createSchema = z.object({
  label: z.string().min(1),
  fieldType: z.enum(["TEXT", "NUMBER", "DATE", "SELECT"]),
  optionsJson: z.string().nullable().optional(),
  orderIndex: z.number().optional(),
  isRequired: z.boolean().optional(),
});

const updateSchema = createSchema.partial().extend({
  isActive: z.boolean().optional(),
});

export async function GET(request: Request) {
  try {
    await requireTasksAdmin();
    const activeOnly = new URL(request.url).searchParams.get("activeOnly") === "true";
    const fields = await listFieldDefinitions(activeOnly);
    return NextResponse.json({ fields });
  } catch (error) {
    return tasksApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    await requireTasksAdmin();
    const body = createSchema.parse(await request.json());
    const field = await createFieldDefinition({
      ...body,
      fieldType: body.fieldType as OpsFieldType,
    });
    return NextResponse.json({ field });
  } catch (error) {
    return tasksApiError(error, "Failed to create field.");
  }
}

export async function PATCH(request: Request) {
  try {
    await requireTasksAdmin();
    const body = updateSchema.parse(await request.json());
    const id = new URL(request.url).searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "id is required." }, { status: 400 });
    }
    const field = await updateFieldDefinition(id, {
      ...body,
      fieldType: body.fieldType as OpsFieldType | undefined,
    });
    return NextResponse.json({ field });
  } catch (error) {
    return tasksApiError(error, "Failed to update field.");
  }
}

export async function DELETE(request: Request) {
  try {
    await requireTasksAdmin();
    const id = new URL(request.url).searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "id is required." }, { status: 400 });
    }
    const field = await deleteFieldDefinition(id);
    return NextResponse.json({ field });
  } catch (error) {
    return tasksApiError(error, "Failed to delete field.");
  }
}
