"use server";
import { getAdminUser } from "@/lib/auth-cache";
import { createAdminClient } from "@/lib/supabase/admin";

export type AppExportRow = {
  id: string;
  referenceNumber: string;
  applicantName: string;
  applicantBarangay?: string | null;
  applicantContact?: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
  amountApproved?: number | null;
  programName: string;
  purpose: string;
};

export type ResidentExportRow = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  barangay?: string | null;
  phone?: string | null;
  residencyVerified: boolean;
  createdAt: string;
};

export async function getApplicationsForExport(): Promise<AppExportRow[] | null> {
  const dbUser = await getAdminUser();
  if (!dbUser) return null;

  const db = createAdminClient();
  const isCoordinator = dbUser.role === "ADMIN";
  const brgy = dbUser.barangay ?? null;

  let query = db
    .from("applications")
    .select(
      "id, referenceNumber, applicantName, applicantBarangay, applicantContact, status, createdAt, updatedAt, amountApproved, benefitProgramId, purpose"
    )
    .order("createdAt", { ascending: false });

  if (isCoordinator && brgy) query = query.eq("applicantBarangay", brgy);

  const { data: apps } = await query;

  const programIds = Array.from(new Set((apps ?? []).map((a) => a.benefitProgramId)));
  const { data: programs } = programIds.length
    ? await db.from("benefit_programs").select("id, name").in("id", programIds)
    : { data: [] };

  return (apps ?? []).map((a) => ({
    ...a,
    programName: (programs ?? []).find((p) => p.id === a.benefitProgramId)?.name ?? "—",
  }));
}

export type DafacExportRow = {
  dafacNumber:    string;
  name:           string;
  age?:           number | null;
  barangay?:      string | null;
  tenurialStatus: string;
  assistanceAmount: number;
  isSenior:       boolean;
  isPwd:          boolean;
  isPregnant:     boolean;
  disbursed:      boolean;
  centerName:     string;
  incidentTitle:  string;
};

export type PayrollExportRow = {
  dafacNumber:    string | null;
  name:           string;
  amount:         number;
  disburseMethod: string;
  disbursedAt?:   string | null;
};

export async function getDafacExportData(incidentId: string): Promise<DafacExportRow[] | null> {
  const dbUser = await getAdminUser();
  if (!dbUser) return null;

  const db = createAdminClient();

  const { data: incident } = await db
    .from("disaster_incidents")
    .select("id, title")
    .eq("id", incidentId)
    .single();

  const { data: centers } = await db
    .from("evacuation_centers")
    .select("id, name")
    .eq("disasterIncidentId", incidentId);

  if (!centers || centers.length === 0) return [];

  const centerIds = centers.map((c) => c.id);
  const centerMap = Object.fromEntries(centers.map((c) => [c.id, c.name]));

  const { data: evacuees } = await db
    .from("evacuees")
    .select("id, name, age, barangay, dafacNumber:dafac_number, tenurialStatus:tenurial_status, assistanceAmount:assistance_amount, isSenior:is_senior, isPwd:is_pwd, isPregnant:is_pregnant, disbursed, evacuationCenterId")
    .in("evacuationCenterId", centerIds)
    .not("dafac_number", "is", null);

  return (evacuees ?? []).map((ev) => ({
    dafacNumber:      ev.dafacNumber ?? "",
    name:             ev.name,
    age:              ev.age,
    barangay:         ev.barangay,
    tenurialStatus:   ev.tenurialStatus ?? "",
    assistanceAmount: ev.assistanceAmount ?? 0,
    isSenior:         ev.isSenior ?? false,
    isPwd:            ev.isPwd ?? false,
    isPregnant:       ev.isPregnant ?? false,
    disbursed:        ev.disbursed ?? false,
    centerName:       centerMap[ev.evacuationCenterId] ?? "—",
    incidentTitle:    incident?.title ?? "—",
  }));
}

export async function getPayrollExportData(batchId: string): Promise<PayrollExportRow[] | null> {
  const dbUser = await getAdminUser();
  if (!dbUser) return null;

  const db = createAdminClient();

  const { data: items } = await db
    .from("payroll_items")
    .select("amount, disburseMethod:disburse_method, disbursedAt:disbursed_at, evacuees(name, dafacNumber:dafac_number)")
    .eq("batch_id", batchId);

  return (items ?? []).map((item) => {
    const ev = Array.isArray(item.evacuees) ? item.evacuees[0] : item.evacuees;
    return {
      dafacNumber:    ev?.dafacNumber ?? null,
      name:           ev?.name ?? "—",
      amount:         item.amount,
      disburseMethod: item.disburseMethod ?? "CASH",
      disbursedAt:    item.disbursedAt,
    };
  });
}

export async function getResidentsForExport(): Promise<ResidentExportRow[] | null> {
  const dbUser = await getAdminUser();
  if (!dbUser) return null;

  const db = createAdminClient();
  const isCoordinator = dbUser.role === "ADMIN";
  const brgy = dbUser.barangay ?? null;

  let query = db
    .from("users")
    .select("id, firstName, lastName, email, barangay, phone, residencyVerified, createdAt")
    .eq("role", "REGISTERED_USER")
    .order("createdAt", { ascending: false });

  if (isCoordinator && brgy) query = query.eq("barangay", brgy);

  const { data } = await query;
  return data ?? [];
}
