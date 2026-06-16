import { NextResponse } from "next/server";
import { z } from "zod";
import { createLineupRecord, listLineups } from "@/lib/domain/data-entry";

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

const querySchema = z.object({
  query: z.string().optional(),
  state: z.string().optional(),
  city: z.string().optional(),
  storeId: z.string().optional(),
  finalRemarkTag: z.string().optional(),
  page: z.coerce.number().int().min(1).optional(),
  pageSize: z.coerce.number().int().min(1).max(100).optional(),
});

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = querySchema.parse({
      query: searchParams.get("query") ?? undefined,
      state: searchParams.get("state") ?? undefined,
      city: searchParams.get("city") ?? undefined,
      storeId: searchParams.get("storeId") ?? undefined,
      finalRemarkTag: searchParams.get("finalRemarkTag") ?? undefined,
      page: searchParams.get("page") ?? undefined,
      pageSize: searchParams.get("pageSize") ?? undefined,
    });
    const data = await listLineups(query);
    return NextResponse.json(data);
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
