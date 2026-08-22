// Holds a full viewport so the footer stays below the fold while
// content streams in — see src/app/loading.tsx for why.
export default function Loading() {
  return (
    <div className="mx-auto min-h-svh max-w-5xl px-4 py-12 sm:px-6">
      <div className="skeleton h-10 w-48" />
      <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_320px]">
        <div className="space-y-4">
          {[0, 1].map((i) => (
            <div key={i} className="skeleton h-28 rounded-xl" />
          ))}
        </div>
        <div className="skeleton h-64 rounded-xl" />
      </div>
    </div>
  );
}
