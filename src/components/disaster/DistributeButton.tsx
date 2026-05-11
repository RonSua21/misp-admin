"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Send } from "lucide-react";

export function DistributeButton({
  itemId,
  incidentId,
  currentDistributed,
  maxAvailable,
}: {
  itemId: string;
  incidentId: string;
  currentDistributed: number;
  maxAvailable: number;
}) {
  const router = useRouter();
  const [open, setOpen]   = useState(false);
  const [qty, setQty]     = useState("");
  const [busy, setBusy]   = useState(false);
  const [error, setError] = useState<string | null>(null);

  const remaining = maxAvailable - currentDistributed;

  async function handleConfirm() {
    const additional = Number(qty);
    if (!additional || additional <= 0) { setError("Enter a valid quantity."); return; }
    if (additional > remaining) { setError(`Only ${remaining} remaining.`); return; }

    setBusy(true);
    setError(null);
    const newTotal = currentDistributed + additional;
    const res = await fetch(`/api/admin/disaster/${incidentId}/inventory`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ itemId, quantityDistributed: newTotal }),
    });

    if (!res.ok) {
      const body = await res.json();
      setError(body.error ?? "Failed to update.");
      setBusy(false);
      return;
    }

    router.refresh();
    setOpen(false);
    setQty("");
    setBusy(false);
  }

  if (remaining <= 0) {
    return <span className="text-xs text-gray-400 italic">Fully distributed</span>;
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1 text-xs font-semibold text-green-700 bg-green-50 hover:bg-green-100 px-2.5 py-1 rounded-lg transition-colors border border-green-200"
      >
        <Send className="w-3 h-3" /> Distribute
      </button>
    );
  }

  return (
    <div className="flex flex-col gap-1.5 min-w-[140px]">
      {error && <p className="text-[10px] text-red-600">{error}</p>}
      <div className="flex gap-1">
        <input
          type="number"
          min="1"
          max={remaining}
          placeholder={`Max ${remaining}`}
          value={qty}
          onChange={(e) => setQty(e.target.value)}
          disabled={busy}
          className="border border-gray-300 dark:border-slate-600 dark:bg-slate-800 dark:text-white rounded-lg px-2 py-1 text-xs w-20 focus:outline-none focus:ring-1 focus:ring-green-500"
          autoFocus
        />
        <button
          onClick={handleConfirm}
          disabled={busy}
          className="text-xs bg-green-600 text-white px-2.5 py-1 rounded-lg hover:bg-green-700 disabled:opacity-50 font-semibold"
        >
          {busy ? "…" : "OK"}
        </button>
        <button
          onClick={() => { setOpen(false); setQty(""); setError(null); }}
          disabled={busy}
          className="text-xs text-gray-500 dark:text-slate-400 px-2 py-1 rounded-lg border border-gray-200 dark:border-slate-600 hover:bg-gray-50"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
