// Order request validation.
//
// Deliberately plain functions with no server-only import, so the same
// rules run in the browser (fast feedback) and again on the server
// (the one that actually matters). Client-side validation is a
// convenience; it can be bypassed entirely by posting directly.

// Flavour and egg preference used to be asked here. They were removed:
// the catalogue is already listed flavour-by-flavour, so the customer
// has chosen the flavour by choosing the cake, and asking again only
// created a chance for the two answers to disagree.

export const TIME_SLOTS = [
  "Morning (9am - 12pm)",
  "Afternoon (12pm - 4pm)",
  "Evening (4pm - 8pm)",
] as const;

export const MAX_QUANTITY = 20;
export const MAX_MESSAGE_LENGTH = 60;
export const MAX_NOTES_LENGTH = 500;

/** Cakes are baked to order, so same-day requests aren't realistic. */
export const MIN_LEAD_DAYS = 1;

export type OrderInput = {
  variantLabel: string;
  quantity: number;
  colour: string;
  cakeMessage: string;
  specialInstructions: string;
  fulfillmentType: "pickup" | "delivery";
  address: string;
  landmark: string;
  city: string;
  pincode: string;
  latitude: number | null;
  longitude: number | null;
  preferredDate: string;
  preferredTime: string;
  contactName: string;
  contactPhone: string;
};

export type FieldErrors = Partial<Record<keyof OrderInput, string>>;

const PHONE_RE = /^[+]?[\d][\d\s-]{7,19}$/;
const PINCODE_RE = /^\d{6}$/;

/** Earliest date a customer may pick, as YYYY-MM-DD. */
export function earliestOrderDate(now = new Date()): string {
  const d = new Date(now);
  d.setDate(d.getDate() + MIN_LEAD_DAYS);
  return d.toISOString().slice(0, 10);
}

export function validateOrder(input: OrderInput): FieldErrors {
  const errors: FieldErrors = {};

  if (!Number.isInteger(input.quantity) || input.quantity < 1) {
    errors.quantity = "Choose at least one.";
  } else if (input.quantity > MAX_QUANTITY) {
    errors.quantity = `For more than ${MAX_QUANTITY}, please message us directly.`;
  }

  if (input.cakeMessage.length > MAX_MESSAGE_LENGTH) {
    errors.cakeMessage = `Keep it under ${MAX_MESSAGE_LENGTH} characters so it fits on the cake.`;
  }

  if (input.specialInstructions.length > MAX_NOTES_LENGTH) {
    errors.specialInstructions = "That's a bit long — please shorten it.";
  }

  if (!input.contactName.trim() || input.contactName.trim().length < 2) {
    errors.contactName = "Please tell us your name.";
  }

  if (!PHONE_RE.test(input.contactPhone.trim())) {
    errors.contactPhone = "Please enter a phone number we can reach you on.";
  }

  if (!input.preferredDate) {
    errors.preferredDate = "When do you need it?";
  } else if (input.preferredDate < earliestOrderDate()) {
    errors.preferredDate = "Cakes are baked to order — please allow at least a day.";
  }

  if (input.fulfillmentType === "delivery") {
    // Coordinates are an acceptable substitute for a typed address —
    // a dropped pin is more useful for delivery than a street name.
    const hasPin = input.latitude !== null && input.longitude !== null;
    if (!input.address.trim() && !hasPin) {
      errors.address = "Add an address, or share your location.";
    }
    // Delivery requires a pincode we actually serve. The server checks
    // it against the list again before saving — the browser's answer
    // is only there to fail fast.
    if (!PINCODE_RE.test(input.pincode.trim())) {
      errors.pincode = "Enter your 6-digit pincode so we can check delivery.";
    }
  }

  return errors;
}

export function hasErrors(errors: FieldErrors): boolean {
  return Object.keys(errors).length > 0;
}

export function formatMoney(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}
