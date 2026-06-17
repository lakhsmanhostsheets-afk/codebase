export const IST_TIMEZONE = "Asia/Kolkata" as const;
export const IST_LOCALE = "en-IN" as const;

export function formatDateTimeIST(
  value: Date | string | null | undefined,
  options?: Intl.DateTimeFormatOptions,
): string {
  if (!value) return "—";
  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString(IST_LOCALE, {
    timeZone: IST_TIMEZONE,
    ...options,
  });
}

export function formatDueDateIST(dueAt: string | null) {
  return formatDateTimeIST(dueAt, {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** Parse datetime-local value (YYYY-MM-DDTHH:mm) as IST wall time. */
export function parseDueAtIST(value: string): Date {
  if (!value.trim()) return new Date(NaN);
  if (/[zZ]|[+-]\d{2}:\d{2}$/.test(value)) {
    return new Date(value);
  }
  const normalized = value.length === 16 ? `${value}:00` : value;
  return new Date(`${normalized}+05:30`);
}

/** Convert stored ISO timestamp to datetime-local input value in IST. */
export function toDatetimeLocalIST(isoString: string): string {
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) return "";
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: IST_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(date);
  const get = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((p) => p.type === type)?.value ?? "";
  return `${get("year")}-${get("month")}-${get("day")}T${get("hour")}:${get("minute")}`;
}
