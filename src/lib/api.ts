import { NextResponse } from "next/server";
import { ZodError } from "zod";

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
  ) {
    super(message);
  }
}

export function ok<T>(data: T, init?: ResponseInit) {
  return NextResponse.json({ ok: true, data }, init);
}

export function created<T>(data: T) {
  return ok(data, { status: 201 });
}

export function noContent() {
  return new NextResponse(null, { status: 204 });
}

export function fail(status: number, code: string, message: string) {
  return NextResponse.json(
    {
      ok: false,
      code,
      message,
    },
    { status },
  );
}

export function handleRouteError(error: unknown) {
  if (error instanceof ApiError) {
    return fail(error.status, error.code, error.message);
  }

  if (error instanceof ZodError) {
    return NextResponse.json(
      {
        ok: false,
        code: "validation_error",
        message: "Dane formularza wymagają poprawy.",
        issues: error.flatten(),
      },
      { status: 422 },
    );
  }

  console.error(error);
  return fail(500, "internal_error", "Wystąpił błąd po stronie serwera.");
}

export async function readJson<T>(
  request: Request,
  parser: { parse: (value: unknown) => T },
): Promise<T> {
  const payload = await request.json().catch(() => {
    throw new ApiError(400, "invalid_json", "Nieprawidłowy JSON.");
  });

  return parser.parse(payload);
}

export function parseIdParam(
  params: Promise<{ id: string }> | { id: string },
): Promise<string> {
  return Promise.resolve(params).then((resolved) => resolved.id);
}
