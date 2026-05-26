import { FinalRemark, Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export function parseFinalRemarkTag(value: string): FinalRemark {
  const normalized = value.trim().toUpperCase();
  if (Object.values(FinalRemark).includes(normalized as FinalRemark)) {
    return normalized as FinalRemark;
  }
  const byLabel: Record<string, FinalRemark> = {
    "INTERVIEW PENDING": FinalRemark.INTERVIEW_PENDING,
    REJECTED: FinalRemark.REJECTED,
    "FINAL SELECTION": FinalRemark.FINAL_SELECTION,
    "CLIENT SELECTED": FinalRemark.CLIENT_SELECTED,
    "BACK OUT": FinalRemark.BACK_OUT,
    "ON HOLD": FinalRemark.ON_HOLD,
  };
  return byLabel[value.trim().toUpperCase()] ?? FinalRemark.OTHER;
}

export type OpenPositionInput = {
  vertical?: string;
  dateOfOpen?: string;
  accountName: string;
  region?: string;
  state: string;
  city: string;
  storeAddress: string;
  storeName: string;
  supervisor?: string;
  poa?: string;
  designation: string;
  positionCount: number;
};

export async function createOpenPositionRecord(input: OpenPositionInput) {
  let store = await prisma.store.findFirst({
    where: {
      storeName: input.storeName.trim(),
      city: input.city.trim(),
      state: input.state.trim(),
    },
  });

  if (!store) {
    store = await prisma.store.create({
      data: {
        accountName: input.accountName.trim(),
        storeName: input.storeName.trim(),
        country: "India",
        city: input.city.trim(),
        state: input.state.trim(),
        address: input.storeAddress.trim(),
        supervisor: input.supervisor?.trim() || null,
        poa: input.poa?.trim() || null,
        region: input.region?.trim() || null,
        vertical: input.vertical?.trim() || null,
      },
    });
  }

  const position = await prisma.openPosition.create({
    data: {
      storeId: store.id,
      designation: input.designation.trim(),
      positionCount: input.positionCount,
      openPositionCount: input.positionCount,
      dateOfOpen: input.dateOfOpen ? new Date(input.dateOfOpen) : null,
      sourceFileName: "ui-entry",
    },
    include: { store: true },
  });

  return position;
}

export type LineupInput = {
  storeId: string;
  lineupDate?: string;
  recruiter?: string;
  name: string;
  contactNumber?: string;
  qualification?: string;
  designation?: string;
  currentOrganization?: string;
  city?: string;
  state?: string;
  clientRemarks?: string;
  finalRemarks: string;
  finalRemarkTag?: string;
  feedbackDate?: string;
  remarks?: string;
};

export async function createLineupRecord(input: LineupInput) {
  const candidate = await prisma.candidate.create({
    data: {
      name: input.name.trim(),
      contactNumber: input.contactNumber?.trim() || null,
      recruiter: input.recruiter?.trim() || null,
      qualification: input.qualification?.trim() || null,
      currentOrganization: input.currentOrganization?.trim() || null,
      city: input.city?.trim() || null,
      state: input.state?.trim() || null,
    },
  });

  const tag = input.finalRemarkTag
    ? parseFinalRemarkTag(input.finalRemarkTag)
    : parseFinalRemarkTag(input.finalRemarks);

  const lineup = await prisma.lineup.create({
    data: {
      storeId: input.storeId,
      candidateId: candidate.id,
      lineupDate: input.lineupDate ? new Date(input.lineupDate) : new Date(),
      clientRemarks: input.clientRemarks?.trim() || null,
      finalRemarks: input.finalRemarks.trim(),
      finalRemarkTag: tag,
      feedbackDate: input.feedbackDate ? new Date(input.feedbackDate) : null,
      remarks: input.remarks?.trim() || null,
      sourceFileName: "ui-entry",
    },
    include: {
      store: true,
      candidate: true,
    },
  });

  if (tag === FinalRemark.FINAL_SELECTION) {
    await prisma.openPosition.updateMany({
      where: {
        storeId: input.storeId,
        openPositionCount: { gt: 0 },
      },
      data: {
        openPositionCount: { decrement: 1 },
      },
    });
  }

  return lineup;
}

export async function listStoresForSelect() {
  return prisma.store.findMany({
    orderBy: [{ state: "asc" }, { city: "asc" }, { storeName: "asc" }],
    select: {
      id: true,
      storeName: true,
      city: true,
      state: true,
      address: true,
      accountName: true,
      supervisor: true,
    },
  });
}

export async function listRecentOpenPositions(limit = 100) {
  return prisma.openPosition.findMany({
    take: limit,
    orderBy: { createdAt: "desc" },
    include: {
      store: true,
    },
  });
}

export type OpenPositionsQuery = {
  query?: string;
  state?: string;
  city?: string;
  designation?: string;
  page?: number;
  pageSize?: number;
};

export async function listOpenPositions(query: OpenPositionsQuery) {
  const page = Math.max(1, query.page ?? 1);
  const pageSize = Math.min(100, Math.max(1, query.pageSize ?? 20));
  const skip = (page - 1) * pageSize;
  const text = query.query?.trim();

  const where: Prisma.OpenPositionWhereInput = {
    ...(query.state || query.city
      ? {
          store: {
            ...(query.state ? { state: query.state } : {}),
            ...(query.city ? { city: query.city } : {}),
          },
        }
      : {}),
    ...(query.designation ? { designation: query.designation } : {}),
    ...(text
      ? {
          OR: [
            { designation: { contains: text, mode: "insensitive" } },
            { store: { storeName: { contains: text, mode: "insensitive" } } },
            { store: { city: { contains: text, mode: "insensitive" } } },
            { store: { state: { contains: text, mode: "insensitive" } } },
            { store: { supervisor: { contains: text, mode: "insensitive" } } },
            { store: { accountName: { contains: text, mode: "insensitive" } } },
          ],
        }
      : {}),
  };

  const [total, rows, states, cities, designations] = await prisma.$transaction([
    prisma.openPosition.count({ where }),
    prisma.openPosition.findMany({
      where,
      skip,
      take: pageSize,
      orderBy: { createdAt: "desc" },
      include: { store: true },
    }),
    prisma.store.findMany({
      where: { openPositions: { some: {} } },
      select: { state: true },
      distinct: ["state"],
      orderBy: { state: "asc" },
    }),
    prisma.store.findMany({
      where: { openPositions: { some: {} } },
      select: { city: true },
      distinct: ["city"],
      orderBy: { city: "asc" },
    }),
    prisma.openPosition.findMany({
      select: { designation: true },
      distinct: ["designation"],
      orderBy: { designation: "asc" },
    }),
  ]);

  return {
    rows,
    total,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
    filters: {
      states: states.map((row) => row.state).filter(Boolean),
      cities: cities.map((row) => row.city).filter(Boolean),
      designations: designations.map((row) => row.designation).filter(Boolean),
    },
  };
}

export async function listRecentLineups(limit = 100) {
  return prisma.lineup.findMany({
    take: limit,
    orderBy: { createdAt: "desc" },
    include: {
      store: true,
      candidate: true,
    },
  });
}

export type LineupsQuery = {
  query?: string;
  state?: string;
  city?: string;
  storeId?: string;
  finalRemarkTag?: string;
  page?: number;
  pageSize?: number;
};

export async function listLineups(query: LineupsQuery) {
  const page = Math.max(1, query.page ?? 1);
  const pageSize = Math.min(100, Math.max(1, query.pageSize ?? 20));
  const skip = (page - 1) * pageSize;
  const text = query.query?.trim();

  const where: Prisma.LineupWhereInput = {
    ...(query.storeId ? { storeId: query.storeId } : {}),
    ...(query.finalRemarkTag ? { finalRemarkTag: parseFinalRemarkTag(query.finalRemarkTag) } : {}),
    ...(query.state || query.city
      ? {
          store: {
            ...(query.state ? { state: query.state } : {}),
            ...(query.city ? { city: query.city } : {}),
          },
        }
      : {}),
    ...(text
      ? {
          OR: [
            { finalRemarks: { contains: text, mode: "insensitive" } },
            { remarks: { contains: text, mode: "insensitive" } },
            { candidate: { name: { contains: text, mode: "insensitive" } } },
            { candidate: { recruiter: { contains: text, mode: "insensitive" } } },
            { candidate: { contactNumber: { contains: text, mode: "insensitive" } } },
            { store: { storeName: { contains: text, mode: "insensitive" } } },
            { store: { city: { contains: text, mode: "insensitive" } } },
            { store: { state: { contains: text, mode: "insensitive" } } },
          ],
        }
      : {}),
  };

  const [total, rows, states, cities] = await prisma.$transaction([
    prisma.lineup.count({ where }),
    prisma.lineup.findMany({
      where,
      skip,
      take: pageSize,
      orderBy: { createdAt: "desc" },
      include: { store: true, candidate: true },
    }),
    prisma.store.findMany({
      where: { lineups: { some: {} } },
      select: { state: true },
      distinct: ["state"],
      orderBy: { state: "asc" },
    }),
    prisma.store.findMany({
      where: { lineups: { some: {} } },
      select: { city: true },
      distinct: ["city"],
      orderBy: { city: "asc" },
    }),
  ]);

  return {
    rows,
    total,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
    filters: {
      states: states.map((row) => row.state).filter(Boolean),
      cities: cities.map((row) => row.city).filter(Boolean),
    },
  };
}

export type StoreInput = {
  accountName: string;
  storeName: string;
  country?: string;
  state: string;
  city: string;
  address: string;
  supervisor?: string;
  poa?: string;
  region?: string;
  vertical?: string;
};

export async function listAllStores() {
  return prisma.store.findMany({
    orderBy: [{ state: "asc" }, { city: "asc" }, { storeName: "asc" }],
    include: {
      _count: { select: { openPositions: true, lineups: true } },
    },
  });
}

export async function updateStoreRecord(id: string, input: StoreInput) {
  return prisma.store.update({
    where: { id },
    data: {
      accountName: input.accountName.trim(),
      storeName: input.storeName.trim(),
      country: input.country?.trim() || "India",
      city: input.city.trim(),
      state: input.state.trim(),
      address: input.address.trim(),
      supervisor: input.supervisor?.trim() || null,
      poa: input.poa?.trim() || null,
      region: input.region?.trim() || null,
      vertical: input.vertical?.trim() || null,
    },
  });
}

export async function deleteStoreRecord(id: string) {
  return prisma.store.delete({ where: { id } });
}

export type OpenPositionUpdate = {
  designation?: string;
  positionCount?: number;
  openPositionCount?: number;
  dateOfOpen?: string | null;
  selectionDate?: string | null;
  store?: StoreInput;
};

export async function updateOpenPositionRecord(id: string, input: OpenPositionUpdate) {
  const existing = await prisma.openPosition.findUnique({
    where: { id },
    include: { store: true },
  });
  if (!existing) throw new Error("Open position not found.");

  if (input.store) {
    await updateStoreRecord(existing.storeId, input.store);
  }

  return prisma.openPosition.update({
    where: { id },
    data: {
      ...(input.designation !== undefined ? { designation: input.designation.trim() } : {}),
      ...(input.positionCount !== undefined ? { positionCount: input.positionCount } : {}),
      ...(input.openPositionCount !== undefined
        ? { openPositionCount: input.openPositionCount }
        : {}),
      ...(input.dateOfOpen !== undefined
        ? { dateOfOpen: input.dateOfOpen ? new Date(input.dateOfOpen) : null }
        : {}),
      ...(input.selectionDate !== undefined
        ? { selectionDate: input.selectionDate ? new Date(input.selectionDate) : null }
        : {}),
    },
    include: { store: true },
  });
}

export async function deleteOpenPositionRecord(id: string) {
  return prisma.openPosition.delete({ where: { id } });
}

export type LineupUpdate = LineupInput & { candidateId?: string };

export async function updateLineupRecord(id: string, input: LineupUpdate) {
  const existing = await prisma.lineup.findUnique({
    where: { id },
    include: { candidate: true },
  });
  if (!existing) throw new Error("Lineup not found.");

  const tag = input.finalRemarkTag
    ? parseFinalRemarkTag(input.finalRemarkTag)
    : parseFinalRemarkTag(input.finalRemarks);

  await prisma.candidate.update({
    where: { id: existing.candidateId },
    data: {
      name: input.name.trim(),
      contactNumber: input.contactNumber?.trim() || null,
      recruiter: input.recruiter?.trim() || null,
      qualification: input.qualification?.trim() || null,
      currentOrganization: input.currentOrganization?.trim() || null,
      city: input.city?.trim() || null,
      state: input.state?.trim() || null,
    },
  });

  return prisma.lineup.update({
    where: { id },
    data: {
      storeId: input.storeId,
      lineupDate: input.lineupDate ? new Date(input.lineupDate) : existing.lineupDate,
      clientRemarks: input.clientRemarks?.trim() || null,
      finalRemarks: input.finalRemarks.trim(),
      finalRemarkTag: tag,
      feedbackDate: input.feedbackDate ? new Date(input.feedbackDate) : null,
      remarks: input.remarks?.trim() || null,
    },
    include: { store: true, candidate: true },
  });
}

export async function deleteLineupRecord(id: string) {
  const lineup = await prisma.lineup.findUnique({ where: { id } });
  if (!lineup) throw new Error("Lineup not found.");
  await prisma.lineup.delete({ where: { id } });
  await prisma.candidate.delete({ where: { id: lineup.candidateId } });
}
