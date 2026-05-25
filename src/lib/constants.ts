import type {
  HazardCategory,
  ReferralAttentionReason,
  ReferralStatus,
  ReferralType,
} from "@/generated/prisma/enums";

export const betterAuthOrgRoleByAppRole = {
  COORDINATOR: "owner",
  HR_STAFF: "member",
} as const;

export const appRoleByBetterAuthOrgRole = {
  owner: "COORDINATOR",
  admin: "COORDINATOR",
  member: "HR_STAFF",
} as const;

export const hazardCategoryLabels: Record<HazardCategory, string> = {
  PHYSICAL: "Czynniki fizyczne",
  DUST: "Pyły",
  CHEMICAL: "Czynniki chemiczne",
  BIOLOGICAL: "Czynniki biologiczne",
  OTHER: "Inne czynniki, w tym niebezpieczne",
};

export const hazardCategoryUiOrder: HazardCategory[] = [
  "PHYSICAL",
  "CHEMICAL",
  "BIOLOGICAL",
  "DUST",
  "OTHER",
];

export const hazardCategoryPdfOrder: HazardCategory[] = [
  "PHYSICAL",
  "DUST",
  "CHEMICAL",
  "BIOLOGICAL",
  "OTHER",
];

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

export const attentionReasonLabels: Record<ReferralAttentionReason, string> = {
  NONE: "Brak",
  NEEDS_CORRECTION: "Do poprawy",
  EMPLOYEE_UNREACHABLE: "Brak kontaktu",
  RESCHEDULE_REQUIRED: "Zmiana terminu",
  NO_SHOW: "Nie stawił się",
  NEGATIVE_DECISION: "Przeciwwskazania",
};

export const referralStatusFlow: ReferralStatus[] = [
  "DRAFT",
  "SUBMITTED",
  "SCHEDULED",
  "COMPLETED",
  "CLOSED",
];
