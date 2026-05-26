import { NextResponse } from "next/server";
import { z } from "zod";
import { deleteLineupRecord, updateLineupRecord } from "@/lib/domain/data-entry";

const updateSchema = z.object({
  storeId: z.string().min(1),
  lineupDate: z.string().optional(),
  recruiter: z.string().optional(),
  name: z.string().min(1),
  contactNumber: z.string().optional(),
  qualification: z.string().optional(),
  currentOrganization: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  clientRemarks: z.string().optional(),
  finalRemarks: z.string().min(1),
  finalRemarkTag: z.string().optional(),
  feedbackDate: z.string().optional(),
  remarks: z.string().optional(),
});

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    const body = updateSchema.parse(await request.json());
    const row = await updateLineupRecord(id, body);
    return NextResponse.json({ row });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update lineup." },
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
    await deleteLineupRecord(id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to delete lineup." },
      { status: 400 },
    );
  }
}
