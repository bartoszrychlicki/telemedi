import { created, handleRouteError, ok, readJson } from "@/lib/api";
import { requireCompanyContext } from "@/lib/auth-context";
import { createReferrals, listReferrals } from "@/server/referral-service";
import { referralCreateSchema, referralListQuerySchema } from "@/server/schemas";

export async function GET(request: Request) {
  try {
    const { companyId } = await requireCompanyContext(request);
    const searchParams = Object.fromEntries(new URL(request.url).searchParams);
    const query = referralListQuerySchema.parse(searchParams);
    return ok(await listReferrals(companyId, query));
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(request: Request) {
  try {
    const { companyId, user } = await requireCompanyContext(request);
    const input = await readJson(request, referralCreateSchema);
    return created(await createReferrals(companyId, user.id, input));
  } catch (error) {
    return handleRouteError(error);
  }
}
