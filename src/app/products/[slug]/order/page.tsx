import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getProductBySlug } from "@/lib/products";
import { getUser } from "@/lib/supabase/server-auth";
import { getOrCreateProfile } from "@/lib/customer";
import { OrderForm } from "./OrderForm";

export const metadata: Metadata = {
  title: "Order",
  robots: { index: false }, // an order form has no business in search results
};

export default async function OrderPage(props: PageProps<"/products/[slug]/order">) {
  const { slug } = await props.params;

  const product = await getProductBySlug(slug);
  if (!product) notFound();

  // Authentication is required only at this point — browsing stays open.
  const user = await getUser();
  if (!user) {
    redirect(`/signin?next=${encodeURIComponent(`/products/${slug}/order`)}`);
  }

  // Pre-fill from the saved profile so returning customers don't retype.
  const profile = await getOrCreateProfile();

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6 sm:py-14">
      <nav aria-label="Breadcrumb" className="text-sm text-muted">
        <Link href="/products" className="hover:text-accent">Cakes</Link>
        <span className="mx-2">/</span>
        <Link href={`/products/${product.slug}`} className="hover:text-accent">
          {product.name}
        </Link>
        <span className="mx-2">/</span>
        <span className="text-ink-soft">Order</span>
      </nav>

      <h1 className="mt-5 text-3xl font-semibold sm:text-4xl">
        Order {product.name}
      </h1>
      <p className="mt-3 text-ink-soft">
        Tell us what you need. We&apos;ll confirm every detail with you before
        we start baking — nothing is charged now.
      </p>

      <div className="mt-8">
        <OrderForm
          product={product}
          defaultName={profile?.fullName ?? ""}
          defaultPhone={profile?.phone ?? ""}
        />
      </div>
    </div>
  );
}
