import { buildEmployeeImportTemplate } from "@/server/xlsx-service";
import { handleRouteError } from "@/lib/api";
import { requireCompanyContext } from "@/lib/auth-context";

export async function GET(request: Request) {
  try {
    await requireCompanyContext(request);
    const buffer = await buildEmployeeImportTemplate();

    return new Response(new Uint8Array(buffer), {
      headers: {
        "content-type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "content-disposition":
          'attachment; filename="szablon_pracownicy.xlsx"',
      },
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
