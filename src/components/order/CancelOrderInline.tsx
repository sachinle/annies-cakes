"use client";

import { useActionState, useState } from "react";
import { cancelMyOrder, type CancelState } from "@/app/account/orders/actions";

// Compact cancel for the orders list, where it sits alongside "Order
// details" and "View bill".
//
// Still two-step — the button swaps the row's actions for a confirm
// prompt rather than cancelling outright. A list is exactly where a
// mis-tap is most likely, and one destroyed order is worse than one
// extra tap. The full form with a reason box lives on the detail page.
export function CancelOrderInline({
  orderId,
  orderNo,
}: {
  orderId: string;
  orderNo: string;
}) {
  const [confirming, setConfirming] = useState(false);
  const [state, formAction, pending] = useActionState<CancelState, FormData>(
    cancelMyOrder,
    {}
  );

  if (state.ok) {
    return <span className="text-sm text-muted">Cancelled</span>;
  }

  if (!confirming) {
    return (
      <>
        <button
          type="button"
          onClick={() => setConfirming(true)}
          className="rounded-full border border-border px-4 py-2 text-sm font-medium text-muted transition-colors hover:border-error hover:text-error"
        >
          Cancel order
        </button>
        {state.error && (
          <p className="w-full text-sm text-error">{state.error}</p>
        )}
      </>
    );
  }

  return (
    <form action={formAction} className="flex flex-wrap items-center gap-2">
      <input type="hidden" name="orderId" value={orderId} />
      <span className="text-sm text-ink-soft">Cancel {orderNo}?</span>
      <button
        type="submit"
        disabled={pending}
        className="rounded-full bg-error px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
      >
        {pending ? "Cancelling…" : "Yes, cancel"}
      </button>
      <button
        type="button"
        onClick={() => setConfirming(false)}
        disabled={pending}
        className="rounded-full border border-border px-4 py-2 text-sm font-medium text-ink transition-colors hover:border-accent hover:text-accent"
      >
        Keep it
      </button>
      {state.error && <p className="w-full text-sm text-error">{state.error}</p>}
    </form>
  );
}
