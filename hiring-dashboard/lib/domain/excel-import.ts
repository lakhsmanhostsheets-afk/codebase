import { FinalRemark } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { extractWorkbookSheets } from "@/lib/domain/workbook-sheets";

type ImportResult = {
  rowsRead: number;
  rowsImported: number;
  errors: string[];
};

type StoreRow = {
  vertical?: string;
  dateOfOpen?: Date;
  project?: string;
  region?: string;
  state?: string;
  city?: string;
  accountName?: string;
  storeAddress?: string;
  storeName?: string;
  supervisor?: string;
  poa?: string;
  designation?: string;
  positionCount?: number;
  openPositionCount?: number;
  selectionDate?: Date;
};

type LineupRow = {
  date?: Date;
  recruiter?: string;
  name?: string;
  contactNo?: string;
  qualification?: string;
  currentOrganization?: string;
  designation?: string;
  experience?: string;
  currentSalary?: number;
  expectedSalary?: number;
  accountName?: string;
  storeAddress?: string;
  storeName?: string;
  city?: string;
  state?: string;
  clientRemarks?: string;
  finalRemarks?: string;
  feedbackDate?: Date;
  tatForFeedback?: number;
  remarks?: string;
};

function parseNumber(value: unknown): number | undefined {
  if (typeof value === "number") return value;
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return undefined;
    const n = Number(trimmed.replace(/,/g, ""));
    return Number.isFinite(n) ? n : undefined;
  }
  return undefined;
}

function parseDate(value: unknown): Date | undefined {
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value;
  if (typeof value === "string" && value.trim()) {
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) return parsed;
  }
  if (typeof value === "number") {
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) return parsed;
  }
  return undefined;
}

