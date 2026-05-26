import { NextResponse } from "next/server";
import { z } from "zod";
import {
  addCustomCity,
  listCities,
  listCountries,
  listStates,
} from "@/lib/domain/locations";

export async function GET(request: Request) {
  try {
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
  stateId: z.string().min(1),
  name: z.string().min(1),
});

export async function POST(request: Request) {
  try {
    const body = citySchema.parse(await request.json());
    const city = await addCustomCity(body.stateId, body.name);
    return NextResponse.json({ city });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to add city." },
      { status: 400 },
    );
  }
}
