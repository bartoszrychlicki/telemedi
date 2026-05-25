import { created, handleRouteError, ok, readJson } from "@/lib/api";
import { requireCompanyContext } from "@/lib/auth-context";
import { createEmployee, listEmployees } from "@/server/employee-service";
import { employeeSchema } from "@/server/schemas";

export async function GET(request: Request) {
  try {
    const { companyId } = await requireCompanyContext(request);
    const searchParams = new URL(request.url).searchParams;
    return ok(await listEmployees(companyId, searchParams.get("q")));
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(request: Request) {
  try {
    const { companyId } = await requireCompanyContext(request);
    const input = await readJson(request, employeeSchema);
    return created(await createEmployee(companyId, input));
  } catch (error) {
    return handleRouteError(error);
  }
}
