import { prismaAdapter } from "better-auth/adapters/prisma";
import { betterAuth } from "better-auth";
import { nextCookies } from "better-auth/next-js";
import { organization } from "better-auth/plugins";

import { appRoleByBetterAuthOrgRole } from "@/lib/constants";
import { db } from "@/lib/db";
import { env } from "@/lib/env";

function normalizeOrigin(value?: string | null) {
  if (!value) {
    return null;
  }

  try {
    return new URL(value.startsWith("http") ? value : `https://${value}`).origin;
  } catch {
    return null;
  }
}

const trustedOrigins = Array.from(
  new Set(
    [
      env.BETTER_AUTH_URL,
      env.NEXT_PUBLIC_APP_URL,
      "https://telemedi-eight.vercel.app",
      process.env.VERCEL_URL,
      process.env.VERCEL_BRANCH_URL,
      process.env.VERCEL_PROJECT_PRODUCTION_URL,
      "http://localhost:3000",
      "http://127.0.0.1:3000",
    ]
      .map(normalizeOrigin)
      .filter((origin): origin is string => Boolean(origin)),
  ),
);

export const auth = betterAuth({
  appName: "Telemedi Medycyna Pracy",
  baseURL: env.BETTER_AUTH_URL,
  trustedOrigins,
  secret: env.BETTER_AUTH_SECRET,
  database: prismaAdapter(db, {
    provider: "postgresql",
    transaction: true,
  }),
  emailAndPassword: {
    enabled: true,
    autoSignIn: true,
  },
  user: {
    modelName: "User",
  },
  session: {
    modelName: "Session",
  },
  account: {
    modelName: "Account",
  },
  verification: {
    modelName: "Verification",
  },
  plugins: [
    organization({
      allowUserToCreateOrganization: false,
      creatorRole: "owner",
      invitationExpiresIn: 60 * 60 * 24 * 7,
      requireEmailVerificationOnInvitation: false,
      sendInvitationEmail: async () => {
        // Phase 1 has no SMTP. Admin and coordinators copy invite links manually.
      },
      schema: {
        organization: {
          modelName: "Organization",
        },
        member: {
          modelName: "Member",
        },
        invitation: {
          modelName: "Invitation",
        },
        session: {
          fields: {
            activeOrganizationId: "activeOrganizationId",
          },
        },
      },
      organizationHooks: {
        afterAcceptInvitation: async ({ invitation, user }) => {
          const company = await db.company.findUnique({
            where: { orgId: invitation.organizationId },
            select: { id: true },
          });

          if (!company) {
            return;
          }

          const appRole =
            appRoleByBetterAuthOrgRole[
              invitation.role as keyof typeof appRoleByBetterAuthOrgRole
            ] ?? "HR_STAFF";

          await db.user.update({
            where: { id: user.id },
            data: {
              appRole,
              companyId: company.id,
            },
          });
        },
      },
    }),
    nextCookies(),
  ],
});

export type AuthSession = Awaited<ReturnType<typeof auth.api.getSession>>;
