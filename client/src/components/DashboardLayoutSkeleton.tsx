export function DashboardLayoutSkeleton() {
  return (
    <div className="min-h-screen animate-pulse bg-[#0b0f14] p-6">
      <div className="grid gap-4 md:grid-cols-[260px_1fr]">
        <div className="rounded-3xl bg-white/5 p-6">
          <div className="h-10 rounded-xl bg-white/10" />
          <div className="mt-6 space-y-3">
            <div className="h-9 rounded-xl bg-white/10" />
            <div className="h-9 rounded-xl bg-white/10" />
            <div className="h-9 rounded-xl bg-white/10" />
          </div>
        </div>
        <div className="rounded-3xl bg-white/5 p-6">
          <div className="h-10 w-56 rounded-xl bg-white/10" />
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <div className="h-28 rounded-2xl bg-white/10" />
            <div className="h-28 rounded-2xl bg-white/10" />
            <div className="h-28 rounded-2xl bg-white/10" />
          </div>
        </div>
      </div>
    </div>
  );
}
