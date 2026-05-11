import { getAdminUser } from "@/lib/auth-cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";
import TopBar from "@/components/layout/TopBar";
import ReferralsTable from "@/components/referrals/ReferralsTable";

export default async function ReferralsPage({
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

  let q = db
    .from("referrals")
    .select(
      `id, caseId, clientId, referredBy, referredTo, serviceNeeded, priority, status, referralCode, referralDate, responseDate, outcome, createdAt,
       client:users!referrals_clientId_fkey(firstName, lastName),
       referrer:users!referrals_referredBy_fkey(firstName, lastName),
       case:cases!referrals_caseId_fkey(caseNumber)`,
      { count: "exact" }
    )
    .order("referralDate", { ascending: false })
    .range(from, to);

  if (status) q = q.eq("status", status);
  if (search) q = q.ilike("referralCode", `%${search}%`);

  const { data: raw, count } = await q;

  const referrals = (raw ?? []).map((r: any) => ({
    ...r,
    clientName: `${r.client?.firstName ?? ""} ${r.client?.lastName ?? ""}`.trim(),
    referredByName: `${r.referrer?.firstName ?? ""} ${r.referrer?.lastName ?? ""}`.trim(),
    caseNumber: r.case?.caseNumber ?? null,
    client: undefined, referrer: undefined, case: undefined,
  }));

  return (
    <div>
      <TopBar title="Referrals" subtitle="Track inter-agency referrals and their outcomes" />
      <div className="p-6">
        <ReferralsTable
          referrals={referrals}
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
