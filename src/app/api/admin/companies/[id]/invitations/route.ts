import { created, handleRouteError, parseIdParam, readJson } from "@/lib/api";
import { requireAdmin } from "@/lib/auth-context";
import { env } from "@/lib/env";
import { createCompanyInvitation } from "@/server/admin-service";
import { invitationCreateSchema } from "@/server/schemas";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { user } = await requireAdmin(request);
    const companyId = await parseIdParam(context.params);
    const input = await readJson(request, invitationCreateSchema);

    return created(
      await createCompanyInvitation({
        companyId,
        invitedByUserId: user.id,
        email: input.email,
        role: input.role,
        appUrl: env.NEXT_PUBLIC_APP_URL,
      }),
    );
  } catch (error) {
    return handleRouteError(error);
  }
}
