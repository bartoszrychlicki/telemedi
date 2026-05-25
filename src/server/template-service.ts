import { db } from "@/lib/db";
import { ApiError } from "@/lib/api";
import type { templateCreateSchema } from "@/server/schemas";
import type { z } from "zod";

type TemplateInput = z.infer<typeof templateCreateSchema>;

export async function listTemplates(companyId: string) {
  return db.template.findMany({
    where: { companyId },
    orderBy: { createdAt: "desc" },
    include: {
      hazardFactors: {
        include: {
          hazardFactor: true,
        },
      },
    },
  });
}

export async function createTemplate(companyId: string, input: TemplateInput) {
  await assertHazardsAccessible(
    companyId,
    input.hazardFactors.map((item) => item.hazardFactorId),
  );

  return db.template.create({
    data: {
      companyId,
      name: input.name,
      positionDescription: input.positionDescription ?? null,
      workDescription: input.workDescription ?? null,
      hazardFactors: {
        create: input.hazardFactors.map((item) => ({
          hazardFactorId: item.hazardFactorId,
          defaultExposureValue: item.defaultExposureValue ?? null,
          defaultMeasurementResult: item.defaultMeasurementResult ?? null,
        })),
      },
    },
    include: {
      hazardFactors: { include: { hazardFactor: true } },
    },
  });
}

export async function updateTemplate(
  companyId: string,
  templateId: string,
  input: Partial<TemplateInput>,
) {
  const existing = await db.template.findFirst({
    where: { id: templateId, companyId },
    select: { id: true },
  });

  if (!existing) {
    throw new ApiError(404, "template_not_found", "Szablon nie istnieje.");
  }

  if (input.hazardFactors) {
    await assertHazardsAccessible(
      companyId,
      input.hazardFactors.map((item) => item.hazardFactorId),
    );
  }

  return db.$transaction(async (tx) => {
    if (input.hazardFactors) {
      await tx.templateHazard.deleteMany({ where: { templateId } });
    }

    return tx.template.update({
      where: { id: templateId },
      data: {
        ...(input.name !== undefined ? { name: input.name } : {}),
        ...(input.positionDescription !== undefined
          ? { positionDescription: input.positionDescription ?? null }
          : {}),
        ...(input.workDescription !== undefined
          ? { workDescription: input.workDescription ?? null }
          : {}),
        ...(input.hazardFactors
          ? {
              hazardFactors: {
                create: input.hazardFactors.map((item) => ({
                  hazardFactorId: item.hazardFactorId,
                  defaultExposureValue: item.defaultExposureValue ?? null,
                  defaultMeasurementResult: item.defaultMeasurementResult ?? null,
                })),
              },
            }
          : {}),
      },
      include: {
        hazardFactors: { include: { hazardFactor: true } },
      },
    });
  });
}

export async function deleteTemplate(companyId: string, templateId: string) {
  const existing = await db.template.findFirst({
    where: { id: templateId, companyId },
    select: { id: true },
  });

  if (!existing) {
    throw new ApiError(404, "template_not_found", "Szablon nie istnieje.");
  }

  await db.template.delete({ where: { id: templateId } });
}

async function assertHazardsAccessible(companyId: string, hazardIds: string[]) {
  if (hazardIds.length === 0) {
    return;
  }

  const count = await db.hazardFactor.count({
    where: {
      id: { in: hazardIds },
      OR: [{ isSystem: true }, { companyId }],
    },
  });

  if (count !== new Set(hazardIds).size) {
    throw new ApiError(
      422,
      "hazard_not_accessible",
      "Wybrany czynnik nie jest dostępny dla tej firmy.",
    );
  }
}
