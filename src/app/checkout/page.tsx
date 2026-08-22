import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getUser } from "@/lib/supabase/server-auth";
import { getOrCreateProfile } from "@/lib/customer";
import { CheckoutForm } from "./CheckoutForm";

export const metadata: Metadata = {
  title: "Checkout",
  robots: { index: false },
};

export default async function CheckoutPage() {
  // Browsing and filling a basket stay open; sign-in is required only
  // here, where we need to know who the order belongs to.
  const user = await getUser();
  if (!user) redirect("/signin?next=%2Fcheckout");

  const profile = await getOrCreateProfile();

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 sm:py-16">
      <nav aria-label="Breadcrumb" className="text-sm text-muted">
        <Link href="/cart" className="hover:text-accent">Basket</Link>
        <span className="mx-2">/</span>
        <span className="text-ink-soft">Checkout</span>
      </nav>

      <h1 className="rule-gold mt-4 text-3xl font-semibold sm:text-4xl">
        Almost there
      </h1>
      <p className="mt-4 max-w-lg text-ink-soft">
        Tell us when and where you need these, and we&apos;ll confirm
        everything with you before we start baking. Nothing is charged now.
      </p>

      <CheckoutForm
        defaultName={profile?.fullName ?? ""}
        defaultPhone={profile?.phone ?? ""}
        savedAddress={profile?.address ?? ""}
        savedLandmark={profile?.landmark ?? ""}
        savedCity={profile?.city ?? ""}
        savedPincode={profile?.pincode ?? ""}
      />
    </div>
  );
}
