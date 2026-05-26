import { prisma } from "@/lib/prisma";
import {
  parseLineupRow,
  parseNumber,
  parseOpenListRow,
  toFinalRemarkTag,
} from "@/lib/domain/excel-import-shared";

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

  await prisma.$transaction(async (tx) => {
    for (let index = 0; index < openListRows.length; index += 1) {
      const record = parseOpenListRow(openListRows[index]);
      if (!record.storeName || !record.city || !record.state) continue;

      let store = await tx.store.findFirst({
        where: {
          storeName: record.storeName,
          city: record.city,
          state: record.state,
        },
      });

      if (!store) {
        store = await tx.store.create({
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
        store = await tx.store.update({
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

      await tx.openPosition.create({
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
    }
  });

  return { rowsImported, errors };
}

export async function importLineupBatch(
  lineupRows: Record<string, unknown>[],
  sourceFileName: string,
  rowOffset = 0,
): Promise<BatchResult> {
  const errors: string[] = [];
  let rowsImported = 0;

  await prisma.$transaction(async (tx) => {
    for (let index = 0; index < lineupRows.length; index += 1) {
      const record = parseLineupRow(lineupRows[index]);
      if (!record.name || !record.storeName) continue;

      const store = await tx.store.findFirst({
        where: {
          storeName: record.storeName,
          ...(record.city ? { city: record.city } : {}),
          ...(record.state ? { state: record.state } : {}),
        },
      });

      if (!store) {
        errors.push(
          `Lineup row ${rowOffset + index + 2}: store not found (${record.storeName}, ${record.city}, ${record.state})`,
        );
        continue;
      }

      const candidate = await tx.candidate.create({
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

      await tx.lineup.create({
        data: {
          storeId: store.id,
          candidateId: candidate.id,
          lineupDate: record.date ?? null,
          clientRemarks: record.clientRemarks || null,
          finalRemarks: record.finalRemarks || null,
          finalRemarkTag: toFinalRemarkTag(record.finalRemarks),
          feedbackDate: record.feedbackDate ?? null,
          tatForFeedback: record.tatForFeedback ?? null,
          remarks: record.remarks || null,
          sourceFileName,
          sourceRowNumber: rowOffset + index + 2,
        },
      });
      rowsImported += 1;
    }
  });

  return { rowsImported, errors };
}
