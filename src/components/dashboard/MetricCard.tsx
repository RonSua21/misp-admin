import type { LucideIcon } from "lucide-react";

export default function MetricCard({
  title,
  value,
  subtitle,
  icon: Icon,
  color,
  trend,
}: {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  color: string;
  trend?: { value: number; label: string };
}) {
  return (
    <div className="card p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wide">
            {title}
          </p>
          <p className="text-3xl font-extrabold text-gray-900 dark:text-white mt-1">
            {value}
          </p>
          {subtitle && (
            <p className="text-xs text-gray-400 dark:text-slate-500 mt-0.5">
              {subtitle}
            </p>
          )}
          {trend && (
            <p
              className={`text-xs font-semibold mt-1 ${
                trend.value >= 0 ? "text-green-600" : "text-red-500"
              }`}
            >
              {trend.value >= 0 ? "↑" : "↓"} {Math.abs(trend.value)}%{" "}
              {trend.label}
            </p>
          )}
        </div>
        <div
          className={`w-11 h-11 rounded-xl ${color} flex items-center justify-center shrink-0`}
        >
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </div>
  );
}
