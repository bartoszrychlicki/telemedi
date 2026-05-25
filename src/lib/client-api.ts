"use client";

export type ApiEnvelope<T> =
  | { ok: true; data: T }
  | { ok: false; code: string; message: string; issues?: unknown };

export class ClientApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
  ) {
    super(message);
  }
}

export async function apiFetch<T>(
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<T> {
  const response = await fetch(input, {
    ...init,
    headers: {
      ...(init?.body instanceof FormData
        ? {}
        : { "content-type": "application/json" }),
      ...init?.headers,
    },
  });

  if (response.status === 204) {
    return undefined as T;
  }

  const envelope = (await response.json()) as ApiEnvelope<T>;
  if (!response.ok || !envelope.ok) {
    const message =
      "message" in envelope ? envelope.message : "Operacja nie powiodła się.";
    const code = "code" in envelope ? envelope.code : "request_failed";
    throw new ClientApiError(response.status, code, message);
  }

  return envelope.data;
}

export function postJson<T>(url: string, body: unknown) {
  return apiFetch<T>(url, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export function patchJson<T>(url: string, body: unknown) {
  return apiFetch<T>(url, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}

export function deleteJson<T>(url: string) {
  return apiFetch<T>(url, { method: "DELETE" });
}
