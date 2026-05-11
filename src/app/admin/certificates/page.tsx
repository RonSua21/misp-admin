import { getAdminUser } from "@/lib/auth-cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";
import TopBar from "@/components/layout/TopBar";
import CertificatesTable from "@/components/certificates/CertificatesTable";

export default async function CertificatesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; search?: string; page?: string }>;
}) {
  const params  = await searchParams;
  const dbUser  = await getAdminUser();
  if (!dbUser) redirect("/login");

  const db      = createAdminClient();
  const status  = params.status ?? "";
  const search  = (params.search ?? "").trim().slice(0, 100);
  const page    = Math.max(1, parseInt(params.page ?? "1", 10) || 1);
  const size    = 10;
  const from    = (page - 1) * size;
  const to      = from + size - 1;

  let q = db
    .from("certificate_requests")
    .select(
      `id, userId, type, purpose, status, referenceNumber, remarks, requestedAt, releasedAt,
       users!certificate_requests_userId_fkey(firstName, lastName, barangay)`,
      { count: "exact" }
    )
    .order("requestedAt", { ascending: false })
    .range(from, to);

  if (status) q = q.eq("status", status);
  if (search) q = q.ilike("referenceNumber", `%${search}%`);

  const { data: raw, count } = await q;

  const isCoordinator = dbUser.role === "ADMIN" && dbUser.barangay;
  const filtered = isCoordinator
    ? (raw ?? []).filter((r: any) => r.users?.barangay === dbUser.barangay)
    : (raw ?? []);

  const requests = filtered.map((r: any) => ({
    ...r,
    clientName: `${r.users?.firstName ?? ""} ${r.users?.lastName ?? ""}`.trim(),
    clientBarangay: r.users?.barangay,
    users: undefined,
  }));

  return (
    <div>
      <TopBar title="Certificate Requests" subtitle="Manage indigency, solo parent, and other certificate issuances" />
      <div className="p-6">
        <CertificatesTable
          requests={requests}
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
