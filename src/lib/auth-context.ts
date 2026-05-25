import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { ApiError } from "@/lib/api";
import type { UserRole } from "@/generated/prisma/enums";

type AuthenticatedUser = {
  id: string;
  email: string;
  name: string;
  appRole: UserRole;
  companyId: string | null;
};

export type RequestContext = {
  user: AuthenticatedUser;
  companyId: string;
  isSuperAdmin: boolean;
};

export type PortalContext = RequestContext & {
  isSuperAdmin: false;
};

export type AdminContext = {
  user: AuthenticatedUser;
  isSuperAdmin: true;
};

export type AdminCompanyReadContext = AdminContext & {
  companyId: string;
};

export async function requireUser(request: Request) {
  const session = await auth.api.getSession({
    headers: request.headers,
  });

  if (!session?.user?.id) {
    throw new ApiError(401, "unauthorized", "Zaloguj się, aby kontynuować.");
  }

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      email: true,
      name: true,
      appRole: true,
      companyId: true,
    },
  });

  if (!user) {
    throw new ApiError(401, "user_missing", "Sesja użytkownika jest niepełna.");
  }

  return user;
}

export async function requireAdmin(request: Request): Promise<AdminContext> {
  const user = await requireUser(request);

  if (user.appRole !== "SUPER_ADMIN") {
    throw new ApiError(403, "forbidden", "Brak dostępu do panelu Telemedi.");
  }

  return {
    user,
    isSuperAdmin: true,
  };
}

export async function requireCompanyContext(
  request: Request,
): Promise<PortalContext> {
  return requirePortalContext(request);
}

export async function requirePortalContext(
  request: Request,
): Promise<PortalContext> {
  const user = await requireUser(request);
  const isSuperAdmin = user.appRole === "SUPER_ADMIN";

  if (isSuperAdmin) {
    throw new ApiError(
      403,
      "admin_portal_mutation_forbidden",
      "Panel Telemedi nie wykonuje operacji w portalu firmy.",
    );
  }

  if (!user.companyId) {
    throw new ApiError(
      409,
      "company_missing",
      "Użytkownik nie jest przypisany do firmy.",
    );
  }

  return {
    user,
    companyId: user.companyId,
    isSuperAdmin: false,
  };
}

export async function requireCoordinator(
  request: Request,
): Promise<PortalContext> {
  const context = await requirePortalContext(request);

  if (context.user.appRole !== "COORDINATOR") {
    throw new ApiError(
      403,
      "coordinator_required",
      "Ta akcja jest dostępna tylko dla koordynatora firmy.",
    );
  }

  return context;
}

export async function requireAdminCompanyReadContext(
  request: Request,
  companyId: string,
): Promise<AdminCompanyReadContext> {
  const context = await requireAdmin(request);
  const company = await db.company.findUnique({
    where: { id: companyId },
    select: { id: true },
  });

  if (!company) {
    throw new ApiError(404, "company_not_found", "Firma nie istnieje.");
  }

  return {
    ...context,
    companyId: company.id,
  };
}

export function canManageUsers(role: UserRole) {
  return role === "COORDINATOR";
}
