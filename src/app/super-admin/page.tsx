import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
  Users,
  FileText,
  Clock,
  CheckCircle2,
  Banknote,
  XCircle,
  ShieldCheck,
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

export default async function SuperAdminDashboard() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const db = createAdminClient();
  const statusList: ApplicationStatus[] = [
    "PENDING",
    "UNDER_REVIEW",
    "APPROVED",
    "REJECTED",
    "DISBURSED",
  ];

  const [
    { count: totalResidents },
    { count: totalAdmins },
    { data: recentApps },
    { data: recentAuditLogs },
    ...statusCounts
  ] = await Promise.all([
    db
      .from("users")
      .select("*", { count: "exact", head: true })
      .eq("role", "REGISTERED_USER"),
    db
      .from("users")
      .select("*", { count: "exact", head: true })
      .eq("role", "ADMIN"),
    db
      .from("applications")
      .select(
        "id, referenceNumber, applicantName, applicantBarangay, status, createdAt, benefitProgramId"
      )
      .order("createdAt", { ascending: false })
      .limit(5),
    db
      .from("application_status_history")
      .select("id, toStatus, changedAt, applicationId, changedBy")
      .order("changedAt", { ascending: false })
      .limit(5),
    ...statusList.map((s) =>
      db
        .from("applications")
        .select("*", { count: "exact", head: true })
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

  // Audit log user names
  const changedByIds = Array.from(
    new Set((recentAuditLogs ?? []).map((l) => l.changedBy).filter(Boolean))
  );
  const { data: changedByUsers } = changedByIds.length
    ? await db
        .from("users")
        .select("id, firstName, lastName")
        .in("id", changedByIds as string[])
    : { data: [] };

  const auditLogsWithUsers = (recentAuditLogs ?? []).map((log) => {
    const u = (changedByUsers ?? []).find((u) => u.id === log.changedBy);
    return {
      ...log,
      changedByName: u ? `${u.firstName} ${u.lastName}` : "System",
    };
  });

  // System health
  const dbConnected = totalResidents !== null;

  return (
    <div>
      <TopBar
        title="System Dashboard"
        subtitle="MISP — Full system overview for Super Administrators"
      />
      <div className="p-6 space-y-6">
        {/* System Health Banner */}
        <div
          className={`flex items-center gap-3 px-4 py-3 rounded-xl border text-sm font-medium ${
            dbConnected
              ? "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-700 dark:text-green-400"
              : "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-700 dark:text-red-400"
          }`}
        >
          <span
            className={`w-2 h-2 rounded-full ${
              dbConnected ? "bg-green-500" : "bg-red-500"
            }`}
          />
          {dbConnected
            ? "All systems operational — Database connected"
            : "Database connection issue detected"}
        </div>

        {/* Metric Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-4">
          <MetricCard
            title="Residents"
            value={totalResidents ?? 0}
            icon={Users}
            color="bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"
          />
          <MetricCard
            title="Staff Accounts"
            value={totalAdmins ?? 0}
            icon={ShieldCheck}
            color="bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400"
          />
          <MetricCard
            title="Total Apps"
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
            title="Under Review"
            value={countMap["UNDER_REVIEW"]}
            icon={FileText}
            color="bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"
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
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2">
            <ApplicationsChart />
          </div>
          <StatusChart data={pieData.length > 0 ? pieData : undefined} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
                  <tr className="bg-gray-50 dark:bg-slate-800/50">
                    {["Reference", "Applicant", "Status"].map((h) => (
                      <th
                        key={h}
                        className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wide"
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
                        colSpan={3}
                        className="px-4 py-8 text-center text-gray-400 text-sm"
                      >
                        No applications yet.
                      </td>
                    </tr>
                  ) : (
                    appsWithPrograms.map((app) => (
                      <tr
                        key={app.id}
                        className="hover:bg-gray-50 dark:hover:bg-slate-800/50"
                      >
                        <td className="px-4 py-3 font-mono text-xs text-makati-blue font-semibold">
                          {app.referenceNumber}
                        </td>
                        <td className="px-4 py-3 text-gray-900 dark:text-white font-medium">
                          {app.applicantName}
                        </td>
                        <td className="px-4 py-3">
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

          {/* Recent Audit Activity */}
          <div className="card overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-slate-700">
              <h2 className="font-bold text-gray-900 dark:text-white">
                Recent Audit Activity
              </h2>
              <Link
                href="/super-admin/audit-logs"
                className="text-sm text-makati-blue font-medium hover:underline flex items-center gap-1"
              >
                View all <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="divide-y divide-gray-100 dark:divide-slate-700">
              {auditLogsWithUsers.length === 0 ? (
                <p className="px-6 py-8 text-center text-sm text-gray-400 dark:text-slate-500">
                  No audit activity yet.
                </p>
              ) : (
                auditLogsWithUsers.map((log) => (
                  <div key={log.id} className="px-6 py-3">
                    <p className="text-sm text-gray-900 dark:text-white">
                      <span className="font-semibold">{log.changedByName}</span>{" "}
                      changed status to{" "}
                      <span className="font-semibold text-makati-blue">
                        {log.toStatus.replace(/_/g, " ")}
                      </span>
                    </p>
                    <p className="text-xs text-gray-400 dark:text-slate-500 mt-0.5">
                      {new Date(log.changedAt).toLocaleDateString("en-PH", {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
