import { site } from "@/content/site";

// Scrolling strip of selling points, like the reference design.
// The list is rendered twice so the loop is seamless; the duplicate is
// hidden from screen readers so the phrases aren't announced twice.
export function Marquee() {
  const items = site.marquee;

  return (
    <div className="marquee border-y border-border bg-accent py-3.5">
      <div className="marquee__track">
        {[0, 1].map((copy) => (
          <ul
            key={copy}
            className="flex shrink-0 items-center"
            aria-hidden={copy === 1 ? true : undefined}
          >
            {items.map((item) => (
              <li
                key={item}
                className="flex items-center gap-8 whitespace-nowrap px-8 text-sm font-semibold uppercase tracking-[0.14em] text-white"
              >
                {item}
                <span className="text-yellow" aria-hidden="true">✦</span>
              </li>
            ))}
          </ul>
        ))}
      </div>
    </div>
  );
}
