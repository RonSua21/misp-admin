"use client";

import { useEffect, useState, useCallback } from "react";
import { CheckCircle2, Clock, AlertTriangle, ChevronDown, RefreshCw } from "lucide-react";
import type { PayrollBatchStatus, Role } from "@/types";
import { formatCurrency, formatDate } from "@/lib/utils";

interface PayrollItem {
  id:             string;
  amount:         number;
  disburseMethod: string;
  disbursedAt:    string | null;
  evacuees: {
    name:        string;
    dafacNumber: string | null;
  } | null;
}

interface PayrollBatch {
  id:             string;
  batchNumber:    string;
  status:         PayrollBatchStatus;
  totalAmount:    number;
  rejectionReason: string | null;
  macApprovedAt:   string | null;
  mswdApprovedAt:  string | null;
  mayorApprovedAt: string | null;
  disbursedAt:     string | null;
  createdAt:       string;
  payroll_items:   PayrollItem[];
}

interface Props {
  incidentId: string;
  adminRole:  Role;
}

const STATUS_LABELS: Record<PayrollBatchStatus, string> = {
  DRAFT:           "Draft",
  PENDING_MAC:     "Pending MAC",
  PENDING_MSWD:    "Pending MSWD Head",
  PENDING_MAYOR:   "Pending Mayor",
  APPROVED:        "Approved",
  DISBURSED:       "Disbursed",
  REJECTED:        "Rejected",
};

const STATUS_COLORS: Record<PayrollBatchStatus, string> = {
  DRAFT:           "bg-gray-100 text-gray-600",
  PENDING_MAC:     "bg-yellow-100 text-yellow-700",
  PENDING_MSWD:    "bg-blue-100 text-blue-700",
  PENDING_MAYOR:   "bg-indigo-100 text-indigo-700",
  APPROVED:        "bg-green-100 text-green-700",
  DISBURSED:       "bg-purple-100 text-purple-700",
  REJECTED:        "bg-red-100 text-red-700",
};

const APPROVAL_STEPS = [
  { label: "MAC Coordinator", approvedField: "macApprovedAt"   as const },
  { label: "MSWD Head",       approvedField: "mswdApprovedAt"  as const },
  { label: "Mayor's Office",  approvedField: "mayorApprovedAt" as const },
];

