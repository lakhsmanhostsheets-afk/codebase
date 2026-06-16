import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const widgetSchema = z.object({
  title: z.string(),
  widgetType: z.string(),
  configJson: z.string(),
  orderIndex: z.number().int(),
});

const dashboardSchema = z.object({
  name: z.string().min(2),
  isDefault: z.boolean().optional().default(false),
  filtersJson: z.string(),
  layoutJson: z.string(),
  widgets: z.array(widgetSchema),
});

export async function GET() {
  const dashboards = await prisma.dashboard.findMany({
    include: { widgets: { orderBy: { orderIndex: "asc" } } },
    orderBy: { updatedAt: "desc" },
  });
  return NextResponse.json({ dashboards });
}

export async function POST(request: Request) {
  try {
    const payload = dashboardSchema.parse(await request.json());
    const dashboard = await prisma.dashboard.create({
      data: {
        name: payload.name,
        isDefault: payload.isDefault,
        filtersJson: payload.filtersJson,
        layoutJson: payload.layoutJson,
        widgets: {
          create: payload.widgets,
        },
      },
      include: { widgets: true },
    });
    return NextResponse.json({ dashboard });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Invalid dashboard payload." },
      { status: 400 },
    );
  }
}
