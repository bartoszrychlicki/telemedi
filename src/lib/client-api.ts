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
  let response: Response;

  try {
    response = await fetch(input, {
      ...init,
      headers: {
        ...(init?.body instanceof FormData
          ? {}
          : { "content-type": "application/json" }),
        ...init?.headers,
      },
    });
  } catch {
    throw new ClientApiError(
      0,
      "network_error",
      "Nie udało się połączyć z serwerem. Odśwież stronę i spróbuj ponownie.",
    );
  }

  if (response.status === 204) {
    return undefined as T;
  }

  let envelope: ApiEnvelope<T>;

  try {
    envelope = (await response.json()) as ApiEnvelope<T>;
  } catch {
    throw new ClientApiError(
      response.status,
      "invalid_response",
      "Serwer zwrócił nieprawidłową odpowiedź. Odśwież stronę i spróbuj ponownie.",
    );
  }

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
