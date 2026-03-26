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
  amountRequested?: number | null;
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
      "id, referenceNumber, applicantName, applicantBarangay, applicantContact, status, createdAt, updatedAt, amountRequested, amountApproved, benefitProgramId, purpose"
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
