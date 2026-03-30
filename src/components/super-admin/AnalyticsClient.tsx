"use client";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from "recharts";

type BarangayData = {
  barangay: string;
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  disbursed: number;
  underReview: number;
  residents: number;
  totalDisbursed: number;
};

export default function AnalyticsClient({ data }: { data: BarangayData[] }) {
  const top15 = data.slice(0, 15);
  const totalApps = data.reduce((sum, d) => sum + d.total, 0);
  const totalResidents = data.reduce((sum, d) => sum + d.residents, 0);
  const totalDisbursed = data.reduce((sum, d) => sum + d.totalDisbursed, 0);

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card p-5">
          <p className="text-xs font-semibold text-gray-400 dark:text-slate-500 uppercase tracking-wide">
            Barangays with Applications
          </p>
          <p className="text-3xl font-extrabold text-gray-900 dark:text-white mt-1">
            {data.length}
          </p>
        </div>
        <div className="card p-5">
          <p className="text-xs font-semibold text-gray-400 dark:text-slate-500 uppercase tracking-wide">
            Total Applications
          </p>
          <p className="text-3xl font-extrabold text-gray-900 dark:text-white mt-1">
            {totalApps}
          </p>
        </div>
        <div className="card p-5">
          <p className="text-xs font-semibold text-gray-400 dark:text-slate-500 uppercase tracking-wide">
            Total Amount Disbursed
          </p>
          <p className="text-3xl font-extrabold text-gray-900 dark:text-white mt-1">
            {"\u20B1"}
            {totalDisbursed.toLocaleString("en-PH", {
              minimumFractionDigits: 0,
            })}
          </p>
        </div>
      </div>

      {/* Bar Chart — Applications per Barangay */}
      <div className="card p-6">
        <h3 className="font-bold text-gray-900 dark:text-white mb-1">
          Applications by Barangay
        </h3>
        <p className="text-xs text-gray-400 dark:text-slate-500 mb-4">
          Top 15 barangays by application volume
        </p>
        {top15.length === 0 ? (
          <p className="text-sm text-gray-400 dark:text-slate-500 py-8 text-center">
            No data available.
          </p>
        ) : (
          <ResponsiveContainer width="100%" height={400}>
            <BarChart
              layout="vertical"
              data={top15}
              margin={{ left: 80, right: 20 }}
            >
              <CartesianGrid strokeDasharray="3 3" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 11, fill: "#9ca3af" }} />
              <YAxis
                type="category"
                dataKey="barangay"
                tick={{ fontSize: 11, fill: "#9ca3af" }}
                width={80}
              />
              <Tooltip
                contentStyle={{
                  background: "#fff",
                  border: "1px solid #e5e7eb",
                  borderRadius: 8,
                  fontSize: 12,
                }}
              />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar
                dataKey="approved"
                name="Approved"
                fill="#22c55e"
                stackId="a"
                radius={[0, 0, 0, 0]}
              />
              <Bar
                dataKey="disbursed"
                name="Disbursed"
                fill="#8b5cf6"
                stackId="a"
              />
              <Bar
                dataKey="pending"
                name="Pending"
                fill="#f59e0b"
                stackId="a"
              />
              <Bar
                dataKey="underReview"
                name="Under Review"
                fill="#3b82f6"
                stackId="a"
              />
              <Bar
                dataKey="rejected"
                name="Rejected"
                fill="#ef4444"
                stackId="a"
                radius={[0, 4, 4, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Residents per Barangay */}
      <div className="card p-6">
        <h3 className="font-bold text-gray-900 dark:text-white mb-1">
          Residents by Barangay
        </h3>
        <p className="text-xs text-gray-400 dark:text-slate-500 mb-4">
          Registered resident count
        </p>
        {top15.length === 0 ? (
          <p className="text-sm text-gray-400 dark:text-slate-500 py-8 text-center">
            No data available.
          </p>
        ) : (
          <ResponsiveContainer width="100%" height={400}>
            <BarChart
              layout="vertical"
              data={top15.sort((a, b) => b.residents - a.residents)}
              margin={{ left: 80, right: 20 }}
            >
              <CartesianGrid strokeDasharray="3 3" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 11, fill: "#9ca3af" }} />
              <YAxis
                type="category"
                dataKey="barangay"
                tick={{ fontSize: 11, fill: "#9ca3af" }}
                width={80}
              />
              <Tooltip
                contentStyle={{
                  background: "#fff",
                  border: "1px solid #e5e7eb",
                  borderRadius: 8,
                  fontSize: 12,
                }}
              />
              <Bar
                dataKey="residents"
                name="Residents"
                fill="#003DA5"
                radius={[0, 4, 4, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Table breakdown */}
      <div className="card overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 dark:border-slate-700">
          <h3 className="font-bold text-gray-900 dark:text-white">
            Full Barangay Breakdown
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 dark:bg-slate-800/50 text-left">
                {[
                  "Barangay",
                  "Residents",
                  "Total Apps",
                  "Pending",
                  "Approved",
                  "Disbursed",
                  "Rejected",
                  "Amount Disbursed",
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
              {data.map((row) => (
                <tr
                  key={row.barangay}
                  className="hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors"
                >
                  <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">
                    {row.barangay}
                  </td>
                  <td className="px-4 py-3 text-gray-600 dark:text-slate-300">
                    {row.residents}
                  </td>
                  <td className="px-4 py-3 font-bold text-gray-900 dark:text-white">
                    {row.total}
                  </td>
                  <td className="px-4 py-3 text-yellow-600 dark:text-yellow-400">
                    {row.pending}
                  </td>
                  <td className="px-4 py-3 text-green-600 dark:text-green-400">
                    {row.approved}
                  </td>
                  <td className="px-4 py-3 text-purple-600 dark:text-purple-400">
                    {row.disbursed}
                  </td>
                  <td className="px-4 py-3 text-red-600 dark:text-red-400">
                    {row.rejected}
                  </td>
                  <td className="px-4 py-3 text-gray-600 dark:text-slate-300">
                    {row.totalDisbursed > 0
                      ? `\u20B1${row.totalDisbursed.toLocaleString("en-PH", { minimumFractionDigits: 0 })}`
                      : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
