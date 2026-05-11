import { createAdminClient } from "@/lib/supabase/admin";
import Link from "next/link";
import {
  Flame, CheckCircle2, AlertTriangle, Activity, ChevronRight,
  ChevronLeft,
} from "lucide-react";
import NewIncidentForm from "@/components/disaster/NewIncidentForm";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Disaster & Relief — MISP Admin" };

const TYPE_COLORS: Record<string, string> = {
  TYPHOON:    "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  FIRE:       "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
  FLOOD:      "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300",
  EARTHQUAKE: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300",
  LANDSLIDE:  "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
  OTHER:      "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
};

const STATUS_COLORS: Record<string, string> = {
  ACTIVE:     "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
  MONITORING: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
  RESOLVED:   "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
};

const PAGE_SIZE = 10;

export default async function DisasterPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const params = await searchParams;
  const page = Math.max(1, parseInt(params.page ?? "1", 10));
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  const db = createAdminClient();

  const [{ data: incidents, count: incidentCount }, { data: centers }] = await Promise.all([
    db.from("disaster_incidents")
      .select("id, title, type, barangay, status, reportedAt, resolvedAt", { count: "exact" })
      .order("reportedAt", { ascending: false })
      .range(from, to),
    db.from("evacuation_centers")
      .select("id, isOpen, currentHeadcount, capacity"),
  ]);

  const allIncidents  = incidents ?? [];
  const allCenters    = centers   ?? [];
  const totalIncidents = incidentCount ?? 0;
  const totalPages    = Math.ceil(totalIncidents / PAGE_SIZE);

  // Stats are computed from centers (always fetched in full — low-volume table).
  // Incident status stats use the paginated slice only for display accuracy.
  const activeCount   = allIncidents.filter((i) => i.status === "ACTIVE").length;
  const openCenters   = allCenters.filter((c) => c.isOpen).length;
  const totalEvacuees = allCenters.reduce((sum, c) => sum + (c.currentHeadcount ?? 0), 0);
  const resolvedCount = allIncidents.filter((i) => i.status === "RESOLVED").length;

  return (
    <div className="p-6 space-y-8">

      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white flex items-center gap-2">
            <Flame className="w-7 h-7 text-red-500" />
            Disaster &amp; Relief Management
          </h1>
          <p className="text-gray-500 dark:text-slate-400 text-sm mt-1">
            Track emergency incidents, evacuation centers, and relief operations.
          </p>
        </div>
        <NewIncidentForm />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Active Incidents",    value: activeCount,   icon: AlertTriangle, color: "text-red-500 bg-red-100 dark:bg-red-900/30" },
          { label: "Open Shelters",       value: openCenters,   icon: Activity,      color: "text-amber-600 bg-amber-100 dark:bg-amber-900/30" },
          { label: "Total Evacuees",      value: totalEvacuees, icon: Flame,         color: "text-blue-600 bg-blue-100 dark:bg-blue-900/30" },
          { label: "Resolved Incidents",  value: resolvedCount, icon: CheckCircle2,  color: "text-green-600 bg-green-100 dark:bg-green-900/30" },
        ].map((s) => (
          <div key={s.label} className="card dark:bg-slate-900 dark:border-slate-700 p-5 flex items-center gap-4">
            <div className={`w-12 h-12 rounded-xl ${s.color} flex items-center justify-center shrink-0`}>
              <s.icon className="w-6 h-6" />
            </div>
            <div>
              <p className="text-2xl font-extrabold text-gray-900 dark:text-white">{s.value}</p>
              <p className="text-xs text-gray-500 dark:text-slate-400">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Incidents Table */}
      <div className="card dark:bg-slate-900 dark:border-slate-700 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 dark:border-slate-700">
          <h2 className="font-bold text-gray-900 dark:text-white">All Incidents</h2>
        </div>

        {allIncidents.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <Flame className="w-10 h-10 text-gray-300 dark:text-slate-600 mx-auto mb-3" />
            <p className="text-gray-500 dark:text-slate-400 text-sm">No incidents reported yet.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 dark:bg-slate-800 text-left">
                  <th className="px-6 py-3 text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wide">Incident</th>
                  <th className="px-6 py-3 text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wide">Type</th>
                  <th className="px-6 py-3 text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wide">Barangay</th>
                  <th className="px-6 py-3 text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wide">Status</th>
                  <th className="px-6 py-3 text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wide">Reported</th>
                  <th className="px-6 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
                {allIncidents.map((inc) => (
                  <tr key={inc.id} className="hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors">
                    <td className="px-6 py-4 font-semibold text-gray-900 dark:text-white">{inc.title}</td>
                    <td className="px-6 py-4">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${TYPE_COLORS[inc.type] ?? TYPE_COLORS.OTHER}`}>
                        {inc.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-500 dark:text-slate-400">
                      {inc.barangay ?? "—"}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${STATUS_COLORS[inc.status]}`}>
                        {inc.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-500 dark:text-slate-400 whitespace-nowrap">
                      {new Date(inc.reportedAt).toLocaleDateString("en-PH", {
                        year: "numeric", month: "short", day: "numeric",
                      })}
                    </td>
                    <td className="px-6 py-4">
                      <Link
                        href={`/admin/disaster/${inc.id}`}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-makati-blue hover:underline"
                      >
                        Manage <ChevronRight className="w-3.5 h-3.5" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-3 border-t border-gray-100 dark:border-slate-700">
            <p className="text-sm text-gray-500 dark:text-slate-400">
              Showing {from + 1}–{Math.min(to + 1, totalIncidents)} of {totalIncidents}
            </p>
            <div className="flex gap-1">
              <Link
                href={`?page=${page - 1}`}
                aria-disabled={page <= 1}
                className={`p-1.5 rounded-lg border text-gray-500 dark:text-slate-400 border-gray-200 dark:border-slate-600 ${
                  page <= 1 ? "opacity-40 pointer-events-none" : "hover:bg-gray-100 dark:hover:bg-slate-700"
                }`}
              >
                <ChevronLeft className="w-4 h-4" />
              </Link>
              <Link
                href={`?page=${page + 1}`}
                aria-disabled={page >= totalPages}
                className={`p-1.5 rounded-lg border text-gray-500 dark:text-slate-400 border-gray-200 dark:border-slate-600 ${
                  page >= totalPages ? "opacity-40 pointer-events-none" : "hover:bg-gray-100 dark:hover:bg-slate-700"
                }`}
              >
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
