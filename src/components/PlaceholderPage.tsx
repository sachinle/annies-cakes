// Lightweight placeholder for routes not yet built out (product catalogue,
// gallery, etc. land in later phases per the implementation plan). Keeps
// navigation honest — no broken links — without faking content.
export function PlaceholderPage({
  title,
  body,
}: {
  title: string;
  body: string;
}) {
  return (
    <section className="mx-auto max-w-2xl px-4 py-20 text-center sm:px-6">
      <h1 className="text-3xl font-semibold sm:text-4xl">{title}</h1>
      <p className="mt-4 text-ink-soft">{body}</p>
    </section>
  );
}
