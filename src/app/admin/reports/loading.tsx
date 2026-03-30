export default function ReportsLoading() {
  return (
    <div className="animate-pulse">
      {/* TopBar */}
      <div className="px-6 py-4 border-b border-gray-100 dark:border-slate-700">
        <div className="h-7 w-44 bg-gray-200 dark:bg-slate-700 rounded mb-2" />
        <div className="h-4 w-64 bg-gray-100 dark:bg-slate-800 rounded" />
      </div>

      <div className="p-6 space-y-6">
        {/* Stats row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-5"
            >
              <div className="h-3 w-24 bg-gray-200 dark:bg-slate-700 rounded mb-3" />
              <div className="h-8 w-16 bg-gray-200 dark:bg-slate-700 rounded" />
            </div>
          ))}
        </div>

        {/* Export buttons */}
        <div className="flex gap-3">
          <div className="h-10 w-40 bg-gray-200 dark:bg-slate-700 rounded-lg" />
          <div className="h-10 w-40 bg-gray-200 dark:bg-slate-700 rounded-lg" />
        </div>

        {/* Table skeleton */}
        <div className="overflow-hidden rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900">
          <div className="bg-gray-50 dark:bg-slate-800 px-6 py-3 grid grid-cols-5 gap-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-3 bg-gray-200 dark:bg-slate-600 rounded" />
            ))}
          </div>
          <div className="divide-y divide-gray-100 dark:divide-slate-700">
            {Array.from({ length: 8 }).map((_, r) => (
              <div key={r} className="px-6 py-4 grid grid-cols-5 gap-4 items-center">
                {Array.from({ length: 5 }).map((_, c) => (
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
