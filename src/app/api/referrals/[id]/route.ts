import { handleRouteError, ok, parseIdParam } from "@/lib/api";
import { requireCompanyContext } from "@/lib/auth-context";
import { getReferral } from "@/server/referral-service";

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { companyId } = await requireCompanyContext(request);
    const id = await parseIdParam(context.params);
    return ok(await getReferral(companyId, id));
  } catch (error) {
    return handleRouteError(error);
  }
}
