import { handleRouteError, ok } from "@/lib/api";
import { requireUser } from "@/lib/auth-context";
import { db } from "@/lib/db";

export async function GET(request: Request) {
  try {
    const user = await requireUser(request);
    const company = user.companyId
      ? await db.company.findUnique({
          where: { id: user.companyId },
          select: { id: true, name: true, nip: true },
        })
      : null;

    return ok({
      user,
      company,
      permissions: {
        isSuperAdmin: user.appRole === "SUPER_ADMIN",
        canUsePortal: user.appRole !== "SUPER_ADMIN",
        canInviteUsers: user.appRole === "COORDINATOR",
        canManageCompanySettings: user.appRole === "COORDINATOR",
        canUseAdminPanel: user.appRole === "SUPER_ADMIN",
      },
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
