import { NextResponse } from "next/server";
import { parseFilters } from "@/lib/api";
import { getStateBreakdown, getSummaryTotals } from "@/lib/domain/hiring-metrics";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const filters = parseFilters(searchParams);
    const [totals, states] = await Promise.all([
      getSummaryTotals(filters),
      getStateBreakdown(filters),
    ]);
    return NextResponse.json({ totals, states });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not fetch dashboard data." },
      { status: 500 },
    );
  }
}
