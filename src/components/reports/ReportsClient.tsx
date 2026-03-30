"use client";
import { useState } from "react";
import {
  FileDown,
  Users,
  FileText,
  CheckCircle2,
  Banknote,
  Clock,
  XCircle,
  Loader2,
} from "lucide-react";
import {
  getApplicationsForExport,
  getResidentsForExport,
  type AppExportRow,
} from "@/app/admin/reports/actions";

function downloadCSV(filename: string, rows: string[][], headers: string[]) {
  const escape = (v: string) => `"${v.replace(/"/g, '""')}"`;
  const lines = [
    headers.map(escape).join(","),
    ...rows.map((row) => row.map(escape).join(",")),
  ];
  const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function buildApplicationsCSV(applications: AppExportRow[]) {
  const headers = [
    "Reference",
    "Applicant Name",
    "Barangay",
    "Contact",
    "Program",
    "Purpose",
    "Status",
    "Amount Requested",
    "Amount Approved",
    "Date Submitted",
    "Last Updated",
  ];
  const rows = applications.map((a) => [
    a.referenceNumber,
    a.applicantName,
    a.applicantBarangay ?? "",
    a.applicantContact ?? "",
    a.programName,
    a.purpose,
    a.status,
    a.amountRequested?.toString() ?? "",
    a.amountApproved?.toString() ?? "",
    new Date(a.createdAt).toLocaleDateString("en-PH"),
    new Date(a.updatedAt).toLocaleDateString("en-PH"),
  ]);
  return { headers, rows };
}

export default function ReportsClient({
  statusCounts,
  totalDisbursed,
  totalResidents,
}: {
  statusCounts: Record<string, number>;
  totalDisbursed: number;
  totalResidents: number;
}) {
  const [exporting, setExporting] = useState<string | null>(null);
  const totalApps = Object.values(statusCounts).reduce((a, b) => a + b, 0);

  async function exportApplicationsCSV() {
    setExporting("applications");
    try {
      const apps = await getApplicationsForExport();
      if (!apps) return;
      const { headers, rows } = buildApplicationsCSV(apps);
      downloadCSV(`misp_applications_${new Date().toISOString().slice(0, 10)}.csv`, rows, headers);
    } finally {
      setExporting(null);
    }
  }

  async function exportResidentsCSV() {
    setExporting("residents");
    try {
      const residents = await getResidentsForExport();
      if (!residents) return;
      const headers = [
        "First Name",
        "Last Name",
        "Email",
        "Barangay",
        "Phone",
        "Residency Verified",
        "Date Joined",
      ];
      const rows = residents.map((r) => [
        r.firstName,
        r.lastName,
        r.email,
        r.barangay ?? "",
        r.phone ?? "",
        r.residencyVerified ? "Yes" : "No",
        new Date(r.createdAt).toLocaleDateString("en-PH"),
      ]);
      downloadCSV(`misp_residents_${new Date().toISOString().slice(0, 10)}.csv`, rows, headers);
    } finally {
      setExporting(null);
    }
  }

  async function exportByStatus(status: string) {
    setExporting(status);
    try {
      const apps = await getApplicationsForExport();
      if (!apps) return;
      const filtered = apps.filter((a) => a.status === status);
      const headers = [
        "Reference",
        "Applicant Name",
        "Barangay",
        "Program",
        "Amount Approved",
        "Date Submitted",
      ];
      const rows = filtered.map((a) => [
        a.referenceNumber,
        a.applicantName,
        a.applicantBarangay ?? "",
        a.programName,
        a.amountApproved?.toString() ?? "",
        new Date(a.createdAt).toLocaleDateString("en-PH"),
      ]);
      downloadCSV(`misp_${status.toLowerCase()}_${new Date().toISOString().slice(0, 10)}.csv`, rows, headers);
    } finally {
      setExporting(null);
    }
  }

  const statCards = [
    {
      label: "Total Applications",
      value: totalApps,
      icon: FileText,
      color: "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400",
    },
    {
      label: "Pending Review",
      value: statusCounts["PENDING"] ?? 0,
      icon: Clock,
      color: "bg-yellow-50 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-400",
    },
    {
      label: "Approved",
      value: statusCounts["APPROVED"] ?? 0,
      icon: CheckCircle2,
      color: "bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400",
    },
    {
      label: "Disbursed",
      value: statusCounts["DISBURSED"] ?? 0,
      icon: Banknote,
      color: "bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400",
    },
    {
      label: "Rejected",
      value: statusCounts["REJECTED"] ?? 0,
      icon: XCircle,
      color: "bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400",
    },
    {
      label: "Total Residents",
      value: totalResidents,
      icon: Users,
      color: "bg-gray-50 dark:bg-slate-700 text-gray-600 dark:text-slate-300",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Quick Stats */}
      <div>
        <h2 className="text-base font-bold text-gray-900 dark:text-white mb-3">
          Quick Stats Summary
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {statCards.map((card) => (
            <div key={card.label} className="card p-4">
              <div
                className={`w-9 h-9 rounded-xl ${card.color} flex items-center justify-center mb-3`}
              >
                <card.icon className="w-4 h-4" />
              </div>
              <p className="text-2xl font-extrabold text-gray-900 dark:text-white">
                {card.value}
              </p>
              <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">
                {card.label}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Total Disbursed */}
      <div className="card p-6 border-l-4 border-l-makati-gold">
        <p className="text-xs font-semibold text-gray-400 dark:text-slate-500 uppercase tracking-wide">
          Total Amount Disbursed
        </p>
        <p className="text-3xl font-extrabold text-gray-900 dark:text-white mt-1">
          {"\u20B1"}{" "}
          {totalDisbursed.toLocaleString("en-PH", { minimumFractionDigits: 2 })}
        </p>
        <p className="text-xs text-gray-400 dark:text-slate-500 mt-1">
          Across all disbursed applications
        </p>
      </div>

      {/* Export buttons */}
      <div>
        <h2 className="text-base font-bold text-gray-900 dark:text-white mb-3">
          Export Data
        </h2>
        <p className="text-xs text-gray-400 dark:text-slate-500 mb-4">
          Data is fetched fresh when you click Export — large datasets may take a moment.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* All Applications */}
          <div className="card p-5">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
              All Applications
            </h3>
            <p className="text-xs text-gray-400 dark:text-slate-500 mb-4">
              Export complete application list with all fields
            </p>
            <button
              onClick={exportApplicationsCSV}
              disabled={exporting !== null}
              className="w-full flex items-center justify-center gap-2 btn-primary disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {exporting === "applications" ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <FileDown className="w-4 h-4" />
              )}
              {exporting === "applications" ? "Exporting…" : "Export Applications CSV"}
            </button>
          </div>

          {/* Residents */}
          <div className="card p-5">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
              Resident Database
            </h3>
            <p className="text-xs text-gray-400 dark:text-slate-500 mb-4">
              Export all registered residents with contact info
            </p>
            <button
              onClick={exportResidentsCSV}
              disabled={exporting !== null}
              className="w-full flex items-center justify-center gap-2 btn-primary disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {exporting === "residents" ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <FileDown className="w-4 h-4" />
              )}
              {exporting === "residents" ? "Exporting…" : "Export Residents CSV"}
            </button>
          </div>

          {/* By Status */}
          <div className="card p-5">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
              Export by Status
            </h3>
            <p className="text-xs text-gray-400 dark:text-slate-500 mb-3">
              Download applications filtered by specific status
            </p>
            <div className="grid grid-cols-2 gap-2">
              {["APPROVED", "DISBURSED", "PENDING", "REJECTED"].map((s) => (
                <button
                  key={s}
                  onClick={() => exportByStatus(s)}
                  disabled={exporting !== null}
                  className="flex items-center justify-center gap-1 text-xs font-medium px-3 py-2 rounded-lg bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-slate-300 hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {exporting === s ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <FileDown className="w-3 h-3" />
                  )}
                  {s.charAt(0) + s.slice(1).toLowerCase()}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Status breakdown table */}
      <div className="card overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 dark:border-slate-700">
          <h2 className="font-bold text-gray-900 dark:text-white">
            Status Breakdown
          </h2>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 dark:bg-slate-800/50 text-left">
              {["Status", "Count", "% of Total"].map((h) => (
                <th
                  key={h}
                  className="px-6 py-3 text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wide"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
            {Object.entries(statusCounts).map(([status, count]) => (
              <tr key={status}>
                <td className="px-6 py-3 font-medium text-gray-900 dark:text-white">
                  {status.replace(/_/g, " ")}
                </td>
                <td className="px-6 py-3 text-gray-600 dark:text-slate-300">
                  {count}
                </td>
                <td className="px-6 py-3 text-gray-500 dark:text-slate-400">
                  {totalApps > 0 ? ((count / totalApps) * 100).toFixed(1) : "0"}%
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
