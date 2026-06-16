import { DashboardFilters } from "@/lib/domain/hiring-metrics";

export function parseFilters(searchParams: URLSearchParams): DashboardFilters {
  return {
    state: searchParams.get("state") || undefined,
    city: searchParams.get("city") || undefined,
    supervisor: searchParams.get("supervisor") || undefined,
    accountName: searchParams.get("accountName") || undefined,
    fromDate: searchParams.get("fromDate") || undefined,
    toDate: searchParams.get("toDate") || undefined,
  };
}
