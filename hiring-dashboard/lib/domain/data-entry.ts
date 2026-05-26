import { FinalRemark } from "@prisma/client";
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
    const openPositions = await prisma.openPosition.findMany({
      where: { storeId: input.storeId },
      orderBy: { createdAt: "desc" },
    });
    for (const op of openPositions) {
      const nextOpen = Math.max(0, op.openPositionCount - 1);
      await prisma.openPosition.update({
        where: { id: op.id },
        data: { openPositionCount: nextOpen },
      });
    }
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

export async function listRecentOpenPositions(limit = 50) {
  return prisma.openPosition.findMany({
    take: limit,
    orderBy: { createdAt: "desc" },
    include: {
      store: true,
    },
  });
}

export async function listRecentLineups(limit = 50) {
  return prisma.lineup.findMany({
    take: limit,
    orderBy: { createdAt: "desc" },
    include: {
      store: true,
      candidate: true,
    },
  });
}
