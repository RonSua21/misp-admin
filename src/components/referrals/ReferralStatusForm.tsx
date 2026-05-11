"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import type { ReferralStatus } from "@/types";

const STATUS_OPTIONS: ReferralStatus[] = ["PENDING", "ACCEPTED", "ACTIVE", "COMPLETED", "DECLINED"];

interface Props {
  referralId: string;
  currentStatus: ReferralStatus;
  currentOutcome?: string;
}

export default function ReferralStatusForm({ referralId, currentStatus, currentOutcome }: Props) {
  const router  = useRouter();
  const [status,  setStatus]  = useState(currentStatus);
  const [outcome, setOutcome] = useState(currentOutcome ?? "");
  const [busy,    setBusy]    = useState(false);
  const [error,   setError]   = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSave() {
    setBusy(true); setError(null); setSuccess(false);
    try {
      const res = await fetch(`/api/admin/referrals/${referralId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, outcome: outcome || undefined, responseDate: new Date().toISOString() }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Update failed."); return; }
      setSuccess(true); router.refresh();
      setTimeout(() => setSuccess(false), 2000);
    } catch { setError("Network error."); }
    finally { setBusy(false); }
  }

  return (
    <div className="space-y-4">
      {error   && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}
      {success && <p className="text-sm text-green-700 bg-green-50 rounded-lg px-3 py-2">Updated successfully.</p>}

      <div>
        <label className="block text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wide mb-1">Status</label>
        <select value={status} onChange={e => setStatus(e.target.value as ReferralStatus)} disabled={busy}
          className="w-full border border-gray-300 dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-makati-blue">
          {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      <div>
        <label className="block text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wide mb-1">Outcome / Notes</label>
        <textarea rows={3} value={outcome} onChange={e => setOutcome(e.target.value)} disabled={busy}
          placeholder="Outcome of this referral (optional)…"
          className="w-full border border-gray-300 dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-makati-blue resize-none" />
      </div>

      <button disabled={busy} onClick={handleSave}
        className="w-full inline-flex items-center justify-center gap-2 bg-makati-blue text-white text-sm font-semibold px-4 py-2.5 rounded-lg hover:bg-blue-800 disabled:opacity-50 transition-colors">
        {busy ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving…</> : "Save Changes"}
      </button>
    </div>
  );
}
