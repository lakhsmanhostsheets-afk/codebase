import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
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

  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([842, 595]);
  const { height } = page.getSize();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const bold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  let y = height - 36;

  page.drawText("Hiring Dashboard Report", {
    x: 32,
    y,
    size: 20,
    font: bold,
    color: rgb(0.1, 0.1, 0.1),
  });
  y -= 28;

  const summaryRows = [
    ["Total Count", String(totals.totalCount)],
    ["Open Position Count", String(totals.openPositionCount)],
    ["Line Up Count", String(totals.lineUpCount)],
    ["Feedback Awaited", String(totals.feedbackAwaited)],
    ["Rejected", String(totals.rejected)],
    ["Selected", String(totals.selected)],
    ["Shortlisted", String(totals.shortlisted)],
    ["Backed Out", String(totals.backedOut)],
    ["On Hold", String(totals.onHold)],
  ];

  page.drawText("Summary", { x: 32, y, size: 13, font: bold });
  y -= 18;
  for (const [metric, value] of summaryRows) {
    page.drawText(`${metric}: ${value}`, { x: 40, y, size: 11, font });
    y -= 14;
  }

  y -= 8;
  page.drawText("State Breakdown", { x: 32, y, size: 13, font: bold });
  y -= 16;
  page.drawText("State", { x: 40, y, size: 10, font: bold });
  page.drawText("Total", { x: 260, y, size: 10, font: bold });
  page.drawText("Open", { x: 320, y, size: 10, font: bold });
  page.drawText("Stores", { x: 390, y, size: 10, font: bold });
  page.drawText("Cities", { x: 460, y, size: 10, font: bold });
  y -= 12;

  for (const row of states.slice(0, 20)) {
    if (y < 36) break;
    page.drawText(row.state, { x: 40, y, size: 9, font });
    page.drawText(String(row.totalCount), { x: 260, y, size: 9, font });
    page.drawText(String(row.openPositionCount), { x: 320, y, size: 9, font });
    page.drawText(String(row.stores), { x: 390, y, size: 9, font });
    page.drawText(String(row.cities), { x: 460, y, size: 9, font });
    y -= 11;
  }

  const bytes = await pdfDoc.save();
  return new Response(Buffer.from(bytes), {
    headers: {
      "content-type": "application/pdf",
      "content-disposition": "attachment; filename=\"hiring-dashboard-report.pdf\"",
    },
  });
}
