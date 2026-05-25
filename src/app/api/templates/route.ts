import { created, handleRouteError, ok, readJson } from "@/lib/api";
import { requireCompanyContext } from "@/lib/auth-context";
import { createTemplate, listTemplates } from "@/server/template-service";
import { templateCreateSchema } from "@/server/schemas";

export async function GET(request: Request) {
  try {
    const { companyId } = await requireCompanyContext(request);
    return ok(await listTemplates(companyId));
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(request: Request) {
  try {
    const { companyId } = await requireCompanyContext(request);
    const input = await readJson(request, templateCreateSchema);
    return created(await createTemplate(companyId, input));
  } catch (error) {
    return handleRouteError(error);
  }
}
