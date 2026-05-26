import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { parseFilters } from "@/lib/api";
import { getStateBreakdown, getSummaryTotals } from "@/lib/domain/hiring-metrics";

export const runtime = "nodejs";

const BRAND = rgb(0.18, 0.22, 0.55);
const BRAND_LIGHT = rgb(0.93, 0.94, 0.99);
const TEXT = rgb(0.15, 0.17, 0.22);
const MUTED = rgb(0.45, 0.48, 0.55);
const WHITE = rgb(1, 1, 1);
const AMBER = rgb(0.85, 0.55, 0.1);

function drawFilterLine(
  page: ReturnType<PDFDocument["addPage"]>,
  font: Awaited<ReturnType<PDFDocument["embedFont"]>>,
  filters: ReturnType<typeof parseFilters>,
  y: number,
) {
  const parts = [
    filters.state && `State: ${filters.state}`,
    filters.city && `City: ${filters.city}`,
    filters.supervisor && `Supervisor: ${filters.supervisor}`,
    filters.accountName && `Account: ${filters.accountName}`,
    filters.fromDate && `From: ${filters.fromDate}`,
    filters.toDate && `To: ${filters.toDate}`,
  ].filter(Boolean);
  const text = parts.length ? parts.join("  ·  ") : "All data (no filters)";
  page.drawText(text, { x: 40, y, size: 9, font, color: MUTED, maxWidth: 760 });
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const filters = parseFilters(searchParams);
  const [totals, states] = await Promise.all([
    getSummaryTotals(filters),
    getStateBreakdown(filters),
  ]);

  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([842, 595]);
  const { width, height } = page.getSize();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const bold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const generated = new Date().toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });

  page.drawRectangle({ x: 0, y: height - 88, width, height: 88, color: BRAND });
  page.drawText("V5 Global Solutions", {
    x: 40,
    y: height - 42,
    size: 11,
    font: bold,
    color: rgb(0.75, 0.82, 1),
  });
  page.drawText("Hiring Dashboard Report", {
    x: 40,
    y: height - 62,
    size: 22,
    font: bold,
    color: WHITE,
  });
  page.drawText(`Generated ${generated}`, {
    x: 40,
    y: height - 78,
    size: 9,
    font,
    color: rgb(0.85, 0.88, 0.95),
  });

  let y = height - 108;
  drawFilterLine(page, font, filters, y);
  y -= 28;

  const kpiCards = [
    { label: "Total Positions", value: totals.totalCount, accent: rgb(0.35, 0.45, 0.95) },
    { label: "Open Positions", value: totals.openPositionCount, accent: AMBER },
    { label: "Profiles Shared", value: totals.lineUpCount, accent: rgb(0.55, 0.35, 0.85) },
    { label: "Feedback Awaited", value: totals.feedbackAwaited, accent: rgb(0.2, 0.65, 0.75) },
    { label: "Selected", value: totals.selected, accent: rgb(0.2, 0.65, 0.45) },
    { label: "Rejected", value: totals.rejected, accent: rgb(0.85, 0.35, 0.35) },
  ];

  const cardW = 120;
  const cardH = 52;
  const gap = 12;
  let x = 40;
  for (const card of kpiCards) {
    page.drawRectangle({
      x,
      y: y - cardH,
      width: cardW,
      height: cardH,
      color: BRAND_LIGHT,
      borderColor: rgb(0.88, 0.9, 0.96),
      borderWidth: 1,
    });
    page.drawRectangle({ x, y: y - 6, width: cardW, height: 6, color: card.accent });
    page.drawText(card.label, {
      x: x + 8,
      y: y - 22,
      size: 8,
      font,
      color: MUTED,
      maxWidth: cardW - 16,
    });
    page.drawText(String(card.value), {
      x: x + 8,
      y: y - 40,
      size: 18,
      font: bold,
      color: TEXT,
    });
    x += cardW + gap;
  }

  y -= cardH + 24;

  const pipeline = [
    ["Shortlisted", totals.shortlisted],
    ["Backed Out", totals.backedOut],
    ["On Hold", totals.onHold],
  ];
  page.drawText("Pipeline detail", { x: 40, y, size: 11, font: bold, color: TEXT });
  y -= 16;
  for (const [label, value] of pipeline) {
    page.drawText(`${label}: ${value}`, { x: 48, y, size: 10, font, color: TEXT });
    y -= 14;
  }

  y -= 10;
  page.drawText("State breakdown", { x: 40, y, size: 12, font: bold, color: TEXT });
  y -= 18;

  const colX = { state: 48, total: 280, open: 360, stores: 440, cities: 520 };
  page.drawRectangle({ x: 40, y: y - 4, width: width - 80, height: 18, color: BRAND });
  const headers: [string, number][] = [
    ["State", colX.state],
    ["Total", colX.total],
    ["Open", colX.open],
    ["Stores", colX.stores],
    ["Cities", colX.cities],
  ];
  for (const [label, xPos] of headers) {
    page.drawText(label, { x: xPos, y: y, size: 9, font: bold, color: WHITE });
  }
  y -= 20;

  let rowIndex = 0;
  for (const row of states) {
    if (y < 48) break;
    if (rowIndex % 2 === 0) {
      page.drawRectangle({
        x: 40,
        y: y - 4,
        width: width - 80,
        height: 16,
        color: rgb(0.97, 0.98, 1),
      });
    }
    page.drawText(row.state, { x: colX.state, y, size: 9, font, color: TEXT, maxWidth: 220 });
    page.drawText(String(row.totalCount), { x: colX.total, y, size: 9, font, color: TEXT });
    page.drawText(String(row.openPositionCount), { x: colX.open, y, size: 9, font, color: AMBER });
    page.drawText(String(row.stores), { x: colX.stores, y, size: 9, font, color: TEXT });
    page.drawText(String(row.cities), { x: colX.cities, y, size: 9, font, color: TEXT });
    y -= 16;
    rowIndex += 1;
  }

  if (states.length > 20) {
    page.drawText(`Showing first 20 of ${states.length} states`, {
      x: 40,
      y: 28,
      size: 8,
      font,
      color: MUTED,
    });
  }

  page.drawText("Confidential — V5 Global Solutions Recruitment Hub", {
    x: 40,
    y: 16,
    size: 8,
    font,
    color: MUTED,
  });

  const bytes = await pdfDoc.save();
  return new Response(Buffer.from(bytes), {
    headers: {
      "content-type": "application/pdf",
      "content-disposition": 'attachment; filename="v5-hiring-report.pdf"',
    },
  });
}
