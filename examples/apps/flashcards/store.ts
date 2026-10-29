// Decks and study progress, persisted with zustand + localStorage. Updates
// are written as mutations with the immer middleware.
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";
import { nanoid } from "nanoid";
import { extendStreak, newCard, schedule, today, type Card, type Deck, type Streak } from "./model";
import { seedDecks } from "./seed";

type DeckInput = Pick<Deck, "name" | "theme" | "symbol">;
type CardInput = Pick<Card, "front" | "back"> & { id?: string };

type Store = {
  decks: Deck[];
  streak: Streak;
  addDeck(deck: DeckInput): string;
  updateDeck(id: string, changes: Partial<DeckInput>): void;
  removeDeck(id: string): void;
  /** Adds a card, or edits the one with `card.id`. */
  saveCard(deckId: string, card: CardInput): void;
  removeCard(deckId: string, cardId: string): void;
  review(deckId: string, cardId: string, knewIt: boolean): void;
  resetProgress(deckId: string): void;
};

export const useFlashcards = create<Store>()(
  persist(
    immer((set) => {
      const update = (deckId: string, fn: (deck: Deck) => void) =>
        set((state) => {
          const deck = state.decks.find((d) => d.id === deckId);
          if (deck) fn(deck);
        });

      return {
        decks: seedDecks(),
        streak: { days: 0, lastStudied: null },

        addDeck: (input) => {
          const id = nanoid();
          set((state) => {
            state.decks.unshift({ ...input, id, cards: [] });
          });
          return id;
        },
        updateDeck: (id, changes) => update(id, (deck) => Object.assign(deck, changes)),
        removeDeck: (id) =>
          set((state) => {
            state.decks = state.decks.filter((d) => d.id !== id);
          }),

        saveCard: (deckId, { id, front, back }) =>
          update(deckId, (deck) => {
            const card = deck.cards.find((c) => c.id === id);
            if (card) Object.assign(card, { front, back });
            else deck.cards.push(newCard(front, back));
          }),
        removeCard: (deckId, cardId) =>
          update(deckId, (deck) => {
            deck.cards = deck.cards.filter((c) => c.id !== cardId);
          }),

        review: (deckId, cardId, knewIt) =>
          set((state) => {
            const card = state.decks.find((d) => d.id === deckId)?.cards.find((c) => c.id === cardId);
            if (card) Object.assign(card, schedule(card, knewIt));
            state.streak = extendStreak(state.streak);
          }),
        resetProgress: (deckId) =>
          update(deckId, (deck) => {
            for (const card of deck.cards) Object.assign(card, { box: 1, due: today() });
          }),
      };
    }),
    { name: "flashcards", version: 1, storage: createJSONStorage(() => localStorage) },
  ),
);

export const useDeck = (id: string) => useFlashcards((state) => state.decks.find((d) => d.id === id));
