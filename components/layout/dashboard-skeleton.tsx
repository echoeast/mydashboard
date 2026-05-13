'use client';

export function DashboardSkeleton() {
  return (
    <div className="h-full overflow-y-auto p-6 space-y-6 animate-pulse">
      {/* Header */}
      <div className="space-y-3">
        <div className="h-8 bg-neutral-300 dark:bg-neutral-700 rounded-lg w-1/3"></div>
        <div className="h-4 bg-neutral-300 dark:bg-neutral-700 rounded w-1/2"></div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="rounded-xl border border-neutral-300 dark:border-neutral-700 bg-card p-6">
            <div className="h-4 bg-neutral-300 dark:bg-neutral-700 rounded w-1/2 mb-4"></div>
            <div className="h-8 bg-neutral-300 dark:bg-neutral-700 rounded w-2/3 mb-3"></div>
            <div className="h-3 bg-neutral-300 dark:bg-neutral-700 rounded w-3/4"></div>
          </div>
        ))}
      </div>

      {/* Chart Placeholder */}
      <div className="rounded-xl border border-neutral-300 dark:border-neutral-700 bg-card p-6">
        <div className="h-5 bg-neutral-300 dark:bg-neutral-700 rounded w-1/4 mb-4"></div>
        <div className="h-64 bg-neutral-300 dark:bg-neutral-700 rounded"></div>
      </div>

      {/* Table Placeholder */}
      <div className="rounded-xl border border-neutral-300 dark:border-neutral-700 bg-card p-6">
        <div className="h-5 bg-neutral-300 dark:bg-neutral-700 rounded w-1/3 mb-4"></div>
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex gap-4">
              <div className="h-4 bg-neutral-300 dark:bg-neutral-700 rounded flex-1"></div>
              <div className="h-4 bg-neutral-300 dark:bg-neutral-700 rounded flex-1"></div>
              <div className="h-4 bg-neutral-300 dark:bg-neutral-700 rounded flex-1"></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

