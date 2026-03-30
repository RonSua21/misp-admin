import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import Link from "next/link";
import {
  ArrowLeft, Flame, MapPin, Calendar, Users,
  Package, Activity, CheckCircle2, Printer,
} from "lucide-react";
import {
  AddCenterForm,
  AddEvacueeForm,
  AddInventoryForm,
  StatusUpdateButton,
} from "@/components/disaster/CenterActions";
import { CenterQRCode } from "@/components/disaster/CenterQRCode";
import { DistributeButton } from "@/components/disaster/DistributeButton";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Incident Detail — MISP Admin" };

const TYPE_COLORS: Record<string, string> = {
  TYPHOON:    "bg-blue-100 text-blue-700",
  FIRE:       "bg-red-100 text-red-700",
  FLOOD:      "bg-cyan-100 text-cyan-700",
  EARTHQUAKE: "bg-orange-100 text-orange-700",
  LANDSLIDE:  "bg-amber-100 text-amber-700",
  OTHER:      "bg-gray-100 text-gray-700",
};

const STATUS_COLORS: Record<string, string> = {
  ACTIVE:     "bg-red-100 text-red-700",
  MONITORING: "bg-amber-100 text-amber-700",
  RESOLVED:   "bg-green-100 text-green-700",
};

export default async function DisasterDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const db = createAdminClient();

  const [{ data: incident }, { data: centers }, { data: inventory }] = await Promise.all([
    db.from("disaster_incidents").select("*").eq("id", id).single(),
    db.from("evacuation_centers").select("*, evacuees(*)").eq("disasterIncidentId", id).order("createdAt", { ascending: true }),
    db.from("relief_inventory").select("*").eq("disasterIncidentId", id).order("createdAt", { ascending: false }),
  ]);

  if (!incident) notFound();

  const allCenters   = centers   ?? [];
  const allInventory = inventory ?? [];

  const totalEvacuees = allCenters.reduce((sum, c) => sum + (c.currentHeadcount ?? 0), 0);
  const totalCapacity = allCenters.reduce((sum, c) => sum + (c.capacity ?? 0), 0);

  // Inventory stock calculations
  const lowStockCount = allInventory.filter((item) => {
    const remaining = (item.quantityAvailable ?? 0) - (item.quantityDistributed ?? 0);
    const pct = item.quantityAvailable > 0 ? (remaining / item.quantityAvailable) * 100 : 0;
    return pct < 20;
  }).length;

  return (
    <div className="p-6 space-y-8">

      {/* Back + Header */}
      <div>
        <Link
          href="/admin/disaster"
          className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-white transition-colors mb-4"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Disasters
        </Link>

        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${TYPE_COLORS[incident.type] ?? TYPE_COLORS.OTHER}`}>
                {incident.type}
              </span>
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${STATUS_COLORS[incident.status]}`}>
                {incident.status}
              </span>
            </div>
            <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white flex items-center gap-2">
              <Flame className="w-6 h-6 text-red-500 shrink-0" />
              {incident.title}
            </h1>
            {incident.barangay && (
              <p className="text-sm text-gray-500 dark:text-slate-400 flex items-center gap-1.5 mt-1">
                <MapPin className="w-3.5 h-3.5" /> Brgy. {incident.barangay}
              </p>
            )}
            {incident.description && (
              <p className="text-sm text-gray-600 dark:text-slate-400 mt-2 max-w-2xl">{incident.description}</p>
            )}
          </div>
          <StatusUpdateButton incidentId={id} currentStatus={incident.status} />
        </div>

        {/* Info row */}
        <div className="flex flex-wrap gap-6 mt-4 text-sm text-gray-500 dark:text-slate-400">
          <span className="flex items-center gap-1.5">
            <Calendar className="w-4 h-4" />
            Reported: {new Date(incident.reportedAt).toLocaleDateString("en-PH", { year: "numeric", month: "long", day: "numeric" })}
          </span>
          {incident.resolvedAt && (
            <span className="flex items-center gap-1.5 text-green-600 dark:text-green-400">
              <CheckCircle2 className="w-4 h-4" />
              Resolved: {new Date(incident.resolvedAt).toLocaleDateString("en-PH", { year: "numeric", month: "long", day: "numeric" })}
            </span>
          )}
          <span className="flex items-center gap-1.5">
            <Users className="w-4 h-4" />
            {totalEvacuees} evacuees / {totalCapacity} capacity across {allCenters.length} center{allCenters.length !== 1 ? "s" : ""}
          </span>
        </div>
      </div>

      {/* ── Evacuation Centers ─────────────────────────────────────────────── */}
      <section className="card dark:bg-slate-900 dark:border-slate-700 p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Activity className="w-5 h-5 text-amber-500" />
            Evacuation Centers ({allCenters.length})
          </h2>
          <AddCenterForm incidentId={id} />
        </div>

        {allCenters.length === 0 ? (
          <p className="text-sm text-gray-400 dark:text-slate-500">No centers added yet.</p>
        ) : (
          <div className="space-y-4">
            {allCenters.map((center) => {
              const pct    = Math.min(Math.round(((center.currentHeadcount ?? 0) / (center.capacity || 1)) * 100), 100);
              const isFull = pct >= 100;
              const evacueeList = (center.evacuees ?? []) as { id: string; name: string; age?: number; barangay?: string; headCount: number }[];

              return (
                <div key={center.id} className="border border-gray-100 dark:border-slate-700 rounded-xl overflow-hidden">
                  {/* Center header */}
                  <div className="bg-gray-50 dark:bg-slate-800 px-5 py-3 flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-white text-sm">{center.name}</p>
                      <p className="text-xs text-gray-500 dark:text-slate-400 flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3 h-3" /> {center.address}, Brgy. {center.barangay}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${isFull ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"}`}>
                        {isFull ? "FULL" : "OPEN"}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-slate-400">
                        {center.currentHeadcount}/{center.capacity}
                      </span>
                      {/* QR Code button */}
                      <CenterQRCode centerId={center.id} centerName={center.name} />
                      {/* Print List */}
                      <Link
                        href={`/admin/disaster/${id}/print?center=${center.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-600 dark:text-slate-300 bg-white dark:bg-slate-700 border border-gray-200 dark:border-slate-600 px-3 py-1.5 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-600 transition-colors"
                      >
                        <Printer className="w-3.5 h-3.5" /> Print List
                      </Link>
                    </div>
                  </div>

                  {/* Capacity bar */}
                  <div className="px-5 py-2 bg-white dark:bg-slate-900">
                    <div className="w-full h-1.5 bg-gray-100 dark:bg-slate-700 rounded-full">
                      <div
                        className={`h-full rounded-full transition-all ${isFull ? "bg-red-500" : pct > 70 ? "bg-amber-500" : "bg-green-500"}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>

                  {/* Evacuees table */}
                  {evacueeList.length > 0 && (
                    <div className="px-5 py-3 bg-white dark:bg-slate-900">
                      <p className="text-xs font-semibold text-gray-400 dark:text-slate-500 uppercase tracking-wide mb-2">
                        Registered Evacuees
                      </p>
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="text-gray-400 dark:text-slate-500 text-left">
                            <th className="py-1 pr-4 font-semibold">Name</th>
                            <th className="py-1 pr-4 font-semibold">Age</th>
                            <th className="py-1 pr-4 font-semibold">Home Brgy.</th>
                            <th className="py-1 font-semibold">Family Members</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50 dark:divide-slate-800">
                          {evacueeList.map((ev) => (
                            <tr key={ev.id}>
                              <td className="py-1.5 pr-4 font-medium text-gray-900 dark:text-white">{ev.name}</td>
                              <td className="py-1.5 pr-4 text-gray-500 dark:text-slate-400">{ev.age ?? "—"}</td>
                              <td className="py-1.5 pr-4 text-gray-500 dark:text-slate-400">{ev.barangay ?? "—"}</td>
                              <td className="py-1.5 text-gray-500 dark:text-slate-400">{ev.headCount}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Register evacuee */}
        {allCenters.length > 0 && (
          <div className="pt-2 border-t border-gray-100 dark:border-slate-700">
            <AddEvacueeForm
              incidentId={id}
              centers={allCenters.map((c) => ({ id: c.id, name: c.name }))}
            />
          </div>
        )}
      </section>

      {/* ── Relief Inventory ──────────────────────────────────────────────── */}
      <section className="card dark:bg-slate-900 dark:border-slate-700 p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Package className="w-5 h-5 text-green-600" />
            Relief Inventory ({allInventory.length})
          </h2>
          <AddInventoryForm incidentId={id} />
        </div>

        {/* Summary bar */}
        {allInventory.length > 0 && (
          <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-slate-400">
            <span>{allInventory.length} item{allInventory.length !== 1 ? "s" : ""}</span>
            {lowStockCount > 0 && (
              <span className="inline-flex items-center gap-1 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 font-semibold px-2 py-0.5 rounded-full">
                ⚠ {lowStockCount} low on stock
              </span>
            )}
          </div>
        )}

        {allInventory.length === 0 ? (
          <p className="text-sm text-gray-400 dark:text-slate-500">No inventory items added yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 dark:bg-slate-800 text-left">
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wide">Item</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wide">Unit</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wide">Available</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wide">Distributed</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wide">Remaining</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wide">Target Brgy.</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wide">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
                {allInventory.map((item) => {
                  const remaining = (item.quantityAvailable ?? 0) - (item.quantityDistributed ?? 0);
                  const pct = item.quantityAvailable > 0 ? (remaining / item.quantityAvailable) * 100 : 0;
                  const stockColor = pct < 20
                    ? "text-red-600 dark:text-red-400 font-bold"
                    : pct < 50
                    ? "text-amber-600 dark:text-amber-400 font-semibold"
                    : "text-green-600 dark:text-green-400";

                  return (
                    <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors">
                      <td className="px-4 py-3 font-semibold text-gray-900 dark:text-white">
                        <div className="flex items-center gap-2">
                          {item.itemName}
                          {pct < 20 && (
                            <span className="text-[10px] font-bold bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400 px-1.5 py-0.5 rounded-full">LOW</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-500 dark:text-slate-400">{item.unit}</td>
                      <td className="px-4 py-3 text-gray-900 dark:text-white font-mono">{item.quantityAvailable}</td>
                      <td className="px-4 py-3">
                        <span className={`font-mono ${item.quantityDistributed > 0 ? "text-green-600 dark:text-green-400" : "text-gray-400"}`}>
                          {item.quantityDistributed}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`font-mono ${stockColor}`}>{remaining}</span>
                      </td>
                      <td className="px-4 py-3 text-gray-500 dark:text-slate-400">{item.barangay ?? "All"}</td>
                      <td className="px-4 py-3">
                        <DistributeButton
                          itemId={item.id}
                          incidentId={id}
                          currentDistributed={item.quantityDistributed ?? 0}
                          maxAvailable={item.quantityAvailable ?? 0}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

    </div>
  );
}
