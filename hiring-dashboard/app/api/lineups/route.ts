import { NextResponse } from "next/server";
import { z } from "zod";
import { createLineupRecord, listRecentLineups } from "@/lib/domain/data-entry";

const createSchema = z.object({
  storeId: z.string().min(1),
  lineupDate: z.string().optional(),
  recruiter: z.string().optional(),
  name: z.string().min(1),
  contactNumber: z.string().optional(),
  qualification: z.string().optional(),
  designation: z.string().optional(),
  currentOrganization: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  clientRemarks: z.string().optional(),
  finalRemarks: z.string().min(1),
  finalRemarkTag: z.string().optional(),
  feedbackDate: z.string().optional(),
  remarks: z.string().optional(),
});

export async function GET() {
  try {
    const rows = await listRecentLineups();
    return NextResponse.json({ rows });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to load lineups." },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = createSchema.parse(await request.json());
    const row = await createLineupRecord(body);
    return NextResponse.json({ row });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to save lineup." },
      { status: 400 },
    );
  }
}
