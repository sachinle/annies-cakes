export default function Loading() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
      <div className="skeleton h-4 w-56" />

      <div className="mt-6 grid gap-10 md:grid-cols-2">
        <div className="skeleton aspect-square rounded-[var(--radius-card)]" />

        <div>
          <div className="skeleton h-10 w-4/5" />
          <div className="skeleton mt-5 h-8 w-32" />
          <div className="mt-4 flex flex-wrap gap-2">
            {[88, 96, 80].map((w, i) => (
              <div key={i} className="skeleton h-9 rounded-full" style={{ width: w }} />
            ))}
          </div>
          <div className="skeleton mt-6 h-4 w-full" />
          <div className="skeleton mt-2 h-4 w-11/12" />
          <div className="skeleton mt-2 h-4 w-3/4" />

          <div className="mt-8 border-t border-border pt-8">
            <div className="skeleton h-14 w-full rounded-full" />
          </div>
          <div className="mt-5 flex flex-wrap gap-3">
            <div className="skeleton h-12 w-48 rounded-full" />
            <div className="skeleton h-12 w-52 rounded-full" />
          </div>
        </div>
      </div>
    </div>
  );
}
