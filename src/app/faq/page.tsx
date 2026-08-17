import type { Metadata } from "next";
import { PlaceholderPage } from "@/components/PlaceholderPage";

export const metadata: Metadata = {
  title: "FAQ",
  description: "Answers to common questions about ordering.",
};

export default function FaqPage() {
  return (
    <PlaceholderPage
      title="FAQ"
      body="Answers to common questions (order timing, eggless options, delivery) are coming soon."
    />
  );
}
