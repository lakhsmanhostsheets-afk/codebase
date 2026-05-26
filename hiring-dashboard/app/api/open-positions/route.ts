import { NextResponse } from "next/server";
import { z } from "zod";
import {
  createOpenPositionRecord,
  listRecentOpenPositions,
} from "@/lib/domain/data-entry";

const createSchema = z.object({
  vertical: z.string().optional(),
  dateOfOpen: z.string().optional(),
  accountName: z.string().min(1),
  region: z.string().optional(),
  state: z.string().min(1),
  city: z.string().min(1),
  storeAddress: z.string().min(1),
  storeName: z.string().min(1),
  supervisor: z.string().optional(),
  poa: z.string().optional(),
  designation: z.string().min(1),
  positionCount: z.coerce.number().int().min(1),
});

export async function GET() {
  try {
    const rows = await listRecentOpenPositions();
    return NextResponse.json({ rows });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to load positions." },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = createSchema.parse(await request.json());
    const row = await createOpenPositionRecord(body);
    return NextResponse.json({ row });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to save open position." },
      { status: 400 },
    );
  }
}
