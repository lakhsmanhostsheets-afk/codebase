import { NextResponse } from "next/server";
import { z } from "zod";
import {
  deleteOpenPositionRecord,
  updateOpenPositionRecord,
} from "@/lib/domain/data-entry";

const updateSchema = z.object({
  designation: z.string().min(1).optional(),
  positionCount: z.coerce.number().int().min(0).optional(),
  openPositionCount: z.coerce.number().int().min(0).optional(),
  dateOfOpen: z.string().nullable().optional(),
  selectionDate: z.string().nullable().optional(),
  store: z
    .object({
      accountName: z.string().min(1),
      storeName: z.string().min(1),
      country: z.string().optional(),
      state: z.string().min(1),
      city: z.string().min(1),
      address: z.string().min(1),
      supervisor: z.string().optional(),
      poa: z.string().optional(),
      region: z.string().optional(),
      vertical: z.string().optional(),
    })
    .optional(),
});

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    const body = updateSchema.parse(await request.json());
    const row = await updateOpenPositionRecord(id, body);
    return NextResponse.json({ row });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update position." },
      { status: 400 },
    );
  }
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    await deleteOpenPositionRecord(id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to delete position." },
      { status: 400 },
    );
  }
}
