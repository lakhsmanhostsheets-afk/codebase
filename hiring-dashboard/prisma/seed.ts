import { FinalRemark } from "@prisma/client";
import { prisma } from "@/lib/prisma";

async function main() {
  const store = await prisma.store.create({
    data: {
      accountName: "AOSmith",
      storeName: "VS RR Nagar",
      city: "Bengaluru",
      state: "Karnataka",
      address: "RR Nagar",
      supervisor: "Sudarshan",
      region: "SOUTH I",
      vertical: "R4",
    },
  });

  const openPosition = await prisma.openPosition.create({
    data: {
      storeId: store.id,
      designation: "ISP",
      positionCount: 1,
      openPositionCount: 1,
      sourceFileName: "seed",
    },
  });

  const candidate = await prisma.candidate.create({
    data: {
      name: "Sample Candidate",
      contactNumber: "9999999999",
      recruiter: "test",
      qualification: "BCom",
      city: "Bengaluru",
      state: "Karnataka",
    },
  });

  await prisma.lineup.create({
    data: {
      storeId: store.id,
      candidateId: candidate.id,
      finalRemarks: "Interview Pending",
      finalRemarkTag: FinalRemark.INTERVIEW_PENDING,
      sourceFileName: "seed",
    },
  });

  // Recompute open positions for seeded record.
  await prisma.openPosition.update({
    where: { id: openPosition.id },
    data: { openPositionCount: 1 },
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
