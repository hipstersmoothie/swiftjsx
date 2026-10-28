// Totals and promo codes.
import { z } from "zod";
import type { CartLine } from "./store";
import type { Cents } from "./format";
import { money } from "./format";

export const FREE_SHIPPING_OVER: Cents = 7500;
const SHIPPING: Cents = 699;
const EXPRESS: Cents = 1499;
export const TAX_RATE = 0.0825;

export type ShippingSpeed = "standard" | "express";

type Promo = { label: string; minimum?: Cents; percentOff?: number; amountOff?: Cents; freeShipping?: boolean };

const promos: Record<string, Promo> = {
  SAVE10: { label: "10% off everything", percentOff: 10 },
  WELCOME5: { label: "$5 off orders over $25", amountOff: 500, minimum: 2500 },
  FREESHIP: { label: "Free standard shipping", freeShipping: true },
  JSX20: { label: "20% off orders over $100", percentOff: 20, minimum: 10000 },
};

/** Promo codes: the format first (instant feedback), then whether it exists. */
const PromoCode = z
  .string()
  .trim()
  .toUpperCase()
  .min(1, "Enter a code")
  .regex(/^[A-Z0-9]+$/, "Codes are letters and numbers only")
  .min(4, "Codes are at least 4 characters")
  .max(12, "Codes are at most 12 characters")
  .refine((code) => code in promos, "That code isn't valid");

export type PromoResult = { ok: true; code: string; label: string } | { ok: false; error: string };

export function checkPromo(input: string, subtotal: Cents): PromoResult {
  const parsed = PromoCode.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid code" };
  const promo = promos[parsed.data];
  if (promo.minimum && subtotal < promo.minimum) {
    return { ok: false, error: `${parsed.data} needs a subtotal of ${money(promo.minimum)}` };
  }
  return { ok: true, code: parsed.data, label: promo.label };
}

export const promoHint = "Try SAVE10, WELCOME5, FREESHIP or JSX20";

export type Totals = {
  count: number;
  subtotal: Cents;
  /** Savings from product discounts (list price − sale price). */
  savings: Cents;
  promoDiscount: Cents;
  promo: { code: string; label: string } | null;
  /** Why an applied code no longer applies (the cart shrank under its minimum). */
  promoProblem: string | null;
  shipping: Cents;
  tax: Cents;
  total: Cents;
  /** Cents to go before shipping is free (0 once it is). */
  toFreeShipping: Cents;
};

export function totals(lines: CartLine[], promoCode: string | null, speed: ShippingSpeed = "standard"): Totals {
  const count = lines.reduce((n, l) => n + l.quantity, 0);
  const subtotal = lines.reduce((sum, l) => sum + l.unitPrice * l.quantity, 0);
  const savings = lines.reduce((sum, l) => sum + (l.listPrice - l.unitPrice) * l.quantity, 0);

  const check = promoCode ? checkPromo(promoCode, subtotal) : null;
  const promo = check?.ok ? promos[check.code] : null;
  const promoDiscount = promo
    ? Math.min(subtotal, promo.amountOff ?? Math.round((subtotal * (promo.percentOff ?? 0)) / 100))
    : 0;

  const freeStandard = subtotal >= FREE_SHIPPING_OVER || !!promo?.freeShipping;
  const shipping = count === 0 ? 0 : speed === "express" ? EXPRESS : freeStandard ? 0 : SHIPPING;
  const taxable = subtotal - promoDiscount;
  const tax = Math.round(taxable * TAX_RATE);

  return {
    count,
    subtotal,
    savings,
    promoDiscount,
    promo: check?.ok ? { code: check.code, label: check.label } : null,
    promoProblem: check && !check.ok ? check.error : null,
    shipping,
    tax,
    total: taxable + shipping + tax,
    toFreeShipping: Math.max(0, FREE_SHIPPING_OVER - subtotal),
  };
}
