"use client";

import { useEffect, useState } from "react";
import { Link as LinkIcon, Send } from "lucide-react";

import { apiFetch, patchJson, postJson } from "@/lib/client-api";
import { formatDate, roleLabels } from "@/components/telemedi/format";
import { ErrorState, Field, LoadingState } from "@/components/telemedi/ui";
import type { CompanySettings, MeResponse } from "@/components/telemedi/types";

export default function SettingsPage() {
  const [settings, setSettings] = useState<CompanySettings | null>(null);
  const [me, setMe] = useState<MeResponse | null>(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteUrl, setInviteUrl] = useState("");

  async function load() {
    setError("");
    try {
      const [settingsData, meData] = await Promise.all([
        apiFetch<CompanySettings>("/api/company/settings"),
        apiFetch<MeResponse>("/api/me"),
      ]);
      setSettings(settingsData);
      setMe(meData);
    } catch (err) {
      setError((err as Error).message);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function save() {
    if (!settings) return;
    setMessage("");
    setError("");
    try {
      await patchJson("/api/company/settings", settings);
      setMessage("Ustawienia zapisane.");
      await load();
    } catch (err) {
      setError((err as Error).message);
    }
  }

  async function invite() {
    setMessage("");
    setError("");
    try {
      const result = await postJson<{ inviteUrl: string }>("/api/company/invitations", {
        email: inviteEmail,
        role: "HR_STAFF",
      });
      setInviteUrl(result.inviteUrl);
      setMessage("Link zaproszenia został wygenerowany.");
    } catch (err) {
      setError((err as Error).message);
    }
  }

  if (error && !settings) {
    return <div className="page"><ErrorState message={error} /></div>;
  }

  if (!settings || !me) {
    return <div className="page"><LoadingState /></div>;
  }

  const canEdit = me.permissions.canManageCompanySettings;

  if (!canEdit) {
    return (
      <div className="page">
        <ErrorState message="Ustawienia firmy i zaproszenia są dostępne tylko dla koordynatora." />
      </div>
    );
  }

  return (
    <div className="page">
      <div>
        <h1 className="page-title">Ustawienia</h1>
        <p className="page-sub">
          Dane firmy, konta użytkowników i domyślne informacje do PDF.
        </p>
      </div>

      {error ? <ErrorState message={error} /> : null}
      {message ? <div className="banner banner-info mb-4">{message}</div> : null}

      <section className="grid-2">
        <div className="card col">
          <h2 className="t-lg bold">Dane firmy</h2>
          <div className="grid-2">
            <Field label="Nazwa">
              <input className="input" disabled={!canEdit} value={settings.name} onChange={(e) => setSettings({ ...settings, name: e.target.value })} />
            </Field>
            <Field label="Nazwa skrócona">
              <input className="input" disabled={!canEdit} value={settings.shortName ?? ""} onChange={(e) => setSettings({ ...settings, shortName: e.target.value })} />
            </Field>
            <Field label="NIP">
              <input className="input" disabled={!canEdit} value={settings.nip} onChange={(e) => setSettings({ ...settings, nip: e.target.value })} />
            </Field>
            <Field label="REGON">
              <input className="input" disabled={!canEdit} value={settings.regon} onChange={(e) => setSettings({ ...settings, regon: e.target.value })} />
            </Field>
            <Field label="Telefon">
              <input className="input" disabled={!canEdit} value={settings.contactPhone ?? ""} onChange={(e) => setSettings({ ...settings, contactPhone: e.target.value })} />
            </Field>
            <Field label="Email kontaktowy">
              <input className="input" disabled={!canEdit} value={settings.contactEmail ?? ""} onChange={(e) => setSettings({ ...settings, contactEmail: e.target.value })} />
            </Field>
          </div>
          <Field label="Adres">
            <input className="input" disabled={!canEdit} value={settings.address} onChange={(e) => setSettings({ ...settings, address: e.target.value })} />
          </Field>
        </div>

        <div className="card col">
          <h2 className="t-lg bold">PDF i podpis</h2>
          <Field label="Miejsce wystawienia">
            <input className="input" disabled={!canEdit} value={settings.pdfIssuedPlace ?? ""} onChange={(e) => setSettings({ ...settings, pdfIssuedPlace: e.target.value })} />
          </Field>
          <Field label="Podpisujący">
            <input className="input" disabled={!canEdit} value={settings.pdfSignatoryName ?? ""} onChange={(e) => setSettings({ ...settings, pdfSignatoryName: e.target.value })} />
          </Field>
          <Field label="Stanowisko podpisującego">
            <input className="input" disabled={!canEdit} value={settings.pdfSignatoryTitle ?? ""} onChange={(e) => setSettings({ ...settings, pdfSignatoryTitle: e.target.value })} />
          </Field>
          <Field label="Stopka PDF">
            <textarea className="textarea" disabled={!canEdit} value={settings.pdfFooterNote ?? ""} onChange={(e) => setSettings({ ...settings, pdfFooterNote: e.target.value })} />
          </Field>
          <button className="btn btn-primary" onClick={save}>Zapisz ustawienia</button>
        </div>
      </section>

      <section className="grid-2 mt-6">
        <div className="card card-flush">
          <div className="card-header">
            <div>
              <h2 className="t-lg bold">Użytkownicy</h2>
              <p className="muted t-sm">Konta przypisane do firmy</p>
            </div>
            <span className="badge badge-outline">{settings.users.length}</span>
          </div>
          <table className="table">
            <thead>
              <tr>
                <th>Osoba</th>
                <th>Rola</th>
                <th>Utworzono</th>
              </tr>
            </thead>
            <tbody>
              {settings.users.map((user) => (
                <tr key={user.id}>
                  <td data-label="Osoba">
                    <div className="bold">{user.name}</div>
                    <div className="muted t-sm">{user.email}</div>
                  </td>
                  <td data-label="Rola">{roleLabels[user.appRole]}</td>
                  <td data-label="Utworzono">{formatDate(user.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="card col">
          <h2 className="t-lg bold">Zaproszenie HR</h2>
          <Field label="Email użytkownika HR">
            <input className="input" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} placeholder="hr@firma.pl" />
          </Field>
          <button className="btn btn-primary" onClick={invite}>
            <Send size={18} />
            Wygeneruj zaproszenie
          </button>
          {inviteUrl ? (
            <div className="banner banner-info">
              <LinkIcon size={18} />
              <div style={{ wordBreak: "break-all" }}>{inviteUrl}</div>
            </div>
          ) : null}
        </div>
      </section>
    </div>
  );
}
