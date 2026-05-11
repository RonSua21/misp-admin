"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Calendar, Loader2, CheckCircle } from "lucide-react";
import type { HomeVisitSchedule } from "@/types";

interface Props {
  caseId: string;
  visits: HomeVisitSchedule[];
  socialWorkers: { id: string; name: string }[];
}

export default function HomeVisitLog({ caseId, visits, socialWorkers }: Props) {
  const router = useRouter();
  const [scheduledAt, setScheduledAt]     = useState("");
  const [socialWorkerId, setSocialWorker] = useState(socialWorkers[0]?.id ?? "");
  const [busy, setBusy]                   = useState(false);
  const [error, setError]                 = useState<string | null>(null);
  const [completing, setCompleting]       = useState<string | null>(null);
  const [findings, setFindings]           = useState<Record<string, string>>({});

  async function scheduleVisit(e: React.FormEvent) {
    e.preventDefault();
    if (!scheduledAt || !socialWorkerId) return;
    setBusy(true); setError(null);
    try {
      const res = await fetch(`/api/admin/cases/${caseId}/visits`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scheduledAt, socialWorkerId }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Failed to schedule visit."); return; }
      setScheduledAt(""); router.refresh();
    } catch { setError("Network error."); }
    finally { setBusy(false); }
  }

  async function completeVisit(visitId: string) {
    const findingText = findings[visitId] ?? "";
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/cases/${caseId}/visits`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ visitId, findings: findingText || undefined }),
      });
      if (res.ok) { setCompleting(null); router.refresh(); }
    } finally { setBusy(false); }
  }

  return (
    <div className="space-y-4">
      {/* Schedule new visit */}
      <form onSubmit={scheduleVisit} className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wide mb-1">Date & Time</label>
            <input type="datetime-local" value={scheduledAt} onChange={e => setScheduledAt(e.target.value)} disabled={busy}
              className="w-full border border-gray-300 dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-makati-blue" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wide mb-1">Social Worker</label>
            <select value={socialWorkerId} onChange={e => setSocialWorker(e.target.value)} disabled={busy}
              className="w-full border border-gray-300 dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-makati-blue">
              {socialWorkers.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
            </select>
          </div>
        </div>
        {error && <p className="text-xs text-red-600">{error}</p>}
        <button type="submit" disabled={busy || !scheduledAt}
          className="inline-flex items-center gap-2 bg-makati-blue text-white text-sm font-semibold px-4 py-2 rounded-lg hover:bg-blue-800 disabled:opacity-50 transition-colors">
          {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Calendar className="w-4 h-4" />}
          Schedule Visit
        </button>
      </form>

      {/* Visit list */}
      <div className="space-y-3">
        {visits.length === 0 && <p className="text-sm text-gray-400 italic">No home visits scheduled.</p>}
        {visits.map(v => (
          <div key={v.id} className="bg-gray-50 dark:bg-slate-800 rounded-xl p-4 space-y-2">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="space-y-0.5">
                <p className="text-sm font-semibold text-gray-800 dark:text-white">
                  {new Date(v.scheduledAt).toLocaleString()}
                </p>
                <p className="text-xs text-gray-500 dark:text-slate-400">Assigned: {v.workerName ?? "—"}</p>
              </div>
              {!v.conductedAt && (
                <button onClick={() => setCompleting(completing === v.id ? null : v.id)}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-green-700 bg-green-50 hover:bg-green-100 px-3 py-1.5 rounded-lg transition-colors">
                  <CheckCircle className="w-3.5 h-3.5" /> Mark Conducted
                </button>
              )}
              {v.conductedAt && (
                <span className="text-xs text-green-700 bg-green-50 px-2 py-1 rounded-lg font-semibold">
                  Conducted {new Date(v.conductedAt).toLocaleDateString()}
                </span>
              )}
            </div>
            {v.findings && <p className="text-sm text-gray-600 dark:text-slate-300 whitespace-pre-wrap">{v.findings}</p>}
            {completing === v.id && (
              <div className="space-y-2 pt-2 border-t border-gray-200 dark:border-slate-700">
                <textarea rows={3} value={findings[v.id] ?? ""} onChange={e => setFindings(f => ({ ...f, [v.id]: e.target.value }))}
                  placeholder="Findings from the home visit…"
                  className="w-full border border-gray-300 dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-makati-blue resize-none" />
                <div className="flex gap-2">
                  <button disabled={busy} onClick={() => completeVisit(v.id)}
                    className="px-4 py-1.5 bg-green-600 text-white text-xs font-semibold rounded-lg hover:bg-green-700 disabled:opacity-50">
                    {busy ? "Saving…" : "Save Findings"}
                  </button>
                  <button onClick={() => setCompleting(null)} className="px-4 py-1.5 text-xs text-gray-500 border border-gray-200 dark:border-slate-700 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-800">
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
