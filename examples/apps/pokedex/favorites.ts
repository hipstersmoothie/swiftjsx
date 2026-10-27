// Favorite Pokémon, persisted with zustand + localStorage.
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { Entry } from "./api";

type Favorites = { entries: Entry[]; toggle(entry: Entry): void };

export const useFavorites = create<Favorites>()(
  persist(
    (set) => ({
      entries: [],
      toggle: (entry) =>
        set(({ entries }) => ({
          entries: entries.some((e) => e.id === entry.id)
            ? entries.filter((e) => e.id !== entry.id)
            : [...entries, { id: entry.id, name: entry.name }].sort((a, b) => a.id - b.id),
        })),
    }),
    { name: "pokedex-favorites", storage: createJSONStorage(() => localStorage) },
  ),
);

export const useIsFavorite = (id: number) => useFavorites((state) => state.entries.some((e) => e.id === id));
