import { NextResponse } from "next/server";
import { z } from "zod";
import { deleteStoreRecord, updateStoreRecord } from "@/lib/domain/data-entry";

const storeSchema = z.object({
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
});

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    const body = storeSchema.parse(await request.json());
    const store = await updateStoreRecord(id, body);
    return NextResponse.json({ store });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update store." },
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
    await deleteStoreRecord(id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to delete store." },
      { status: 400 },
    );
  }
}
