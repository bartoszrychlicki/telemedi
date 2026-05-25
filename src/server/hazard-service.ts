import { db } from "@/lib/db";
import { ApiError } from "@/lib/api";
import type { HazardCategory } from "@/generated/prisma/enums";

export async function listHazards(companyId: string) {
  return db.hazardFactor.findMany({
    where: {
      OR: [{ isSystem: true }, { companyId }],
    },
    orderBy: [{ category: "asc" }, { isSystem: "desc" }, { name: "asc" }],
  });
}

export async function createCompanyHazards(
  companyId: string,
  category: HazardCategory,
  names: string[],
) {
  const cleanNames = [...new Set(names.map((name) => name.trim()).filter(Boolean))];

  await db.hazardFactor.createMany({
    data: cleanNames.map((name) => ({
      companyId,
      category,
      name,
      isSystem: false,
    })),
    skipDuplicates: true,
  });

  return listHazards(companyId);
}

export async function updateCompanyHazard(
  companyId: string,
  hazardId: string,
  name: string,
) {
  const hazard = await db.hazardFactor.findFirst({
    where: { id: hazardId, companyId, isSystem: false },
    select: { id: true },
  });

  if (!hazard) {
    throw new ApiError(404, "hazard_not_found", "Czynnik firmowy nie istnieje.");
  }

  return db.hazardFactor.update({
    where: { id: hazardId },
    data: { name },
  });
}

export async function deleteCompanyHazard(companyId: string, hazardId: string) {
  const hazard = await db.hazardFactor.findFirst({
    where: { id: hazardId, companyId, isSystem: false },
    select: { id: true },
  });

  if (!hazard) {
    throw new ApiError(404, "hazard_not_found", "Czynnik firmowy nie istnieje.");
  }

  await db.hazardFactor.delete({ where: { id: hazardId } });
}

export async function listSystemHazards() {
  return db.hazardFactor.findMany({
    where: { isSystem: true },
    orderBy: [{ category: "asc" }, { name: "asc" }],
  });
}

export async function createSystemHazards(category: HazardCategory, names: string[]) {
  const cleanNames = [...new Set(names.map((name) => name.trim()).filter(Boolean))];

  await db.hazardFactor.createMany({
    data: cleanNames.map((name) => ({
      category,
      name,
      isSystem: true,
      companyId: null,
    })),
    skipDuplicates: true,
  });

  return listSystemHazards();
}

export async function updateSystemHazard(hazardId: string, name: string) {
  const hazard = await db.hazardFactor.findFirst({
    where: { id: hazardId, isSystem: true },
    select: { id: true },
  });

  if (!hazard) {
    throw new ApiError(404, "hazard_not_found", "Czynnik systemowy nie istnieje.");
  }

  return db.hazardFactor.update({ where: { id: hazardId }, data: { name } });
}

export async function deleteSystemHazard(hazardId: string) {
  const hazard = await db.hazardFactor.findFirst({
    where: { id: hazardId, isSystem: true },
    select: { id: true },
  });

  if (!hazard) {
    throw new ApiError(404, "hazard_not_found", "Czynnik systemowy nie istnieje.");
  }

  await db.hazardFactor.delete({ where: { id: hazardId } });
}
