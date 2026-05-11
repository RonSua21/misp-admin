import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";
import TopBar from "@/components/layout/TopBar";
import AnalyticsClient from "@/components/super-admin/AnalyticsClient";

export default async function AnalyticsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const db = createAdminClient();

  // Get all applications with barangay info
  const { data: applications } = await db
    .from("applications")
    .select("applicantBarangay, status, amountApproved, createdAt");

  // Get all residents with barangay
  const { data: residents } = await db
    .from("users")
    .select("barangay, createdAt")
    .eq("role", "REGISTERED_USER");

  // Build barangay breakdown
  const barangayMap: Record<
    string,
    {
      total: number;
      pending: number;
      approved: number;
      rejected: number;
      disbursed: number;
      underReview: number;
      residents: number;
      totalDisbursed: number;
    }
  > = {};

  (applications ?? []).forEach((app) => {
    const brgy = app.applicantBarangay ?? "Unknown";
    if (!barangayMap[brgy]) {
      barangayMap[brgy] = {
        total: 0,
        pending: 0,
        approved: 0,
        rejected: 0,
        disbursed: 0,
        underReview: 0,
        residents: 0,
        totalDisbursed: 0,
      };
    }
    barangayMap[brgy].total++;
    if (app.status === "PENDING") barangayMap[brgy].pending++;
    if (app.status === "APPROVED") barangayMap[brgy].approved++;
    if (app.status === "REJECTED") barangayMap[brgy].rejected++;
    if (app.status === "DISBURSED") {
      barangayMap[brgy].disbursed++;
      barangayMap[brgy].totalDisbursed += app.amountApproved ?? 0;
    }
    if (app.status === "UNDER_REVIEW") barangayMap[brgy].underReview++;
  });

  (residents ?? []).forEach((r) => {
    const brgy = r.barangay ?? "Unknown";
    if (!barangayMap[brgy]) {
      barangayMap[brgy] = {
        total: 0,
        pending: 0,
        approved: 0,
        rejected: 0,
        disbursed: 0,
        underReview: 0,
        residents: 0,
        totalDisbursed: 0,
      };
    }
    barangayMap[brgy].residents++;
  });

  const chartData = Object.entries(barangayMap)
    .map(([barangay, data]) => ({ barangay, ...data }))
    .sort((a, b) => b.total - a.total);

  return (
    <div>
      <TopBar
        title="Analytics"
        subtitle="Per-barangay application and resident statistics"
      />
      <div className="p-6">
        <AnalyticsClient data={chartData} />
      </div>
    </div>
  );
}
