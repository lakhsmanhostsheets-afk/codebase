import { FinalRemark } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export type DashboardFilters = {
  state?: string;
  city?: string;
  supervisor?: string;
  accountName?: string;
  fromDate?: string;
  toDate?: string;
};

function buildStoreWhere(filters: DashboardFilters) {
  return {
    ...(filters.state ? { state: filters.state } : {}),
    ...(filters.city ? { city: filters.city } : {}),
    ...(filters.supervisor ? { supervisor: filters.supervisor } : {}),
    ...(filters.accountName ? { accountName: filters.accountName } : {}),
  };
}

export async function getSummaryTotals(filters: DashboardFilters) {
  const whereStore = buildStoreWhere(filters);
  const whereDate =
    filters.fromDate || filters.toDate
      ? {
          dateOfOpen: {
            ...(filters.fromDate ? { gte: new Date(filters.fromDate) } : {}),
            ...(filters.toDate ? { lte: new Date(filters.toDate) } : {}),
          },
        }
      : {};

  const openPositions = await prisma.openPosition.findMany({
    where: { store: whereStore, ...whereDate },
    select: {
      positionCount: true,
      openPositionCount: true,
      storeId: true,
    },
  });

  const storeIds = [...new Set(openPositions.map((x) => x.storeId))];
  const lineups = storeIds.length
    ? await prisma.lineup.groupBy({
        by: ["finalRemarkTag", "storeId"],
        where: { storeId: { in: storeIds } },
        _count: { _all: true },
      })
    : [];

  const finalRemarkTotals = {
    feedbackAwaited: 0,
    rejected: 0,
    selected: 0,
    shortlisted: 0,
    backedOut: 0,
    onHold: 0,
  };

  for (const row of lineups) {
    if (row.finalRemarkTag === FinalRemark.INTERVIEW_PENDING) {
      finalRemarkTotals.feedbackAwaited += row._count._all;
    } else if (row.finalRemarkTag === FinalRemark.REJECTED) {
      finalRemarkTotals.rejected += row._count._all;
    } else if (row.finalRemarkTag === FinalRemark.FINAL_SELECTION) {
      finalRemarkTotals.selected += row._count._all;
    } else if (row.finalRemarkTag === FinalRemark.CLIENT_SELECTED) {
      finalRemarkTotals.shortlisted += row._count._all;
    } else if (row.finalRemarkTag === FinalRemark.BACK_OUT) {
      finalRemarkTotals.backedOut += row._count._all;
    } else if (row.finalRemarkTag === FinalRemark.ON_HOLD) {
      finalRemarkTotals.onHold += row._count._all;
    }
  }

  return {
    totalCount: openPositions.reduce((sum, row) => sum + row.positionCount, 0),
    openPositionCount: openPositions.reduce(
      (sum, row) => sum + row.openPositionCount,
      0,
    ),
    lineUpCount: lineups.reduce((sum, row) => sum + row._count._all, 0),
    ...finalRemarkTotals,
  };
}

export async function getStateBreakdown(filters: DashboardFilters) {
  const whereStore = buildStoreWhere(filters);

  const rows = await prisma.openPosition.findMany({
    where: { store: whereStore },
    select: {
      positionCount: true,
      openPositionCount: true,
      store: {
        select: {
          state: true,
          city: true,
        },
      },
    },
  });

  const grouped = new Map<
    string,
    {
      state: string;
      totalCount: number;
      openPositionCount: number;
      stores: number;
      cities: Set<string>;
    }
  >();

  for (const row of rows) {
    const state = row.store.state.trim() || "(blank)";
    if (!grouped.has(state)) {
      grouped.set(state, {
        state,
        totalCount: 0,
        openPositionCount: 0,
        stores: 0,
        cities: new Set<string>(),
      });
    }
    const item = grouped.get(state)!;
    item.totalCount += row.positionCount;
    item.openPositionCount += row.openPositionCount;
    item.stores += 1;
    if (row.store.city) item.cities.add(row.store.city.trim());
  }

  return [...grouped.values()]
    .map((item) => ({
      state: item.state,
      totalCount: item.totalCount,
      openPositionCount: item.openPositionCount,
      stores: item.stores,
      cities: item.cities.size,
    }))
    .sort((a, b) => b.totalCount - a.totalCount);
}
