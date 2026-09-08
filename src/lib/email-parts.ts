/**
 * Splits an email into its local and domain parts.
 *
 * Deliberately in its own module with NO "use client" directive. It
 * lived in ObfuscatedEmail.tsx, which is a client component — and a
 * server component may render a client component but cannot *call* a
 * function exported from one. Doing so throws at request time:
 *
 *   Attempted to call splitEmail() from the server but splitEmail is on
 *   the client.
 *
 * The footer and contact page are server components, so the pure helper
 * has to live somewhere both sides can import.
 */
export function splitEmail(full: string): { user: string; domain: string } {
  const at = full.lastIndexOf("@");
  if (at < 1) return { user: full, domain: "" };
  return { user: full.slice(0, at), domain: full.slice(at + 1) };
}
