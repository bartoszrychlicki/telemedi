import { handleRouteError } from "@/lib/api";
import { requireAdminCompanyReadContext } from "@/lib/auth-context";
import { renderReferralPdf } from "@/server/pdf-service";

export const runtime = "nodejs";

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string; referralId: string }> },
) {
  try {
    const { id: companyId, referralId } = await context.params;
    await requireAdminCompanyReadContext(request, companyId);
    const buffer = await renderReferralPdf(companyId, referralId);

    return new Response(new Uint8Array(buffer), {
      headers: {
        "content-type": "application/pdf",
        "content-disposition": `attachment; filename="skierowanie-${referralId}.pdf"`,
      },
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
