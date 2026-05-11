import { redirect } from "next/navigation";
import { getAdminUser } from "@/lib/auth-cache";
import { createAdminClient } from "@/lib/supabase/admin";
import Link from "next/link";
import {
  Users,
  FileText,
  Clock,
  CheckCircle2,
  Banknote,
  XCircle,
  ArrowRight,
} from "lucide-react";
import MetricCard from "@/components/dashboard/MetricCard";
import ApplicationsChart from "@/components/dashboard/ApplicationsChart";
import StatusChart from "@/components/dashboard/StatusChart";
import TopBar from "@/components/layout/TopBar";
import type { ApplicationStatus } from "@/types";

const STATUS_COLORS: Record<ApplicationStatus, string> = {
  PENDING: "bg-yellow-100 text-yellow-800",
  UNDER_REVIEW: "bg-blue-100 text-blue-800",
  APPROVED: "bg-green-100 text-green-800",
  REJECTED: "bg-red-100 text-red-800",
  DISBURSED: "bg-purple-100 text-purple-800",
};

export default async function AdminDashboard() {
  const dbUser = await getAdminUser();
  if (!dbUser) redirect("/login");

  const db = createAdminClient();
  const isCoordinator = dbUser.role === "ADMIN";
  const brgy = dbUser.barangay ?? null;

  const statusList: ApplicationStatus[] = [
    "PENDING",
    "UNDER_REVIEW",
    "APPROVED",
    "REJECTED",
    "DISBURSED",
  ];

  const [{ count: totalResidents }, { data: recentApps }, ...statusCounts] =
    await Promise.all([
      isCoordinator && brgy
        ? db
            .from("users")
            .select("id", { count: "exact", head: true })
            .eq("role", "REGISTERED_USER")
            .eq("barangay", brgy)
        : db
            .from("users")
            .select("id", { count: "exact", head: true })
            .eq("role", "REGISTERED_USER"),
      isCoordinator && brgy
        ? db
            .from("applications")
            .select(
              "id, referenceNumber, applicantName, applicantBarangay, status, createdAt, benefitProgramId"
            )
            .eq("applicantBarangay", brgy)
            .order("createdAt", { ascending: false })
            .limit(5)
        : db
            .from("applications")
            .select(
              "id, referenceNumber, applicantName, applicantBarangay, status, createdAt, benefitProgramId"
            )
            .order("createdAt", { ascending: false })
            .limit(5),
      ...statusList.map((s) =>
        isCoordinator && brgy
          ? db
              .from("applications")
              .select("id", { count: "exact", head: true })
              .eq("status", s)
              .eq("applicantBarangay", brgy)
          : db
              .from("applications")
              .select("id", { count: "exact", head: true })
              .eq("status", s)
      ),
    ]);

  const countMap = Object.fromEntries(
    statusList.map((s, i) => [s, statusCounts[i].count ?? 0])
  );
  const totalApps = Object.values(countMap).reduce((a, b) => a + b, 0);

  const programIds = Array.from(
    new Set((recentApps ?? []).map((a) => a.benefitProgramId))
  );
  const { data: programs } = programIds.length
    ? await db
        .from("benefit_programs")
        .select("id, name")
        .in("id", programIds)
    : { data: [] };

  const appsWithPrograms = (recentApps ?? []).map((app) => ({
    ...app,
    programName:
      (programs ?? []).find((p) => p.id === app.benefitProgramId)?.name ?? "—",
  }));

  const pieData = statusList
    .map((s) => ({
      name: s.replace("_", " "),
      key: s,
      value: countMap[s] as number,
    }))
    .filter((d) => d.value > 0);

  return (
    <div>
      <TopBar
        title={
          isCoordinator ? `Barangay ${brgy} Dashboard` : "Admin Dashboard"
        }
        subtitle={
          isCoordinator
            ? "Showing data for your barangay only"
            : "MSWD Integrated Services Portal — Staff View"
        }
      />
      <div className="p-6 space-y-6">
        {/* Metric Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          <MetricCard
            title="Total Residents"
            value={totalResidents ?? 0}
            icon={Users}
            color="bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"
          />
          <MetricCard
            title="Total Applications"
            value={totalApps}
            icon={FileText}
            color="bg-gray-100 text-gray-600 dark:bg-slate-700 dark:text-slate-300"
          />
          <MetricCard
            title="Pending"
            value={countMap["PENDING"]}
            icon={Clock}
            color="bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400"
          />
          <MetricCard
            title="Approved"
            value={countMap["APPROVED"]}
            icon={CheckCircle2}
            color="bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400"
          />
          <MetricCard
            title="Disbursed"
            value={countMap["DISBURSED"]}
            icon={Banknote}
            color="bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400"
          />
          <MetricCard
            title="Rejected"
            value={countMap["REJECTED"]}
            icon={XCircle}
            color="bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400"
          />
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2">
            <ApplicationsChart />
          </div>
          <StatusChart data={pieData.length > 0 ? pieData : undefined} />
        </div>

        {/* Recent Applications */}
        <div className="card overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-slate-700">
            <h2 className="font-bold text-gray-900 dark:text-white">
              Recent Applications
            </h2>
            <Link
              href="/admin/applications"
              className="text-sm text-makati-blue font-medium hover:underline flex items-center gap-1"
            >
              View all <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 dark:bg-slate-800/50 text-left">
                  {[
                    "Reference",
                    "Applicant",
                    "Barangay",
                    "Program",
                    "Date",
                    "Status",
                  ].map((h) => (
                    <th
                      key={h}
                      className="px-6 py-3 text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wide"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
                {appsWithPrograms.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-6 py-12 text-center text-gray-400 text-sm"
                    >
                      No applications yet.
                    </td>
                  </tr>
                ) : (
                  appsWithPrograms.map((app) => (
                    <tr
                      key={app.id}
                      className="hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors"
                    >
                      <td className="px-6 py-4 font-mono text-xs text-makati-blue font-semibold">
                        {app.referenceNumber}
                      </td>
                      <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">
                        {app.applicantName}
                      </td>
                      <td className="px-6 py-4 text-gray-500 dark:text-slate-400">
                        {app.applicantBarangay ?? "—"}
                      </td>
                      <td className="px-6 py-4 text-gray-500 dark:text-slate-400">
                        {app.programName}
                      </td>
                      <td className="px-6 py-4 text-gray-500 dark:text-slate-400 whitespace-nowrap">
                        {new Date(app.createdAt).toLocaleDateString("en-PH", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                            STATUS_COLORS[app.status as ApplicationStatus]
                          }`}
                        >
                          {app.status.replace("_", " ")}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
