"use client";

import { useActionState, useState } from "react";
import { deleteAccount, type DeleteState } from "./actions";
import { FormMessage } from "@/components/auth/AuthShell";

export function DeleteAccount() {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState<DeleteState, FormData>(
    deleteAccount,
    {}
  );

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-full border border-error/40 px-5 py-2.5 text-sm font-semibold text-error transition-colors hover:bg-error/10"
      >
        Delete my account
      </button>
    );
  }

  return (
    <form action={formAction} className="rounded-xl border border-error/30 bg-error/5 p-5">
      <FormMessage error={state.error} />
      <p className="text-sm text-ink">
        This can&apos;t be undone. Type <strong>DELETE</strong> to confirm.
      </p>
      <input
        name="confirm"
        aria-label="Type DELETE to confirm"
        autoComplete="off"
        className="mt-3 w-full rounded-lg border border-border bg-surface px-3.5 py-2.5 text-ink outline-none focus:border-error"
      />
      <div className="mt-4 flex gap-3">
        <button
          type="submit"
          disabled={pending}
          className="rounded-full bg-error px-5 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
        >
          {pending ? "Deleting…" : "Permanently delete"}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="rounded-full border border-border px-5 py-2.5 text-sm font-semibold text-ink"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
