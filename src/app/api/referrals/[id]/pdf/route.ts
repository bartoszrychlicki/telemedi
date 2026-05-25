import { handleRouteError, parseIdParam } from "@/lib/api";
import { requireCompanyContext } from "@/lib/auth-context";
import { renderReferralPdf } from "@/server/pdf-service";

export const runtime = "nodejs";

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { companyId } = await requireCompanyContext(request);
    const id = await parseIdParam(context.params);
    const buffer = await renderReferralPdf(companyId, id);

    return new Response(new Uint8Array(buffer), {
      headers: {
        "content-type": "application/pdf",
        "content-disposition": `attachment; filename="skierowanie-${id}.pdf"`,
      },
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
