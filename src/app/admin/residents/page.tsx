import { getAdminUser } from "@/lib/auth-cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";
import TopBar from "@/components/layout/TopBar";
import ResidentsTable from "@/components/residents/ResidentsTable";

// Static list — Makati's 23 barangays (updated: EMBO barangays now under Taguig City).
const MAKATI_BARANGAYS = [
  "Bangkal", "Bel-Air", "Carmona", "Dasmariñas", "Forbes Park",
  "Guadalupe Nuevo", "Guadalupe Viejo", "Kasilawan", "La Paz",
  "Magallanes", "Olympia", "Palanan", "Pinagkaisahan", "Pio del Pilar",
  "Poblacion", "San Antonio", "San Isidro", "San Lorenzo", "Santa Cruz",
  "Singkamas", "Tejeros", "Urdaneta", "Valenzuela",
];

export default async function ResidentsPage({
  searchParams,
}: {
  searchParams: Promise<{
    search?: string;
    barangay?: string;
    page?: string;
    verified?: string;
  }>;
}) {
  const params = await searchParams;
  const dbUser = await getAdminUser();
  if (!dbUser) redirect("/login");

  const db = createAdminClient();
  const isCoordinator = dbUser.role === "ADMIN";
  const adminBarangay = dbUser.barangay ?? null;

  const search = params.search ?? "";
  const barangayFilter =
    isCoordinator && adminBarangay ? adminBarangay : (params.barangay ?? "");
  const verifiedFilter = params.verified ?? "";
  const page = parseInt(params.page ?? "1", 10);
  const pageSize = 10;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = db
    .from("users")
    .select(
      "id, firstName, lastName, email, barangay, phone, residencyVerified, createdAt",
      { count: "exact" }
    )
    .eq("role", "REGISTERED_USER")
    .order("createdAt", { ascending: false })
    .range(from, to);

  if (search)
    query = query.or(
      `firstName.ilike.%${search}%,lastName.ilike.%${search}%,email.ilike.%${search}%`
    );
  if (barangayFilter) query = query.eq("barangay", barangayFilter);
  if (verifiedFilter === "true") query = query.eq("residencyVerified", true);
  if (verifiedFilter === "false") query = query.eq("residencyVerified", false);

  const { data: residents, count } = await query;

  // Fetch application counts for the current page's users only.
  const userIds = (residents ?? []).map((r) => r.id);
  const { data: appCounts } = userIds.length
    ? await db.from("applications").select("userId").in("userId", userIds)
    : { data: [] };

  const appCountMap: Record<string, number> = {};
  (appCounts ?? []).forEach((a) => {
    appCountMap[a.userId] = (appCountMap[a.userId] ?? 0) + 1;
  });

  const residentsWithCounts = (residents ?? []).map((r) => ({
    ...r,
    applicationCount: appCountMap[r.id] ?? 0,
  }));

  return (
    <div>
      <TopBar
        title="Resident Database"
        subtitle="All registered MSWD Makati residents"
      />
      <div className="p-6">
        <ResidentsTable
          residents={residentsWithCounts}
          total={count ?? 0}
          page={page}
          pageSize={pageSize}
          currentSearch={search}
          currentBarangay={barangayFilter}
          currentVerified={verifiedFilter}
          barangays={MAKATI_BARANGAYS}
          isCoordinator={isCoordinator}
        />
      </div>
    </div>
  );
}
