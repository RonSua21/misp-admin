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

// ─── Case Management ──────────────────────────────────────────────────────

export type CaseStatus   = "OPEN" | "ACTIVE" | "FOR_CLOSURE" | "CLOSED" | "REFERRED";
export type CaseCategory = "CHILD_WELFARE" | "WOMEN_PROTECTION" | "SENIOR_CITIZEN" | "PWD_ASSISTANCE" | "FAMILY_SERVICES" | "SOLO_PARENT" | "LIVELIHOOD" | "OTHER";
export type CasePriority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";
export type CaseNoteType = "FIELD_VISIT" | "OFFICE_INTERVIEW" | "PHONE" | "UPDATE";

export interface Case {
  id: string;
  caseNumber: string;
  clientId: string;
  assignedTo?: string;
  category: CaseCategory;
  priority: CasePriority;
  status: CaseStatus;
  description: string;
  barangay?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  clientName?: string;
  assignedWorkerName?: string;
}

export interface CaseNote {
  id: string;
  caseId: string;
  content: string;
  authorId: string;
  type: CaseNoteType;
  createdAt: string;
  authorName?: string;
}

export interface HomeVisitSchedule {
  id: string;
  caseId: string;
  scheduledAt: string;
  conductedAt?: string;
  findings?: string;
  socialWorkerId: string;
  createdAt: string;
  workerName?: string;
}

// ─── Certificate Issuance ─────────────────────────────────────────────────

export type CertType   = "INDIGENCY" | "LOW_INCOME" | "COHABITATION" | "SOLO_PARENT" | "NO_INCOME" | "GOOD_MORAL" | "RESIDENCY";
export type CertStatus = "PENDING" | "UNDER_REVIEW" | "APPROVED" | "RELEASED" | "REJECTED";

export interface CertificateRequest {
  id: string;
  userId: string;
  type: CertType;
  purpose: string;
  status: CertStatus;
  referenceNumber: string;
  remarks?: string;
  requestedAt: string;
  releasedAt?: string;
  releasedBy?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  clientName?: string;
  clientBarangay?: string;
}

// ─── Appointments ─────────────────────────────────────────────────────────

export type AppointmentStatus = "PENDING" | "CONFIRMED" | "COMPLETED" | "CANCELLED" | "NO_SHOW";
export type ServiceType = "CASE_CONSULTATION" | "CERTIFICATE_REQUEST" | "FINANCIAL_INQUIRY" | "SOLO_PARENT" | "PWD_ASSESSMENT" | "GENERAL_INQUIRY";

export interface Appointment {
  id: string;
  userId?: string;
  serviceType: ServiceType;
  preferredDate: string;
  preferredTime: string;
  status: AppointmentStatus;
  notes?: string;
  assignedTo?: string;
  isWalkIn: boolean;
  queueNumber?: string;
  confirmedAt?: string;
  completedAt?: string;
  cancelledAt?: string;
  createdAt: string;
  updatedAt: string;
  clientName?: string;
  assignedWorkerName?: string;
}

// ─── Referrals ────────────────────────────────────────────────────────────

export type ReferralStatus   = "PENDING" | "ACCEPTED" | "ACTIVE" | "COMPLETED" | "DECLINED";
export type ReferralPriority = "ROUTINE" | "URGENT" | "EMERGENCY";

export interface Referral {
  id: string;
  caseId?: string;
  clientId: string;
  referredBy: string;
  referredTo: string;
  serviceNeeded: string;
  priority: ReferralPriority;
  status: ReferralStatus;
  referralCode: string;
  referralDate: string;
  responseDate?: string;
  outcome?: string;
  createdAt: string;
  updatedAt: string;
  clientName?: string;
  referredByName?: string;
  caseNumber?: string;
}

export interface ReferralNote {
  id: string;
  referralId: string;
  content: string;
  authorId: string;
  createdAt: string;
  authorName?: string;
}
