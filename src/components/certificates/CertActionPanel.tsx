"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle, XCircle, PackageCheck, Loader2 } from "lucide-react";
import type { CertStatus } from "@/types";

interface Props {
  certId: string;
  status: CertStatus;
  referenceNumber: string;
}

export default function CertActionPanel({ certId, status, referenceNumber }: Props) {
  const router = useRouter();
  const [busy, setBusy]     = useState(false);
  const [remarks, setRemarks] = useState("");
  const [showReject, setShowReject] = useState(false);
  const [error, setError]   = useState<string | null>(null);

  async function doAction(action: "approve" | "reject" | "release") {
    setBusy(true); setError(null);
    try {
      const res = await fetch(`/api/admin/certificates/${certId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, remarks: remarks || undefined }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Action failed."); return; }
      router.refresh();
      setShowReject(false);
      setRemarks("");
    } catch { setError("Network error."); }
    finally { setBusy(false); }
  }

  if (status === "RELEASED") {
    return <p className="text-sm text-gray-500 italic">This certificate has been released.</p>;
  }

  return (
    <div className="space-y-3">
      {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}

      <div className="flex flex-wrap gap-2">
        {status === "PENDING" || status === "UNDER_REVIEW" ? (
          <>
            <button disabled={busy} onClick={() => doAction("approve")}
              className="inline-flex items-center gap-1.5 bg-green-600 text-white text-sm font-semibold px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors">
              {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
              Approve
            </button>
            <button disabled={busy} onClick={() => setShowReject(v => !v)}
              className="inline-flex items-center gap-1.5 bg-red-600 text-white text-sm font-semibold px-4 py-2 rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors">
              <XCircle className="w-4 h-4" /> Reject
            </button>
          </>
        ) : null}

        {status === "APPROVED" && (
          <button disabled={busy} onClick={() => doAction("release")}
            className="inline-flex items-center gap-1.5 bg-makati-blue text-white text-sm font-semibold px-4 py-2 rounded-lg hover:bg-blue-800 disabled:opacity-50 transition-colors">
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <PackageCheck className="w-4 h-4" />}
            Mark as Released
          </button>
        )}
      </div>

      {showReject && (
        <div className="space-y-2">
          <textarea
            className="w-full border border-gray-300 dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 resize-none"
            rows={3}
            placeholder="Reason for rejection (optional)…"
            value={remarks}
            onChange={e => setRemarks(e.target.value)}
            disabled={busy}
          />
          <div className="flex gap-2">
            <button disabled={busy} onClick={() => doAction("reject")}
              className="px-4 py-2 bg-red-600 text-white text-sm font-semibold rounded-lg hover:bg-red-700 disabled:opacity-50">
              Confirm Rejection
            </button>
            <button onClick={() => setShowReject(false)} disabled={busy}
              className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700 border border-gray-200 dark:border-slate-700 rounded-lg">
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
