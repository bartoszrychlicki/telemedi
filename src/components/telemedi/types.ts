export type UserRole = "SUPER_ADMIN" | "COORDINATOR" | "HR_STAFF";
export type ReferralStatus =
  | "DRAFT"
  | "SUBMITTED"
  | "SCHEDULED"
  | "COMPLETED"
  | "CLOSED"
  | "CANCELLED";
export type ReferralType = "INITIAL" | "PERIODIC" | "CONTROL";
export type ReferralAttentionReason =
  | "NONE"
  | "NEEDS_CORRECTION"
  | "EMPLOYEE_UNREACHABLE"
  | "RESCHEDULE_REQUIRED"
  | "NO_SHOW"
  | "NEGATIVE_DECISION";
export type HazardCategory =
  | "PHYSICAL"
  | "CHEMICAL"
  | "BIOLOGICAL"
  | "DUST"
  | "OTHER";

export type MeResponse = {
  user: {
    id: string;
    email: string;
    name: string;
    appRole: UserRole;
    companyId: string | null;
  };
  company: {
    id: string;
    name: string;
    nip: string;
  } | null;
  permissions: {
    isSuperAdmin: boolean;
    canUsePortal: boolean;
    canInviteUsers: boolean;
    canManageCompanySettings: boolean;
    canUseAdminPanel: boolean;
  };
};

export type Employee = {
  id: string;
  firstName: string;
  lastName: string;
  pesel: string | null;
  birthDate?: string | null;
  identityDocumentSeries?: string | null;
  identityDocumentNumber?: string | null;
  identityDocumentName?: string | null;
  identityDocumentCountry?: string | null;
  position: string;
  address: string;
  email: string;
  phone: string;
  _count?: { referrals: number };
};

export type Hazard = {
  id: string;
  category: HazardCategory;
  name: string;
  isSystem: boolean;
  companyId: string | null;
};

export type Template = {
  id: string;
  name: string;
  positionDescription: string | null;
  workDescription: string | null;
  createdAt: string;
  hazardFactors: {
    hazardFactorId: string;
    defaultExposureValue: string | null;
    defaultMeasurementResult: string | null;
    hazardFactor: Hazard;
  }[];
};

export type ReferralListItem = {
  id: string;
  employeeId: string;
  type: ReferralType;
  status: ReferralStatus;
  attentionReason: ReferralAttentionReason;
  employeeNameSnapshot: string;
  employeePeselSnapshot: string | null;
  positionSnapshot: string;
  issuedAt: string;
  deadlineDate: string;
  facilityName: string | null;
  appointmentDate: string | null;
  hazardFactors: { id: string }[];
  employee?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    position: string;
  };
};

export type ReferralDetail = Omit<ReferralListItem, "hazardFactors"> & {
  employeeAddressSnapshot: string;
  employeeBirthDateSnapshot: string | null;
  employeeIdentityDocumentSnapshot: string | null;
  employmentContext: "EMPLOYED" | "STARTING_WORK";
  positionDescription: string;
  workDescription: string;
  issuedPlace: string;
  occupationalMedicineCertificateRef: string | null;
  company: {
    id: string;
    name: string;
    shortName: string | null;
    nip: string;
    regon: string;
    address: string;
  };
  createdBy: { id: string; name: string; email: string };
  hazardFactors: {
    id: string;
    category: HazardCategory;
    factorNameSnapshot: string;
    exposureValue: string;
    measurementResult: string | null;
    notes: string | null;
  }[];
  statusEvents: {
    id: string;
    fromStatus: ReferralStatus | null;
    toStatus: ReferralStatus;
    attentionReason: ReferralAttentionReason | null;
    facilityName: string | null;
    appointmentDate: string | null;
    note: string | null;
    createdAt: string;
    createdBy: { id: string; name: string; email: string } | null;
  }[];
};

export type CompanySettings = {
  id: string;
  name: string;
  shortName: string | null;
  nip: string;
  regon: string;
  address: string;
  contactPhone: string | null;
  contactEmail: string | null;
  pdfIssuedPlace: string | null;
  pdfSignatoryName: string | null;
  pdfSignatoryTitle: string | null;
  pdfFooterNote: string | null;
  users: {
    id: string;
    name: string;
    email: string;
    appRole: UserRole;
    createdAt: string;
  }[];
};
