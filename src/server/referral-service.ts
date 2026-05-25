import { Prisma } from "@/generated/prisma/client";

import { ApiError } from "@/lib/api";
import { db } from "@/lib/db";
import { referralStatusFlow } from "@/lib/constants";
import type {
  ReferralCreateInput,
  ReferralStatusUpdateInput,
} from "@/server/schemas";
import type { ReferralStatus } from "@/generated/prisma/enums";

const referralInclude = {
  employee: true,
  company: true,
  createdBy: {
    select: { id: true, name: true, email: true },
  },
  hazardFactors: {
    orderBy: { factorNameSnapshot: "asc" },
  },
  statusEvents: {
    orderBy: { createdAt: "asc" },
    include: {
      createdBy: {
        select: { id: true, name: true, email: true },
      },
    },
  },
} satisfies Prisma.ReferralInclude;

export async function listReferrals(
  companyId: string,
  query: { status?: string; type?: string; q?: string },
) {
  const where: Prisma.ReferralWhereInput = {
    companyId,
  };

  if (query.status) {
    where.status = query.status as ReferralStatus;
  }

  if (query.type) {
    where.type = query.type as Prisma.EnumReferralTypeFilter["equals"];
  }

  if (query.q?.trim()) {
    where.employeeNameSnapshot = {
      contains: query.q.trim(),
      mode: "insensitive",
    };
  }

  return db.referral.findMany({
    where,
    orderBy: [{ deadlineDate: "asc" }, { createdAt: "desc" }],
    include: {
      employee: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
          position: true,
        },
      },
      hazardFactors: {
        select: { id: true },
      },
    },
  });
}

export async function getReferral(companyId: string, referralId: string) {
  const referral = await db.referral.findFirst({
    where: { id: referralId, companyId },
    include: referralInclude,
  });

  if (!referral) {
    throw new ApiError(404, "referral_not_found", "Skierowanie nie istnieje.");
  }

  return referral;
}

export async function createReferrals(
  companyId: string,
  createdById: string,
  input: ReferralCreateInput,
) {
  const employees = await db.employee.findMany({
    where: {
      id: { in: input.employeeIds },
      companyId,
      archivedAt: null,
    },
  });

  if (employees.length !== new Set(input.employeeIds).size) {
    throw new ApiError(
      422,
      "employees_not_accessible",
      "Niektórzy pracownicy nie istnieją albo są zarchiwizowani.",
    );
  }

  await assertReferralHazardsAccessible(companyId, input.hazards);

  const referrals = await db.$transaction(async (tx) => {
    if (input.saveAsTemplateName) {
      const template = await tx.template.upsert({
        where: {
          companyId_name: {
            companyId,
            name: input.saveAsTemplateName,
          },
        },
        create: {
          companyId,
          name: input.saveAsTemplateName,
          positionDescription: input.positionDescription,
          workDescription: input.workDescription,
        },
        update: {
          positionDescription: input.positionDescription,
          workDescription: input.workDescription,
        },
      });

      await tx.templateHazard.deleteMany({
        where: { templateId: template.id },
      });
      await tx.templateHazard.createMany({
        data: input.hazards
          .filter((hazard) => hazard.hazardFactorId)
          .map((hazard) => ({
            templateId: template.id,
            hazardFactorId: hazard.hazardFactorId!,
            defaultExposureValue: hazard.exposureValue,
            defaultMeasurementResult: hazard.measurementResult ?? null,
          })),
      });
    }

    return Promise.all(
      employees.map((employee) => {
        const identitySnapshot = [
          employee.identityDocumentName,
          employee.identityDocumentSeries,
          employee.identityDocumentNumber,
          employee.identityDocumentCountry,
        ]
          .filter(Boolean)
          .join(" ");

        return tx.referral.create({
          data: {
            companyId,
            employeeId: employee.id,
            type: input.type,
            status: "SUBMITTED",
            attentionReason: "NONE",
            employeeNameSnapshot: `${employee.firstName} ${employee.lastName}`,
            employeePeselSnapshot: employee.pesel,
            employeeBirthDateSnapshot: employee.birthDate,
            employeeIdentityDocumentSnapshot: identitySnapshot || null,
            employeeAddressSnapshot: employee.address,
            employmentContext: input.employmentContext,
            positionSnapshot: input.positionOverride ?? employee.position,
            positionDescription: input.positionDescription,
            workDescription: input.workDescription,
            issuedPlace: input.issuedPlace,
            deadlineDate: input.deadlineDate,
            createdById,
            hazardFactors: {
              create: input.hazards.map((hazard) => ({
                hazardFactorId: hazard.hazardFactorId ?? null,
                category: hazard.category,
                factorNameSnapshot: hazard.factorName,
                exposureValue: hazard.exposureValue,
                measurementResult: hazard.measurementResult ?? null,
                notes: hazard.notes ?? null,
              })),
            },
            statusEvents: {
              create: {
                fromStatus: null,
                toStatus: "SUBMITTED",
                attentionReason: "NONE",
                createdById,
                note: "Skierowanie wygenerowane w portalu HR.",
              },
            },
          },
          include: referralInclude,
        });
      }),
    );
  });

  return referrals;
}

export async function updateReferralStatus(
  companyId: string,
  referralId: string,
  createdById: string,
  input: ReferralStatusUpdateInput,
) {
  const referral = await db.referral.findFirst({
    where: { id: referralId, companyId },
    select: {
      id: true,
      status: true,
    },
  });

  if (!referral) {
    throw new ApiError(404, "referral_not_found", "Skierowanie nie istnieje.");
  }

  assertStatusTransition(referral.status, input.status);

  return db.$transaction(async (tx) => {
    await tx.referralStatusEvent.create({
      data: {
        referralId,
        fromStatus: referral.status,
        toStatus: input.status,
        attentionReason: input.attentionReason,
        facilityName: input.facilityName ?? null,
        appointmentDate: input.appointmentDate ?? null,
        note: input.note ?? null,
        createdById,
      },
    });

    return tx.referral.update({
      where: { id: referralId },
      data: {
        status: input.status,
        attentionReason: input.attentionReason,
        ...(input.status === "SCHEDULED"
          ? {
              facilityName: input.facilityName,
              appointmentDate: input.appointmentDate,
            }
          : {}),
      },
      include: referralInclude,
    });
  });
}

function assertStatusTransition(from: ReferralStatus, to: ReferralStatus) {
  if (from === to) {
    return;
  }

  if (to === "CANCELLED") {
    return;
  }

  if (from === "CANCELLED" || from === "CLOSED") {
    throw new ApiError(
      409,
      "status_transition_not_allowed",
      "Nie można zmienić zamkniętego lub anulowanego skierowania.",
    );
  }

  const fromIndex = referralStatusFlow.indexOf(from);
  const toIndex = referralStatusFlow.indexOf(to);

  if (toIndex !== fromIndex + 1) {
    throw new ApiError(
      409,
      "status_transition_not_allowed",
      "Status można przesuwać tylko do kolejnego kroku.",
    );
  }
}

async function assertReferralHazardsAccessible(
  companyId: string,
  hazards: ReferralCreateInput["hazards"],
) {
  const hazardIds = hazards
    .map((hazard) => hazard.hazardFactorId)
    .filter((id): id is string => Boolean(id));

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
