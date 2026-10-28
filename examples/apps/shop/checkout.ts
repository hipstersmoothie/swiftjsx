// The checkout form: input masks (card number, expiry, postal code), card
// brands, Luhn, and the zod schema that validates the whole thing.
import { z } from "zod";
import { addDays, startOfDay } from "date-fns";

export type CardBrand = { name: string; icon: string; lengths: number[]; cvc: number; groups: number[] };

const brands: { test: RegExp; brand: CardBrand }[] = [
  { test: /^3[47]/, brand: { name: "American Express", icon: "creditcard.fill", lengths: [15], cvc: 4, groups: [4, 6, 5] } },
  { test: /^4/, brand: { name: "Visa", icon: "creditcard.fill", lengths: [13, 16, 19], cvc: 3, groups: [4, 4, 4, 4, 3] } },
  { test: /^(5[1-5]|2[2-7])/, brand: { name: "Mastercard", icon: "creditcard.fill", lengths: [16], cvc: 3, groups: [4, 4, 4, 4] } },
  { test: /^6(011|5)/, brand: { name: "Discover", icon: "creditcard.fill", lengths: [16, 19], cvc: 3, groups: [4, 4, 4, 4, 3] } },
];
const unknownBrand: CardBrand = { name: "Card", icon: "creditcard", lengths: [16], cvc: 3, groups: [4, 4, 4, 4, 3] };

export const cardBrand = (digits: string): CardBrand => brands.find((b) => b.test.test(digits))?.brand ?? unknownBrand;

const digitsOnly = (s: string) => s.replace(/\D/g, "");

/** "4242424242424242" → "4242 4242 4242 4242"; Amex groups 4-6-5. Extra digits are dropped. */
export function formatCardNumber(input: string): string {
  const digits = digitsOnly(input);
  const brand = cardBrand(digits);
  const max = Math.max(...brand.lengths);
  const kept = digits.slice(0, max);
  const parts: string[] = [];
  let at = 0;
  for (const size of brand.groups) {
    if (at >= kept.length) break;
    parts.push(kept.slice(at, at + size));
    at += size;
  }
  return parts.join(" ");
}

/**
 * MM/YY as you type: "4" → "04/", "1" waits (could be 10–12), "13" → "01/3".
 * The slash is added after the month, but not while erasing (or backspace
 * could never get past it).
 */
export function formatExpiry(input: string, previous: string): string {
  let digits = digitsOnly(input).slice(0, 4);
  const erasing = input.length < previous.length;
  if (digits.length === 1 && Number(digits) > 1) digits = `0${digits}`;
  if (digits.length >= 2 && Number(digits.slice(0, 2)) > 12) digits = `0${digits[0]}${digits.slice(1)}`.slice(0, 4);
  if (digits.length < 2) return digits;
  if (digits.length === 2) return erasing ? digits : `${digits}/`;
  return `${digits.slice(0, 2)}/${digits.slice(2)}`;
}

export const formatPostalCode = (input: string, country: string) =>
  country === "CA"
    ? input
        .toUpperCase()
        .replace(/[^A-Z0-9]/g, "")
        .slice(0, 6)
        .replace(/^(.{3})(.+)$/, "$1 $2")
    : input.replace(/[^\d-]/g, "").slice(0, 10);

/** The Luhn checksum every card number carries in its last digit. */
export function luhn(digits: string): boolean {
  let sum = 0;
  for (let i = 0; i < digits.length; i++) {
    let d = Number(digits[digits.length - 1 - i]);
    if (i % 2 === 1) {
      d *= 2;
      if (d > 9) d -= 9;
    }
    sum += d;
  }
  return digits.length > 0 && sum % 10 === 0;
}

export const countries = [
  { value: "US", label: "United States" },
  { value: "CA", label: "Canada" },
];

export const regions: Record<string, { value: string; label: string }[]> = {
  US: "AL AK AZ AR CA CO CT DE DC FL GA HI ID IL IN IA KS KY LA ME MD MA MI MN MS MO MT NE NV NH NJ NM NY NC ND OH OK OR PA RI SC SD TN TX UT VT VA WA WV WI WY"
    .split(" ")
    .map((s) => ({ value: s, label: s })),
  CA: "AB BC MB NB NL NS NT NU ON PE QC SK YT".split(" ").map((s) => ({ value: s, label: s })),
};

