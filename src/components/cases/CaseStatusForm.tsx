"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import type { CaseStatus, CasePriority } from "@/types";

const TRANSITIONS: Record<CaseStatus, CaseStatus[]> = {
  OPEN:        ["ACTIVE"],
  ACTIVE:      ["FOR_CLOSURE", "REFERRED"],
  FOR_CLOSURE: ["CLOSED", "ACTIVE"],
  CLOSED:      [],
  REFERRED:    ["CLOSED"],
};

const PRIORITY_OPTIONS: CasePriority[] = ["LOW", "MEDIUM", "HIGH", "URGENT"];

interface Worker { id: string; name: string; }

interface Props {
  caseId: string;
  currentStatus: CaseStatus;
  currentPriority: CasePriority;
  currentAssignedTo: string | null;
  workers: Worker[];
}

export default function CaseStatusForm({ caseId, currentStatus, currentPriority, currentAssignedTo, workers }: Props) {
  const router   = useRouter();
  const [status,   setStatus]   = useState(currentStatus);
  const [priority, setPriority] = useState(currentPriority);
  const [assigned, setAssigned] = useState(currentAssignedTo ?? "");
  const [busy,     setBusy]     = useState(false);
  const [error,    setError]    = useState<string | null>(null);
  const [success,  setSuccess]  = useState(false);

  async function handleSave() {
    setBusy(true); setError(null); setSuccess(false);
    try {
      const res = await fetch(`/api/admin/cases/${caseId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, priority, assignedTo: assigned || null }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Update failed."); return; }
      setSuccess(true); router.refresh();
      setTimeout(() => setSuccess(false), 2000);
    } catch { setError("Network error."); }
    finally { setBusy(false); }
  }

  const nextStatuses = TRANSITIONS[currentStatus];

  return (
    <div className="space-y-4">
      {error   && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}
      {success && <p className="text-sm text-green-700 bg-green-50 rounded-lg px-3 py-2">Updated successfully.</p>}

      {nextStatuses.length > 0 && (
        <div>
          <label className="block text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wide mb-1">Status</label>
          <select value={status} onChange={e => setStatus(e.target.value as CaseStatus)} disabled={busy}
            className="w-full border border-gray-300 dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-makati-blue">
            <option value={currentStatus}>{currentStatus.replace("_", " ")} (current)</option>
            {nextStatuses.map(s => (
              <option key={s} value={s}>{s.replace("_", " ")}</option>
            ))}
          </select>
        </div>
      )}

      <div>
        <label className="block text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wide mb-1">Priority</label>
        <select value={priority} onChange={e => setPriority(e.target.value as CasePriority)} disabled={busy}
          className="w-full border border-gray-300 dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-makati-blue">
          {PRIORITY_OPTIONS.map(p => <option key={p} value={p}>{p}</option>)}
        </select>
      </div>

      <div>
        <label className="block text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wide mb-1">Assigned Social Worker</label>
        <select value={assigned} onChange={e => setAssigned(e.target.value)} disabled={busy}
          className="w-full border border-gray-300 dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-makati-blue">
          <option value="">— Unassigned —</option>
          {workers.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
        </select>
      </div>

      <button disabled={busy} onClick={handleSave}
        className="w-full inline-flex items-center justify-center gap-2 bg-makati-blue text-white text-sm font-semibold px-4 py-2.5 rounded-lg hover:bg-blue-800 disabled:opacity-50 transition-colors">
        {busy ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving…</> : "Save Changes"}
      </button>
    </div>
  );
}
