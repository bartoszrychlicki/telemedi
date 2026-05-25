import {
  handleRouteError,
  noContent,
  ok,
  parseIdParam,
  readJson,
} from "@/lib/api";
import { requireCompanyContext } from "@/lib/auth-context";
import {
  deleteCompanyHazard,
  updateCompanyHazard,
} from "@/server/hazard-service";
import { hazardUpdateSchema } from "@/server/schemas";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { companyId } = await requireCompanyContext(request);
    const id = await parseIdParam(context.params);
    const input = await readJson(request, hazardUpdateSchema);
    return ok(await updateCompanyHazard(companyId, id, input.name));
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { companyId } = await requireCompanyContext(request);
    const id = await parseIdParam(context.params);
    await deleteCompanyHazard(companyId, id);
    return noContent();
  } catch (error) {
    return handleRouteError(error);
  }
}
