"use client";
import { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import type { Referral, ReferralStatus, ReferralPriority } from "@/types";
import Link from "next/link";

const STATUS_COLORS: Record<ReferralStatus, string> = {
  PENDING:   "bg-yellow-100 text-yellow-800",
  ACCEPTED:  "bg-blue-100 text-blue-800",
  ACTIVE:    "bg-purple-100 text-purple-800",
  COMPLETED: "bg-green-100 text-green-800",
  DECLINED:  "bg-red-100 text-red-700",
};

const PRIORITY_COLORS: Record<ReferralPriority, string> = {
  ROUTINE:   "bg-gray-100 text-gray-600",
  URGENT:    "bg-orange-100 text-orange-700",
  EMERGENCY: "bg-red-100 text-red-700",
};

const STATUSES: ReferralStatus[] = ["PENDING", "ACCEPTED", "ACTIVE", "COMPLETED", "DECLINED"];

interface Props {
  referrals: Referral[];
  total: number;
  page: number;
  pageSize: number;
  currentStatus: string;
  currentSearch: string;
}

export default function ReferralsTable({ referrals, total, page, pageSize, currentStatus, currentSearch }: Props) {
  const router   = useRouter();
  const pathname = usePathname();
  const [search, setSearch] = useState(currentSearch);
  const totalPages = Math.ceil(total / pageSize);

  function navigate(params: Record<string, string>) {
    const sp = new URLSearchParams({ status: currentStatus, search: currentSearch, page: String(page), ...params });
    router.push(`${pathname}?${sp.toString()}`);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3 items-center">
        <div className="flex gap-1 flex-wrap">
          <button onClick={() => navigate({ status: "", page: "1" })}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${!currentStatus ? "bg-makati-blue text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
            All
          </button>
          {STATUSES.map(s => (
            <button key={s} onClick={() => navigate({ status: s, page: "1" })}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${currentStatus === s ? "bg-makati-blue text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
              {s}
            </button>
          ))}
        </div>
        <form onSubmit={e => { e.preventDefault(); navigate({ search, page: "1" }); }} className="flex gap-2 ml-auto">
          <input className="border border-gray-300 dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-makati-blue"
            placeholder="Search referral code…" value={search} onChange={e => setSearch(e.target.value)} />
          <button type="submit" className="px-3 py-1.5 bg-makati-blue text-white rounded-lg text-sm font-semibold hover:bg-blue-800">Search</button>
        </form>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-700 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 dark:bg-slate-800 text-gray-500 dark:text-slate-400 text-xs uppercase tracking-wide">
            <tr>
              <th className="px-4 py-3 text-left">Referral Code</th>
              <th className="px-4 py-3 text-left">Client</th>
              <th className="px-4 py-3 text-left">Referred To</th>
              <th className="px-4 py-3 text-left">Service Needed</th>
              <th className="px-4 py-3 text-left">Priority</th>
              <th className="px-4 py-3 text-left">Status</th>
              <th className="px-4 py-3 text-left">Date</th>
              <th className="px-4 py-3 text-left">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
            {referrals.length === 0 && (
              <tr><td colSpan={8} className="px-4 py-8 text-center text-gray-400 text-sm">No referrals found.</td></tr>
            )}
            {referrals.map(r => (
              <tr key={r.id} className="hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors">
                <td className="px-4 py-3 font-mono text-xs text-gray-600 dark:text-slate-300">{r.referralCode}</td>
                <td className="px-4 py-3 font-medium text-gray-800 dark:text-white">{r.clientName ?? "—"}</td>
                <td className="px-4 py-3 text-gray-600 dark:text-slate-300">{r.referredTo}</td>
                <td className="px-4 py-3 text-gray-500 dark:text-slate-400 max-w-xs truncate">{r.serviceNeeded}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${PRIORITY_COLORS[r.priority]}`}>{r.priority}</span>
                </td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${STATUS_COLORS[r.status]}`}>{r.status}</span>
                </td>
                <td className="px-4 py-3 text-gray-500 dark:text-slate-400 text-xs">{new Date(r.referralDate).toLocaleDateString()}</td>
                <td className="px-4 py-3">
                  <Link href={`/admin/referrals/${r.id}`} className="text-makati-blue hover:underline text-xs font-semibold">View</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

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
