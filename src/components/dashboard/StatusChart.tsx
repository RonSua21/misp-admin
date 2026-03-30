"use client";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

const COLORS: Record<string, string> = {
  PENDING: "#f59e0b",
  UNDER_REVIEW: "#3b82f6",
  APPROVED: "#22c55e",
  REJECTED: "#ef4444",
  DISBURSED: "#8b5cf6",
};

const PLACEHOLDER = [
  { name: "Pending", value: 14, key: "PENDING" },
  { name: "Under Review", value: 8, key: "UNDER_REVIEW" },
  { name: "Approved", value: 31, key: "APPROVED" },
  { name: "Rejected", value: 5, key: "REJECTED" },
  { name: "Disbursed", value: 19, key: "DISBURSED" },
];

export default function StatusChart({
  data = PLACEHOLDER,
}: {
  data?: typeof PLACEHOLDER;
}) {
  return (
    <div className="card p-6">
      <h3 className="font-bold text-gray-900 dark:text-white mb-1">
        Status Distribution
      </h3>
      <p className="text-xs text-gray-400 dark:text-slate-500 mb-4">
        All-time breakdown
      </p>
      <ResponsiveContainer width="100%" height={220}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={90}
            paddingAngle={3}
            dataKey="value"
          >
            {data.map((entry, i) => (
              <Cell key={i} fill={COLORS[entry.key] ?? "#ccc"} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              background: "#fff",
              border: "1px solid #e5e7eb",
              borderRadius: 8,
              fontSize: 12,
            }}
          />
          <Legend
            iconType="circle"
            iconSize={8}
            wrapperStyle={{ fontSize: 12 }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
