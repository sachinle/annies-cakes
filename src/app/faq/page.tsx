import type { Metadata } from "next";
import { PlaceholderPage } from "@/components/PlaceholderPage";

export const metadata: Metadata = {
  alternates: { canonical: "/faq" },
  title: "FAQ",
  description: "Answers to common questions about ordering.",
};

export default function FaqPage() {
  return (
    <PlaceholderPage
      title="FAQ"
      body="Answers to common questions (order timing, custom designs, delivery areas) are coming soon."
    />
  );
}
