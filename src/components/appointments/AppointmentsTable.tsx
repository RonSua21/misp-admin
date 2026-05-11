"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, CheckCircle2, XCircle, UserX, Check } from "lucide-react";
import type { Appointment, AppointmentStatus } from "@/types";

const STATUS_COLORS: Record<AppointmentStatus, string> = {
  PENDING:   "bg-yellow-100 text-yellow-800",
  CONFIRMED: "bg-blue-100 text-blue-800",
  COMPLETED: "bg-green-100 text-green-800",
  CANCELLED: "bg-gray-100 text-gray-600",
  NO_SHOW:   "bg-red-100 text-red-700",
};

const SERVICE_LABELS: Record<string, string> = {
  CASE_CONSULTATION:   "Case Consultation",
  CERTIFICATE_REQUEST: "Certificate Request",
  FINANCIAL_INQUIRY:   "Financial Inquiry",
  SOLO_PARENT:         "Solo Parent",
  PWD_ASSESSMENT:      "PWD Assessment",
  GENERAL_INQUIRY:     "General Inquiry",
};

const STATUSES: AppointmentStatus[] = ["PENDING", "CONFIRMED", "COMPLETED", "CANCELLED", "NO_SHOW"];

interface Props {
  appointments: Appointment[];
  total: number;
  currentDate: string;
  currentStatus: string;
}

export default function AppointmentsTable({ appointments, total, currentDate, currentStatus }: Props) {
  const router = useRouter();
  const [date, setDate]     = useState(currentDate);
  const [status, setStatus] = useState(currentStatus);
  const [busy, setBusy]     = useState<string | null>(null);
  const [error, setError]   = useState<string | null>(null);

  function navigate(d = date, s = status) {
    const sp = new URLSearchParams({ date: d, ...(s ? { status: s } : {}) });
    router.push(`/admin/appointments?${sp.toString()}`);
  }

  async function doAction(id: string, action: string) {
    setBusy(id + action); setError(null);
    try {
      const res = await fetch(`/api/admin/appointments/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Action failed."); return; }
      router.refresh();
    } catch { setError("Network error."); }
    finally { setBusy(null); }
  }

  return (
    <div className="space-y-4">
      {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="flex items-center gap-2">
          <label className="text-sm font-semibold text-gray-600 dark:text-slate-300">Date</label>
          <input type="date" value={date}
            onChange={e => { setDate(e.target.value); navigate(e.target.value, status); }}
            className="border border-gray-300 dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-makati-blue" />
        </div>
        <div className="flex gap-1 flex-wrap">
          <button onClick={() => { setStatus(""); navigate(date, ""); }}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${!status ? "bg-makati-blue text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
            All
          </button>
          {STATUSES.map(s => (
            <button key={s} onClick={() => { setStatus(s); navigate(date, s); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${status === s ? "bg-makati-blue text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
              {s}
            </button>
          ))}
        </div>
        <span className="ml-auto text-sm text-gray-500">{total} appointment{total !== 1 ? "s" : ""}</span>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-700 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 dark:bg-slate-800 text-gray-500 dark:text-slate-400 text-xs uppercase tracking-wide">
            <tr>
              <th className="px-4 py-3 text-left">Queue</th>
              <th className="px-4 py-3 text-left">Client</th>
              <th className="px-4 py-3 text-left">Service</th>
              <th className="px-4 py-3 text-left">Time</th>
              <th className="px-4 py-3 text-left">Type</th>
              <th className="px-4 py-3 text-left">Status</th>
              <th className="px-4 py-3 text-left">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
            {appointments.length === 0 && (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-400 text-sm">No appointments for this date.</td></tr>
            )}
            {appointments.map(a => (
              <tr key={a.id} className="hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors">
                <td className="px-4 py-3 font-mono text-xs font-bold text-makati-blue">{a.queueNumber ?? "—"}</td>
                <td className="px-4 py-3 font-medium text-gray-800 dark:text-white">{a.clientName || "Walk-in"}</td>
                <td className="px-4 py-3 text-gray-600 dark:text-slate-300">{SERVICE_LABELS[a.serviceType] ?? a.serviceType}</td>
                <td className="px-4 py-3 text-gray-500 dark:text-slate-400">{a.preferredTime}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${a.isWalkIn ? "bg-orange-100 text-orange-700" : "bg-purple-100 text-purple-700"}`}>
                    {a.isWalkIn ? "Walk-in" : "Booked"}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${STATUS_COLORS[a.status]}`}>{a.status}</span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-1">
                    {a.status === "PENDING" && (
                      <button disabled={busy === a.id + "confirm"} onClick={() => doAction(a.id, "confirm")} title="Confirm"
                        className="p-1.5 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 disabled:opacity-50">
                        {busy === a.id + "confirm" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                      </button>
                    )}
                    {(a.status === "PENDING" || a.status === "CONFIRMED") && (
                      <>
                        <button disabled={busy === a.id + "complete"} onClick={() => doAction(a.id, "complete")} title="Complete"
                          className="p-1.5 rounded-lg bg-green-50 text-green-700 hover:bg-green-100 disabled:opacity-50">
                          {busy === a.id + "complete" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                        </button>
                        <button disabled={busy === a.id + "no_show"} onClick={() => doAction(a.id, "no_show")} title="No Show"
                          className="p-1.5 rounded-lg bg-orange-50 text-orange-700 hover:bg-orange-100 disabled:opacity-50">
                          {busy === a.id + "no_show" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <UserX className="w-3.5 h-3.5" />}
                        </button>
                        <button disabled={busy === a.id + "cancel"} onClick={() => doAction(a.id, "cancel")} title="Cancel"
                          className="p-1.5 rounded-lg bg-red-50 text-red-700 hover:bg-red-100 disabled:opacity-50">
                          {busy === a.id + "cancel" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <XCircle className="w-3.5 h-3.5" />}
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
