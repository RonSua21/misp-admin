import { getAdminUser } from "@/lib/auth-cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";
import TopBar from "@/components/layout/TopBar";
import ReportsClient from "@/components/reports/ReportsClient";
import type { ApplicationStatus } from "@/types";

const STATUS_LIST: ApplicationStatus[] = [
  "PENDING",
  "UNDER_REVIEW",
  "APPROVED",
  "REJECTED",
  "DISBURSED",
];

export default async function ReportsPage() {
  const dbUser = await getAdminUser();
  if (!dbUser) redirect("/login");

  const db = createAdminClient();
  const isCoordinator = dbUser.role === "ADMIN";
  const brgy = dbUser.barangay ?? null;

  // Run all stats queries in parallel — no full table scan.
  const results = await Promise.all([
    // 5 parallel status count queries
    ...STATUS_LIST.map((s) => {
      let q = db
        .from("applications")
        .select("id", { count: "exact", head: true })
        .eq("status", s);
      if (isCoordinator && brgy) q = q.eq("applicantBarangay", brgy);
      return q;
    }),
    // Residents count
    (() => {
      let q = db
        .from("users")
        .select("id", { count: "exact", head: true })
        .eq("role", "REGISTERED_USER");
      if (isCoordinator && brgy) q = q.eq("barangay", brgy);
      return q;
    })(),
    // Only fetch amountApproved for DISBURSED rows to compute the total
    (() => {
      let q = db
        .from("applications")
        .select("amountApproved")
        .eq("status", "DISBURSED");
      if (isCoordinator && brgy) q = q.eq("applicantBarangay", brgy);
      return q;
    })(),
  ]);

  const statusCountResults = results.slice(0, STATUS_LIST.length);
  const { count: totalResidents } = results[STATUS_LIST.length] as { count: number | null; data: null };
  const { data: disbursedApps } = results[STATUS_LIST.length + 1] as { data: { amountApproved: number | null }[] | null; count: null };

  const statusCounts = Object.fromEntries(
    STATUS_LIST.map((s, i) => [s, (statusCountResults[i] as { count: number | null }).count ?? 0])
  );

  const totalDisbursed = (disbursedApps ?? []).reduce(
    (sum, a) => sum + (a.amountApproved ?? 0),
    0
  );

  return (
    <div>
      <TopBar
        title="Reports & Exports"
        subtitle="Generate and download data reports"
      />
      <div className="p-6">
        <ReportsClient
          statusCounts={statusCounts}
          totalDisbursed={totalDisbursed}
          totalResidents={totalResidents ?? 0}
        />
      </div>
    </div>
  );
}
