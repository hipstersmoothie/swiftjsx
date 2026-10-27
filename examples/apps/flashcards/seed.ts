// The decks a new install starts with. Some capitals are already learned, so
// the home screen shows a mix of due and scheduled cards.
import { nanoid } from "nanoid";
import { newCard, type Box, type Deck } from "./model";
import type { ThemeName } from "./theme";

type SeedDeck = { name: string; theme: ThemeName; symbol: string; cards: [string, string][]; learned?: { count: number; box: Box } };

const decks: SeedDeck[] = [
  {
    name: "Spanish basics",
    theme: "orange",
    symbol: "character.book.closed.fill",
    cards: [
      ["Hello", "Hola"],
      ["Thank you", "Gracias"],
      ["Please", "Por favor"],
      ["Good morning", "Buenos días"],
      ["Goodbye", "Adiós"],
      ["See you later", "Hasta luego"],
      ["How are you?", "¿Cómo estás?"],
      ["I don't understand", "No entiendo"],
      ["Where is the bathroom?", "¿Dónde está el baño?"],
      ["The water", "El agua"],
      ["The cat", "El gato"],
      ["Cheers!", "¡Salud!"],
    ],
  },
  {
    name: "World capitals",
    theme: "teal",
    symbol: "globe.americas.fill",
    learned: { count: 5, box: 3 },
    cards: [
      ["France", "Paris"],
      ["Japan", "Tokyo"],
      ["Norway", "Oslo"],
      ["Egypt", "Cairo"],
      ["South Korea", "Seoul"],
      ["Australia", "Canberra"],
      ["Canada", "Ottawa"],
      ["Brazil", "Brasília"],
      ["Kenya", "Nairobi"],
      ["New Zealand", "Wellington"],
      ["Turkey", "Ankara"],
      ["Argentina", "Buenos Aires"],
    ],
  },
  {
    name: "JS trivia",
    theme: "purple",
    symbol: "curlybraces",
    cards: [
      ["typeof null", '"object"'],
      ["typeof NaN", '"number"'],
      ["[] + []", '"" (an empty string)'],
      ["0.1 + 0.2 === 0.3", "false (it's 0.30000000000000004)"],
      ['"5" * "2"', "10"],
      ["[1, 2, 3].at(-1)", "3"],
      ["[1, 2, 3].map(String)", '["1", "2", "3"]'],
      ["What does a ?? b return?", "b, but only when a is null or undefined"],
      ["When does Promise.all reject?", "As soon as any of its promises rejects"],
      ["Does Object.freeze freeze nested objects?", "No, it's shallow"],
      ["What is a closure?", "A function plus the variables it captured from where it was defined"],
      ["Which declaration is hoisted with its value: var, let, or function?", "function"],
    ],
  },
];

export const seedDecks = (): Deck[] =>
  decks.map(({ cards, learned, ...deck }) => ({
    ...deck,
    id: nanoid(),
    cards: cards.map(([front, back], i) => newCard(front, back, learned && i < learned.count ? learned.box : 1)),
  }));
