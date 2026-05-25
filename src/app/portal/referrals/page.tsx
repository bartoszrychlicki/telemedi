"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Download, Plus, Search } from "lucide-react";

import { apiFetch } from "@/lib/client-api";
import {
  attentionLabels,
  formatDate,
  formatDateTime,
  referralTypeLabels,
} from "@/components/telemedi/format";
import { EmptyState, ErrorState, LoadingState, StatusBadge } from "@/components/telemedi/ui";
import type { ReferralListItem, ReferralStatus, ReferralType } from "@/components/telemedi/types";

const statuses: Array<"ALL" | ReferralStatus> = [
  "ALL",
  "DRAFT",
  "SUBMITTED",
  "SCHEDULED",
  "COMPLETED",
  "CLOSED",
  "CANCELLED",
];

export default function ReferralsPage() {
  const [referrals, setReferrals] = useState<ReferralListItem[]>([]);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<"ALL" | ReferralStatus>("ALL");
  const [type, setType] = useState<"ALL" | ReferralType>("ALL");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError("");
      try {
        const params = new URLSearchParams();
        if (status !== "ALL") params.set("status", status);
        if (type !== "ALL") params.set("type", type);
        if (query.trim().length >= 2) params.set("q", query.trim());
        const suffix = params.toString() ? `?${params}` : "";
        setReferrals(await apiFetch<ReferralListItem[]>(`/api/referrals${suffix}`));
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    }
    const timeout = setTimeout(() => void load(), 150);
    return () => clearTimeout(timeout);
  }, [query, status, type]);

  const attentionCount = useMemo(
    () => referrals.filter((referral) => referral.attentionReason !== "NONE").length,
    [referrals],
  );

  return (
    <div className="page">
      <div className="row between">
        <div>
          <h1 className="page-title">Skierowania</h1>
          <p className="page-sub">
            Lista zleceń medycyny pracy, filtr statusów i szybki dostęp do PDF.
          </p>
        </div>
        <Link className="btn btn-primary" href="/portal/referrals/new">
          <Plus size={18} />
          Wystaw skierowanie
        </Link>
      </div>

      <div className="card">
        <div className="filter-bar">
          <div className="search-wrap grow">
            <Search size={18} />
            <input
              className="input"
              placeholder="Szukaj pracownika"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </div>
          <select className="select" style={{ width: 190 }} value={status} onChange={(event) => setStatus(event.target.value as "ALL" | ReferralStatus)}>
            {statuses.map((item) => (
              <option key={item} value={item}>
                {item === "ALL" ? "Wszystkie statusy" : item}
              </option>
            ))}
          </select>
          <select className="select" style={{ width: 170 }} value={type} onChange={(event) => setType(event.target.value as "ALL" | ReferralType)}>
            <option value="ALL">Wszystkie typy</option>
            <option value="INITIAL">Wstępne</option>
            <option value="PERIODIC">Okresowe</option>
            <option value="CONTROL">Kontrolne</option>
          </select>
          <span className={attentionCount ? "badge badge-warn" : "badge badge-outline"}>
            Wymaga uwagi: {attentionCount}
          </span>
        </div>
      </div>

      {error ? <div className="mt-4"><ErrorState message={error} /></div> : null}
      {loading ? <div className="mt-4"><LoadingState /></div> : null}

      {!loading ? (
        <div className="card card-flush mt-4">
          {referrals.length === 0 ? (
            <EmptyState>Brak skierowań dla wybranych filtrów.</EmptyState>
          ) : (
            <table className="table referrals-table">
              <thead>
                <tr>
                  <th>Pracownik</th>
                  <th>Typ</th>
                  <th>Status</th>
                  <th>Termin</th>
                  <th>Placówka</th>
                  <th>Czynniki</th>
                  <th>PDF</th>
                </tr>
              </thead>
              <tbody>
                {referrals.map((referral) => (
                  <tr key={referral.id}>
                    <td data-label="Pracownik">
                      <Link className="bold" href={`/portal/referrals/${referral.id}`}>
                        {referral.employeeNameSnapshot}
                      </Link>
                      <div className="muted t-sm">{referral.positionSnapshot}</div>
                      {referral.attentionReason !== "NONE" ? (
                        <div className="badge badge-warn mt-2">
                          {attentionLabels[referral.attentionReason]}
                        </div>
                      ) : null}
                    </td>
                    <td data-label="Typ">{referralTypeLabels[referral.type]}</td>
                    <td data-label="Status"><StatusBadge status={referral.status} /></td>
                    <td data-label="Termin">
                      <div>{formatDate(referral.deadlineDate)}</div>
                      <div className="muted t-sm">
                        wyst. {formatDate(referral.issuedAt)}
                      </div>
                    </td>
                    <td className="muted t-sm" data-label="Placówka">
                      {referral.facilityName ?? "Jeszcze nie umówiono"}
                      {referral.appointmentDate ? (
                        <div>{formatDateTime(referral.appointmentDate)}</div>
                      ) : null}
                    </td>
                    <td data-label="Czynniki">{referral.hazardFactors.length}</td>
                    <td data-label="PDF">
                      <a className="btn btn-outline btn-sm" href={`/api/referrals/${referral.id}/pdf`}>
                        <Download size={16} />
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      ) : null}
    </div>
  );
}
