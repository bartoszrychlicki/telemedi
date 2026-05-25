import { handleRouteError, ok, parseIdParam, readJson } from "@/lib/api";
import { requireCompanyContext } from "@/lib/auth-context";
import { updateEmployee } from "@/server/employee-service";
import { employeeUpdateSchema } from "@/server/schemas";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { companyId } = await requireCompanyContext(request);
    const id = await parseIdParam(context.params);
    const input = await readJson(request, employeeUpdateSchema);
    return ok(await updateEmployee(companyId, id, input));
  } catch (error) {
    return handleRouteError(error);
  }
}
