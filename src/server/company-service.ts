import { randomUUID } from "node:crypto";

import { ApiError } from "@/lib/api";
import { betterAuthOrgRoleByAppRole } from "@/lib/constants";
import { db } from "@/lib/db";
import type {
  CompanySettingsInput,
  invitationCreateSchema,
} from "@/server/schemas";
import type { z } from "zod";

type InvitationInput = z.infer<typeof invitationCreateSchema>;

export async function getCompanySettings(companyId: string) {
  return db.company.findUniqueOrThrow({
    where: { id: companyId },
    select: {
      id: true,
      name: true,
      shortName: true,
      nip: true,
      regon: true,
      address: true,
      contactPhone: true,
      contactEmail: true,
      pdfIssuedPlace: true,
      pdfSignatoryName: true,
      pdfSignatoryTitle: true,
      pdfFooterNote: true,
      users: {
        orderBy: [{ appRole: "asc" }, { name: "asc" }],
        select: {
          id: true,
          name: true,
          email: true,
          appRole: true,
          createdAt: true,
        },
      },
    },
  });
}

export async function updateCompanySettings(
  companyId: string,
  input: CompanySettingsInput,
) {
  return db.company.update({
    where: { id: companyId },
    data: {
      name: input.name,
      shortName: input.shortName ?? null,
      nip: input.nip,
      regon: input.regon,
      address: input.address,
      contactPhone: input.contactPhone ?? null,
      contactEmail: input.contactEmail ?? null,
      pdfIssuedPlace: input.pdfIssuedPlace ?? null,
      pdfSignatoryName: input.pdfSignatoryName ?? null,
      pdfSignatoryTitle: input.pdfSignatoryTitle ?? null,
      pdfFooterNote: input.pdfFooterNote ?? null,
    },
  });
}

export async function createPortalInvitation(input: {
  companyId: string;
  invitedByUserId: string;
  email: string;
  role: InvitationInput["role"];
  appUrl: string;
}) {
  if (input.role === "COORDINATOR") {
    throw new ApiError(
      403,
      "coordinator_invite_forbidden",
      "Koordynator może zapraszać tylko użytkowników HR.",
    );
  }

  const company = await db.company.findUniqueOrThrow({
    where: { id: input.companyId },
    select: { orgId: true },
  });

  const betterAuthRole = betterAuthOrgRoleByAppRole[input.role];
  const invitation = await db.invitation.create({
    data: {
      id: `inv_${randomUUID()}`,
      organizationId: company.orgId,
      email: input.email.toLowerCase(),
      role: betterAuthRole,
      status: "pending",
      expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7),
      inviterId: input.invitedByUserId,
    },
  });

  return {
    invitation,
    appRole: input.role,
    inviteUrl: `${input.appUrl}/accept-invite?id=${encodeURIComponent(
      invitation.id,
    )}`,
  };
}
