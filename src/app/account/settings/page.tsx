import type { Metadata } from "next";
import { getUser } from "@/lib/supabase/server-auth";
import { PasswordForm } from "./PasswordForm";
import { DeleteAccount } from "./DeleteAccount";

export const metadata: Metadata = {
  title: "Settings",
  robots: { index: false },
};

export default async function SettingsPage() {
  const user = await getUser();

  // Google-only accounts have no password to change. Checking the
  // identity list is more reliable than guessing from the email.
  const hasPassword = Boolean(
    user?.identities?.some((i) => i.provider === "email")
  );

  return (
    <div className="max-w-md">
      <h1 className="text-2xl font-semibold sm:text-3xl">Settings</h1>

      <section className="mt-8">
        <h2 className="text-base font-semibold text-ink">Password</h2>
        {hasPassword ? (
          <div className="mt-4">
            <PasswordForm />
          </div>
        ) : (
          <p className="mt-2 text-sm text-muted">
            You sign in with Google, so there&apos;s no password to manage
            here. You can change it from your Google account.
          </p>
        )}
      </section>

      <section className="mt-12 border-t border-border pt-8">
        <h2 className="text-base font-semibold text-ink">Delete account</h2>
        <p className="mt-2 text-sm text-ink-soft">
          This removes your profile and sign-in permanently. Orders you&apos;ve
          already placed stay in our records — we need them for our own
          accounts — but they&apos;ll no longer be linked to a login.
        </p>
        <div className="mt-4">
          <DeleteAccount />
        </div>
      </section>
    </div>
  );
}
