"use client";
import { useState } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import type { CertificateRequest, CertStatus, CertType } from "@/types";
import Link from "next/link";

const STATUS_COLORS: Record<CertStatus, string> = {
  PENDING:      "bg-yellow-100 text-yellow-800",
  UNDER_REVIEW: "bg-blue-100 text-blue-800",
  APPROVED:     "bg-green-100 text-green-800",
  RELEASED:     "bg-gray-100 text-gray-700",
  REJECTED:     "bg-red-100 text-red-800",
};

const CERT_LABELS: Record<CertType, string> = {
  INDIGENCY:    "Indigency",
  LOW_INCOME:   "Low Income",
  COHABITATION: "Cohabitation",
  SOLO_PARENT:  "Solo Parent",
  NO_INCOME:    "No Income",
  GOOD_MORAL:   "Good Moral",
  RESIDENCY:    "Residency",
};

const STATUSES: CertStatus[] = ["PENDING", "UNDER_REVIEW", "APPROVED", "RELEASED", "REJECTED"];

interface Props {
  requests: CertificateRequest[];
  total: number;
  page: number;
  pageSize: number;
  currentStatus: string;
  currentSearch: string;
}

export default function CertificatesTable({ requests, total, page, pageSize, currentStatus, currentSearch }: Props) {
  const router    = useRouter();
  const pathname  = usePathname();
  const [search, setSearch] = useState(currentSearch);
  const totalPages = Math.ceil(total / pageSize);

  function navigate(params: Record<string, string>) {
    const sp = new URLSearchParams({ status: currentStatus, search: currentSearch, page: String(page), ...params });
    router.push(`${pathname}?${sp.toString()}`);
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="flex gap-1 flex-wrap">
          <button onClick={() => navigate({ status: "", page: "1" })}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${!currentStatus ? "bg-makati-blue text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
            All
          </button>
          {STATUSES.map(s => (
            <button key={s} onClick={() => navigate({ status: s, page: "1" })}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${currentStatus === s ? "bg-makati-blue text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
              {s.replace("_", " ")}
            </button>
          ))}
        </div>
        <form onSubmit={e => { e.preventDefault(); navigate({ search, page: "1" }); }} className="flex gap-2 ml-auto">
          <input className="border border-gray-300 dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-makati-blue"
            placeholder="Search reference no…" value={search} onChange={e => setSearch(e.target.value)} />
          <button type="submit" className="px-3 py-1.5 bg-makati-blue text-white rounded-lg text-sm font-semibold hover:bg-blue-800">Search</button>
        </form>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-700 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 dark:bg-slate-800 text-gray-500 dark:text-slate-400 text-xs uppercase tracking-wide">
            <tr>
              <th className="px-4 py-3 text-left">Reference No.</th>
              <th className="px-4 py-3 text-left">Resident</th>
              <th className="px-4 py-3 text-left">Type</th>
              <th className="px-4 py-3 text-left">Purpose</th>
              <th className="px-4 py-3 text-left">Status</th>
              <th className="px-4 py-3 text-left">Requested</th>
              <th className="px-4 py-3 text-left">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
            {requests.length === 0 && (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-400 text-sm">No certificate requests found.</td></tr>
            )}
            {requests.map(r => (
              <tr key={r.id} className="hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors">
                <td className="px-4 py-3 font-mono text-xs text-gray-600 dark:text-slate-300">{r.referenceNumber}</td>
                <td className="px-4 py-3 font-medium text-gray-800 dark:text-white">{r.clientName ?? "—"}</td>
                <td className="px-4 py-3 text-gray-600 dark:text-slate-300">{CERT_LABELS[r.type] ?? r.type}</td>
                <td className="px-4 py-3 text-gray-500 dark:text-slate-400 max-w-xs truncate">{r.purpose}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${STATUS_COLORS[r.status]}`}>{r.status.replace("_", " ")}</span>
                </td>
                <td className="px-4 py-3 text-gray-500 dark:text-slate-400 text-xs">{new Date(r.requestedAt).toLocaleDateString()}</td>
                <td className="px-4 py-3">
                  <Link href={`/admin/certificates/${r.id}`} className="text-makati-blue hover:underline text-xs font-semibold">View</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-gray-500">
          <span>Showing {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, total)} of {total}</span>
          <div className="flex gap-2">
            <button disabled={page <= 1} onClick={() => navigate({ page: String(page - 1) })}
              className="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-slate-700 disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-slate-800">← Prev</button>
            <button disabled={page >= totalPages} onClick={() => navigate({ page: String(page + 1) })}
              className="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-slate-700 disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-slate-800">Next →</button>
          </div>
        </div>
      )}
    </div>
  );
}
