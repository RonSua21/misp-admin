import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";
import TopBar from "@/components/layout/TopBar";

const STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-800",
  UNDER_REVIEW: "bg-blue-100 text-blue-800",
  APPROVED: "bg-green-100 text-green-800",
  REJECTED: "bg-red-100 text-red-800",
  DISBURSED: "bg-purple-100 text-purple-800",
};

export default async function AuditLogsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const params = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const db = createAdminClient();
  const page = parseInt(params.page ?? "1", 10);
  const pageSize = 30;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const { data: logs, count } = await db
    .from("application_status_history")
    .select(
      "id, applicationId, fromStatus, toStatus, changedAt, remarks, changedBy",
      { count: "exact" }
    )
    .order("changedAt", { ascending: false })
    .range(from, to);

  const changedByIds = Array.from(
    new Set((logs ?? []).map((l) => l.changedBy).filter(Boolean))
  );
  const { data: changedByUsers } = changedByIds.length
    ? await db
        .from("users")
        .select("id, firstName, lastName, email, role")
        .in("id", changedByIds as string[])
    : { data: [] };

  const appIds = Array.from(
    new Set((logs ?? []).map((l) => l.applicationId).filter(Boolean))
  );
  const { data: apps } = appIds.length
    ? await db
        .from("applications")
        .select("id, referenceNumber, applicantName")
        .in("id", appIds as string[])
    : { data: [] };

  const logsEnriched = (logs ?? []).map((log) => {
    const u = (changedByUsers ?? []).find((u) => u.id === log.changedBy);
    const app = (apps ?? []).find((a) => a.id === log.applicationId);
    return {
      ...log,
      changedByName: u ? `${u.firstName} ${u.lastName}` : "System",
      changedByEmail: u?.email ?? "",
      changedByRole: u?.role ?? "",
      referenceNumber: app?.referenceNumber ?? "—",
      applicantName: app?.applicantName ?? "—",
    };
  });

  const totalPages = Math.ceil((count ?? 0) / pageSize);

  return (
    <div>
      <TopBar
        title="Audit Logs"
        subtitle="Full trail of all application status changes"
      />
      <div className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500 dark:text-slate-400">
            {count ?? 0} total entries
          </p>
        </div>

        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 dark:bg-slate-800/50 text-left">
                  {[
                    "Changed By",
                    "Application",
                    "Applicant",
                    "From",
                    "To",
                    "Remarks",
                    "Date & Time",
                  ].map((h) => (
                    <th
                      key={h}
                      className="px-4 py-3 text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wide whitespace-nowrap"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
                {logsEnriched.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-6 py-12 text-center text-gray-400 dark:text-slate-500"
                    >
                      No audit entries found.
                    </td>
                  </tr>
                ) : (
                  logsEnriched.map((log) => (
                    <tr
                      key={log.id}
                      className="hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors"
                    >
                      <td className="px-4 py-3.5">
                        <p className="font-medium text-gray-900 dark:text-white">
                          {log.changedByName}
                        </p>
                        <p className="text-xs text-gray-400 dark:text-slate-500">
                          {log.changedByRole}
                        </p>
                      </td>
                      <td className="px-4 py-3.5 font-mono text-xs text-makati-blue font-semibold">
                        {log.referenceNumber}
                      </td>
                      <td className="px-4 py-3.5 text-gray-600 dark:text-slate-300">
                        {log.applicantName}
                      </td>
                      <td className="px-4 py-3.5">
                        {log.fromStatus ? (
                          <span
                            className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                              STATUS_COLORS[log.fromStatus] ??
                              "bg-gray-100 text-gray-700"
                            }`}
                          >
                            {log.fromStatus.replace(/_/g, " ")}
                          </span>
                        ) : (
                          <span className="text-gray-400 text-xs">New</span>
                        )}
                      </td>
                      <td className="px-4 py-3.5">
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                            STATUS_COLORS[log.toStatus] ??
                            "bg-gray-100 text-gray-700"
                          }`}
                        >
                          {log.toStatus.replace(/_/g, " ")}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-gray-500 dark:text-slate-400 max-w-[200px] truncate">
                        {log.remarks ?? "—"}
                      </td>
                      <td className="px-4 py-3.5 text-gray-500 dark:text-slate-400 whitespace-nowrap">
                        {new Date(log.changedAt).toLocaleDateString("en-PH", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 dark:border-slate-700">
              <p className="text-sm text-gray-500 dark:text-slate-400">
                Page {page} of {totalPages}
              </p>
              <div className="flex gap-2">
                {page > 1 && (
                  <a
                    href={`/super-admin/audit-logs?page=${page - 1}`}
                    className="px-3 py-1.5 text-sm rounded-lg border border-gray-200 dark:border-slate-600 text-gray-600 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700"
                  >
                    Previous
                  </a>
                )}
                {page < totalPages && (
                  <a
                    href={`/super-admin/audit-logs?page=${page + 1}`}
                    className="px-3 py-1.5 text-sm rounded-lg border border-gray-200 dark:border-slate-600 text-gray-600 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700"
                  >
                    Next
                  </a>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
