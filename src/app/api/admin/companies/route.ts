import { created, handleRouteError, ok, readJson } from "@/lib/api";
import { requireAdmin } from "@/lib/auth-context";
import { createCompany, listCompanies } from "@/server/admin-service";
import { companyCreateSchema } from "@/server/schemas";

export async function GET(request: Request) {
  try {
    await requireAdmin(request);
    return ok(await listCompanies());
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(request: Request) {
  try {
    const { user } = await requireAdmin(request);
    const input = await readJson(request, companyCreateSchema);
    return created(await createCompany(input, user.id));
  } catch (error) {
    return handleRouteError(error);
  }
}
