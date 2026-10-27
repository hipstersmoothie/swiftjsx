// What survives a relaunch: liked songs, recent searches, recently played and
// the volume, in zustand + localStorage.
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { Track } from "./api";

type Library = {
  liked: Track[];
  recentSearches: string[];
  recentlyPlayed: Track[];
  volume: number;
  toggleLike(track: Track): void;
  addSearch(term: string): void;
  removeSearch(term: string): void;
  clearSearches(): void;
  addPlayed(track: Track): void;
  setVolume(volume: number): void;
};

export const useLibrary = create<Library>()(
  persist(
    (set) => ({
      liked: [],
      recentSearches: [],
      recentlyPlayed: [],
      volume: 1,
      toggleLike: (track) =>
        set(({ liked }) => ({
          liked: liked.some((t) => t.id === track.id) ? liked.filter((t) => t.id !== track.id) : [track, ...liked],
        })),
      addSearch: (term) => {
        const clean = term.trim();
        if (!clean) return;
        set(({ recentSearches }) => ({
          recentSearches: [clean, ...recentSearches.filter((s) => s.toLowerCase() !== clean.toLowerCase())].slice(0, 12),
        }));
      },
      removeSearch: (term) => set(({ recentSearches }) => ({ recentSearches: recentSearches.filter((s) => s !== term) })),
      clearSearches: () => set({ recentSearches: [] }),
      addPlayed: (track) =>
        set(({ recentlyPlayed }) => ({ recentlyPlayed: [track, ...recentlyPlayed.filter((t) => t.id !== track.id)].slice(0, 30) })),
      setVolume: (volume) => set({ volume }),
    }),
    { name: "music-library", storage: createJSONStorage(() => localStorage) },
  ),
);

export const useIsLiked = (id: number | undefined) => useLibrary((s) => id !== undefined && s.liked.some((t) => t.id === id));