export default function PayrollPanel({ incidentId, adminRole }: Props) {
  const [batches,   setBatches]   = useState<PayrollBatch[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [generating, setGenerating] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error,     setError]     = useState<string | null>(null);
  const [expanded,  setExpanded]  = useState<string | null>(null);
  const [returnReason, setReturnReason] = useState("");
  const [showReturn,   setShowReturn]   = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    fetch(`/api/admin/disaster/${incidentId}/payroll`)
      .then((r) => r.json())
      .then((data) => setBatches(Array.isArray(data) ? data : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [incidentId]);

  useEffect(() => { load(); }, [load]);

  async function generateBatch() {
    setGenerating(true);
    setError(null);
    try {
      const res  = await fetch(`/api/admin/disaster/${incidentId}/payroll`, { method: "POST" });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Failed to generate payroll.");
      } else {
        setBatches((prev) => [json, ...prev]);
      }
    } catch {
      setError("Network error.");
    } finally {
      setGenerating(false);
    }
  }

  async function doAction(batchId: string, action: "submit" | "approve" | "return", reason?: string) {
    setActionLoading(batchId);
    setError(null);
    try {
      const body: Record<string, unknown> = { action };
      if (action === "return" && reason) body.rejectionReason = reason;

      const res  = await fetch(`/api/admin/disaster/${incidentId}/payroll/${batchId}/approve`, {
        method:  "PATCH",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(body),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Action failed.");
      } else {
        setBatches((prev) =>
          prev.map((b) => b.id === batchId ? { ...b, ...json } : b)
        );
        setShowReturn(null);
        setReturnReason("");
        load(); // refresh to get accurate totals / items
      }
    } catch {
      setError("Network error.");
    } finally {
      setActionLoading(null);
    }
  }

  function getNextAction(batch: PayrollBatch): { label: string; action: "submit" | "approve" } | null {
    if (adminRole === "ADMIN") {
      if (batch.status === "DRAFT")        return { label: "Submit for MAC Approval", action: "submit" };
      if (batch.status === "PENDING_MAC")  return { label: "Approve (MAC)",           action: "approve" };
    }
    if (adminRole === "SUPER_ADMIN") {
      if (batch.status === "DRAFT")        return { label: "Submit for MAC Approval", action: "submit" };
      if (batch.status === "PENDING_MAC")  return { label: "Approve (MAC)",           action: "approve" };
      if (batch.status === "PENDING_MSWD") return { label: "Approve (MSWD Head)",     action: "approve" };
      if (batch.status === "PENDING_MAYOR") return { label: "Approve (Mayor)",        action: "approve" };
      if (batch.status === "APPROVED")     return { label: "Mark Disbursed",          action: "approve" };
    }
    return null;
  }

  if (loading) {
    return (
      <div className="card p-6">
        <h3 className="font-bold text-gray-900 dark:text-white mb-4">Calamity Payroll</h3>
        <p className="text-sm text-gray-400">Loading…</p>
      </div>
    );
  }

  return (
    <div className="card p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-gray-900 dark:text-white">Calamity Payroll</h3>
        <div className="flex items-center gap-2">
          <button onClick={load} className="text-gray-400 hover:text-gray-600">
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={generateBatch}
            disabled={generating}
            className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-makati-blue text-white hover:bg-blue-800 transition-colors disabled:opacity-50"
          >
            {generating ? "Generating…" : "Generate Payroll Batch"}
          </button>
        </div>
      </div>

      {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2 mb-4">{error}</p>}

      {batches.length === 0 ? (
        <p className="text-sm text-gray-400 dark:text-slate-500 italic">
          No payroll batches yet. Generate one to include all DAFAC-registered evacuees.
        </p>
      ) : (
        <div className="space-y-4">
          {batches.map((batch) => {
            const isExpanded   = expanded === batch.id;
            const nextAction   = getNextAction(batch);
            const canReturn    = (adminRole === "SUPER_ADMIN" || adminRole === "ADMIN")
              && !["APPROVED", "DISBURSED", "REJECTED", "DRAFT"].includes(batch.status);
            const isActing     = actionLoading === batch.id;
            const showingReturn = showReturn === batch.id;

            return (
              <div key={batch.id} className="border border-gray-200 dark:border-slate-700 rounded-lg overflow-hidden">
                {/* Header row */}
                <div
                  className="flex items-center justify-between p-4 cursor-pointer bg-gray-50 dark:bg-slate-700/40 hover:bg-gray-100 dark:hover:bg-slate-700/60 transition-colors"
                  onClick={() => setExpanded(isExpanded ? null : batch.id)}
                >
                  <div className="flex items-center gap-3">
                    <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isExpanded ? "rotate-180" : ""}`} />
                    <span className="font-mono text-sm font-bold text-gray-900 dark:text-white">{batch.batchNumber}</span>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${STATUS_COLORS[batch.status]}`}>
                      {STATUS_LABELS[batch.status]}
                    </span>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-gray-900 dark:text-white">{formatCurrency(batch.totalAmount)}</p>
                    <p className="text-xs text-gray-400 dark:text-slate-500">{batch.payroll_items?.length ?? 0} evacuees</p>
                  </div>
                </div>

                {isExpanded && (
                  <div className="p-4 space-y-4 border-t border-gray-200 dark:border-slate-700">
                    {/* Approval timeline */}
                    <div className="flex items-center gap-0">
                      {APPROVAL_STEPS.map((step, i) => {
                        const done   = !!batch[step.approvedField];
                        const active = !done && i === APPROVAL_STEPS.filter((s) => !!batch[s.approvedField]).length;
                        return (
                          <div key={step.label} className="flex items-center flex-1 last:flex-none">
                            <div className="flex flex-col items-center gap-1.5 flex-shrink-0">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-colors
                                ${done ? "bg-makati-blue border-makati-blue text-white"
                                       : active ? "bg-white border-makati-blue text-makati-blue"
                                               : "bg-gray-100 border-gray-200 text-gray-300"}`}
                              >
                                {done
                                  ? <CheckCircle2 className="w-4 h-4" />
                                  : batch.status === "REJECTED" && active
                                  ? <AlertTriangle className="w-4 h-4 text-red-500" />
                                  : <Clock className="w-4 h-4" />
                                }
                              </div>
                              <span className={`text-[10px] font-semibold text-center leading-tight w-16
                                ${done || active ? "text-makati-blue" : "text-gray-400"}`}>
                                {step.label}
                              </span>
                            </div>
                            {i < APPROVAL_STEPS.length - 1 && (
                              <div className={`flex-1 h-0.5 mx-1 mb-5 ${done ? "bg-makati-blue" : "bg-gray-200"}`} />
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {batch.status === "REJECTED" && batch.rejectionReason && (
                      <p className="text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2">
                        Rejected: {batch.rejectionReason}
                      </p>
                    )}

                    {batch.disbursedAt && (
                      <p className="text-xs text-purple-700 bg-purple-50 rounded-lg px-3 py-2">
                        ✓ Disbursed on {formatDate(batch.disbursedAt)}
                      </p>
                    )}

                    {/* Action buttons */}
                    {(nextAction || canReturn) && !showingReturn && (
                      <div className="flex flex-wrap gap-2">
                        {nextAction && (
                          <button
                            onClick={() => doAction(batch.id, nextAction.action)}
                            disabled={isActing}
                            className="btn-primary text-sm disabled:opacity-50"
                          >
                            {isActing ? "Processing…" : nextAction.label}
                          </button>
                        )}
                        {canReturn && (
                          <button
                            onClick={() => setShowReturn(batch.id)}
                            disabled={isActing}
                            className="btn-secondary text-sm text-red-600 border-red-200 hover:bg-red-50"
                          >
                            Return / Reject
                          </button>
                        )}
                      </div>
                    )}

                    {showingReturn && (
                      <div className="border border-red-100 rounded-lg p-4 space-y-3 bg-red-50">
                        <p className="text-sm font-semibold text-red-800">Return / Reject Batch</p>
                        <textarea
                          value={returnReason}
                          onChange={(e) => setReturnReason(e.target.value)}
                          rows={2}
                          placeholder="State the reason for returning this batch…"
                          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={() => doAction(batch.id, "return", returnReason)}
                            disabled={isActing || !returnReason.trim()}
                            className="btn-primary bg-red-600 hover:bg-red-700 text-sm disabled:opacity-50"
                          >
                            {isActing ? "Processing…" : "Confirm Return"}
                          </button>
                          <button
                            onClick={() => { setShowReturn(null); setReturnReason(""); }}
                            disabled={isActing}
                            className="btn-secondary text-sm"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Items table */}
                    {batch.payroll_items && batch.payroll_items.length > 0 && (
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="text-xs text-gray-400 dark:text-slate-500 uppercase border-b border-gray-100 dark:border-slate-700">
                              <th className="text-left pb-2">Name</th>
                              <th className="text-left pb-2">DAFAC No.</th>
                              <th className="text-right pb-2">Amount</th>
                              <th className="text-left pb-2 pl-4">Method</th>
                              <th className="text-right pb-2">Disbursed</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-50 dark:divide-slate-700/50">
                            {batch.payroll_items.map((item) => (
                              <tr key={item.id}>
                                <td className="py-2 text-gray-900 dark:text-white">
                                  {item.evacuees?.name ?? "—"}
                                </td>
                                <td className="py-2 font-mono text-xs text-gray-500 dark:text-slate-400">
                                  {item.evacuees?.dafacNumber ?? "—"}
                                </td>
                                <td className="py-2 text-right font-medium text-gray-900 dark:text-white">
                                  {formatCurrency(item.amount)}
                                </td>
                                <td className="py-2 pl-4">
                                  <span className="text-xs bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-slate-300 px-2 py-0.5 rounded">
                                    {item.disburseMethod ?? "CASH"}
                                  </span>
                                </td>
                                <td className="py-2 text-right text-xs text-gray-400 dark:text-slate-500">
                                  {item.disbursedAt ? formatDate(item.disbursedAt) : "—"}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
