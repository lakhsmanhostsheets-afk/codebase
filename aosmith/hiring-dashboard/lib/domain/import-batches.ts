import { prisma } from "@/lib/prisma";
import {
  parseLineupRow,
  parseNumber,
  parseOpenListRow,
  toFinalRemarkTag,
} from "@/lib/domain/excel-import-shared";
import {
  guessCityFromStoreName,
  loadStoreIndexFromDb,
  normalizeLocationPart,
  type StoreIndex,
} from "@/lib/domain/store-matching";

export type BatchResult = {
  rowsImported: number;
  errors: string[];
};

export async function importOpenListBatch(
  openListRows: Record<string, unknown>[],
  sourceFileName: string,
  rowOffset = 0,
): Promise<BatchResult> {
  const errors: string[] = [];
  let rowsImported = 0;

  for (let index = 0; index < openListRows.length; index += 1) {
    const record = parseOpenListRow(openListRows[index]);
    if (!record.storeName || !record.city || !record.state) continue;

    try {
      let store = await prisma.store.findFirst({
        where: {
          storeName: { equals: record.storeName, mode: "insensitive" },
          city: { equals: record.city, mode: "insensitive" },
          state: { equals: record.state, mode: "insensitive" },
        },
      });

      if (!store) {
        store = await prisma.store.create({
          data: {
            accountName: record.accountName || "Unknown",
            storeName: record.storeName,
            city: record.city,
            state: record.state,
            address: record.storeAddress || "",
            supervisor: record.supervisor || null,
            poa: record.poa || null,
            region: record.region || null,
            vertical: record.vertical || null,
          },
        });
      } else {
        store = await prisma.store.update({
          where: { id: store.id },
          data: {
            accountName: record.accountName || "Unknown",
            address: record.storeAddress || "",
            supervisor: record.supervisor || null,
            poa: record.poa || null,
            region: record.region || null,
            vertical: record.vertical || null,
          },
        });
      }

      await prisma.openPosition.create({
        data: {
          storeId: store.id,
          designation: record.designation || "Unknown",
          positionCount: record.positionCount ?? 0,
          openPositionCount: record.openPositionCount ?? record.positionCount ?? 0,
          dateOfOpen: record.dateOfOpen ?? null,
          selectionDate: record.selectionDate ?? null,
          sourceFileName,
          sourceRowNumber: rowOffset + index + 2,
        },
      });
      rowsImported += 1;
    } catch (error) {
      errors.push(
        `Open list row ${rowOffset + index + 2}: ${error instanceof Error ? error.message : "import failed"}`,
      );
    }
  }

  return { rowsImported, errors };
}

export async function importLineupBatch(
  lineupRows: Record<string, unknown>[],
  sourceFileName: string,
  rowOffset = 0,
  storeIndex?: StoreIndex,
): Promise<BatchResult> {
  const errors: string[] = [];
  let rowsImported = 0;
  const index = storeIndex ?? (await loadStoreIndexFromDb(prisma));

  for (let rowIndex = 0; rowIndex < lineupRows.length; rowIndex += 1) {
    const record = parseLineupRow(lineupRows[rowIndex]);
    if (!record.name || !record.storeName) continue;

    try {
      let store =
        index.find({
          storeName: record.storeName,
          city: record.city,
          state: record.state,
          accountName: record.accountName,
        }) ?? null;

      if (!store) {
        const city =
          normalizeLocationPart(record.city) ||
          normalizeLocationPart(guessCityFromStoreName(record.storeName));
        const state = normalizeLocationPart(record.state);

        if (city || state) {
          const created = await prisma.store.create({
            data: {
              accountName: record.accountName || "Unknown",
              storeName: record.storeName,
              city: city || "Unknown",
              state: state || "Unknown",
              address: record.storeAddress || "",
            },
          });
          store = {
            id: created.id,
            storeName: created.storeName,
            city: created.city,
            state: created.state,
            accountName: created.accountName,
          };
        }
      }

      if (!store) {
        errors.push(
          `Lineup row ${rowOffset + rowIndex + 2}: store not found (${record.storeName}, ${record.city}, ${record.state})`,
        );
        continue;
      }

      const dbStore = await prisma.store.findUnique({ where: { id: store.id } });
      if (!dbStore) {
        errors.push(
          `Lineup row ${rowOffset + rowIndex + 2}: store id missing (${record.storeName})`,
        );
        continue;
      }

      const candidate = await prisma.candidate.create({
        data: {
          name: record.name,
          contactNumber: record.contactNo || null,
          recruiter: record.recruiter || null,
          qualification: record.qualification || null,
          currentOrganization: record.currentOrganization || null,
          experienceYears: parseNumber(record.experience) ?? null,
          currentSalary: record.currentSalary ?? null,
          expectedSalary: record.expectedSalary ?? null,
          city: record.city || null,
          state: record.state || null,
        },
      });

      await prisma.lineup.create({
        data: {
          storeId: dbStore.id,
          candidateId: candidate.id,
          lineupDate: record.date ?? null,
          clientRemarks: record.clientRemarks || null,
          finalRemarks: record.finalRemarks || null,
          finalRemarkTag: toFinalRemarkTag(record.finalRemarks),
          feedbackDate: record.feedbackDate ?? null,
          tatForFeedback: record.tatForFeedback ?? null,
          remarks: record.remarks || null,
          sourceFileName,
          sourceRowNumber: rowOffset + rowIndex + 2,
        },
      });
      rowsImported += 1;
    } catch (error) {
      errors.push(
        `Lineup row ${rowOffset + rowIndex + 2}: ${error instanceof Error ? error.message : "import failed"}`,
      );
    }
  }

  return { rowsImported, errors };
}
