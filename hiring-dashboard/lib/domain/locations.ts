import { prisma } from "@/lib/prisma";
import {
  INDIA_COUNTRY,
  INDIA_STATES_AND_CITIES,
} from "@/lib/data/india-locations";

let seedPromise: Promise<void> | null = null;

export async function ensureIndiaLocationsSeeded() {
  if (!seedPromise) {
    seedPromise = (async () => {
      let country = await prisma.country.findUnique({
        where: { code: INDIA_COUNTRY.code },
      });

      if (!country) {
        country = await prisma.country.create({
          data: { name: INDIA_COUNTRY.name, code: INDIA_COUNTRY.code },
        });
      }

      const stateCount = await prisma.state.count({
        where: { countryId: country.id },
      });
      if (stateCount > 0) return;

      for (const [stateName, cities] of Object.entries(INDIA_STATES_AND_CITIES)) {
        const state = await prisma.state.create({
          data: { name: stateName, countryId: country.id },
        });

        for (const cityName of cities) {
          await prisma.city.create({
            data: { name: cityName, stateId: state.id, isCustom: false },
          });
        }
      }
    })().catch((error) => {
      seedPromise = null;
      throw error;
    });
  }

  await seedPromise;
}

export async function listCountries() {
  return prisma.country.findMany({ orderBy: { name: "asc" } });
}

export async function listStates(countryCode = "IN") {
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

export async function addCustomState(countryCode: string, name: string) {
  const trimmed = name.trim();
  if (!trimmed) throw new Error("State name is required.");

  const country = await prisma.country.findUnique({
    where: { code: countryCode },
  });
  if (!country) throw new Error("Country not found.");

  const existing = await prisma.state.findFirst({
    where: {
      countryId: country.id,
      name: { equals: trimmed, mode: "insensitive" },
    },
  });
  if (existing) return existing;

  return prisma.state.create({
    data: { name: trimmed, countryId: country.id },
  });
}
