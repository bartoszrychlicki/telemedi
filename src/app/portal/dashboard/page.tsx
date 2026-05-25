"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AlertTriangle, CalendarClock, ClipboardPlus, Users } from "lucide-react";

import { apiFetch } from "@/lib/client-api";
import {
  attentionLabels,
  formatDate,
  referralTypeLabels,
} from "@/components/telemedi/format";
import { EmptyState, ErrorState, LoadingState, StatusBadge } from "@/components/telemedi/ui";
import type { ReferralListItem, ReferralStatus } from "@/components/telemedi/types";

type DashboardData = {
  stats: {
    employees: number;
    activeReferrals: number;
    needsAttention: number;
    scheduled: number;
  };
  statusCounts: Partial<Record<ReferralStatus, number>>;
  urgentReferrals: ReferralListItem[];
  recentReferrals: ReferralListItem[];
};

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    apiFetch<DashboardData>("/api/dashboard")
      .then(setData)
      .catch((err: Error) => setError(err.message));
  }, []);

  if (error) {
    return (
      <div className="page">
        <ErrorState message={error} />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="page">
        <LoadingState />
      </div>
    );
  }

  return (
    <div className="page">
      <div className="row between">
        <div>
          <h1 className="page-title">Przegląd</h1>
          <p className="page-sub">
            Najważniejsze skierowania, terminy i zadania dla działu HR.
          </p>
        </div>
        <Link className="btn btn-primary" href="/portal/referrals/new">
          <ClipboardPlus size={18} />
          Nowe skierowanie
        </Link>
      </div>

      <section className="grid-4">
        <div className="stat">
          <div className="row between">
            <span className="stat-label">Pracownicy</span>
            <Users size={19} />
          </div>
          <span className="stat-value">{data.stats.employees}</span>
          <span className="stat-sub">aktywni w firmie</span>
        </div>
        <div className="stat">
          <div className="row between">
            <span className="stat-label">Skierowania w toku</span>
            <ClipboardPlus size={19} />
          </div>
          <span className="stat-value">{data.stats.activeReferrals}</span>
          <span className="stat-sub">zlecone, umówione lub zrealizowane</span>
        </div>
        <div className="stat urgent">
          <div className="row between">
            <span className="stat-label">Wymaga uwagi</span>
            <AlertTriangle size={19} />
          </div>
          <span className="stat-value">{data.stats.needsAttention}</span>
          <span className="stat-sub">brak kontaktu, korekta lub zmiana terminu</span>
        </div>
        <div className="stat">
          <div className="row between">
            <span className="stat-label">Umówione wizyty</span>
            <CalendarClock size={19} />
          </div>
          <span className="stat-value">{data.stats.scheduled}</span>
          <span className="stat-sub">z przypisaną placówką i terminem</span>
        </div>
      </section>

      <section className="grid-2 mt-6">
        <div className="card card-flush">
          <div className="card-header">
            <div>
              <h2 className="t-lg bold">Najbliższe terminy</h2>
              <p className="muted t-sm">Skierowania z terminem w najbliższych dniach</p>
            </div>
            <Link className="btn btn-outline btn-sm" href="/portal/referrals">
              Wszystkie
            </Link>
          </div>
          <ReferralList referrals={data.urgentReferrals} />
        </div>
        <div className="card card-flush">
          <div className="card-header">
            <div>
              <h2 className="t-lg bold">Ostatnia aktywność</h2>
              <p className="muted t-sm">Najnowsze skierowania w portalu</p>
            </div>
          </div>
          <ReferralList referrals={data.recentReferrals} />
        </div>
      </section>
    </div>
  );
}

function ReferralList({ referrals }: { referrals: ReferralListItem[] }) {
  if (referrals.length === 0) {
    return <EmptyState>Brak skierowań do pokazania.</EmptyState>;
  }

  return (
    <div className="card-body col">
      {referrals.map((referral) => (
        <Link
          className="row between rounded-md border border-[var(--border)] bg-white p-4 hover:bg-[var(--accent)]"
          href={`/portal/referrals/${referral.id}`}
          key={referral.id}
        >
          <div>
            <div className="bold">{referral.employeeNameSnapshot}</div>
            <div className="muted t-sm">
              {referralTypeLabels[referral.type]} · termin {formatDate(referral.deadlineDate)}
            </div>
            {referral.attentionReason !== "NONE" ? (
              <div className="badge badge-warn mt-2">
                {attentionLabels[referral.attentionReason]}
              </div>
            ) : null}
          </div>
          <StatusBadge status={referral.status} />
        </Link>
      ))}
    </div>
  );
}
