// Centralized, non-secret business configuration. Read from env so the
// phone number / address / review link never need to be hunted down and
// edited in a dozen components — see spec §42.
//
// Real values go in .env.local (see .env.example). Placeholders below are
// obviously fake so nothing real accidentally ships if the env var is unset.

export const siteConfig = {
  name: "Annie's Homemade Cakes",
  shortName: "Annie's Cakes",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.example-annies-cakes.com",

  phone: process.env.NEXT_PUBLIC_BUSINESS_PHONE ?? "+91 00000 00000",
  whatsapp: process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "910000000000",
  email: process.env.NEXT_PUBLIC_BUSINESS_EMAIL ?? "hello@example.com",

  address: {
    line1: process.env.NEXT_PUBLIC_ADDRESS_LINE1 ?? "Add your address in .env.local",
    city: process.env.NEXT_PUBLIC_ADDRESS_CITY ?? "",
    state: process.env.NEXT_PUBLIC_ADDRESS_STATE ?? "",
    pincode: process.env.NEXT_PUBLIC_ADDRESS_PINCODE ?? "",
  },

  googleMapsUrl: process.env.NEXT_PUBLIC_GOOGLE_MAPS_URL ?? "",
  googleReviewUrl: process.env.NEXT_PUBLIC_GOOGLE_REVIEW_URL ?? "",

  social: {
    instagram: process.env.NEXT_PUBLIC_INSTAGRAM_URL ?? "",
    facebook: process.env.NEXT_PUBLIC_FACEBOOK_URL ?? "",
  },

  // Real, business-provided numbers only — never fabricate these.
  stats: {
    ordersDelivered: "1000+",
    happyCustomers: "200+",
  },
} as const;

export function whatsappLink(message?: string) {
  const base = `https://wa.me/${siteConfig.whatsapp}`;
  return message ? `${base}?text=${encodeURIComponent(message)}` : base;
}

// tel: links must not contain spaces/formatting — only digits and a
// leading +, or some mobile dialers silently fail to parse them.
export function telHref(phone: string) {
  return `tel:${phone.replace(/[^\d+]/g, "")}`;
}
