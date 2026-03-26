import { getAdminUser } from "@/lib/auth-cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";
import TopBar from "@/components/layout/TopBar";
import ApplicationsTable from "@/components/applications/ApplicationsTable";
import type { ApplicationStatus } from "@/types";

export default async function ApplicationsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; search?: string; page?: string }>;
}) {
  const params = await searchParams;
  const dbUser = await getAdminUser();
  if (!dbUser) redirect("/login");

  const db = createAdminClient();
  const isCoordinator = dbUser.role === "ADMIN";
  const brgy = dbUser.barangay ?? null;
  const statusFilter = params.status as ApplicationStatus | undefined;
  const search = params.search ?? "";
  const page = parseInt(params.page ?? "1", 10);
  const pageSize = 10;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = db
    .from("applications")
    .select(
      "id, referenceNumber, applicantName, applicantBarangay, applicantContact, status, createdAt, updatedAt, benefitProgramId, purpose, amountRequested, amountApproved",
      { count: "exact" }
    )
    .order("createdAt", { ascending: false })
    .range(from, to);

  if (isCoordinator && brgy) query = query.eq("applicantBarangay", brgy);
  if (statusFilter) query = query.eq("status", statusFilter);
  if (search) query = query.ilike("applicantName", `%${search}%`);

  const { data: applications, count } = await query;

  const programIds = Array.from(
    new Set((applications ?? []).map((a) => a.benefitProgramId))
  );
  const { data: programs } = programIds.length
    ? await db
        .from("benefit_programs")
        .select("id, name")
        .in("id", programIds)
    : { data: [] };

  const appsWithPrograms = (applications ?? []).map((app) => ({
    ...app,
    programName:
      (programs ?? []).find((p) => p.id === app.benefitProgramId)?.name ?? "—",
  }));

  return (
    <div>
      <TopBar
        title="Application Queue"
        subtitle="Review and manage all submitted applications"
      />
      <div className="p-6">
        <ApplicationsTable
          applications={appsWithPrograms}
          total={count ?? 0}
          page={page}
          pageSize={pageSize}
          currentStatus={statusFilter}
          currentSearch={search}
        />
      </div>
    </div>
  );
}
