import { ORDER_STATUSES, STATUS_LABELS, type OrderStatus } from "@/lib/orders";

// Order progress rail.
//
// Geometry: each step occupies 1/steps of the width and its dot sits in
// the middle of that slot, so the first dot's centre is at
// (50/steps)% and the last at (100 - 50/steps)%. The rail spans exactly
// between those two points, and the fill covers currentIndex of the
// (steps - 1) gaps between them.
//
// Getting this wrong is easy: an earlier version applied a horizontal
// margin *and* a right offset to the fill, which subtracted the inset
// twice and left the line stopping short of the dot it was meant to
// reach.
export function OrderTimeline({ status }: { status: OrderStatus }) {
  const steps = ORDER_STATUSES.length;
  const currentIndex = ORDER_STATUSES.indexOf(
    status as (typeof ORDER_STATUSES)[number]
  );

  const inset = 50 / steps;              // % from each edge to a dot centre
  const railWidth = 100 - inset * 2;     // % between first and last dot
  const filled = currentIndex <= 0 ? 0 : currentIndex / (steps - 1);

  return (
    <div aria-label={`Order progress: ${STATUS_LABELS[status]}`}>
      <div className="relative">
        {/* Rail */}
        <div
          aria-hidden="true"
          className="absolute top-[5px] h-0.5 rounded-full bg-border"
          style={{ left: `${inset}%`, width: `${railWidth}%` }}
        />

        {/* Fill — scaled rather than resized so the browser can
            composite the animation instead of laying out on each frame. */}
        <div
          aria-hidden="true"
          className="absolute top-[5px] h-0.5 origin-left rounded-full bg-accent"
          style={{
            left: `${inset}%`,
            width: `${railWidth * filled}%`,
            animation: "draw-line 1.1s cubic-bezier(0.16, 1, 0.3, 1) forwards",
          }}
        />

        <ol className="relative flex">
          {ORDER_STATUSES.map((step, i) => {
            const done = i < currentIndex;
            const current = i === currentIndex;

            return (
              <li key={step} className="flex flex-1 flex-col items-center gap-2">
                <span
                  className={`h-3 w-3 rounded-full border-2 transition-colors duration-500 ${
                    done || current
                      ? "border-accent"
                      : "border-border bg-surface"
                  } ${done ? "bg-accent" : current ? "bg-surface" : ""}`}
                  style={
                    current
                      ? {
                          animation: "pulse-ring 2.4s ease-out infinite",
                          animationDelay: "1.1s",
                        }
                      : undefined
                  }
                />
                <span
                  className={`px-0.5 text-center text-[10px] leading-tight sm:text-xs ${
                    current
                      ? "font-semibold text-accent"
                      : done
                        ? "text-ink-soft"
                        : "text-muted"
                  }`}
                >
                  {STATUS_LABELS[step]}
                </span>
              </li>
            );
          })}
        </ol>
      </div>
    </div>
  );
}
