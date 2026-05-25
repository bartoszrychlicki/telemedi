import { handleRouteError, ok, readJson } from "@/lib/api";
import { requireCoordinator, requirePortalContext } from "@/lib/auth-context";
import {
  getCompanySettings,
  updateCompanySettings,
} from "@/server/company-service";
import { companySettingsSchema } from "@/server/schemas";

export async function GET(request: Request) {
  try {
    const { companyId } = await requirePortalContext(request);
    return ok(await getCompanySettings(companyId));
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function PATCH(request: Request) {
  try {
    const { companyId } = await requireCoordinator(request);
    const input = await readJson(request, companySettingsSchema);
    return ok(await updateCompanySettings(companyId, input));
  } catch (error) {
    return handleRouteError(error);
  }
}
