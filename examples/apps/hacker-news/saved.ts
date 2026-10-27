// Saved stories, persisted with zustand + localStorage.
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { Story } from "./api";

type Saved = { stories: Story[]; toggle(story: Story): void };

export const useSaved = create<Saved>()(
  persist(
    (set) => ({
      stories: [],
      toggle: (story) =>
        set(({ stories }) => ({
          stories: stories.some((s) => s.id === story.id) ? stories.filter((s) => s.id !== story.id) : [story, ...stories],
        })),
    }),
    { name: "hacker-news-saved", storage: createJSONStorage(() => localStorage) },
  ),
);

export const useIsSaved = (id: string) => useSaved((state) => state.stories.some((s) => s.id === id));
