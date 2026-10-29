// Money, numbers and the fake variants DummyJSON doesn't have.
//
// Money is kept in integer cents so a cart of 3 × $9.99 adds up to $29.97,
// not $29.969999999999995; it becomes dollars only to be shown.
import { format, type Color } from "swiftjsx";

export type Cents = number;

export const toCents = (dollars: number): Cents => Math.round(dollars * 100);

/** 1999 → "$19.99" (in the user's locale, in US dollars). */
export const money = (cents: Cents) => format.currency(cents / 100, "USD");

/** 12.48 → "12%". */
export const formatPercent = (value: number) => format.percent(value / 100);

/** "1 item", "3 items". */
export const plural = (n: number, one: string, many = `${one}s`) => format.count(n, { one: `# ${one}`, other: `# ${many}` });

/** "home-decoration" → "Home Decoration". */
export const titleCase = (slug: string) =>
  slug
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");

// MARK: Variants

export type ColorOption = { name: string; swatch: Color };

const palette: ColorOption[] = [
  { name: "Midnight", swatch: "#1c1c1e" },
  { name: "Silver", swatch: "#d1d1d6" },
  { name: "Ocean", swatch: "#2f6fde" },
  { name: "Sage", swatch: "#8aa58a" },
  { name: "Coral", swatch: "#ff6f61" },
  { name: "Sand", swatch: "#d8c3a5" },
  { name: "Plum", swatch: "#8e4585" },
];

const apparel = new Set(["mens-shirts", "tops", "womens-dresses"]);
const shoes = new Set(["mens-shoes", "womens-shoes"]);
const devices = new Set(["smartphones", "laptops", "tablets"]);

export type Variants = { sizeLabel: string; sizes: string[]; colors: ColorOption[] };

/** Sizes and colors for a product, made up from its category (stable per id). */
export function variantsFor(product: { id: number; category: string }): Variants {
  const sizes = apparel.has(product.category)
    ? ["XS", "S", "M", "L", "XL"]
    : shoes.has(product.category)
      ? ["7", "8", "9", "10", "11", "12"]
      : devices.has(product.category)
        ? ["128 GB", "256 GB", "512 GB"]
        : [];
  const sizeLabel = devices.has(product.category) ? "Storage" : "Size";
  const groceries = product.category === "groceries" || product.category === "beauty" || product.category === "skin-care";
  // Three or four colors, picked by id so they don't change between launches.
  const count = groceries ? 0 : 3 + (product.id % 2);
  const start = product.id % palette.length;
  const colors = Array.from({ length: count }, (_, i) => palette[(start + i * 2) % palette.length]);
  return { sizeLabel, sizes, colors };
}

/** Storage tiers cost more. */
export function variantSurcharge(size: string | undefined): Cents {
  if (size === "256 GB") return 10000;
  if (size === "512 GB") return 25000;
  return 0;
}
