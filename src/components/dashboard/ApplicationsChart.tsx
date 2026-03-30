"use client";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const PLACEHOLDER_DATA = [
  { month: "Oct", count: 12 },
  { month: "Nov", count: 19 },
  { month: "Dec", count: 8 },
  { month: "Jan", count: 25 },
  { month: "Feb", count: 31 },
  { month: "Mar", count: 22 },
];

export default function ApplicationsChart({
  data = PLACEHOLDER_DATA,
}: {
  data?: typeof PLACEHOLDER_DATA;
}) {
  return (
    <div className="card p-6">
      <h3 className="font-bold text-gray-900 dark:text-white mb-1">
        Applications Over Time
      </h3>
      <p className="text-xs text-gray-400 dark:text-slate-500 mb-4">
        Last 6 months
      </p>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data} barCategoryGap="35%">
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis
            dataKey="month"
            tick={{ fontSize: 12, fill: "#9ca3af" }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 12, fill: "#9ca3af" }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            contentStyle={{
              background: "#fff",
              border: "1px solid #e5e7eb",
              borderRadius: 8,
              fontSize: 12,
            }}
            cursor={{ fill: "#003DA510" }}
          />
          <Bar
            dataKey="count"
            name="Applications"
            fill="#003DA5"
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
