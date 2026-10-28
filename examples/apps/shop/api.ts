// DummyJSON (https://dummyjson.com): a free fake store API. Responses are
// checked with zod, which also drops the fields we don't use.
import { infiniteQueryOptions, queryOptions } from "@tanstack/react-query";
import { z } from "zod";
import { toCents, type Cents } from "./format";

const API = "https://dummyjson.com";
export const PAGE_SIZE = 30;

const Review = z.object({
  rating: z.number(),
  comment: z.string(),
  date: z.string(),
  reviewerName: z.string(),
});

export const Product = z.object({
  id: z.number(),
  title: z.string(),
  description: z.string(),
  category: z.string(),
  price: z.number(),
  discountPercentage: z.number().default(0),
  rating: z.number().default(0),
  stock: z.number().default(0),
  brand: z.string().optional(),
  thumbnail: z.string(),
  images: z.array(z.string()).default([]),
  reviews: z.array(Review).default([]),
  shippingInformation: z.string().optional(),
  returnPolicy: z.string().optional(),
  warrantyInformation: z.string().optional(),
});
export type Product = z.infer<typeof Product>;
export type Review = z.infer<typeof Review>;

const ProductPage = z.object({ products: z.array(Product), total: z.number(), skip: z.number(), limit: z.number() });
type ProductPage = z.infer<typeof ProductPage>;

const Category = z.object({ slug: z.string(), name: z.string() });
export type Category = z.infer<typeof Category>;

async function get<T>(path: string, schema: z.ZodType<T>, signal?: AbortSignal): Promise<T> {
  const response = await fetch(API + path, { signal });
  if (!response.ok) throw new Error(`DummyJSON: ${response.status} ${response.statusText}`);
  const parsed = schema.safeParse(await response.json());
  if (!parsed.success) throw new Error(`Unexpected response from ${path}: ${parsed.error.issues[0]?.message ?? "invalid"}`);
  return parsed.data;
}

const nextSkip = (page: ProductPage) => (page.skip + page.products.length < page.total ? page.skip + page.limit : undefined);

export const fetchProducts = (category: string | null, skip: number, signal?: AbortSignal) =>
  get(
    category ? `/products/category/${encodeURIComponent(category)}?limit=${PAGE_SIZE}&skip=${skip}` : `/products?limit=${PAGE_SIZE}&skip=${skip}`,
    ProductPage,
    signal,
  );

/** Every product, or one category's, a page at a time. */
export const productsQuery = (category: string | null) =>
  infiniteQueryOptions({
    queryKey: ["products", category ?? "all"],
    queryFn: ({ pageParam, signal }) => fetchProducts(category, pageParam, signal),
    initialPageParam: 0,
    getNextPageParam: nextSkip,
  });

/** The first page of a category (the "More in…" row). */
export const relatedQuery = (category: string) =>
  queryOptions({
    queryKey: ["related", category],
    queryFn: async ({ signal }) => (await fetchProducts(category, 0, signal)).products,
  });

/** The carousel: the biggest discounts. */
export const featuredQuery = queryOptions({
  queryKey: ["featured"],
  queryFn: async ({ signal }) => (await get(`/products?sortBy=discountPercentage&order=desc&limit=6`, ProductPage, signal)).products,
});

export const categoriesQuery = queryOptions({
  queryKey: ["categories"],
  queryFn: ({ signal }) => get("/products/categories", z.array(Category), signal),
  staleTime: Infinity,
});

export const searchQuery = (term: string) =>
  queryOptions({
    queryKey: ["search", term],
    queryFn: async ({ signal }) => {
      const page = await get(`/products/search?q=${encodeURIComponent(term)}&limit=${PAGE_SIZE}`, ProductPage, signal);
      return { products: page.products, total: page.total };
    },
    enabled: term.length > 0,
  });

/** One product (the grid already has it: pass it as `initialData`). */
export const productQuery = (id: number) =>
  queryOptions({
    queryKey: ["product", id],
    queryFn: ({ signal }) => get(`/products/${id}`, Product, signal),
  });

// MARK: Prices

/** What it costs after the discount, in cents. */
export const salePrice = (p: { price: number; discountPercentage: number }): Cents => toCents(p.price * (1 - p.discountPercentage / 100));

/** Shown as "-12%" only when it's worth mentioning. */
export const hasDiscount = (p: { discountPercentage: number }) => p.discountPercentage >= 1;

export type StockLevel = { label: string; color: "green" | "orange" | "red"; icon: string; available: boolean };

export function stockLevel(stock: number): StockLevel {
  if (stock <= 0) return { label: "Out of stock", color: "red", icon: "xmark.circle.fill", available: false };
  if (stock < 10) return { label: `Only ${stock} left`, color: "orange", icon: "exclamationmark.circle.fill", available: true };
  return { label: "In stock", color: "green", icon: "checkmark.circle.fill", available: true };
}
