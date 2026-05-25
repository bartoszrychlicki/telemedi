import { created, handleRouteError, readJson } from "@/lib/api";
import { requireCoordinator } from "@/lib/auth-context";
import { env } from "@/lib/env";
import { createPortalInvitation } from "@/server/company-service";
import { invitationCreateSchema } from "@/server/schemas";

export async function POST(request: Request) {
  try {
    const { companyId, user } = await requireCoordinator(request);
    const input = await readJson(request, invitationCreateSchema);

    return created(
      await createPortalInvitation({
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
