"use client";

import { useEffect, useState, useCallback } from "react";
import { Ticket, CheckCircle2, Clock, RefreshCw, X } from "lucide-react";
import { formatDate } from "@/lib/utils";

interface Evacuee {
  id:   string;
  name: string;
}

interface InventoryItem {
  id:    string;
  itemName: string;
  quantityAvailable:   number;
  quantityDistributed: number;
}

interface Center {
  id:      string;
  name:    string;
  evacuees?: Evacuee[];
}

interface Voucher {
  id:          string;
  voucherCode: string;
  redeemed:    boolean;
  redeemedAt:  string | null;
  issuedAt:    string;
  quantity:    number;
  evacuees: { name: string } | null;
  relief_inventory: { itemName: string } | null;
}

interface Props {
  incidentId: string;
  centers:    Center[];
  inventory:  InventoryItem[];
}

export default function VoucherIssuancePanel({ incidentId, centers, inventory }: Props) {
  const [vouchers,     setVouchers]     = useState<Voucher[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [showForm,     setShowForm]     = useState(false);
  const [issuing,      setIssuing]      = useState(false);
  const [redeemLoading, setRedeemLoading] = useState<string | null>(null);
  const [error,        setError]        = useState<string | null>(null);
  const [redeemCode,   setRedeemCode]   = useState("");
  const [redeemError,  setRedeemError]  = useState<string | null>(null);
  const [redeemSuccess, setRedeemSuccess] = useState<string | null>(null);

  // Issue form
  const [centerId,     setCenterId]   = useState("");
  const [evacueeId,    setEvacueeId]  = useState("");
  const [inventoryId,  setInventoryId] = useState("");
  const [quantity,     setQuantity]   = useState(1);

  const allEvacuees: Evacuee[] = centers
    .filter((c) => !centerId || c.id === centerId)
    .flatMap((c) => c.evacuees ?? []);

  const load = useCallback(() => {
    setLoading(true);
    fetch(`/api/admin/disaster/${incidentId}/vouchers`)
      .then((r) => r.json())
      .then((data) => setVouchers(Array.isArray(data) ? data : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [incidentId]);

  useEffect(() => { load(); }, [load]);

  async function handleIssue(e: React.FormEvent) {
    e.preventDefault();
    setIssuing(true);
    setError(null);
    try {
      const res  = await fetch(`/api/admin/disaster/${incidentId}/vouchers`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ evacueeId, inventoryId, quantity }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Failed to issue voucher.");
      } else {
        setVouchers((prev) => [json, ...prev]);
        setShowForm(false);
        setCenterId(""); setEvacueeId(""); setInventoryId(""); setQuantity(1);
      }
    } catch {
      setError("Network error.");
    } finally {
      setIssuing(false);
    }
  }

  async function handleRedeem(code: string) {
    const trimmed = code.trim().toUpperCase();
    if (!trimmed) return;
    setRedeemLoading(trimmed);
    setRedeemError(null);
    setRedeemSuccess(null);
    try {
      const res  = await fetch(`/api/admin/disaster/vouchers/${trimmed}/redeem`, { method: "PATCH" });
      const json = await res.json();
      if (!res.ok) {
        setRedeemError(json.error ?? "Redemption failed.");
      } else {
        setRedeemSuccess(`Voucher ${trimmed} redeemed successfully.`);
        setRedeemCode("");
        load();
      }
    } catch {
      setRedeemError("Network error.");
    } finally {
      setRedeemLoading(null);
    }
  }

  return (
    <div className="card p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <Ticket className="w-4 h-4 text-makati-blue" />
          Relief Vouchers
        </h3>
        <div className="flex items-center gap-2">
          <button onClick={load} className="text-gray-400 hover:text-gray-600">
            <RefreshCw className="w-4 h-4" />
          </button>
          {!showForm && (
            <button
              onClick={() => setShowForm(true)}
              className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-makati-blue text-white hover:bg-blue-800 transition-colors"
            >
              Issue Voucher
            </button>
          )}
        </div>
      </div>

      {/* Redeem panel */}
      <div className="mb-4 flex items-start gap-2">
        <div className="flex-1">
          <input
            type="text"
            value={redeemCode}
            onChange={(e) => { setRedeemCode(e.target.value.toUpperCase()); setRedeemError(null); setRedeemSuccess(null); }}
            onKeyDown={(e) => e.key === "Enter" && handleRedeem(redeemCode)}
            placeholder="Enter voucher code to redeem (e.g. VCH-ABCDEF-12WXYZ)"
            className="w-full border border-gray-200 dark:border-slate-600 rounded-lg px-3 py-2 text-sm font-mono bg-white dark:bg-slate-800 dark:text-white"
          />
          {redeemError   && <p className="text-xs text-red-600 mt-1">{redeemError}</p>}
          {redeemSuccess && <p className="text-xs text-green-600 mt-1">{redeemSuccess}</p>}
        </div>
        <button
          onClick={() => handleRedeem(redeemCode)}
          disabled={!redeemCode.trim() || !!redeemLoading}
          className="btn-primary text-sm disabled:opacity-50 whitespace-nowrap"
        >
          {redeemLoading ? "Redeeming…" : "Redeem"}
        </button>
      </div>

      {/* Issue form */}
      {showForm && (
        <form onSubmit={handleIssue}
          className="mb-4 border border-gray-200 dark:border-slate-700 rounded-lg p-4 space-y-3 bg-gray-50 dark:bg-slate-700/30">
          <div className="flex items-center justify-between mb-1">
            <p className="text-sm font-semibold text-gray-700 dark:text-slate-200">Issue New Voucher</p>
            <button type="button" onClick={() => { setShowForm(false); setError(null); }}>
              <X className="w-4 h-4 text-gray-400 hover:text-gray-600" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-500 dark:text-slate-400 block mb-1">Evacuation Center</label>
              <select value={centerId} onChange={(e) => { setCenterId(e.target.value); setEvacueeId(""); }}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-800 dark:border-slate-600 dark:text-white">
                <option value="">All centers</option>
                {centers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-500 dark:text-slate-400 block mb-1">Evacuee *</label>
              <select value={evacueeId} onChange={(e) => setEvacueeId(e.target.value)} required
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-800 dark:border-slate-600 dark:text-white">
                <option value="">Select evacuee…</option>
                {allEvacuees.map((ev) => <option key={ev.id} value={ev.id}>{ev.name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-500 dark:text-slate-400 block mb-1">Relief Item *</label>
              <select value={inventoryId} onChange={(e) => setInventoryId(e.target.value)} required
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-800 dark:border-slate-600 dark:text-white">
                <option value="">Select item…</option>
                {inventory.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.itemName} ({item.quantityAvailable - item.quantityDistributed} available)
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-500 dark:text-slate-400 block mb-1">Quantity *</label>
              <input
                type="number" min={1} value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
                required
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-800 dark:border-slate-600 dark:text-white"
              />
            </div>
          </div>

          {error && <p className="text-xs text-red-600">{error}</p>}

          <div className="flex gap-2">
            <button type="submit" disabled={issuing || !evacueeId || !inventoryId}
              className="btn-primary text-sm disabled:opacity-50">
              {issuing ? "Issuing…" : "Issue Voucher"}
            </button>
            <button type="button" onClick={() => { setShowForm(false); setError(null); }}
              disabled={issuing} className="btn-secondary text-sm">
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Voucher list */}
      {loading ? (
        <p className="text-sm text-gray-400">Loading vouchers…</p>
      ) : vouchers.length === 0 ? (
        <p className="text-xs text-gray-400 dark:text-slate-500 italic">No vouchers issued yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-gray-400 dark:text-slate-500 uppercase border-b border-gray-100 dark:border-slate-700">
                <th className="text-left pb-2">Code</th>
                <th className="text-left pb-2">Evacuee</th>
                <th className="text-left pb-2">Item</th>
                <th className="text-right pb-2">Qty</th>
                <th className="text-left pb-2 pl-4">Status</th>
                <th className="text-right pb-2">Issued</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-slate-700/50">
              {vouchers.map((v) => (
                <tr key={v.id}>
                  <td className="py-2 font-mono text-xs text-makati-blue font-bold">{v.voucherCode}</td>
                  <td className="py-2 text-gray-900 dark:text-white">{v.evacuees?.name ?? "—"}</td>
                  <td className="py-2 text-gray-600 dark:text-slate-300">{v.relief_inventory?.itemName ?? "—"}</td>
                  <td className="py-2 text-right text-gray-900 dark:text-white">{v.quantity}</td>
                  <td className="py-2 pl-4">
                    {v.redeemed ? (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-green-700 bg-green-100 px-2 py-0.5 rounded-full">
                        <CheckCircle2 className="w-3 h-3" /> Redeemed
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-yellow-700 bg-yellow-100 px-2 py-0.5 rounded-full">
                        <Clock className="w-3 h-3" /> Pending
                      </span>
                    )}
                  </td>
                  <td className="py-2 text-right text-xs text-gray-400 dark:text-slate-500">
                    {formatDate(v.issuedAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
