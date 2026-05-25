import { created, handleRouteError, ok, readJson } from "@/lib/api";
import { requireCompanyContext } from "@/lib/auth-context";
import { createCompanyHazards, listHazards } from "@/server/hazard-service";
import { hazardCreateSchema } from "@/server/schemas";

export async function GET(request: Request) {
  try {
    const { companyId } = await requireCompanyContext(request);
    return ok(await listHazards(companyId));
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(request: Request) {
  try {
    const { companyId } = await requireCompanyContext(request);
    const input = await readJson(request, hazardCreateSchema);
    return created(await createCompanyHazards(companyId, input.category, input.names));
  } catch (error) {
    return handleRouteError(error);
  }
}
