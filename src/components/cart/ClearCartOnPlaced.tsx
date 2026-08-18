"use client";

import { useEffect, useRef } from "react";
import { useCart } from "./CartProvider";

// Empties the browser's copy of the basket once an order made *from the
// basket* has gone through.
//
// The server action already deletes cart_items, but that alone isn't
// enough. The basket also lives in React state and localStorage, and
// neither is touched by a server-side delete. Worse, CartProvider merges
// the local copy over the server copy on load and pushes the result
// back — so an ordered basket would come back from the dead on the next
// visit, and the customer could order the same cakes twice.
//
// Only rendered when the redirect says the order came from the basket:
// "Order just this one" deliberately leaves the basket intact, and
// clearing it there would throw away cakes the customer still wants.
export function ClearCartOnPlaced({ orderNo }: { orderNo: string }) {
  const { clear, ready } = useCart();
  const clearedFor = useRef<string | null>(null);

  useEffect(() => {
    // Waiting for `ready` matters: CartProvider loads the saved basket
    // asynchronously, and clearing before that finishes would just be
    // overwritten when the load resolves.
    if (!ready || clearedFor.current === orderNo) return;
    clearedFor.current = orderNo;
    clear();
  }, [ready, orderNo, clear]);

  return null;
}
