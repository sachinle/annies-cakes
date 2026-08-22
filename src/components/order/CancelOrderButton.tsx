"use client";

import { useActionState, useState } from "react";
import { cancelMyOrder, type CancelState } from "@/app/account/orders/actions";

// Two-step cancel: the button opens a confirmation panel rather than
// cancelling on the first click. A stray tap shouldn't destroy an order,
// and the second step is also where we ask why — useful to the owner,
// and optional so it never blocks someone who just wants out.
export function CancelOrderButton({
  orderId,
  orderNo,
}: {
  orderId: string;
  orderNo: string;
}) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState<CancelState, FormData>(
    cancelMyOrder,
    {}
  );

  if (state.ok) {
    return (
      <p className="mt-6 rounded-xl border border-border bg-surface px-5 py-4 text-sm text-muted">
        Order {orderNo} has been cancelled. We&apos;ve let the kitchen know.
      </p>
    );
  }

  if (!open) {
    return (
      <div className="mt-8">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="text-sm font-medium text-muted underline underline-offset-4 transition-colors hover:text-error"
        >
          Cancel this order
        </button>
        {state.error && (
          <p className="mt-3 rounded-lg border border-error/30 bg-error/10 px-4 py-3 text-sm text-error">
            {state.error}
          </p>
        )}
      </div>
    );
  }

  return (
    <form
      action={formAction}
      className="mt-8 rounded-xl border border-error/30 bg-error/5 p-5"
    >
      <input type="hidden" name="orderId" value={orderId} />

      <p className="font-display text-lg text-ink">Cancel order {orderNo}?</p>
      <p className="mt-1.5 text-sm text-ink-soft">
        This can&apos;t be undone. If you only need to change a detail, message
        us instead — we can usually adjust it.
      </p>

      <label htmlFor="cancel-reason" className="mt-4 block text-sm text-ink-soft">
        Reason <span className="text-muted">(optional)</span>
      </label>
      <textarea
        id="cancel-reason"
        name="reason"
        rows={2}
        maxLength={300}
        placeholder="Changed my mind, wrong date…"
        className="mt-1.5 w-full rounded-lg border border-border bg-surface px-3.5 py-2.5 text-sm text-ink outline-none placeholder:text-muted focus:border-accent"
      />

      {state.error && (
        <p className="mt-3 rounded-lg border border-error/30 bg-error/10 px-4 py-3 text-sm text-error">
          {state.error}
        </p>
      )}

      <div className="mt-5 flex flex-wrap gap-3">
        <button
          type="submit"
          disabled={pending}
          className="rounded-full bg-error px-6 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
        >
          {pending ? "Cancelling…" : "Yes, cancel it"}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          disabled={pending}
          className="rounded-full border border-border px-6 py-2.5 text-sm font-semibold text-ink transition-colors hover:border-accent hover:text-accent"
        >
          Keep my order
        </button>
      </div>
    </form>
  );
}
