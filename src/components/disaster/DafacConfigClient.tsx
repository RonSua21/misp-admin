"use client";

import { useState } from "react";
import { Save } from "lucide-react";
import type { Role, TenurialStatus } from "@/types";
import { formatCurrency } from "@/lib/utils";

interface DafacRow {
  id:             string;
  tenurialStatus: TenurialStatus;
  amount:         number;
  updatedAt:      string;
}

interface Props {
  config:    DafacRow[];
  adminRole: Role;
}

const LABELS: Record<TenurialStatus, string> = {
  OWNER:     "Owner",
  RENTER:    "Renter",
  SHARER:    "Sharer / Informal Settler",
  BEDSPACER: "Bedspacer",
};

export default function DafacConfigClient({ config, adminRole }: Props) {
  const [rows,    setRows]    = useState<DafacRow[]>(config);
  const [saving,  setSaving]  = useState<TenurialStatus | null>(null);
  const [errors,  setErrors]  = useState<Partial<Record<TenurialStatus, string>>>({});
  const [success, setSuccess] = useState<Partial<Record<TenurialStatus, string>>>({});

  const canEdit = adminRole === "SUPER_ADMIN";

  function updateAmount(status: TenurialStatus, val: string) {
    setRows((prev) => prev.map((r) => r.tenurialStatus === status ? { ...r, amount: Number(val) } : r));
    setErrors((prev)  => ({ ...prev, [status]: undefined }));
    setSuccess((prev) => ({ ...prev, [status]: undefined }));
  }

  async function save(status: TenurialStatus, amount: number) {
    setSaving(status);
    setErrors((prev)  => ({ ...prev, [status]: undefined }));
    setSuccess((prev) => ({ ...prev, [status]: undefined }));
    try {
      const res  = await fetch("/api/admin/dafac-config", {
        method:  "PATCH",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ tenurialStatus: status, amount }),
      });
      const json = await res.json();
      if (!res.ok) {
        setErrors((prev) => ({ ...prev, [status]: json.error ?? "Failed to save." }));
      } else {
        setSuccess((prev) => ({ ...prev, [status]: "Saved." }));
        setRows((prev) => prev.map((r) => r.tenurialStatus === status ? { ...r, ...json } : r));
      }
    } catch {
      setErrors((prev) => ({ ...prev, [status]: "Network error." }));
    } finally {
      setSaving(null);
    }
  }

  return (
    <div className="card p-6">
      <div className="mb-4">
        <h2 className="text-lg font-bold text-gray-900 dark:text-white">DAFAC Assistance Amounts</h2>
        <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">
          Fixed cash amounts assigned per tenurial status during calamity registration.
          {!canEdit && " (SUPER_ADMIN only can edit)"}
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-xs text-gray-400 dark:text-slate-500 uppercase border-b border-gray-100 dark:border-slate-700">
              <th className="text-left pb-2">Tenurial Status</th>
              <th className="text-right pb-2">Current Amount</th>
              {canEdit && <th className="text-right pb-2">Edit Amount</th>}
              {canEdit && <th className="pb-2" />}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50 dark:divide-slate-700/50">
            {rows.map((row) => (
              <tr key={row.tenurialStatus}>
                <td className="py-3 font-medium text-gray-900 dark:text-white">
                  {LABELS[row.tenurialStatus]}
                </td>
                <td className="py-3 text-right text-gray-600 dark:text-slate-300">
                  {formatCurrency(row.amount)}
                </td>
                {canEdit && (
                  <td className="py-3 text-right">
                    <input
                      type="number"
                      min={0}
                      step={100}
                      value={row.amount}
                      onChange={(e) => updateAmount(row.tenurialStatus, e.target.value)}
                      className="w-36 border border-gray-200 dark:border-slate-600 rounded-lg px-3 py-1.5 text-sm text-right bg-white dark:bg-slate-800 dark:text-white"
                    />
                    {errors[row.tenurialStatus] && (
                      <p className="text-xs text-red-600 mt-1">{errors[row.tenurialStatus]}</p>
                    )}
                    {success[row.tenurialStatus] && (
                      <p className="text-xs text-green-600 mt-1">{success[row.tenurialStatus]}</p>
                    )}
                  </td>
                )}
                {canEdit && (
                  <td className="py-3 pl-2">
                    <button
                      onClick={() => save(row.tenurialStatus, row.amount)}
                      disabled={saving === row.tenurialStatus}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-makati-blue text-white hover:bg-blue-800 transition-colors disabled:opacity-50"
                    >
                      <Save className="w-3.5 h-3.5" />
                      {saving === row.tenurialStatus ? "Saving…" : "Save"}
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
