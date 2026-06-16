/** Fuzzy store lookup for lineup → open list joins (Store Name + City + State). */

export type StoreMatchInput = {
  storeName: string;
  city?: string;
  state?: string;
  accountName?: string;
};

export type StoreMatchRecord = {
  id: string;
  storeName: string;
  city: string;
  state: string;
  accountName: string;
};

const STATE_ALIASES: Record<string, string> = {
  maharastra: "maharashtra",
  gujrat: "gujarat",
  bangalore: "bengaluru",
  bengalore: "bengaluru",
  delhi: "delhi ncr",
  "new delhi": "delhi",
};

const EMPTY_LOCATION = new Set(["", "-", "na", "n/a", "none", "."]);

export function normalizeLocationPart(value?: string): string {
  const raw = (value || "").trim().replace(/\s+/g, " ");
  if (!raw || EMPTY_LOCATION.has(raw.toLowerCase())) return "";
  const lower = raw.toLowerCase();
  return STATE_ALIASES[lower] || lower;
}

export function normalizeStoreName(value?: string): string {
  return (value || "")
    .trim()
    .replace(/\s+/g, " ")
    .replace(/\s*-\s*/g, " - ")
    .toLowerCase();
}

/** e.g. "Surat - Piplod" → city hint "Surat" */
export function guessCityFromStoreName(storeName?: string): string {
  const parts = (storeName || "").split(/\s*-\s*/);
  if (parts.length < 2) return "";
  const hint = parts[0].trim();
  if (!hint || hint.length < 2 || EMPTY_LOCATION.has(hint.toLowerCase())) return "";
  return hint;
}

export function compositeKey(storeName: string, city?: string, state?: string): string {
  return `${normalizeStoreName(storeName)}|${normalizeLocationPart(city)}|${normalizeLocationPart(state)}`;
}

export class StoreIndex {
  private readonly byComposite = new Map<string, StoreMatchRecord>();
  private readonly byName = new Map<string, StoreMatchRecord[]>();

  constructor(stores: StoreMatchRecord[]) {
    for (const store of stores) {
      this.byComposite.set(
        compositeKey(store.storeName, store.city, store.state),
        store,
      );

      const nameKey = normalizeStoreName(store.storeName);
      const bucket = this.byName.get(nameKey) ?? [];
      bucket.push(store);
      this.byName.set(nameKey, bucket);
    }
  }

  static fromRecords(
    records: Array<{
      storeName?: string;
      city?: string;
      state?: string;
      accountName?: string;
    }>,
  ): StoreIndex {
    const stores: StoreMatchRecord[] = [];
    const seen = new Set<string>();

    for (const record of records) {
      if (!record.storeName) continue;
      const key = compositeKey(record.storeName, record.city, record.state);
      if (seen.has(key)) continue;
      seen.add(key);
      stores.push({
        id: key,
        storeName: record.storeName,
        city: record.city || "",
        state: record.state || "",
        accountName: record.accountName || "",
      });
    }

    return new StoreIndex(stores);
  }

  find(input: StoreMatchInput): StoreMatchRecord | null {
    const name = normalizeStoreName(input.storeName);
    const city =
      normalizeLocationPart(input.city) ||
      normalizeLocationPart(guessCityFromStoreName(input.storeName));
    const state = normalizeLocationPart(input.state);
    const account = normalizeLocationPart(input.accountName);

    if (!name) return null;

    const exact = this.byComposite.get(`${name}|${city}|${state}`);
    if (exact) return exact;

    if (city && state) {
      for (const store of this.allStores()) {
        if (
          compositeKey(store.storeName, store.city, store.state) ===
          `${name}|${city}|${state}`
        ) {
          return store;
        }
      }
    }

    const byName = this.byName.get(name) ?? [];
    let candidates = byName;

    if (candidates.length === 0) {
      candidates = this.fuzzyNameMatches(name);
    }

    if (candidates.length === 0) return null;

    if (city) {
      const withCity = candidates.filter((s) => normalizeLocationPart(s.city) === city);
      if (withCity.length === 1) return withCity[0];
      if (withCity.length > 1) candidates = withCity;
    }

    if (state) {
      const withState = candidates.filter((s) => normalizeLocationPart(s.state) === state);
      if (withState.length === 1) return withState[0];
      if (withState.length > 1) candidates = withState;
    }

    if (account) {
      const withAccount = candidates.filter(
        (s) => normalizeLocationPart(s.accountName) === account,
      );
      if (withAccount.length === 1) return withAccount[0];
      if (withAccount.length > 1) candidates = withAccount;
    }

    if (candidates.length === 1) return candidates[0];

    if (!city && !state && candidates.length > 1) {
      return null;
    }

    return candidates[0] ?? null;
  }

  private fuzzyNameMatches(name: string): StoreMatchRecord[] {
    const hits: StoreMatchRecord[] = [];
    for (const [key, stores] of this.byName) {
      if (key === name || key.includes(name) || name.includes(key)) {
        hits.push(...stores);
      }
    }
    return hits;
  }

  private allStores(): StoreMatchRecord[] {
    const out: StoreMatchRecord[] = [];
    for (const stores of this.byName.values()) {
      out.push(...stores);
    }
    return out;
  }
}

export async function loadStoreIndexFromDb(
  prisma: {
    store: {
      findMany: (args: {
        select: {
          id: true;
          storeName: true;
          city: true;
          state: true;
          accountName: true;
        };
      }) => Promise<StoreMatchRecord[]>;
    };
  },
): Promise<StoreIndex> {
  const stores = await prisma.store.findMany({
    select: {
      id: true,
      storeName: true,
      city: true,
      state: true,
      accountName: true,
    },
  });
  return new StoreIndex(stores);
}
