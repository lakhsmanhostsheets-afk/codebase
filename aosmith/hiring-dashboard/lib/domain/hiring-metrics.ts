import { FinalRemark, Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export type DashboardFilters = {
  state?: string;
  city?: string;
  supervisor?: string;
  accountName?: string;
  fromDate?: string;
  toDate?: string;
};

function buildStoreWhere(filters: DashboardFilters): Prisma.StoreWhereInput {
  const where: Prisma.StoreWhereInput = {};
  if (filters.state) {
    where.state = { equals: filters.state.trim(), mode: "insensitive" };
  }
  if (filters.city) {
    where.city = { equals: filters.city.trim(), mode: "insensitive" };
  }
  if (filters.supervisor) {
    where.supervisor = { equals: filters.supervisor.trim(), mode: "insensitive" };
  }
  if (filters.accountName) {
    where.accountName = { equals: filters.accountName.trim(), mode: "insensitive" };
  }
  return where;
}

function buildDateWhere(filters: DashboardFilters): Prisma.OpenPositionWhereInput {
  if (!filters.fromDate && !filters.toDate) return {};
  return {
    dateOfOpen: {
      ...(filters.fromDate ? { gte: new Date(filters.fromDate) } : {}),
      ...(filters.toDate ? { lte: new Date(`${filters.toDate}T23:59:59.999Z`) } : {}),
    },
  };
}

export async function getSummaryTotals(filters: DashboardFilters) {
  const whereStore = buildStoreWhere(filters);
  const whereDate = buildDateWhere(filters);
  const whereOpenPosition = { store: whereStore, ...whereDate };

  const [openPositionTotals, openPositionStores] = await Promise.all([
    prisma.openPosition.aggregate({
      where: whereOpenPosition,
      _sum: {
        positionCount: true,
        openPositionCount: true,
      },
    }),
    prisma.openPosition.groupBy({
      by: ["storeId"],
      where: whereOpenPosition,
    }),
  ]);

  const storeIds = openPositionStores.map((row) => row.storeId);
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
    totalCount: openPositionTotals._sum.positionCount ?? 0,
    openPositionCount: openPositionTotals._sum.openPositionCount ?? 0,
    lineUpCount: lineups.reduce((sum, row) => sum + row._count._all, 0),
    ...finalRemarkTotals,
  };
}

export async function getStateBreakdown(filters: DashboardFilters) {
  const whereStore = buildStoreWhere(filters);
  const whereDate = buildDateWhere(filters);
  const whereOpenPosition = { store: whereStore, ...whereDate };

  const groupedByStore = await prisma.openPosition.groupBy({
    by: ["storeId"],
    where: whereOpenPosition,
    _sum: {
      positionCount: true,
      openPositionCount: true,
    },
  });

  if (!groupedByStore.length) return [];

  const stores = await prisma.store.findMany({
    where: { id: { in: groupedByStore.map((row) => row.storeId) } },
    select: {
      id: true,
      state: true,
      city: true,
    },
  });
  const storeById = new Map(stores.map((store) => [store.id, store]));

  const grouped = new Map<
    string,
    {
      state: string;
      totalCount: number;
      openPositionCount: number;
      storeIds: Set<string>;
      cities: Set<string>;
    }
  >();

  for (const row of groupedByStore) {
    const store = storeById.get(row.storeId);
    if (!store) continue;
    const state = store.state.trim() || "(blank)";
    if (!grouped.has(state)) {
      grouped.set(state, {
        state,
        totalCount: 0,
        openPositionCount: 0,
        storeIds: new Set<string>(),
        cities: new Set<string>(),
      });
    }
    const item = grouped.get(state)!;
    item.totalCount += row._sum.positionCount ?? 0;
    item.openPositionCount += row._sum.openPositionCount ?? 0;
    item.storeIds.add(store.id);
    if (store.city) item.cities.add(store.city.trim());
  }

  return [...grouped.values()]
    .map((item) => ({
      state: item.state,
      totalCount: item.totalCount,
      openPositionCount: item.openPositionCount,
      stores: item.storeIds.size,
      cities: item.cities.size,
    }))
    .sort((a, b) => b.totalCount - a.totalCount);
}

export async function getFilterOptions() {
  const stores = await prisma.store.findMany({
    select: { state: true, city: true, supervisor: true, accountName: true },
  });
  const uniq = (values: string[]) =>
    [...new Set(values.map((v) => v.trim()).filter(Boolean))].sort((a, b) =>
      a.localeCompare(b),
    );

  return {
    states: uniq(stores.map((s) => s.state)),
    cities: uniq(stores.map((s) => s.city)),
    supervisors: uniq(stores.map((s) => s.supervisor || "")),
    accounts: uniq(stores.map((s) => s.accountName)),
  };
}
