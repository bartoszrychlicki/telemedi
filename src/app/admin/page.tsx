"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Building2, Plus, Send } from "lucide-react";

import { apiFetch, postJson } from "@/lib/client-api";
import { formatDate } from "@/components/telemedi/format";
import { ErrorState, Field, LoadingState, Modal } from "@/components/telemedi/ui";

type AdminCompany = {
  id: string;
  name: string;
  shortName: string | null;
  nip: string;
  regon: string;
  address: string;
  contactPhone: string | null;
  createdAt: string;
  employees: { id: string }[];
  referrals: { status: string }[];
  users: { id: string; email: string; name: string; appRole: string }[];
};

const emptyCompany = {
  name: "",
  shortName: "",
  nip: "",
  regon: "",
  address: "",
  contactPhone: "",
  contactEmail: "",
};

export default function AdminPage() {
  const [companies, setCompanies] = useState<AdminCompany[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [inviteCompany, setInviteCompany] = useState<AdminCompany | null>(null);

  async function load() {
    setLoading(true);
    setError("");
    try {
      setCompanies(await apiFetch<AdminCompany[]>("/api/admin/companies"));
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  return (
    <div className="page">
      <div className="row between">
        <div>
          <h1 className="page-title">Firmy</h1>
          <p className="page-sub">
            Panel Telemedi: dodawanie klientów, zaproszenia i read-only podgląd danych.
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowCreate(true)}>
          <Plus size={18} />
          Dodaj firmę
        </button>
      </div>

      {error ? <ErrorState message={error} /> : null}
      {loading ? <LoadingState /> : null}

      <section className="grid-3">
        {companies.map((company) => {
          const openReferrals = company.referrals.filter(
            (referral) => !["CLOSED", "CANCELLED"].includes(referral.status),
          ).length;
          return (
            <article className="card col" key={company.id}>
              <div className="row between">
                <div className="brand-mark"><Building2 size={18} /></div>
                <span className="badge badge-outline">
                  {formatDate(company.createdAt)}
                </span>
              </div>
              <div>
                <h2 className="t-lg bold">{company.shortName ?? company.name}</h2>
                <p className="muted t-sm">{company.name}</p>
              </div>
              <div className="grid-3">
                <Metric label="Pracownicy" value={company.employees.length} />
                <Metric label="Skierowania" value={company.referrals.length} />
                <Metric label="Otwarte" value={openReferrals} />
              </div>
              <div className="muted t-sm">
                NIP {company.nip} · {company.address}
              </div>
              <div className="row">
                <Link className="btn btn-outline btn-sm" href={`/admin/companies/${company.id}`}>
                  Podgląd
                </Link>
                <button className="btn btn-secondary btn-sm" onClick={() => setInviteCompany(company)}>
                  <Send size={16} />
                  Zaproś
                </button>
              </div>
            </article>
          );
        })}
      </section>

      {showCreate ? (
        <CreateCompanyModal
          onClose={() => setShowCreate(false)}
          onSaved={() => {
            setShowCreate(false);
            void load();
          }}
        />
      ) : null}
      {inviteCompany ? (
        <InviteCompanyModal
          company={inviteCompany}
          onClose={() => setInviteCompany(null)}
        />
      ) : null}
    </div>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="stat-value" style={{ fontSize: "1.25rem" }}>{value}</div>
      <div className="muted t-xs">{label}</div>
    </div>
  );
}

function CreateCompanyModal({
  onClose,
  onSaved,
}: {
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState(emptyCompany);
  const [error, setError] = useState("");

  async function submit() {
    setError("");
    try {
      await postJson("/api/admin/companies", form);
      onSaved();
    } catch (err) {
      setError((err as Error).message);
    }
  }

  return (
    <Modal
      title="Dodaj firmę"
      onClose={onClose}
      wide
      footer={
        <>
          <button className="btn btn-outline" onClick={onClose}>Anuluj</button>
          <button className="btn btn-primary" onClick={submit}>Utwórz</button>
        </>
      }
    >
      {error ? <ErrorState message={error} /> : null}
      <div className="grid-2">
        {Object.entries({
          name: "Nazwa",
          shortName: "Nazwa skrócona",
          nip: "NIP",
          regon: "REGON",
          contactPhone: "Telefon",
          contactEmail: "Email kontaktowy",
        }).map(([key, label]) => (
          <Field label={label} key={key}>
            <input
              className="input"
              value={form[key as keyof typeof form]}
              onChange={(event) => setForm({ ...form, [key]: event.target.value })}
            />
          </Field>
        ))}
      </div>
      <div className="mt-4">
        <Field label="Adres">
          <input className="input" value={form.address} onChange={(event) => setForm({ ...form, address: event.target.value })} />
        </Field>
      </div>
    </Modal>
  );
}

function InviteCompanyModal({
  company,
  onClose,
}: {
  company: AdminCompany;
  onClose: () => void;
}) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"COORDINATOR" | "HR_STAFF">("COORDINATOR");
  const [inviteUrl, setInviteUrl] = useState("");
  const [error, setError] = useState("");

  async function submit() {
    setError("");
    setInviteUrl("");
    try {
      const result = await postJson<{ inviteUrl: string }>(
        `/api/admin/companies/${company.id}/invitations`,
        { email, role },
      );
      setInviteUrl(result.inviteUrl);
    } catch (err) {
      setError((err as Error).message);
    }
  }

  return (
    <Modal
      title={`Zaproś do ${company.shortName ?? company.name}`}
      onClose={onClose}
      footer={
        <>
          <button className="btn btn-outline" onClick={onClose}>Zamknij</button>
          <button className="btn btn-primary" onClick={submit}>Wygeneruj link</button>
        </>
      }
    >
      {error ? <ErrorState message={error} /> : null}
      <div className="grid-2">
        <Field label="Email">
          <input className="input" value={email} onChange={(event) => setEmail(event.target.value)} />
        </Field>
        <Field label="Rola">
          <select className="select" value={role} onChange={(event) => setRole(event.target.value as "COORDINATOR" | "HR_STAFF")}>
            <option value="COORDINATOR">Koordynator</option>
            <option value="HR_STAFF">HR</option>
          </select>
        </Field>
      </div>
      {inviteUrl ? (
        <div className="banner banner-info mt-4" style={{ wordBreak: "break-all" }}>
          {inviteUrl}
        </div>
      ) : null}
    </Modal>
  );
}
