import type { OpsFieldType } from "@prisma/client";
import { prisma } from "@/lib/prisma";

function slugify(label: string) {
  return label
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "");
}

export async function listFieldDefinitions(activeOnly = false) {
  return prisma.opsTaskFieldDefinition.findMany({
    where: activeOnly ? { isActive: true } : undefined,
    orderBy: { orderIndex: "asc" },
  });
}

export async function createFieldDefinition(input: {
  label: string;
  fieldType: OpsFieldType;
  optionsJson?: string | null;
  orderIndex?: number;
  isRequired?: boolean;
}) {
  const slug = slugify(input.label);
  const maxOrder = await prisma.opsTaskFieldDefinition.aggregate({
    _max: { orderIndex: true },
  });

  return prisma.opsTaskFieldDefinition.create({
    data: {
      label: input.label.trim(),
      slug: slug || `field_${Date.now()}`,
      fieldType: input.fieldType,
      optionsJson: input.optionsJson || null,
      orderIndex: input.orderIndex ?? (maxOrder._max.orderIndex ?? 0) + 1,
      isRequired: input.isRequired ?? false,
    },
  });
}

export async function updateFieldDefinition(
  id: string,
  input: Partial<{
    label: string;
    fieldType: OpsFieldType;
    optionsJson: string | null;
    orderIndex: number;
    isRequired: boolean;
    isActive: boolean;
  }>,
) {
  return prisma.opsTaskFieldDefinition.update({
    where: { id },
    data: {
      ...(input.label !== undefined ? { label: input.label.trim() } : {}),
      ...(input.fieldType !== undefined ? { fieldType: input.fieldType } : {}),
      ...(input.optionsJson !== undefined ? { optionsJson: input.optionsJson } : {}),
      ...(input.orderIndex !== undefined ? { orderIndex: input.orderIndex } : {}),
      ...(input.isRequired !== undefined ? { isRequired: input.isRequired } : {}),
      ...(input.isActive !== undefined ? { isActive: input.isActive } : {}),
    },
  });
}

export async function deleteFieldDefinition(id: string) {
  return prisma.opsTaskFieldDefinition.update({
    where: { id },
    data: { isActive: false },
  });
}
