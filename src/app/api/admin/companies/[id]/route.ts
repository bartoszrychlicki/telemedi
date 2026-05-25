import { ApiError, handleRouteError, ok, parseIdParam } from "@/lib/api";
import { requireAdminCompanyReadContext } from "@/lib/auth-context";
import { getCompanyAdminDetail } from "@/server/admin-service";

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const companyId = await parseIdParam(context.params);
    await requireAdminCompanyReadContext(request, companyId);
    const detail = await getCompanyAdminDetail(companyId);

    if (!detail) {
      throw new ApiError(404, "company_not_found", "Firma nie istnieje.");
    }

    return ok(detail);
  } catch (error) {
    return handleRouteError(error);
  }
}
