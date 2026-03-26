"use client";
import { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { Search, ChevronLeft, ChevronRight, CheckCircle2, XCircle } from "lucide-react";

type Resident = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  barangay?: string | null;
  phone?: string | null;
  residencyVerified: boolean;
  createdAt: string;
  applicationCount: number;
};

export default function ResidentsTable({
  residents,
  total,
  page,
  pageSize,
  currentSearch,
  currentBarangay,
  currentVerified,
  barangays,
  isCoordinator,
}: {
  residents: Resident[];
  total: number;
  page: number;
  pageSize: number;
  currentSearch: string;
  currentBarangay: string;
  currentVerified: string;
  barangays: string[];
  isCoordinator: boolean;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [search, setSearch] = useState(currentSearch);
  const totalPages = Math.ceil(total / pageSize);

  function buildUrl(overrides: Record<string, string>) {
    const params = new URLSearchParams();
    if (currentSearch) params.set("search", currentSearch);
    if (currentBarangay) params.set("barangay", currentBarangay);
    if (currentVerified) params.set("verified", currentVerified);
    params.set("page", String(page));
    Object.entries(overrides).forEach(([k, v]) => {
      if (v) params.set(k, v);
      else params.delete(k);
    });
    return `${pathname}?${params.toString()}`;
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    router.push(buildUrl({ search, page: "1" }));
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="flex gap-2 flex-wrap items-center">
          {!isCoordinator && (
            <select
              value={currentBarangay}
              onChange={(e) =>
                router.push(buildUrl({ barangay: e.target.value, page: "1" }))
              }
              className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-700 dark:text-slate-300 text-sm rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-makati-blue"
            >
              <option value="">All Barangays</option>
              {barangays.sort().map((b) => (
                <option key={b} value={b}>
                  Brgy. {b}
                </option>
              ))}
            </select>
          )}
          <select
            value={currentVerified}
            onChange={(e) =>
              router.push(buildUrl({ verified: e.target.value, page: "1" }))
            }
            className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-700 dark:text-slate-300 text-sm rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-makati-blue"
          >
            <option value="">All Residency</option>
            <option value="true">Verified</option>
            <option value="false">Unverified</option>
          </select>
          <span className="text-sm text-gray-500 dark:text-slate-400">
            {total} residents total
          </span>
        </div>

        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or email..."
              className="pl-9 pr-4 py-2 text-sm bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-makati-blue min-w-[220px]"
            />
          </div>
          <button type="submit" className="btn-primary">
            Search
          </button>
        </form>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 dark:bg-slate-800/50 text-left">
                {[
                  "Resident",
                  "Email",
                  "Barangay",
                  "Phone",
                  "Residency",
                  "Applications",
                  "Date Joined",
                ].map((h) => (
                  <th
                    key={h}
                    className="px-4 py-3 text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wide whitespace-nowrap"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
              {residents.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-6 py-12 text-center text-gray-400 dark:text-slate-500"
                  >
                    No residents found.
                  </td>
                </tr>
              ) : (
                residents.map((r) => (
                  <tr
                    key={r.id}
                    className="hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors"
                  >
                    <td className="px-4 py-3.5">
                      <p className="font-medium text-gray-900 dark:text-white">
                        {r.firstName} {r.lastName}
                      </p>
                    </td>
                    <td className="px-4 py-3.5 text-gray-500 dark:text-slate-400">
                      {r.email}
                    </td>
                    <td className="px-4 py-3.5 text-gray-500 dark:text-slate-400">
                      {r.barangay ? `Brgy. ${r.barangay}` : "—"}
                    </td>
                    <td className="px-4 py-3.5 text-gray-500 dark:text-slate-400">
                      {r.phone ?? "—"}
                    </td>
                    <td className="px-4 py-3.5">
                      {r.residencyVerified ? (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-green-700 bg-green-100 dark:bg-green-900/30 dark:text-green-400 px-2 py-0.5 rounded-full">
                          <CheckCircle2 className="w-3 h-3" />
                          Verified
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-yellow-700 bg-yellow-100 dark:bg-yellow-900/30 dark:text-yellow-400 px-2 py-0.5 rounded-full">
                          <XCircle className="w-3 h-3" />
                          Unverified
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <span className="text-gray-900 dark:text-white font-semibold">
                        {r.applicationCount}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-gray-500 dark:text-slate-400 whitespace-nowrap">
                      {new Date(r.createdAt).toLocaleDateString("en-PH", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 dark:border-slate-700">
            <p className="text-sm text-gray-500 dark:text-slate-400">
              Showing {(page - 1) * pageSize + 1}–
              {Math.min(page * pageSize, total)} of {total}
            </p>
            <div className="flex gap-1">
              <Link
                href={buildUrl({ page: String(page - 1) })}
                aria-disabled={page <= 1}
                className={`p-1.5 rounded-lg border text-gray-500 dark:text-slate-400 ${
                  page <= 1
                    ? "opacity-40 pointer-events-none"
                    : "hover:bg-gray-100 dark:hover:bg-slate-700"
                } border-gray-200 dark:border-slate-600`}
              >
                <ChevronLeft className="w-4 h-4" />
              </Link>
              <Link
                href={buildUrl({ page: String(page + 1) })}
                aria-disabled={page >= totalPages}
                className={`p-1.5 rounded-lg border text-gray-500 dark:text-slate-400 ${
                  page >= totalPages
                    ? "opacity-40 pointer-events-none"
                    : "hover:bg-gray-100 dark:hover:bg-slate-700"
                } border-gray-200 dark:border-slate-600`}
              >
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
