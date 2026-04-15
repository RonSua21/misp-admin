// ─────────────────────────────────────────────
//  MISP Admin — Shared TypeScript types
// ─────────────────────────────────────────────

export type Role = "SUPER_ADMIN" | "ADMIN" | "REGISTERED_USER" | "GUEST";
export type ApplicationStatus = "PENDING" | "UNDER_REVIEW" | "APPROVED" | "REJECTED" | "DISBURSED";
export type BenefitCategory = "FINANCIAL_ASSISTANCE" | "MEDICAL_ASSISTANCE" | "SENIOR_CITIZEN" | "PWD_ASSISTANCE";
export type DocumentStatus = "PENDING" | "VERIFIED" | "REJECTED";

// ─── MSWD Workflow Enums ───────────────────────────────────────────────────

export type VoterStatus = "ACTIVE" | "INACTIVE" | "UNKNOWN";

/** 0=pending MAC, 1=MAC done/pending MSWD, 2=MSWD done/pending Mayor, 3=fully approved */
export type ApprovalLevel = 0 | 1 | 2 | 3;

export type RejectionCode =
  | "VOTER_INACTIVE"
  | "INCOMPLETE_DOCS"
  | "NOT_ELIGIBLE"
  | "ORIENTATION_REQUIRED"
  | "FAILED_HOME_VISIT"
  | "OTHER";

export type TenurialStatus = "OWNER" | "RENTER" | "SHARER" | "BEDSPACER";

export type DisburseMethod = "CASH" | "MAKATIZEN_CARD" | "GCASH";

export type PayrollBatchStatus =
  | "DRAFT"
  | "PENDING_MAC"
  | "PENDING_MSWD"
  | "PENDING_MAYOR"
  | "APPROVED"
  | "DISBURSED"
  | "REJECTED";

// ─── User ─────────────────────────────────────────────────────────────────

export interface UserProfile {
  id: string;
  supabaseId: string;
  email: string;
  firstName: string;
  lastName: string;
  role: Role;
  barangay?: string;
  residencyVerified: boolean;
  createdAt: string;
}

// ─── Application ──────────────────────────────────────────────────────────

export interface Application {
  id: string;
  referenceNumber: string;
  userId: string;
  benefitProgramId: string;
  status: ApplicationStatus;
  applicantName: string;
  applicantContact?: string;
  applicantBarangay?: string;
  purpose: string;
  amountApproved?: number;
  remarks?: string;
  // MSWD multi-level approval fields
  voterStatus?: VoterStatus;
  approvalLevel?: ApprovalLevel;
  rejectionCode?: RejectionCode;
  orientationAttended?: boolean;
  homeVisitRequired?: boolean;
  homeVisitDate?: string;
  homeVisitNotes?: string;
  macApprovedAt?: string;
  mswdApprovedAt?: string;
  mayorApprovedAt?: string;
  disbursementMethod?: DisburseMethod;
  prpwdEncoded?: boolean;
  createdAt: string;
  updatedAt: string;
}

// ─── Benefit Program ──────────────────────────────────────────────────────

export interface BenefitProgram {
  id: string;
  name: string;
  category: BenefitCategory;
  description: string;
  isActive: boolean;
  maxAmount?: number;
}

// ─── Audit Log ────────────────────────────────────────────────────────────

export interface AuditLog {
  id: string;
  userId: string;
  action: string;
  targetType: string;
  targetId: string;
  details?: string;
  createdAt: string;
}

// ─── Document ─────────────────────────────────────────────────────────────

export interface Document {
  id: string;
  userId: string;
  applicationId?: string;
  documentType: string;
  fileUrl: string;
  status: DocumentStatus;
  createdAt: string;
}

// ─── Announcement ─────────────────────────────────────────────────────────

export interface Announcement {
  id: string;
  title: string;
  body: string;
  isActive: boolean;
  createdAt: string;
  createdBy?: string;
}

// ─── Evacuee ──────────────────────────────────────────────────────────────

export interface Evacuee {
  id: string;
  evacuationCenterId: string;
  name: string;
  age?: number;
  barangay?: string;
  headCount: number;
  registeredAt: string;
  // DAFAC fields
  dafacNumber?: string;
  tenurialStatus?: TenurialStatus;
  assistanceAmount?: number;
  isSenior?: boolean;
  isPwd?: boolean;
  isPregnant?: boolean;
  disbursed?: boolean;
  disbursedAt?: string;
  disbursementMethod?: DisburseMethod;
}

// ─── DAFAC Config ─────────────────────────────────────────────────────────

export interface DafacConfig {
  id: string;
  tenurialStatus: TenurialStatus;
  amount: number;
  updatedAt: string;
}

// ─── Payroll ──────────────────────────────────────────────────────────────

export interface PayrollBatch {
  id: string;
  incidentId: string;
  batchNumber: string;
  status: PayrollBatchStatus;
  totalAmount: number;
  rejectionReason?: string;
  macApprovedAt?: string;
  mswdApprovedAt?: string;
  mayorApprovedAt?: string;
  disbursedAt?: string;
  createdAt: string;
  items?: PayrollItem[];
}

export interface PayrollItem {
  id: string;
  batchId: string;
  evacueeId: string;
  amount: number;
  disburseMethod: DisburseMethod;
  disbursedAt?: string;
  evacuee?: Evacuee;
}

// ─── Relief Voucher ───────────────────────────────────────────────────────

export interface ReliefVoucher {
  id: string;
  voucherCode: string;
  evacueeId: string;
  inventoryId: string;
  quantity: number;
  redeemed: boolean;
  redeemedAt?: string;
  issuedAt: string;
  evacuee?: Evacuee;
}

// ─── Audit Photo ──────────────────────────────────────────────────────────

export interface AuditPhoto {
  id: string;
  entityType: "APPLICATION" | "DISBURSEMENT" | "DISTRIBUTION";
  entityId: string;
  fileUrl: string;
  latitude?: number;
  longitude?: number;
  takenAt: string;
}

// ─── ID Issuance ──────────────────────────────────────────────────────────

export interface IdIssuance {
  id: string;
  applicationId: string;
  userId: string;
  bookletType: "MEDICINE" | "GROCERY" | "MOVIE";
  bookletNumber?: string;
  claimDate?: string;
  signatureUrl?: string;
  issuedBy: string;
  createdAt: string;
}
