/**
 * Generic pulsing skeleton used by every admin section's loading.tsx.
 * Shows a TopBar area, a filter-bar row, and a paginated table shell.
 */
export default function TablePageSkeleton({
  rows = 8,
  cols = 5,
  showFilters = true,
}: {
  rows?: number;
  cols?: number;
  showFilters?: boolean;
}) {
  return (
    <div className="animate-pulse">
      {/* TopBar */}
      <div className="px-6 py-4 border-b border-gray-100 dark:border-slate-700">
        <div className="h-7 w-44 bg-gray-200 dark:bg-slate-700 rounded mb-2" />
        <div className="h-4 w-72 bg-gray-100 dark:bg-slate-800 rounded" />
      </div>

      <div className="p-6 space-y-4">
        {/* Filter row */}
        {showFilters && (
          <div className="flex flex-wrap gap-3">
            <div className="h-9 w-56 bg-gray-200 dark:bg-slate-700 rounded-lg" />
            <div className="h-9 w-36 bg-gray-200 dark:bg-slate-700 rounded-lg" />
            <div className="h-9 w-28 bg-gray-200 dark:bg-slate-700 rounded-lg" />
          </div>
        )}

        {/* Table card */}
        <div className="overflow-hidden rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900">
          {/* Header row */}
          <div className="grid bg-gray-50 dark:bg-slate-800 px-6 py-3 gap-4"
            style={{ gridTemplateColumns: `repeat(${cols}, minmax(0,1fr))` }}
          >
            {Array.from({ length: cols }).map((_, i) => (
              <div key={i} className="h-3 bg-gray-200 dark:bg-slate-600 rounded" />
            ))}
          </div>

          {/* Data rows */}
          <div className="divide-y divide-gray-100 dark:divide-slate-700">
            {Array.from({ length: rows }).map((_, r) => (
              <div
                key={r}
                className="grid px-6 py-4 gap-4 items-center"
                style={{ gridTemplateColumns: `repeat(${cols}, minmax(0,1fr))` }}
              >
                {Array.from({ length: cols }).map((_, c) => (
                  <div
                    key={c}
                    className={`h-4 rounded bg-gray-100 dark:bg-slate-800 ${
                      c === 0 ? "w-3/4" : c === cols - 1 ? "w-1/2" : "w-full"
                    }`}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* Pagination row */}
        <div className="flex justify-between items-center pt-1">
          <div className="h-4 w-32 bg-gray-100 dark:bg-slate-800 rounded" />
          <div className="flex gap-2">
            <div className="h-8 w-20 bg-gray-200 dark:bg-slate-700 rounded-lg" />
            <div className="h-8 w-20 bg-gray-200 dark:bg-slate-700 rounded-lg" />
          </div>
        </div>
      </div>
    </div>
  );
}
