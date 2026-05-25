import { handleRouteError, ok, parseIdParam, readJson } from "@/lib/api";
import { requireCompanyContext } from "@/lib/auth-context";
import { updateReferralStatus } from "@/server/referral-service";
import { referralStatusUpdateSchema } from "@/server/schemas";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { companyId, user } = await requireCompanyContext(request);
    const id = await parseIdParam(context.params);
    const input = await readJson(request, referralStatusUpdateSchema);
    return ok(await updateReferralStatus(companyId, id, user.id, input));
  } catch (error) {
    return handleRouteError(error);
  }
}
