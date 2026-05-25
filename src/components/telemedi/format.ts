import type {
  HazardCategory,
  ReferralAttentionReason,
  ReferralStatus,
  ReferralType,
  UserRole,
} from "@/components/telemedi/types";

export const roleLabels: Record<UserRole, string> = {
  SUPER_ADMIN: "Super Admin",
  COORDINATOR: "Koordynator",
  HR_STAFF: "HR",
};

export const referralTypeLabels: Record<ReferralType, string> = {
  INITIAL: "Wstępne",
  PERIODIC: "Okresowe",
  CONTROL: "Kontrolne",
};

export const referralStatusLabels: Record<ReferralStatus, string> = {
  DRAFT: "Szkic",
  SUBMITTED: "Zlecone",
  SCHEDULED: "Umówione",
  COMPLETED: "Zrealizowane",
  CLOSED: "Orzeczenie gotowe",
  CANCELLED: "Anulowane",
};

export const attentionLabels: Record<ReferralAttentionReason, string> = {
  NONE: "Brak",
  NEEDS_CORRECTION: "Do poprawy",
  EMPLOYEE_UNREACHABLE: "Brak kontaktu",
  RESCHEDULE_REQUIRED: "Zmiana terminu",
  NO_SHOW: "Nie stawił się",
  NEGATIVE_DECISION: "Przeciwwskazania",
};

export const hazardCategoryLabels: Record<HazardCategory, string> = {
  PHYSICAL: "Fizyczne",
  CHEMICAL: "Chemiczne",
  BIOLOGICAL: "Biologiczne",
  DUST: "Pyły",
  OTHER: "Inne",
};

export const hazardCategoryOrder: HazardCategory[] = [
  "PHYSICAL",
  "CHEMICAL",
  "BIOLOGICAL",
  "DUST",
  "OTHER",
];

export const statusClass: Record<ReferralStatus, string> = {
  DRAFT: "status-draft",
  SUBMITTED: "status-submitted",
  SCHEDULED: "status-scheduled",
  COMPLETED: "status-completed",
  CLOSED: "status-closed",
  CANCELLED: "status-cancelled",
};

export function formatDate(value: string | Date | null | undefined) {
  if (!value) {
    return "-";
  }
  return new Intl.DateTimeFormat("pl-PL").format(new Date(value));
}

export function formatDateTime(value: string | Date | null | undefined) {
  if (!value) {
    return "-";
  }
  return new Intl.DateTimeFormat("pl-PL", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export function initials(name: string) {
  return name
    .split(/\s+/)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function maskPesel(pesel: string | null | undefined) {
  if (!pesel) {
    return "-";
  }
  return `${pesel.slice(0, 2)}****${pesel.slice(-4)}`;
}
