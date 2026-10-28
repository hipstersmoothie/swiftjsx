// The cart, the wishlist and past orders, persisted with zustand + localStorage.
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { produce } from "immer";
import { nanoid } from "nanoid";
import type { Product } from "./api";
import { salePrice } from "./api";
import { toCents, variantSurcharge, type Cents } from "./format";

export type CartLine = {
  /** Product id plus the chosen variant: the same shirt in M and L are two lines. */
  key: string;
  productId: number;
  title: string;
  brand?: string;
  thumbnail: string;
  size?: string;
  color?: string;
  unitPrice: Cents;
  /** Before the discount, for the strikethrough. */
  listPrice: Cents;
  quantity: number;
  stock: number;
};

export type Order = {
  id: string;
  placedAt: number;
  deliveryDate: number;
  shippingName: string;
  city: string;
  lines: CartLine[];
  total: Cents;
};

type State = {
  lines: CartLine[];
  promo: string | null;
  wishlist: Product[];
  orders: Order[];
};

type Actions = {
  add(product: Product, options: { quantity: number; size?: string; color?: string }): void;
  setQuantity(key: string, quantity: number): void;
  remove(keys: string[]): void;
  applyPromo(code: string | null): void;
  toggleWishlist(product: Product): void;
  removeFromWishlist(ids: number[]): void;
  /** Moves a cart line to the wishlist ("Save for later"). */
  saveForLater(key: string, product: Product | undefined): void;
  placeOrder(details: { deliveryDate: number; shippingName: string; city: string; total: Cents }): Order;
};

export const MAX_PER_LINE = 10;

export const useShop = create<State & Actions>()(
  persist(
    (set, get) => ({
      lines: [],
      promo: null,
      wishlist: [],
      orders: [],

      add: (product, { quantity, size, color }) =>
        set(
          produce((s: State) => {
            const key = [product.id, size ?? "", color ?? ""].join("|");
            const existing = s.lines.find((l) => l.key === key);
            const limit = Math.min(MAX_PER_LINE, product.stock);
            if (existing) {
              existing.quantity = Math.min(limit, existing.quantity + quantity);
              return;
            }
            const surcharge = variantSurcharge(size);
            s.lines.unshift({
              key,
              productId: product.id,
              title: product.title,
              brand: product.brand,
              thumbnail: product.thumbnail,
              size,
              color,
              unitPrice: salePrice(product) + surcharge,
              listPrice: toCents(product.price) + surcharge,
              quantity: Math.min(limit, quantity),
              stock: product.stock,
            });
          }),
        ),

      setQuantity: (key, quantity) =>
        set(
          produce((s: State) => {
            const line = s.lines.find((l) => l.key === key);
            if (!line) return;
            if (quantity <= 0) s.lines = s.lines.filter((l) => l.key !== key);
            else line.quantity = Math.min(quantity, MAX_PER_LINE, line.stock);
          }),
        ),

      remove: (keys) => set((s) => ({ lines: s.lines.filter((l) => !keys.includes(l.key)) })),

      applyPromo: (promo) => set({ promo }),

      toggleWishlist: (product) =>
        set((s) => ({
          wishlist: s.wishlist.some((p) => p.id === product.id)
            ? s.wishlist.filter((p) => p.id !== product.id)
            : [product, ...s.wishlist],
        })),

      removeFromWishlist: (ids) => set((s) => ({ wishlist: s.wishlist.filter((p) => !ids.includes(p.id)) })),

      saveForLater: (key, product) =>
        set((s) => ({
          lines: s.lines.filter((l) => l.key !== key),
          wishlist: product && !s.wishlist.some((p) => p.id === product.id) ? [product, ...s.wishlist] : s.wishlist,
        })),

      placeOrder: (details) => {
        const order: Order = {
          id: nanoid(8).toUpperCase().replace(/[-_]/g, "X"),
          placedAt: Date.now(),
          lines: get().lines,
          ...details,
        };
        set((s) => ({ orders: [order, ...s.orders].slice(0, 20), lines: [], promo: null }));
        return order;
      },
    }),
    {
      name: "shop-v1",
      storage: createJSONStorage(() => localStorage),
      partialize: ({ lines, promo, wishlist, orders }) => ({ lines, promo, wishlist, orders }),
    },
  ),
);

/** Items in the cart (for the tab badge). Selects a number, so no re-render loops. */
export const useCartCount = () => useShop((s) => s.lines.reduce((n, l) => n + l.quantity, 0));

export const useIsWishlisted = (id: number) => useShop((s) => s.wishlist.some((p) => p.id === id));
