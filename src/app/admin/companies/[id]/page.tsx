"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Download } from "lucide-react";

import { apiFetch } from "@/lib/client-api";
import {
  formatDate,
  formatDateTime,
  referralTypeLabels,
  roleLabels,
} from "@/components/telemedi/format";
import { ErrorState, LoadingState, StatusBadge } from "@/components/telemedi/ui";
import type { ReferralListItem, UserRole } from "@/components/telemedi/types";

type AdminCompanyDetail = {
  company: {
    id: string;
    name: string;
    shortName: string | null;
    nip: string;
    regon: string;
    address: string;
    contactPhone: string | null;
    contactEmail: string | null;
    createdAt: string;
  };
  users: {
    id: string;
    name: string;
    email: string;
    appRole: UserRole;
    emailVerified: boolean;
    createdAt: string;
  }[];
  stats: {
    employees: number;
    referrals: number;
    openReferrals: number;
  };
  recentReferrals: ReferralListItem[];
};

export default function AdminCompanyPage() {
  const params = useParams<{ id: string }>();
  const [detail, setDetail] = useState<AdminCompanyDetail | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    apiFetch<AdminCompanyDetail>(`/api/admin/companies/${params.id}`)
      .then(setDetail)
      .catch((err: Error) => setError(err.message));
  }, [params.id]);

  if (error) {
    return <div className="page"><ErrorState message={error} /></div>;
  }

  if (!detail) {
    return <div className="page"><LoadingState /></div>;
  }

  return (
    <div className="page">
      <div className="row between">
        <div>
          <h1 className="page-title">{detail.company.shortName ?? detail.company.name}</h1>
          <p className="page-sub">
            Read-only podgląd klienta. Superadmin nie może tutaj dodawać pracowników ani wystawiać skierowań.
          </p>
        </div>
        <Link className="btn btn-outline" href="/admin">Wróć do firm</Link>
      </div>

      <section className="grid-3">
        <div className="stat">
          <span className="stat-label">Pracownicy</span>
          <span className="stat-value">{detail.stats.employees}</span>
          <span className="stat-sub">aktywni</span>
        </div>
        <div className="stat">
          <span className="stat-label">Skierowania</span>
          <span className="stat-value">{detail.stats.referrals}</span>
          <span className="stat-sub">łącznie</span>
        </div>
        <div className="stat">
          <span className="stat-label">Otwarte</span>
          <span className="stat-value">{detail.stats.openReferrals}</span>
          <span className="stat-sub">niezamknięte</span>
        </div>
      </section>

      <section className="grid-2 mt-6">
        <div className="card col">
          <h2 className="t-lg bold">Dane firmy</h2>
          <Info label="Nazwa" value={detail.company.name} />
          <Info label="NIP" value={detail.company.nip} />
          <Info label="REGON" value={detail.company.regon} />
          <Info label="Adres" value={detail.company.address} />
          <Info label="Kontakt" value={`${detail.company.contactEmail ?? "-"} · ${detail.company.contactPhone ?? "-"}`} />
          <Info label="Utworzono" value={formatDate(detail.company.createdAt)} />
        </div>
        <div className="card card-flush">
          <div className="card-header">
            <h2 className="t-lg bold">Użytkownicy</h2>
            <span className="badge badge-outline">{detail.users.length}</span>
          </div>
          <table className="table">
            <thead>
              <tr>
                <th>Użytkownik</th>
                <th>Rola</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {detail.users.map((user) => (
                <tr key={user.id}>
                  <td>
                    <div className="bold">{user.name}</div>
                    <div className="muted t-sm">{user.email}</div>
                  </td>
                  <td>{roleLabels[user.appRole]}</td>
                  <td>{user.emailVerified ? "Aktywny" : "Niezweryfikowany"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="card card-flush mt-6">
        <div className="card-header">
          <div>
            <h2 className="t-lg bold">Ostatnie skierowania</h2>
            <p className="muted t-sm">Superadmin może pobierać PDF, bez zmiany danych.</p>
          </div>
        </div>
        <table className="table">
          <thead>
            <tr>
              <th>Pracownik</th>
              <th>Typ</th>
              <th>Status</th>
              <th>Termin</th>
              <th>PDF</th>
            </tr>
          </thead>
          <tbody>
            {detail.recentReferrals.map((referral) => (
              <tr key={referral.id}>
                <td>
                  <div className="bold">{referral.employeeNameSnapshot}</div>
                  <div className="muted t-sm">{referral.positionSnapshot}</div>
                </td>
                <td>{referralTypeLabels[referral.type]}</td>
                <td><StatusBadge status={referral.status} /></td>
                <td>
                  {formatDate(referral.deadlineDate)}
                  <div className="muted t-sm">{formatDateTime(referral.appointmentDate)}</div>
                </td>
                <td>
                  <a
                    className="btn btn-outline btn-sm"
                    href={`/api/admin/companies/${detail.company.id}/referrals/${referral.id}/pdf`}
                  >
                    <Download size={16} />
                    PDF
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="muted t-sm">{label}</div>
      <div className="medium">{value}</div>
    </div>
  );
}