function normalize(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function toFinalRemarkTag(value?: string): FinalRemark {
  const normalized = (value || "").trim().toLowerCase();
  if (normalized === "interview pending") return FinalRemark.INTERVIEW_PENDING;
  if (normalized === "rejected") return FinalRemark.REJECTED;
  if (normalized === "final selection") return FinalRemark.FINAL_SELECTION;
  if (normalized === "client selected") return FinalRemark.CLIENT_SELECTED;
  if (normalized === "back out") return FinalRemark.BACK_OUT;
  if (normalized === "on hold") return FinalRemark.ON_HOLD;
  return FinalRemark.OTHER;
}

function parseOpenListRow(record: Record<string, unknown>): StoreRow {
  return {
    vertical: normalize(record.Vertical),
    dateOfOpen: parseDate(record["Date of Open"]),
    project: normalize(record.Project),
    region: normalize(record.Region),
    state: normalize(record.State),
    city: normalize(record.City),
    accountName: normalize(record["Account Name"]),
    storeAddress: normalize(record["Store Address"]),
    storeName: normalize(record["Store Name"]),
    supervisor: normalize(record.Supervisor),
    poa: normalize(record.POA),
    designation: normalize(record.Designation),
    positionCount: parseNumber(record["Position count"]),
    openPositionCount: parseNumber(record["Open Position Count"]),
    selectionDate: parseDate(record["Selection date"]),
  };
}

function parseLineupRow(record: Record<string, unknown>): LineupRow {
  return {
    date: parseDate(record.Date),
    recruiter: normalize(record.Recruiter),
    name: normalize(record.Name),
    contactNo: normalize(record["Contact No."]),
    qualification: normalize(record.Qualification),
    currentOrganization: normalize(record["Current /Previous Organisation"]),
    designation: normalize(record.Designation),
    experience: normalize(record.Experience),
    currentSalary: parseNumber(record["Current Salary"]),
    expectedSalary: parseNumber(record["Expected Salary"]),
    accountName: normalize(record["Account Name"]),
    storeAddress: normalize(record["Store Address"]),
    storeName: normalize(record["Store Name"]),
    city: normalize(record.City),
    state: normalize(record.State),
    clientRemarks: normalize(record["Client Remarks"]),
    finalRemarks: normalize(record["Final Remarks"]),
    feedbackDate: parseDate(record["Feedback Date"]),
    tatForFeedback: parseNumber(record["TAT For Feedback"]),
    remarks: normalize(record.Remarks),
  };
}

function storeCompositeKey(row: { storeName?: string; city?: string; state?: string }) {
  return `${(row.storeName || "").toLowerCase()}|${(row.city || "").toLowerCase()}|${(row.state || "").toLowerCase()}`;
}

export async function importParsedRows(
  openListRows: Record<string, unknown>[],
  lineupRows: Record<string, unknown>[],
  sourceFileName: string,
): Promise<ImportResult> {
  const errors: string[] = [];
  let rowsRead = 0;
  let rowsImported = 0;

  const importJob = await prisma.importJob.create({
    data: {
      sourceFileName,
      status: "running",
    },
  });

  try {
    rowsRead = openListRows.length + lineupRows.length;

    const storeIdByKey = new Map<string, string>();

    await prisma.$transaction(async (tx) => {
      for (let index = 0; index < openListRows.length; index += 1) {
        const record = parseOpenListRow(openListRows[index]);
        if (!record.storeName || !record.city || !record.state) {
          continue;
        }

        const key = storeCompositeKey(record);
        // There is no natural unique field in legacy file, so we fallback to find-first by composite.
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
              externalStoreId: null,
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

        storeIdByKey.set(key, store.id);

        await tx.openPosition.create({
          data: {
            storeId: store.id,
            designation: record.designation || "Unknown",
            positionCount: record.positionCount ?? 0,
            openPositionCount: record.openPositionCount ?? record.positionCount ?? 0,
            dateOfOpen: record.dateOfOpen ?? null,
            selectionDate: record.selectionDate ?? null,
            sourceFileName,
            sourceRowNumber: index + 2,
          },
        });
        rowsImported += 1;
      }

      for (let index = 0; index < lineupRows.length; index += 1) {
        const record = parseLineupRow(lineupRows[index]);
        if (!record.name || !record.storeName) {
          continue;
        }

        const key = storeCompositeKey({
          storeName: record.storeName,
          city: record.city,
          state: record.state,
        });

        const storeId = storeIdByKey.get(key);
        if (!storeId) {
          errors.push(
            `Lineup row ${index + 2}: store not matched (${record.storeName}, ${record.city}, ${record.state})`,
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
            storeId,
            candidateId: candidate.id,
            lineupDate: record.date ?? null,
            clientRemarks: record.clientRemarks || null,
            finalRemarks: record.finalRemarks || null,
            finalRemarkTag: toFinalRemarkTag(record.finalRemarks),
            feedbackDate: record.feedbackDate ?? null,
            tatForFeedback: record.tatForFeedback ?? null,
            remarks: record.remarks || null,
            sourceFileName,
            sourceRowNumber: index + 2,
          },
        });

        rowsImported += 1;
      }
    });

    await prisma.importJob.update({
      where: { id: importJob.id },
      data: {
        status: "completed",
        completedAt: new Date(),
        rowsRead,
        rowsImported,
        errorsCount: errors.length,
        errorsJson: errors.length ? JSON.stringify(errors) : null,
      },
    });
  } catch (error) {
    await prisma.importJob.update({
      where: { id: importJob.id },
      data: {
        status: "failed",
        completedAt: new Date(),
        rowsRead,
        rowsImported,
        errorsCount: errors.length + 1,
        errorsJson: JSON.stringify([
          ...errors,
          error instanceof Error ? error.message : "Unknown import error",
        ]),
      },
    });
    throw error;
  }

  return {
    rowsRead,
    rowsImported,
    errors,
  };
}

export async function importWorkbook(
  buffer: Buffer,
  sourceFileName: string,
): Promise<ImportResult> {
  const { openListRows, lineupRows } = extractWorkbookSheets(buffer);
  return importParsedRows(openListRows, lineupRows, sourceFileName);
}
