"use client";
import { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { Search, ChevronLeft, ChevronRight, ExternalLink } from "lucide-react";

type Doc = {
  id: string;
  documentType: string;
  fileUrl: string;
  status: string;
  createdAt: string;
  userId: string;
  applicationId?: string | null;
  applicantName: string;
  barangay?: string | null;
};

const STATUS_COLORS: Record<string, string> = {
  PENDING:
    "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300",
  VERIFIED:
    "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
  REJECTED:
    "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
};

export default function DocumentsTable({
  documents,
  total,
  page,
  pageSize,
  currentSearch,
  currentStatus,
}: {
  documents: Doc[];
  total: number;
  page: number;
  pageSize: number;
  currentSearch: string;
  currentStatus: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [search, setSearch] = useState(currentSearch);
  const totalPages = Math.ceil(total / pageSize);

  function buildUrl(overrides: Record<string, string>) {
    const params = new URLSearchParams();
    if (currentSearch) params.set("search", currentSearch);
    if (currentStatus) params.set("status", currentStatus);
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
          {["", "PENDING", "VERIFIED", "REJECTED"].map((s) => (
            <Link
              key={s}
              href={buildUrl({ status: s, page: "1" })}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                currentStatus === s
                  ? "bg-makati-blue text-white"
                  : "bg-white dark:bg-slate-800 text-gray-600 dark:text-slate-300 border border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700"
              }`}
            >
              {s === "" ? "All" : s.charAt(0) + s.slice(1).toLowerCase()}
            </Link>
          ))}
        </div>

        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by applicant..."
              className="pl-9 pr-4 py-2 text-sm bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-makati-blue"
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
                  "Document Type",
                  "Applicant",
                  "Barangay",
                  "Date Submitted",
                  "Status",
                  "File",
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
              {documents.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-6 py-12 text-center text-gray-400 dark:text-slate-500"
                  >
                    No documents found.
                  </td>
                </tr>
              ) : (
                documents.map((doc) => (
                  <tr
                    key={doc.id}
                    className="hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors"
                  >
                    <td className="px-4 py-3.5">
                      <p className="font-medium text-gray-900 dark:text-white">
                        {doc.documentType.replace(/_/g, " ")}
                      </p>
                    </td>
                    <td className="px-4 py-3.5 text-gray-700 dark:text-slate-300 font-medium">
                      {doc.applicantName}
                    </td>
                    <td className="px-4 py-3.5 text-gray-500 dark:text-slate-400">
                      {doc.barangay ? `Brgy. ${doc.barangay}` : "—"}
                    </td>
                    <td className="px-4 py-3.5 text-gray-500 dark:text-slate-400 whitespace-nowrap">
                      {new Date(doc.createdAt).toLocaleDateString("en-PH", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </td>
                    <td className="px-4 py-3.5">
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                          STATUS_COLORS[doc.status] ?? "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {doc.status}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <a
                        href={doc.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-makati-blue hover:underline font-medium"
                      >
                        Open <ExternalLink className="w-3 h-3" />
                      </a>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

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
