import ExcelJS from "exceljs";
import { parseFilters } from "@/lib/api";
import { getStateBreakdown, getSummaryTotals } from "@/lib/domain/hiring-metrics";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const filters = parseFilters(searchParams);
  const [totals, states] = await Promise.all([
    getSummaryTotals(filters),
    getStateBreakdown(filters),
  ]);

  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Hiring Dashboard";
  workbook.created = new Date();

  const summarySheet = workbook.addWorksheet("Summary");
  summarySheet.columns = [
    { header: "Metric", key: "metric", width: 28 },
    { header: "Value", key: "value", width: 18 },
  ];
  summarySheet.addRows([
    { metric: "Total Count", value: totals.totalCount },
    { metric: "Open Position Count", value: totals.openPositionCount },
    { metric: "Line Up Count", value: totals.lineUpCount },
    { metric: "Feedback Awaited", value: totals.feedbackAwaited },
    { metric: "Rejected", value: totals.rejected },
    { metric: "Selected", value: totals.selected },
    { metric: "Shortlisted", value: totals.shortlisted },
    { metric: "Backed Out", value: totals.backedOut },
    { metric: "On Hold", value: totals.onHold },
  ]);

  const stateSheet = workbook.addWorksheet("State Breakdown");
  stateSheet.columns = [
    { header: "State", key: "state", width: 22 },
    { header: "Total Count", key: "totalCount", width: 18 },
    { header: "Open Position Count", key: "openPositionCount", width: 20 },
    { header: "Stores", key: "stores", width: 12 },
    { header: "Cities", key: "cities", width: 12 },
  ];
  stateSheet.addRows(states);

  const buffer = await workbook.xlsx.writeBuffer();
  return new Response(buffer, {
    headers: {
      "content-type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "content-disposition": `attachment; filename=\"hiring-dashboard-summary.xlsx\"`,
    },
  });
}
