"use client";

import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { Download, ExternalLink } from "lucide-react";

import { apiFetch, postJson } from "@/lib/client-api";
import {
  attentionLabels,
  formatDate,
  formatDateTime,
  hazardCategoryLabels,
  referralTypeLabels,
} from "@/components/telemedi/format";
import { ErrorState, LoadingState, StatusBadge } from "@/components/telemedi/ui";
import type { ReferralDetail, ReferralStatus } from "@/components/telemedi/types";

const statusFlow: ReferralStatus[] = [
  "DRAFT",
  "SUBMITTED",
  "SCHEDULED",
  "COMPLETED",
  "CLOSED",
];

export default function ReferralDetailPage() {
  const params = useParams<{ id: string }>();
  const [referral, setReferral] = useState<ReferralDetail | null>(null);
  const [error, setError] = useState("");
  const [devOpen, setDevOpen] = useState(false);

  const load = useCallback(async () => {
    setError("");
    try {
      setReferral(await apiFetch<ReferralDetail>(`/api/referrals/${params.id}`));
    } catch (err) {
      setError((err as Error).message);
    }
  }, [params.id]);

  useEffect(() => {
    void load();
  }, [load]);

  if (error) {
    return <div className="page"><ErrorState message={error} /></div>;
  }

  if (!referral) {
    return <div className="page"><LoadingState /></div>;
  }

  return (
    <div className="page">
      <div className="row between">
        <div>
          <h1 className="page-title">{referral.employeeNameSnapshot}</h1>
          <p className="page-sub">
            {referralTypeLabels[referral.type]} · {referral.positionSnapshot} · termin {formatDate(referral.deadlineDate)}
          </p>
        </div>
        <div className="row">
          <StatusBadge status={referral.status} />
          {referral.attentionReason !== "NONE" ? (
            <span className="badge badge-warn">{attentionLabels[referral.attentionReason]}</span>
          ) : null}
          <a className="btn btn-primary" href={`/api/referrals/${referral.id}/pdf`}>
            <Download size={18} />
            Pobierz PDF
          </a>
        </div>
      </div>

      <section className="grid-2">
        <div className="card col">
          <h2 className="t-lg bold">Dane skierowania</h2>
          <Info label="Pracodawca" value={`${referral.company.name}, ${referral.company.address}`} />
          <Info label="PESEL / dokument" value={referral.employeePeselSnapshot ?? referral.employeeIdentityDocumentSnapshot ?? "-"} />
          <Info label="Adres pracownika" value={referral.employeeAddressSnapshot} />
          <Info label="Miejsce wystawienia" value={referral.issuedPlace} />
          <Info label="Wystawiono" value={formatDate(referral.issuedAt)} />
          <Info label="Placówka" value={referral.facilityName ?? "Jeszcze nie umówiono"} />
          <Info label="Termin wizyty" value={formatDateTime(referral.appointmentDate)} />
          {referral.occupationalMedicineCertificateRef ? (
            <div className="banner banner-info">
              <ExternalLink size={18} />
              <div>
                E-orzeczenie: {referral.occupationalMedicineCertificateRef}
              </div>
            </div>
          ) : null}
        </div>
        <div className="card">
          <h2 className="t-lg bold">Timeline statusów</h2>
          <div className="timeline mt-4">
            {referral.statusEvents.map((event) => (
              <div className="tl-item" key={event.id}>
                <div className="tl-dot done">✓</div>
                <div className="bold">{event.toStatus}</div>
                <div className="muted t-sm">{formatDateTime(event.createdAt)}</div>
                <div className="t-sm">{event.note ?? "Aktualizacja statusu"}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="grid-2 mt-6">
        <div className="card col">
          <h2 className="t-lg bold">Opis stanowiska</h2>
          <p>{referral.positionDescription}</p>
          <h2 className="t-lg bold">Opis warunków pracy</h2>
          <p>{referral.workDescription}</p>
        </div>
        <div className="card">
          <h2 className="t-lg bold">Czynniki i narażenia</h2>
          <div className="col mt-4">
            {referral.hazardFactors.map((hazard) => (
              <div className="card" key={hazard.id}>
                <div className="row between">
                  <div className="bold">{hazard.factorNameSnapshot}</div>
                  <span className="badge badge-outline">{hazardCategoryLabels[hazard.category]}</span>
                </div>
                <p className="muted t-sm">Narażenie: {hazard.exposureValue}</p>
                <p className="muted t-sm">Pomiary: {hazard.measurementResult ?? "nie dotyczy"}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <button className="dev-fab" onClick={() => setDevOpen((value) => !value)}>
        Mock statusu Telemedi
      </button>
      {devOpen ? (
        <DevPanel referral={referral} onChanged={load} />
      ) : null}
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

function DevPanel({
  referral,
  onChanged,
}: {
  referral: ReferralDetail;
  onChanged: () => void;
}) {
  const [error, setError] = useState("");

  async function move(status: ReferralStatus) {
    setError("");
    try {
      await postJson(`/api/referrals/${referral.id}/status`, {
        status,
        attentionReason: status === "SUBMITTED" ? "EMPLOYEE_UNREACHABLE" : "NONE",
        facilityName:
          status === "SCHEDULED"
            ? "Centrum Medyczne Damiana, ul. Wałbrzyska 46, Warszawa"
            : null,
        appointmentDate:
          status === "SCHEDULED" ? "2026-06-04T10:30:00.000Z" : null,
        note: "Status ustawiony w mockowanym panelu Telemedi.",
      });
      onChanged();
    } catch (err) {
      setError((err as Error).message);
    }
  }

  return (
    <div className="dev-panel">
      <div className="dev-panel-header">
        <span>Dev-only status flow</span>
        <StatusBadge status={referral.status} />
      </div>
      <div className="dev-panel-body col">
        {statusFlow.map((status) => (
          <button
            className="dev-btn"
            disabled={status === referral.status}
            key={status}
            onClick={() => move(status)}
          >
            <span>Ustaw {status}</span>
            <span>→</span>
          </button>
        ))}
        {error ? <div className="danger t-sm">{error}</div> : null}
      </div>
    </div>
  );
}
