import Link from "next/link";
import type { ReactNode } from "react";

export function AuthShell({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <section className="mx-auto flex max-w-md flex-col px-4 py-14 sm:px-6 sm:py-20">
      <Link href="/" className="font-display text-lg font-semibold text-ink">
        Annie&apos;s Cakes
      </Link>
      <h1 className="mt-8 text-2xl font-semibold sm:text-3xl">{title}</h1>
      {subtitle && <p className="mt-2 text-sm text-ink-soft">{subtitle}</p>}
      <div className="mt-8">{children}</div>
      {footer && <div className="mt-6 text-sm text-muted">{footer}</div>}
    </section>
  );
}

export function Field({
  label,
  name,
  type = "text",
  autoComplete,
  required = true,
  placeholder,
  minLength,
  hint,
}: {
  label: string;
  name: string;
  type?: string;
  autoComplete?: string;
  required?: boolean;
  placeholder?: string;
  minLength?: number;
  hint?: string;
}) {
  const id = `field-${name}`;
  return (
    <div className="mb-4">
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-ink">
        {label}
      </label>
      <input
        id={id}
        name={name}
        type={type}
        autoComplete={autoComplete}
        required={required}
        placeholder={placeholder}
        minLength={minLength}
        aria-describedby={hint ? `${id}-hint` : undefined}
        className="w-full rounded-lg border border-border bg-surface px-3.5 py-2.5 text-ink outline-none transition-colors placeholder:text-muted focus:border-accent"
      />
      {hint && (
        <p id={`${id}-hint`} className="mt-1.5 text-xs text-muted">
          {hint}
        </p>
      )}
    </div>
  );
}

export function FormMessage({
  error,
  message,
}: {
  error?: string;
  message?: string;
}) {
  if (!error && !message) return null;
  return (
    <p
      role="status"
      aria-live="polite"
      className={`mb-4 rounded-lg border px-3.5 py-2.5 text-sm ${
        error
          ? "border-error/30 bg-error/10 text-error"
          : "border-success/30 bg-success/10 text-success"
      }`}
    >
      {error ?? message}
    </p>
  );
}

export function SubmitButton({
  children,
  pending,
}: {
  children: ReactNode;
  pending: boolean;
}) {
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded-full bg-accent px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-accent-hover disabled:opacity-60"
    >
      {pending ? "Please wait…" : children}
    </button>
  );
}
