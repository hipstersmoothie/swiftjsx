// Cards, decks, and a Leitner-box schedule: a card you know moves up a box
// and comes back later; one you miss goes back to box 1, due today.
import { addDays, differenceInCalendarDays, startOfDay } from "date-fns";
import { nanoid } from "nanoid";
import type { ThemeName } from "./theme";

export type Box = 1 | 2 | 3 | 4 | 5;
/** `due` is the start of the day it's due, so "due" means "due today or earlier". */
export type Card = { id: string; front: string; back: string; box: Box; due: number };
export type Deck = { id: string; name: string; theme: ThemeName; symbol: string; cards: Card[] };
export type Streak = { days: number; lastStudied: number | null };

export const MAX_BOX: Box = 5;
/** Days until a card in each box is due again. */
const INTERVALS: Record<Box, number> = { 1: 0, 2: 1, 3: 3, 4: 7, 5: 14 };

export const today = (now = Date.now()) => startOfDay(now).getTime();

export function newCard(front: string, back: string, box: Box = 1, now = Date.now()): Card {
  return { id: nanoid(), front, back, box, due: startOfDay(addDays(now, INTERVALS[box])).getTime() };
}

export function schedule(card: Card, knewIt: boolean, now = Date.now()): Pick<Card, "box" | "due"> {
  const box = knewIt ? (Math.min(card.box + 1, MAX_BOX) as Box) : 1;
  return { box, due: startOfDay(addDays(now, INTERVALS[box])).getTime() };
}

export const isDue = (card: Card, now: number) => card.due <= now;
export const dueCards = (deck: Deck, now: number) => deck.cards.filter((card) => isDue(card, now));

/** "today", "tomorrow", "in 3 days"… */
export function dueIn(due: number, now: number): string {
  const days = differenceInCalendarDays(due, now);
  return days <= 0 ? "today" : days === 1 ? "tomorrow" : `in ${days} days`;
}

/** Studying today continues yesterday's streak, or starts a new one. */
export function extendStreak(streak: Streak, now = Date.now()): Streak {
  const gap = streak.lastStudied === null ? Infinity : differenceInCalendarDays(now, streak.lastStudied);
  if (gap === 0) return streak;
  return { days: gap === 1 ? streak.days + 1 : 1, lastStudied: now };
}

/** The streak as of `now`: it's broken once a whole day passes without studying. */
export const currentStreak = (streak: Streak, now: number) =>
  streak.lastStudied !== null && differenceInCalendarDays(now, streak.lastStudied) <= 1 ? streak.days : 0;

export function shuffle<T>(items: T[]): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/** "1 card", "3 cards". */
export const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? "" : "s"}`;

/** Longest run of correct answers. */
export const bestRun = (results: boolean[]) =>
  results.reduce(({ best, run }, knew) => (knew ? { best: Math.max(best, run + 1), run: run + 1 } : { best, run: 0 }), { best: 0, run: 0 }).best;
