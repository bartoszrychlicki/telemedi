"use client";

import { useState } from "react";

import { authClient } from "@/lib/auth-client";
import { apiFetch } from "@/lib/client-api";
import { validateEmail, validateRequired } from "@/lib/form-validation";
import { Field } from "@/components/telemedi/ui";
import type { MeResponse } from "@/components/telemedi/types";

const demoAccounts = [
  ["Super Admin", "admin@telemedi.pl"],
  ["Koordynator", "koordynator@demo.pl"],
  ["HR", "hr@demo.pl"],
] as const;

export default function LoginPage() {
  const [email, setEmail] = useState("koordynator@demo.pl");
  const [password, setPassword] = useState("TelemediDemo123!");
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;

    const validationError =
      validateRequired([
        { label: "Email", value: email },
        { label: "Hasło", value: password },
      ]) ?? validateEmail("Email", email, true);

    if (validationError) {
      setMessage(validationError);
      return;
    }

    setPending(true);
    setMessage("");

    try {
      const result = await authClient.signIn.email({
        email,
        password,
      });

      if (result.error) {
        setMessage("Nie udało się zalogować. Sprawdź dane demo i seed bazy.");
        return;
      }

      const me = await apiFetch<MeResponse>("/api/me").catch(() => null);
      window.location.href = me?.permissions.isSuperAdmin ? "/admin" : "/portal/dashboard";
    } catch {
      setMessage("Nie udało się połączyć z serwerem. Spróbuj ponownie.");
    } finally {
      setPending(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[var(--background)] px-6">
      <div className="grid w-full max-w-5xl grid-cols-[1fr_420px] gap-8">
        <section className="flex flex-col justify-center">
          <div className="brand">
            <div className="brand-mark">T</div>
            <div>
              <div className="brand-name">Telemedi</div>
              <div className="brand-sub">Medycyna pracy</div>
            </div>
          </div>
          <h1 className="mt-8 text-4xl font-semibold">
            Portal do obsługi skierowań medycyny pracy
          </h1>
          <p className="mt-4 max-w-xl text-lg text-[var(--muted-foreground)]">
            Desktopowy system dla HR oraz panel administracyjny Telemedi.
          </p>
        </section>
        <form className="card col" onSubmit={submit}>
          <div>
            <p className="muted t-sm">Logowanie</p>
            <h2 className="t-2xl bold">Wybierz konto demo</h2>
          </div>
          <div className="row" style={{ flexWrap: "wrap" }}>
            {demoAccounts.map(([label, value]) => (
              <button
                className="btn btn-outline btn-sm"
                key={value}
                onClick={() => setEmail(value)}
                type="button"
              >
                {label}
              </button>
            ))}
          </div>
          <Field label="Email" required>
            <input
              className="input"
              onChange={(event) => setEmail(event.target.value)}
              required
              type="email"
              value={email}
            />
          </Field>
          <Field label="Hasło" required>
            <input
              className="input"
              onChange={(event) => setPassword(event.target.value)}
              required
              type="password"
              value={password}
            />
          </Field>
          <button className="btn btn-primary" disabled={pending} type="submit">
            {pending ? "Logowanie..." : "Zaloguj"}
          </button>
          {message ? <p className="danger t-sm">{message}</p> : null}
        </form>
      </div>
    </main>
  );
}
