import { created, handleRouteError, ok, readJson } from "@/lib/api";
import { requireAdmin } from "@/lib/auth-context";
import { createSystemHazards, listSystemHazards } from "@/server/hazard-service";
import { hazardCreateSchema } from "@/server/schemas";

export async function GET(request: Request) {
  try {
    await requireAdmin(request);
    return ok(await listSystemHazards());
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(request: Request) {
  try {
    await requireAdmin(request);
    const input = await readJson(request, hazardCreateSchema);
    return created(await createSystemHazards(input.category, input.names));
  } catch (error) {
    return handleRouteError(error);
  }
}
