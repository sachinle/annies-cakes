import type { Metadata } from "next";
import { CartView } from "./CartView";

export const metadata: Metadata = {
  title: "Your Basket",
  robots: { index: false },
};

export default function CartPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 sm:py-16">
      <h1 className="rule-gold text-3xl font-semibold sm:text-4xl">
        Your basket
      </h1>
      <CartView />
    </div>
  );
}
