import { handleRouteError, ok } from "@/lib/api";
import { requireCompanyContext } from "@/lib/auth-context";
import { importEmployeesFromWorkbook } from "@/server/xlsx-service";

export async function POST(request: Request) {
  try {
    const { companyId } = await requireCompanyContext(request);
    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return ok({ imported: [], errors: [{ row: 0, message: "Brak pliku." }] });
    }

    return ok(await importEmployeesFromWorkbook(companyId, await file.arrayBuffer()));
  } catch (error) {
    return handleRouteError(error);
  }
}
