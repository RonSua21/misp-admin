export type Role = "SUPER_ADMIN" | "ADMIN" | "REGISTERED_USER" | "GUEST";
export type ApplicationStatus = "PENDING" | "UNDER_REVIEW" | "APPROVED" | "REJECTED" | "DISBURSED";
export type BenefitCategory = "FINANCIAL_ASSISTANCE" | "MEDICAL_ASSISTANCE" | "SENIOR_CITIZEN" | "PWD_ASSISTANCE";
export type DocumentStatus = "PENDING" | "VERIFIED" | "REJECTED";

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
  amountRequested?: number;
  amountApproved?: number;
  remarks?: string;
  createdAt: string;
  updatedAt: string;
}

export interface BenefitProgram {
  id: string;
  name: string;
  category: BenefitCategory;
  description: string;
  isActive: boolean;
  maxAmount?: number;
}

export interface AuditLog {
  id: string;
  userId: string;
  action: string;
  targetType: string;
  targetId: string;
  details?: string;
  createdAt: string;
}

export interface Document {
  id: string;
  userId: string;
  applicationId?: string;
  documentType: string;
  fileUrl: string;
  status: DocumentStatus;
  createdAt: string;
}

export interface Announcement {
  id: string;
  title: string;
  body: string;
  isActive: boolean;
  createdAt: string;
  createdBy?: string;
}
