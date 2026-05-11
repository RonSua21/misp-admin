import { getAdminUser } from "@/lib/auth-cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";
import TopBar from "@/components/layout/TopBar";
import CasesTable from "@/components/cases/CasesTable";

export default async function CasesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; search?: string; page?: string }>;
}) {
  const params = await searchParams;
  const dbUser = await getAdminUser();
  if (!dbUser) redirect("/login");

  const db     = createAdminClient();
  const status = params.status ?? "";
  const search = (params.search ?? "").trim().slice(0, 100);
  const page   = Math.max(1, parseInt(params.page ?? "1", 10) || 1);
  const size   = 10;
  const from   = (page - 1) * size;
  const to     = from + size - 1;

  const isCoordinator = dbUser.role === "ADMIN" && dbUser.barangay;

  let q = db
    .from("cases")
    .select(
      `id, caseNumber, clientId, assignedTo, category, priority, status, barangay, createdAt, updatedAt,
       client:users!cases_clientId_fkey(firstName, lastName),
       worker:users!cases_assignedTo_fkey(firstName, lastName)`,
      { count: "exact" }
    )
    .order("createdAt", { ascending: false })
    .range(from, to);

  if (isCoordinator) q = q.eq("barangay", dbUser.barangay!);
  if (status)        q = q.eq("status", status);
  if (search)        q = q.ilike("caseNumber", `%${search}%`);

  const { data: raw, count } = await q;

  const cases = (raw ?? []).map((c: any) => ({
    ...c,
    clientName: `${c.client?.firstName ?? ""} ${c.client?.lastName ?? ""}`.trim(),
    assignedWorkerName: c.worker ? `${c.worker.firstName ?? ""} ${c.worker.lastName ?? ""}`.trim() : null,
    client: undefined,
    worker: undefined,
  }));

  return (
    <div>
      <TopBar title="Case Management" subtitle="Track and manage social welfare cases" />
      <div className="p-6">
        <CasesTable
          cases={cases}
          total={count ?? 0}
          page={page}
          pageSize={size}
          currentStatus={status}
          currentSearch={search}
        />
      </div>
    </div>
  );
}
