import { prisma } from "@/lib/prisma";
import {
  INDIA_COUNTRY,
  INDIA_STATES_AND_CITIES,
} from "@/lib/data/india-locations";

export async function ensureIndiaLocationsSeeded() {
  let country = await prisma.country.findUnique({
    where: { code: INDIA_COUNTRY.code },
  });

  if (!country) {
    country = await prisma.country.create({
      data: { name: INDIA_COUNTRY.name, code: INDIA_COUNTRY.code },
    });
  }

  for (const [stateName, cities] of Object.entries(INDIA_STATES_AND_CITIES)) {
    let state = await prisma.state.findFirst({
      where: { countryId: country.id, name: stateName },
    });

    if (!state) {
      state = await prisma.state.create({
        data: { name: stateName, countryId: country.id },
      });
    }

    for (const cityName of cities) {
      await prisma.city.upsert({
        where: {
          stateId_name: { stateId: state.id, name: cityName },
        },
        create: { name: cityName, stateId: state.id, isCustom: false },
        update: {},
      });
    }
  }

  return country;
}

export async function listCountries() {
  await ensureIndiaLocationsSeeded();
  return prisma.country.findMany({ orderBy: { name: "asc" } });
}

export async function listStates(countryCode = "IN") {
  await ensureIndiaLocationsSeeded();
  return prisma.state.findMany({
    where: { country: { code: countryCode } },
    orderBy: { name: "asc" },
    include: { country: { select: { name: true, code: true } } },
  });
}

export async function listCities(stateId: string) {
  return prisma.city.findMany({
    where: { stateId },
    orderBy: { name: "asc" },
  });
}

export async function addCustomCity(stateId: string, name: string) {
  const trimmed = name.trim();
  if (!trimmed) throw new Error("City name is required.");

  const existing = await prisma.city.findFirst({
    where: { stateId, name: { equals: trimmed, mode: "insensitive" } },
  });
  if (existing) return existing;

  return prisma.city.create({
    data: { name: trimmed, stateId, isCustom: true },
  });
}
