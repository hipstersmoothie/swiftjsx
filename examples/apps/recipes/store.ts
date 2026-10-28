// Favorites, the shopping list, servings per recipe and recent searches,
// persisted with zustand + localStorage.
//
// Selectors return raw state (arrays/records straight from the store) and
// components derive from them: a zustand v5 selector that builds a new array
// each time loops forever.
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { Recipe, RecipeSummary } from "./api";
import { summaryOf } from "./api";
import { ingredientKey as keyOf } from "./quantity";

/** TheMealDB has no servings; its recipes are mostly for about four. */
export const BASE_SERVINGS = 4;

export type ListRecipe = RecipeSummary & { servings: number; ingredients: { name: string; measure: string }[] };

type State = {
  favorites: RecipeSummary[];
  /** Recipes whose ingredients are on the shopping list. */
  list: ListRecipe[];
  /** Ingredient keys (see `ingredientKey`) ticked off in the shop. */
  checked: Record<string, true>;
  /** Servings chosen on a recipe's page, by recipe id. */
  servings: Record<string, number>;
  recentSearches: string[];

  toggleFavorite(recipe: RecipeSummary): void;
  setServings(id: string, servings: number): void;
  addToList(recipe: Recipe, servings: number): void;
  removeFromList(id: string): void;
  setListServings(id: string, servings: number): void;
  toggleChecked(key: string): void;
  clearChecked(): void;
  uncheckAll(): void;
  clearList(): void;
  rememberSearch(term: string): void;
  forgetSearches(): void;
};

export const useRecipes = create<State>()(
  persist(
    (set) => ({
      favorites: [],
      list: [],
      checked: {},
      servings: {},
      recentSearches: [],

      toggleFavorite: (recipe) =>
        set(({ favorites }) => ({
          favorites: favorites.some((f) => f.id === recipe.id)
            ? favorites.filter((f) => f.id !== recipe.id)
            : [summaryOf(recipe), ...favorites],
        })),
      setServings: (id, servings) => set(({ servings: all }) => ({ servings: { ...all, [id]: servings } })),
      addToList: (recipe, servings) =>
        set(({ list }) => ({
          list: [
            { ...summaryOf(recipe), servings, ingredients: recipe.ingredients },
            ...list.filter((r) => r.id !== recipe.id),
          ],
        })),
      removeFromList: (id) => set(({ list }) => ({ list: list.filter((r) => r.id !== id) })),
      setListServings: (id, servings) =>
        set(({ list }) => ({ list: list.map((r) => (r.id === id ? { ...r, servings } : r)) })),
      toggleChecked: (key) =>
        set(({ checked }) => {
          const next = { ...checked };
          if (next[key]) delete next[key];
          else next[key] = true;
          return { checked: next };
        }),
      clearChecked: () =>
        set(({ list, checked }) => {
          // Drop ticked ingredients from every recipe, then recipes with nothing left.
          const keep = (name: string) => !checked[keyOf(name)];
          return {
            list: list.map((r) => ({ ...r, ingredients: r.ingredients.filter((i) => keep(i.name)) })).filter((r) => r.ingredients.length),
            checked: {},
          };
        }),
      uncheckAll: () => set({ checked: {} }),
      clearList: () => set({ list: [], checked: {} }),
      rememberSearch: (term) =>
        set(({ recentSearches }) => ({
          recentSearches: [term, ...recentSearches.filter((t) => t.toLowerCase() !== term.toLowerCase())].slice(0, 8),
        })),
      forgetSearches: () => set({ recentSearches: [] }),
    }),
    { name: "recipes-app", version: 1, storage: createJSONStorage(() => localStorage) },
  ),
);

export const useIsFavorite = (id: string) => useRecipes((s) => s.favorites.some((f) => f.id === id));
export const useServings = (id: string) => useRecipes((s) => s.servings[id] ?? BASE_SERVINGS);
export const useIsOnList = (id: string) => useRecipes((s) => s.list.some((r) => r.id === id));
