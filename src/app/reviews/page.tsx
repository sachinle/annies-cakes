import type { Metadata } from "next";
import { PlaceholderPage } from "@/components/PlaceholderPage";

export const metadata: Metadata = {
  alternates: { canonical: "/reviews" },
  title: "Reviews",
  description: "What customers say about their cakes.",
};

export default function ReviewsPage() {
  return (
    <PlaceholderPage
      title="Reviews"
      body="Verified customer reviews will show up here once the ordering system is live — only customers who've actually completed an order can leave one."
    />
  );
}
