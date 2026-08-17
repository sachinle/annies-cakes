"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { loadServerCart, saveServerCart } from "@/lib/cart-actions";
import {
  MAX_CART_LINES,
  MAX_LINE_QUANTITY,
  cartCount,
  cartTotal,
  lineKey,
  type CartLine,
} from "@/lib/cart-types";

const STORAGE_KEY = "annies-cart";

type CartContextValue = {
  lines: CartLine[];
  count: number;
  total: number;
  ready: boolean;
  add: (line: CartLine) => void;
  setQuantity: (productId: number, variantLabel: string | null, qty: number) => void;
  remove: (productId: number, variantLabel: string | null) => void;
  clear: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);

function readLocal(): CartLine[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as CartLine[]) : [];
  } catch {
    return [];
  }
}

function writeLocal(lines: CartLine[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(lines));
  } catch {
    // Private browsing can block storage; the cart still works in-memory
    // for this session.
  }
}

export function CartProvider({
  signedIn,
  children,
}: {
  signedIn: boolean;
  children: ReactNode;
}) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [ready, setReady] = useState(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Initial load. A guest basket in localStorage is merged into the
  // saved account cart on sign-in rather than being thrown away —
  // losing what someone just picked out is the worst possible moment
  // to lose it.
  useEffect(() => {
    let cancelled = false;

    async function init() {
      const local = readLocal();

      if (!signedIn) {
        if (!cancelled) {
          setLines(local);
          setReady(true);
        }
        return;
      }

      try {
        const server = await loadServerCart();
        const merged = mergeCarts(server, local);
        if (cancelled) return;

        setLines(merged);
        writeLocal(merged);
        // Push the merge back so the account copy matches.
        if (local.length > 0) await saveServerCart(merged);
      } catch {
        if (!cancelled) setLines(local);
      } finally {
        if (!cancelled) setReady(true);
      }
    }

    init();
    return () => {
      cancelled = true;
    };
  }, [signedIn]);

  // Persist changes. Debounced so holding the "+" button doesn't fire a
  // request per click.
  const persist = useCallback(
    (next: CartLine[]) => {
      writeLocal(next);
      if (!signedIn) return;
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(() => {
        saveServerCart(next).catch(() => {
          // Local copy is already updated; a failed sync is not worth
          // interrupting the customer over.
        });
      }, 700);
    },
    [signedIn]
  );

  const update = useCallback(
    (fn: (prev: CartLine[]) => CartLine[]) => {
      setLines((prev) => {
        const next = fn(prev);
        persist(next);
        return next;
      });
    },
    [persist]
  );

  const add = useCallback(
    (line: CartLine) => {
      update((prev) => {
        const key = lineKey(line.productId, line.variantLabel);
        const existing = prev.find(
          (l) => lineKey(l.productId, l.variantLabel) === key
        );

        if (existing) {
          return prev.map((l) =>
            lineKey(l.productId, l.variantLabel) === key
              ? {
                  ...l,
                  quantity: Math.min(
                    MAX_LINE_QUANTITY,
                    l.quantity + line.quantity
                  ),
                }
              : l
          );
        }
        if (prev.length >= MAX_CART_LINES) return prev;
        return [...prev, line];
      });
    },
    [update]
  );

  const setQuantity = useCallback(
    (productId: number, variantLabel: string | null, qty: number) => {
      const key = lineKey(productId, variantLabel);
      update((prev) =>
        qty <= 0
          ? prev.filter((l) => lineKey(l.productId, l.variantLabel) !== key)
          : prev.map((l) =>
              lineKey(l.productId, l.variantLabel) === key
                ? { ...l, quantity: Math.min(MAX_LINE_QUANTITY, qty) }
                : l
            )
      );
    },
    [update]
  );

  const remove = useCallback(
    (productId: number, variantLabel: string | null) => {
      const key = lineKey(productId, variantLabel);
      update((prev) =>
        prev.filter((l) => lineKey(l.productId, l.variantLabel) !== key)
      );
    },
    [update]
  );

  const clear = useCallback(() => update(() => []), [update]);

  return (
    <CartContext.Provider
      value={{
        lines,
        count: cartCount(lines),
        total: cartTotal(lines),
        ready,
        add,
        setQuantity,
        remove,
        clear,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside <CartProvider>");
  return ctx;
}

/** Server cart wins on conflict; guest-only lines are appended. */
function mergeCarts(server: CartLine[], local: CartLine[]): CartLine[] {
  const keys = new Set(server.map((l) => lineKey(l.productId, l.variantLabel)));
  const extras = local.filter(
    (l) => !keys.has(lineKey(l.productId, l.variantLabel))
  );
  return [...server, ...extras].slice(0, MAX_CART_LINES);
}
