import {
  handleRouteError,
  noContent,
  ok,
  parseIdParam,
  readJson,
} from "@/lib/api";
import { requireCompanyContext } from "@/lib/auth-context";
import { deleteTemplate, updateTemplate } from "@/server/template-service";
import { templateUpdateSchema } from "@/server/schemas";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { companyId } = await requireCompanyContext(request);
    const id = await parseIdParam(context.params);
    const input = await readJson(request, templateUpdateSchema);
    return ok(await updateTemplate(companyId, id, input));
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
    await deleteTemplate(companyId, id);
    return noContent();
  } catch (error) {
    return handleRouteError(error);
  }
}
