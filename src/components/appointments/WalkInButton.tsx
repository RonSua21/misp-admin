"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { UserPlus, X, Loader2, Hash } from "lucide-react";
import type { ServiceType } from "@/types";

const SERVICE_LABELS: Record<ServiceType, string> = {
  CASE_CONSULTATION:   "Case Consultation",
  CERTIFICATE_REQUEST: "Certificate Request",
  FINANCIAL_INQUIRY:   "Financial Inquiry",
  SOLO_PARENT:         "Solo Parent Services",
  PWD_ASSESSMENT:      "PWD Assessment",
  GENERAL_INQUIRY:     "General Inquiry",
};

export default function WalkInButton() {
  const router = useRouter();
  const [open, setOpen]           = useState(false);
  const [busy, setBusy]           = useState(false);
  const [serviceType, setService] = useState<ServiceType>("GENERAL_INQUIRY");
  const [notes, setNotes]         = useState("");
  const [queueNumber, setQueue]   = useState<string | null>(null);
  const [error, setError]         = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setError(null);
    try {
      const res = await fetch("/api/admin/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ serviceType, notes: notes || undefined }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Failed to add walk-in."); return; }
      setQueue(data.queueNumber);
      router.refresh();
    } catch { setError("Network error."); }
    finally { setBusy(false); }
  }

  function handleClose() {
    setOpen(false); setQueue(null); setNotes(""); setError(null);
  }

  return (
    <>
      <button onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 bg-makati-blue text-white text-sm font-semibold px-4 py-2.5 rounded-lg hover:bg-blue-800 active:scale-95 transition-all">
        <UserPlus className="w-4 h-4" /> Add Walk-in
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4"
          onClick={handleClose}>
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4 border border-gray-100 dark:border-slate-700"
            onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-makati-blue" />
                Add Walk-in Client
              </h3>
              <button onClick={handleClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                <X className="w-5 h-5" />
              </button>
            </div>

            {queueNumber ? (
              <div className="text-center py-6 space-y-3">
                <div className="flex items-center justify-center gap-2 text-makati-blue">
                  <Hash className="w-8 h-8" />
                </div>
                <p className="text-5xl font-black text-makati-blue">{queueNumber}</p>
                <p className="text-sm text-gray-500">Queue number assigned</p>
                <button onClick={handleClose}
                  className="mt-2 px-6 py-2.5 bg-makati-blue text-white rounded-lg text-sm font-semibold hover:bg-blue-800">
                  Done
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {error && <p className="text-sm text-red-600 bg-red-50 dark:bg-red-900/20 rounded-lg px-3 py-2">{error}</p>}
                <div>
                  <label className="block text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wide mb-1">Service Type</label>
                  <select value={serviceType} onChange={e => setService(e.target.value as ServiceType)} disabled={busy}
                    className="w-full border border-gray-300 dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-makati-blue">
                    {(Object.entries(SERVICE_LABELS) as [ServiceType, string][]).map(([k, v]) => (
                      <option key={k} value={k}>{v}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wide mb-1">Notes (optional)</label>
                  <textarea rows={2} value={notes} onChange={e => setNotes(e.target.value)} disabled={busy}
                    placeholder="Brief notes about the client's concern…"
                    className="w-full border border-gray-300 dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-makati-blue resize-none" />
                </div>
                <div className="flex gap-3 pt-1">
                  <button type="submit" disabled={busy}
                    className="inline-flex items-center gap-2 bg-makati-blue text-white text-sm font-semibold px-5 py-2.5 rounded-lg hover:bg-blue-800 disabled:opacity-50 transition-colors">
                    {busy ? <><Loader2 className="w-4 h-4 animate-spin" /> Adding…</> : "Assign Queue Number"}
                  </button>
                  <button type="button" onClick={handleClose} disabled={busy}
                    className="text-sm text-gray-500 dark:text-slate-400 px-4 py-2 rounded-lg border border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-800">
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
