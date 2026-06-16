import { NextResponse } from "next/server";
import { z } from "zod";
import {
  addCustomState,
  addCustomCity,
  ensureIndiaLocationsSeeded,
  listCities,
  listCountries,
  listStates,
} from "@/lib/domain/locations";

export async function GET(request: Request) {
  try {
    await ensureIndiaLocationsSeeded();
    const { searchParams } = new URL(request.url);
    const stateId = searchParams.get("stateId");
    const countryCode = searchParams.get("countryCode") || "IN";

    if (stateId) {
      const cities = await listCities(stateId);
      return NextResponse.json({ cities });
    }

    const [countries, states] = await Promise.all([
      listCountries(),
      listStates(countryCode),
    ]);
    return NextResponse.json({ countries, states });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to load locations." },
      { status: 500 },
    );
  }
}

const citySchema = z.object({
  type: z.literal("city").optional(),
  stateId: z.string().min(1),
  name: z.string().min(1),
});

const stateSchema = z.object({
  type: z.literal("state"),
  countryCode: z.string().min(2).default("IN"),
  name: z.string().min(1),
});

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    const parsedState = stateSchema.safeParse(payload);
    if (parsedState.success) {
      const state = await addCustomState(parsedState.data.countryCode, parsedState.data.name);
      return NextResponse.json({ state });
    }

    const body = citySchema.parse(payload);
    const city = await addCustomCity(body.stateId, body.name);
    return NextResponse.json({ city });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to add city." },
      { status: 400 },
    );
  }
}
