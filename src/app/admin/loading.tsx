import TablePageSkeleton from "@/components/skeletons/TablePageSkeleton";

// Dashboard has metric cards + charts + table — custom skeleton
export default function DashboardLoading() {
  return (
    <div className="animate-pulse">
      {/* TopBar */}
      <div className="px-6 py-4 border-b border-gray-100 dark:border-slate-700">
        <div className="h-7 w-44 bg-gray-200 dark:bg-slate-700 rounded mb-2" />
        <div className="h-4 w-72 bg-gray-100 dark:bg-slate-800 rounded" />
      </div>

      <div className="p-6 space-y-6">
        {/* Metric cards */}
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-5 flex items-center gap-4"
            >
              <div className="w-12 h-12 rounded-xl bg-gray-200 dark:bg-slate-700 shrink-0" />
              <div className="space-y-2 flex-1 min-w-0">
                <div className="h-7 w-10 bg-gray-200 dark:bg-slate-700 rounded" />
                <div className="h-3 w-full bg-gray-100 dark:bg-slate-800 rounded" />
              </div>
            </div>
          ))}
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 h-64" />
          <div className="rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 h-64" />
        </div>

        {/* Recent Applications table */}
        <div className="rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 dark:border-slate-700">
            <div className="h-5 w-40 bg-gray-200 dark:bg-slate-700 rounded" />
          </div>
          <div className="divide-y divide-gray-100 dark:divide-slate-700">
            {Array.from({ length: 5 }).map((_, r) => (
              <div key={r} className="px-6 py-4 grid grid-cols-6 gap-4 items-center">
                {Array.from({ length: 6 }).map((_, c) => (
                  <div key={c} className="h-4 bg-gray-100 dark:bg-slate-800 rounded" />
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