/** Standard takes at least three days, express one; either can be scheduled up to a month out. */
export const earliestDelivery = (speed: "standard" | "express", now = new Date()) => startOfDay(addDays(now, speed === "express" ? 1 : 3));
export const latestDelivery = (now = new Date()) => startOfDay(addDays(now, 30));

export type CheckoutForm = {
  email: string;
  name: string;
  street: string;
  apartment: string;
  city: string;
  region: string;
  postalCode: string;
  country: string;
  phone: string;
  deliveryDate: Date;
  speed: "standard" | "express";
  cardNumber: string;
  expiry: string;
  cvc: string;
  cardName: string;
  saveCard: boolean;
};

export type Field = keyof CheckoutForm;

const required = (label: string) => z.string().trim().min(1, `${label} is required`);

export const CheckoutSchema = z
  .object({
    email: required("Email").pipe(z.email("Enter a valid email")),
    name: required("Full name").refine((s) => s.trim().includes(" "), "Enter your first and last name"),
    street: required("Street address").min(5, "That address looks too short"),
    apartment: z.string(),
    city: required("City"),
    region: required("State"),
    postalCode: z.string().trim(),
    country: z.enum(["US", "CA"]),
    phone: z.string().refine((s) => s === "" || s.replace(/\D/g, "").length >= 10, "Enter a 10-digit phone number"),
    deliveryDate: z.date(),
    speed: z.enum(["standard", "express"]),
    cardNumber: required("Card number")
      .transform(digitsOnly)
      .refine((d) => cardBrand(d).lengths.includes(d.length), "Card number is incomplete")
      .refine(luhn, "That card number isn't valid"),
    expiry: required("Expiry").regex(/^\d{2}\/\d{2}$/, "Use MM/YY"),
    cvc: required("Security code").regex(/^\d+$/, "Digits only"),
    cardName: required("Name on card"),
    saveCard: z.boolean(),
  })
  .superRefine((form, ctx) => {
    const postal = form.country === "CA" ? /^[A-Z]\d[A-Z] \d[A-Z]\d$/ : /^\d{5}(-\d{4})?$/;
    if (!postal.test(form.postalCode)) {
      ctx.addIssue({ code: "custom", path: ["postalCode"], message: form.country === "CA" ? "Use A1A 1A1" : "Use a 5-digit ZIP code" });
    }
    const [mm, yy] = form.expiry.split("/").map(Number);
    if (mm && (mm < 1 || mm > 12)) ctx.addIssue({ code: "custom", path: ["expiry"], message: "Month must be 01–12" });
    else if (mm && yy !== undefined) {
      const now = new Date();
      const expires = new Date(2000 + yy, mm, 1); // first day of the month after
      if (expires <= now) ctx.addIssue({ code: "custom", path: ["expiry"], message: "This card has expired" });
    }
    const brand = cardBrand(form.cardNumber);
    if (form.cvc && form.cvc.length !== brand.cvc) {
      ctx.addIssue({ code: "custom", path: ["cvc"], message: `${brand.name} codes have ${brand.cvc} digits` });
    }
    const day = startOfDay(form.deliveryDate);
    if (day < earliestDelivery(form.speed)) {
      ctx.addIssue({
        code: "custom",
        path: ["deliveryDate"],
        message:
          form.speed === "express" ? "Express arrives tomorrow at the earliest" : "Standard takes at least 3 days; pick a later day or Express",
      });
    } else if (day > latestDelivery()) {
      ctx.addIssue({ code: "custom", path: ["deliveryDate"], message: "Deliveries can be scheduled up to 30 days out" });
    }
  });

/** First error per field. */
export function validateCheckout(form: CheckoutForm): Partial<Record<Field, string>> {
  const result = CheckoutSchema.safeParse(form);
  if (result.success) return {};
  const errors: Partial<Record<Field, string>> = {};
  for (const issue of result.error.issues) {
    const field = issue.path[0] as Field | undefined;
    if (field && !errors[field]) errors[field] = issue.message;
  }
  return errors;
}

/** For the summary: "•••• 4242". */
export const maskedCard = (number: string) => {
  const digits = digitsOnly(number);
  return digits.length >= 4 ? `•••• ${digits.slice(-4)}` : "";
};

export const formatPhone = (input: string) => {
  const d = digitsOnly(input).slice(0, 10);
  if (d.length < 4) return d;
  if (d.length < 7) return `(${d.slice(0, 3)}) ${d.slice(3)}`;
  return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`;
};
