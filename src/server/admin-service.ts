import { randomUUID } from "node:crypto";

import { db } from "@/lib/db";
import {
  appRoleByBetterAuthOrgRole,
  betterAuthOrgRoleByAppRole,
} from "@/lib/constants";
import type { CompanyCreateInput } from "@/server/schemas";
import type { UserRole } from "@/generated/prisma/enums";

function slugifyCompanyName(name: string) {
  const slug = name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return `${slug || "firma"}-${randomUUID().slice(0, 8)}`;
}

export async function listCompanies() {
  return db.company.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      employees: {
        select: { id: true },
        where: { archivedAt: null },
      },
      referrals: {
        select: { status: true },
      },
      users: {
        select: {
          id: true,
          email: true,
          name: true,
          appRole: true,
        },
        where: {
          appRole: "COORDINATOR",
        },
      },
    },
  });
}

export async function createCompany(input: CompanyCreateInput, adminUserId: string) {
  return db.$transaction(async (tx) => {
    const organization = await tx.organization.create({
      data: {
        id: `org_${randomUUID()}`,
        name: input.name,
        slug: slugifyCompanyName(input.name),
        createdAt: new Date(),
        metadata: JSON.stringify({
          nip: input.nip,
          regon: input.regon,
        }),
      },
    });

    const company = await tx.company.create({
      data: {
        ...input,
        shortName: input.shortName ?? null,
        contactPhone: input.contactPhone ?? null,
        contactEmail: input.contactEmail ?? null,
        pdfIssuedPlace: input.shortName ?? input.name,
        orgId: organization.id,
      },
    });

    await tx.member.upsert({
      where: {
        organizationId_userId: {
          organizationId: organization.id,
          userId: adminUserId,
        },
      },
      create: {
        id: `mem_${randomUUID()}`,
        organizationId: organization.id,
        userId: adminUserId,
        role: "owner",
        createdAt: new Date(),
      },
      update: {
        role: "owner",
      },
    });

    return company;
  });
}

export async function createCompanyInvitation(input: {
  companyId: string;
  invitedByUserId: string;
  email: string;
  role: Exclude<UserRole, "SUPER_ADMIN">;
  appUrl: string;
}) {
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
    appRole: appRoleByBetterAuthOrgRole[betterAuthRole],
    inviteUrl: `${input.appUrl}/accept-invite?id=${encodeURIComponent(
      invitation.id,
    )}`,
  };
}

export async function getCompanyAdminDetail(companyId: string) {
  const [
    company,
    employeeCount,
    referralStatusGroups,
    recentReferrals,
    users,
  ] = await Promise.all([
    db.company.findUnique({
      where: { id: companyId },
      include: { organization: true },
    }),
    db.employee.count({ where: { companyId, archivedAt: null } }),
    db.referral.groupBy({
      by: ["status"],
      where: { companyId },
      _count: { _all: true },
    }),
    db.referral.findMany({
      where: { companyId },
      orderBy: { createdAt: "desc" },
      take: 8,
      include: {
        hazardFactors: { select: { id: true } },
      },
    }),
    db.user.findMany({
      where: { companyId },
      orderBy: [{ appRole: "asc" }, { name: "asc" }],
      select: {
        id: true,
        name: true,
        email: true,
        appRole: true,
        emailVerified: true,
        createdAt: true,
      },
    }),
  ]);

  if (!company) {
    return null;
  }

  return {
    company,
    users,
    stats: {
      employees: employeeCount,
      referrals: referralStatusGroups.reduce(
        (acc, item) => acc + item._count._all,
        0,
      ),
      openReferrals: referralStatusGroups
        .filter((item) => !["CLOSED", "CANCELLED"].includes(item.status))
        .reduce((acc, item) => acc + item._count._all, 0),
    },
    referralStatusCounts: referralStatusGroups.reduce(
      (acc, item) => ({ ...acc, [item.status]: item._count._all }),
      {},
    ),
    recentReferrals,
  };
}
