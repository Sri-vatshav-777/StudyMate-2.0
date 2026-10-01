export default function DashboardLoading() {
  return (
    <div className="space-y-8 animate-pulse pb-12">
      {/* Header Skeleton */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="space-y-2">
          <div className="h-8 w-64 bg-slate-200 dark:bg-white/10 rounded-xl" />
          <div className="h-4 w-96 bg-slate-100 dark:bg-white/5 rounded-lg" />
        </div>
        <div className="flex items-center gap-3">
          <div className="h-10 w-24 bg-slate-200 dark:bg-white/10 rounded-xl" />
          <div className="h-10 w-28 bg-slate-200 dark:bg-white/10 rounded-xl" />
        </div>
      </div>

      {/* Metric Cards Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="p-5 rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 shadow-sm space-y-3"
          >
            <div className="flex justify-between items-center">
              <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-white/5" />
              <div className="w-12 h-3 bg-slate-100 dark:bg-white/5 rounded" />
            </div>
            <div className="h-7 w-20 bg-slate-200 dark:bg-white/10 rounded-lg" />
            <div className="h-3 w-32 bg-slate-100 dark:bg-white/5 rounded" />
          </div>
        ))}
      </div>

      {/* Main Content Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 p-6 rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 space-y-4">
          <div className="h-6 w-40 bg-slate-200 dark:bg-white/10 rounded-lg" />
          <div className="space-y-3 pt-2">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-20 rounded-xl border border-slate-100 dark:border-white/5 bg-slate-50 dark:bg-white/[0.02]"
              />
            ))}
          </div>
        </div>

        <div className="p-6 rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 space-y-4">
          <div className="h-6 w-32 bg-slate-200 dark:bg-white/10 rounded-lg" />
          <div className="space-y-3 pt-2">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="h-14 rounded-xl border border-slate-100 dark:border-white/5 bg-slate-50 dark:bg-white/[0.02]"
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
