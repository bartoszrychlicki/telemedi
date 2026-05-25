"use client";

import type { ReactNode } from "react";
import { AlertCircle, Loader2, X } from "lucide-react";

import { referralStatusLabels, statusClass } from "@/components/telemedi/format";
import type { ReferralStatus } from "@/components/telemedi/types";

export function LoadingState({ label = "Ładowanie danych" }: { label?: string }) {
  return (
    <div className="card row">
      <Loader2 size={18} className="animate-spin" />
      <span>{label}</span>
    </div>
  );
}

export function ErrorState({ message }: { message: string }) {
  return (
    <div className="banner">
      <AlertCircle size={20} />
      <div>
        <div className="bold">Nie udało się wykonać operacji</div>
        <div className="t-sm">{message}</div>
      </div>
    </div>
  );
}

export function EmptyState({ children }: { children: ReactNode }) {
  return <div className="empty">{children}</div>;
}

export function StatusBadge({ status }: { status: ReferralStatus }) {
  return (
    <span className={`badge badge-dot ${statusClass[status]}`}>
      {referralStatusLabels[status]}
    </span>
  );
}

export function AttentionBadge({ label }: { label: string }) {
  return <span className="badge badge-warn">{label}</span>;
}

export function Field({
  label,
  children,
  help,
  required,
}: {
  label: string;
  children: ReactNode;
  help?: string;
  required?: boolean;
}) {
  return (
    <label className="field">
      <span className="label">
        <span>{label}</span>
        {required ? <span className="required-label">wymagane</span> : null}
      </span>
      {children}
      {help ? <span className="help">{help}</span> : null}
    </label>
  );
}

export function Modal({
  title,
  children,
  footer,
  onClose,
  wide,
}: {
  title: string;
  children: ReactNode;
  footer?: ReactNode;
  onClose: () => void;
  wide?: boolean;
}) {
  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true">
      <div className={`modal ${wide ? "modal-lg" : ""}`}>
        <div className="modal-header row between">
          <h2 className="t-xl bold">{title}</h2>
          <button className="btn btn-ghost btn-sm" onClick={onClose} type="button">
            <X size={18} />
          </button>
        </div>
        <div className="modal-body">{children}</div>
        {footer ? <div className="modal-footer">{footer}</div> : null}
      </div>
    </div>
  );
}
