import { NextResponse } from "next/server";
import { parseFilters } from "@/lib/api";
import { formatDatabaseError } from "@/lib/db-connection-hint";
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
      { error: formatDatabaseError(error) },
      { status: 500 },
    );
  }
}
