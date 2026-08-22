// Catalogue skeleton. Mirrors the real layout — header, filter row,
// card grid — so the page doesn't jump when the cakes arrive.
export default function Loading() {
  return (
    <div className="bg-blush">
      <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-20">
        <div className="skeleton h-12 w-72 max-w-full" />
        <div className="skeleton mt-5 h-4 w-full max-w-xl" />
        <div className="skeleton mt-2 h-4 w-2/3 max-w-md" />

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <div className="skeleton h-12 flex-1 rounded-full" />
          <div className="skeleton h-12 w-44 rounded-full" />
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {[72, 96, 84, 60].map((w, i) => (
            <div key={i} className="skeleton h-9 rounded-full" style={{ width: w }} />
          ))}
        </div>

        <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="overflow-hidden rounded-[var(--radius-card)] border border-border bg-surface"
            >
              <div className="skeleton aspect-square rounded-none" />
              <div className="p-4">
                <div className="skeleton h-5 w-3/4" />
                <div className="skeleton mt-2.5 h-3.5 w-full" />
                <div className="skeleton mt-1.5 h-3.5 w-5/6" />
                <div className="mt-5 flex items-center justify-between">
                  <div className="skeleton h-6 w-20" />
                  <div className="skeleton h-10 w-10 rounded-full" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
