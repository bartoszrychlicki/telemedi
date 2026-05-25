import {
  handleRouteError,
  noContent,
  ok,
  parseIdParam,
  readJson,
} from "@/lib/api";
import { requireAdmin } from "@/lib/auth-context";
import { deleteSystemHazard, updateSystemHazard } from "@/server/hazard-service";
import { hazardUpdateSchema } from "@/server/schemas";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    await requireAdmin(request);
    const id = await parseIdParam(context.params);
    const input = await readJson(request, hazardUpdateSchema);
    return ok(await updateSystemHazard(id, input.name));
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    await requireAdmin(request);
    const id = await parseIdParam(context.params);
    await deleteSystemHazard(id);
    return noContent();
  } catch (error) {
    return handleRouteError(error);
  }
}
