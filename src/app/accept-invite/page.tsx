"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useState, type ReactNode } from "react";

export default function AcceptInvitePage() {
  return (
    <Suspense fallback={<InviteShell>Ładowanie zaproszenia...</InviteShell>}>
      <AcceptInviteContent />
    </Suspense>
  );
}

function AcceptInviteContent() {
  const params = useSearchParams();
  const invitationId = params.get("id") ?? "";
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function accept() {
    setPending(true);
    setMessage("");
    setError("");
    try {
      const response = await fetch("/api/auth/organization/accept-invitation", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ invitationId }),
      });
      if (!response.ok) {
        const body = await response.json().catch(() => null);
        throw new Error(
          body?.message ??
            "Nie udało się przyjąć zaproszenia. Zaloguj się kontem z adresu zaproszenia.",
        );
      }
      setMessage("Zaproszenie przyjęte. Za chwilę przejdziesz do portalu.");
      window.location.href = "/portal/dashboard";
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setPending(false);
    }
  }

  return (
    <InviteShell>
        <div className="brand">
          <div className="brand-mark">T</div>
          <div>
            <div className="brand-name">Telemedi</div>
            <div className="brand-sub">Zaproszenie do firmy</div>
          </div>
        </div>
        <h1 className="t-2xl bold">Dołącz do workspace</h1>
        <p className="muted">
          Jeśli nie jesteś jeszcze zalogowany, zaloguj się kontem z adresu,
          na który wysłano zaproszenie, a potem wróć do tego linku.
        </p>
        <div className="card">
          <div className="muted t-sm">ID zaproszenia</div>
          <div className="tabular" style={{ wordBreak: "break-all" }}>
            {invitationId || "Brak ID w adresie"}
          </div>
        </div>
        <div className="row">
          <button
            className="btn btn-primary"
            disabled={pending || !invitationId}
            onClick={accept}
          >
            {pending ? "Przyjmowanie..." : "Przyjmij zaproszenie"}
          </button>
          <Link className="btn btn-outline" href="/login">
            Przejdź do logowania
          </Link>
        </div>
        {message ? <div className="banner banner-info">{message}</div> : null}
        {error ? <div className="banner">{error}</div> : null}
    </InviteShell>
  );
}

function InviteShell({ children }: { children: ReactNode }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[var(--background)] px-6">
      <section className="card col w-full max-w-xl">{children}</section>
    </main>
  );
}
