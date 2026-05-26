import { NextResponse } from "next/server";
import { listStoresForSelect } from "@/lib/domain/data-entry";

export async function GET() {
  try {
    const stores = await listStoresForSelect();
    return NextResponse.json({ stores });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to load stores." },
      { status: 500 },
    );
  }
}
