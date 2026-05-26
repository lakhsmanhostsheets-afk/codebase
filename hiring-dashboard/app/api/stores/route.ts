import { NextResponse } from "next/server";
import { z } from "zod";
import { listAllStores } from "@/lib/domain/data-entry";
import { prisma } from "@/lib/prisma";

const storeSchema = z.object({
  accountName: z.string().min(1),
  storeName: z.string().min(1),
  country: z.string().optional(),
  state: z.string().min(1),
  city: z.string().min(1),
  address: z.string().min(1),
  supervisor: z.string().optional(),
  poa: z.string().optional(),
  region: z.string().optional(),
  vertical: z.string().optional(),
});

export async function GET() {
  try {
    const stores = await listAllStores();
    return NextResponse.json({ stores });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to load stores." },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = storeSchema.parse(await request.json());
    const store = await prisma.store.create({
      data: {
        accountName: body.accountName.trim(),
        storeName: body.storeName.trim(),
        country: body.country?.trim() || "India",
        city: body.city.trim(),
        state: body.state.trim(),
        address: body.address.trim(),
        supervisor: body.supervisor?.trim() || null,
        poa: body.poa?.trim() || null,
        region: body.region?.trim() || null,
        vertical: body.vertical?.trim() || null,
      },
    });
    return NextResponse.json({ store });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create store." },
      { status: 400 },
    );
  }
}
