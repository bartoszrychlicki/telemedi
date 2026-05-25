import { handleRouteError, ok } from "@/lib/api";
import { requirePortalContext } from "@/lib/auth-context";
import { getDashboard } from "@/server/dashboard-service";

export async function GET(request: Request) {
  try {
    const { companyId } = await requirePortalContext(request);
    return ok(await getDashboard(companyId));
  } catch (error) {
    return handleRouteError(error);
  }
}
