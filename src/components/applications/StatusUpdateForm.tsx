"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, AlertCircle } from "lucide-react";
import type { ApplicationStatus } from "@/types";

const STATUS_OPTIONS: { value: ApplicationStatus; label: string }[] = [
  { value: "PENDING", label: "Pending" },
  { value: "UNDER_REVIEW", label: "Under Review" },
  { value: "APPROVED", label: "Approved" },
  { value: "REJECTED", label: "Rejected" },
  { value: "DISBURSED", label: "Disbursed" },
];

export default function StatusUpdateForm({
  applicationId,
  currentStatus,
}: {
  applicationId: string;
  currentStatus: ApplicationStatus;
}) {
  const router = useRouter();
  const [status, setStatus] = useState<ApplicationStatus>(currentStatus);
  const [remarks, setRemarks] = useState("");
  const [amountApproved, setAmountApproved] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (status === currentStatus && !remarks) return;
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const res = await fetch(`/api/admin/applications/${applicationId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status,
          remarks: remarks || undefined,
          amountApproved: amountApproved
            ? parseFloat(amountApproved)
            : undefined,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "Failed to update application.");
        return;
      }
      setSuccess(true);
      setRemarks("");
      router.refresh();
    } catch {
      setError("An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="card p-6">
      <h3 className="font-bold text-gray-900 dark:text-white mb-4">
        Update Status
      </h3>
      <form onSubmit={handleSubmit} className="space-y-3">
        {success && (
          <div className="flex gap-2 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg text-sm text-green-700 dark:text-green-400">
            <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
            Status updated successfully.
          </div>
        )}
        {error && (
          <div className="flex gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-600 dark:text-red-400">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            {error}
          </div>
        )}

        <div>
          <label className="block text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wide mb-1.5">
            New Status
          </label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as ApplicationStatus)}
            className="w-full bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 text-gray-900 dark:text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-makati-blue"
          >
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {(status === "APPROVED" || status === "DISBURSED") && (
          <div>
            <label className="block text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wide mb-1.5">
              Amount Approved (PHP)
            </label>
            <input
              type="number"
              value={amountApproved}
              onChange={(e) => setAmountApproved(e.target.value)}
              placeholder="0.00"
              min="0"
              step="0.01"
              className="w-full bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 text-gray-900 dark:text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-makati-blue"
            />
          </div>
        )}

        <div>
          <label className="block text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wide mb-1.5">
            Remarks (optional)
          </label>
          <textarea
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
            placeholder="Add notes about this status change..."
            rows={3}
            className="w-full bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 text-gray-900 dark:text-white placeholder-gray-400 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-makati-blue resize-none"
          />
        </div>

        <button
          type="submit"
          disabled={loading || status === currentStatus}
          className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed py-2"
        >
          {loading ? "Saving..." : "Update Application"}
        </button>
      </form>
    </div>
  );
}
