export default function Loading() {
  return (
    <div>
      <div className="skeleton h-9 w-44" />
      <div className="mt-8 space-y-5">
        {[0, 1, 2].map((i) => (
          <div key={i} className="rounded-xl border border-border bg-surface p-5">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="skeleton h-5 w-40" />
                <div className="skeleton mt-2 h-3.5 w-56" />
              </div>
              <div className="skeleton h-7 w-24 rounded-full" />
            </div>
            <div className="skeleton mt-5 h-2 w-full rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
}
