// Boards, columns and cards: the data model, sample data and pure helpers.
import { addDays, differenceInCalendarDays, format, startOfToday } from "date-fns";
import { nanoid } from "nanoid";
import type { Color } from "swiftjsx";

export type Member = { id: string; name: string; color: Color };
export type CardLabel = { id: string; name: string; color: Color };
export type ChecklistItem = { id: string; text: string; done: boolean };

export type Card = {
  id: string;
  columnId: string;
  title: string;
  description: string;
  labelIds: string[];
  assigneeId: string | null;
  /** Start of the day it's due (ms), or null. */
  due: number | null;
  checklist: ChecklistItem[];
  archived: boolean;
  createdAt: number;
};

export type Column = {
  id: string;
  name: string;
  color: Color;
  /** Order of the column's (unarchived) cards. */
  cardIds: string[];
  archived: boolean;
};

export type Board = {
  id: string;
  name: string;
  color: BoardColor;
  symbol: string;
  labels: CardLabel[];
  /** In display order. */
  columns: Column[];
  cards: Record<string, Card>;
  createdAt: number;
};

// MARK: Palette

export const boardColors = {
  indigo: { name: "Indigo", tint: "indigo", gradient: ["#5E5CE6", "#8E8CFF"] },
  blue: { name: "Blue", tint: "blue", gradient: ["#0A84FF", "#5AC8FA"] },
  teal: { name: "Teal", tint: "teal", gradient: ["#30B0C7", "#64D2FF"] },
  green: { name: "Green", tint: "green", gradient: ["#30D158", "#A4E786"] },
  orange: { name: "Orange", tint: "orange", gradient: ["#FF9F0A", "#FFD60A"] },
  pink: { name: "Pink", tint: "pink", gradient: ["#FF375F", "#FF8FAB"] },
  purple: { name: "Purple", tint: "purple", gradient: ["#BF5AF2", "#E0A3FF"] },
  gray: { name: "Graphite", tint: "gray", gradient: ["#636366", "#AEAEB2"] },
} satisfies Record<string, { name: string; tint: Color; gradient: Color[] }>;

export type BoardColor = keyof typeof boardColors;
export const boardColorNames = Object.keys(boardColors) as BoardColor[];
export const boardSymbols = ["square.grid.3x2.fill", "rocket.fill", "paintbrush.pointed.fill", "hammer.fill", "house.fill", "graduationcap.fill", "cart.fill", "sparkles"];

/** Colors for columns and labels. */
export const swatches: Color[] = ["gray", "blue", "indigo", "purple", "pink", "red", "orange", "yellow", "green", "teal"];

export const members: Member[] = [
  { id: "ava", name: "Ava Chen", color: "pink" },
  { id: "ben", name: "Ben Okafor", color: "blue" },
  { id: "chloe", name: "Chloé Martin", color: "purple" },
  { id: "diego", name: "Diego Ruiz", color: "orange" },
  { id: "emma", name: "Emma Larsen", color: "teal" },
];

export const memberById = (id: string | null) => members.find((m) => m.id === id);

export function defaultLabels(): CardLabel[] {
  return [
    { id: "bug", name: "Bug", color: "red" },
    { id: "feature", name: "Feature", color: "blue" },
    { id: "design", name: "Design", color: "purple" },
    { id: "urgent", name: "Urgent", color: "orange" },
    { id: "research", name: "Research", color: "teal" },
    { id: "chore", name: "Chore", color: "gray" },
  ];
}

// MARK: Constructors

export function newCard(columnId: string, title: string, extra: Partial<Card> = {}): Card {
  return {
    id: nanoid(10),
    columnId,
    title,
    description: "",
    labelIds: [],
    assigneeId: null,
    due: null,
    checklist: [],
    archived: false,
    createdAt: Date.now(),
    ...extra,
  };
}

export function newColumn(name: string, color: Color): Column {
  return { id: nanoid(8), name, color, cardIds: [], archived: false };
}

export function newBoard(name: string, color: BoardColor, symbol: string, columnNames = ["To do", "In progress", "Review", "Done"]): Board {
  const columnColors: Color[] = ["gray", "blue", "orange", "green", "purple"];
  return {
    id: nanoid(8),
    name,
    color,
    symbol,
    labels: defaultLabels(),
    columns: columnNames.map((n, i) => newColumn(n, columnColors[i % columnColors.length])),
    cards: {},
    createdAt: Date.now(),
  };
}

export const checklist = (...items: [string, boolean][]): ChecklistItem[] =>
  items.map(([text, done]) => ({ id: nanoid(6), text, done }));

/** Adds cards to a board's columns, in order. */
function fill(board: Board, columns: Record<number, (Partial<Card> & { title: string })[]>) {
  board.columns.forEach((column, i) => {
    for (const { title, ...extra } of columns[i] ?? []) {
      const card = newCard(column.id, title, extra);
      board.cards[card.id] = card;
      column.cardIds.push(card.id);
    }
  });
  return board;
}

// MARK: Sample data (first launch)

export function seedBoards(): Board[] {
  const day = (n: number) => addDays(startOfToday(), n).getTime();

  const launch = fill(newBoard("Product Launch", "indigo", "rocket.fill"), {
    0: [
      { title: "Write launch blog post", labelIds: ["feature"], assigneeId: "chloe", due: day(6), description: "Announce the board view, keyboard shortcuts and the new API." },
      { title: "Pricing page copy", labelIds: ["design", "urgent"], assigneeId: "ava", due: day(2) },
      { title: "Fix crash when a board has no columns", labelIds: ["bug", "urgent"], assigneeId: "ben", due: day(-1) },
      { title: "Benchmark sync with 10k cards", labelIds: ["research"], checklist: checklist(["Seed a large board", false], ["Profile on device", false]) },
      { title: "Update screenshots", labelIds: ["chore"], assigneeId: "emma" },
    ],
    1: [
      {
        title: "Drag and drop between columns",
        labelIds: ["feature"],
        assigneeId: "diego",
        due: day(3),
        description: "Long-press a card to pick it up, then drag. Auto-scroll near the edges.",
        checklist: checklist(["Pick up", true], ["Reorder in a column", true], ["Move across columns", false], ["Auto-scroll", false]),
      },
      { title: "Onboarding illustrations", labelIds: ["design"], assigneeId: "chloe", checklist: checklist(["Sketches", true], ["Final art", false]) },
      { title: "Email digest", labelIds: ["feature"], assigneeId: "ben", due: day(9) },
    ],
    2: [
      { title: "Accessibility audit", labelIds: ["research", "chore"], assigneeId: "emma", checklist: checklist(["VoiceOver", true], ["Dynamic Type", true], ["Contrast", true], ["Reduce Motion", false]) },
      { title: "Dark mode polish", labelIds: ["design"], assigneeId: "ava", due: day(1) },
    ],
    3: [
      { title: "Set up the beta program", labelIds: ["chore"], assigneeId: "diego", checklist: checklist(["TestFlight group", true], ["Feedback form", true]) },
      { title: "Choose a name", labelIds: ["research"], assigneeId: "ava" },
      { title: "Fix login loop on iPad", labelIds: ["bug"], assigneeId: "ben" },
    ],
  });

  const website = fill(newBoard("Website Redesign", "teal", "paintbrush.pointed.fill", ["Backlog", "Design", "Build", "QA", "Shipped"]), {
    0: [
      { title: "Customer stories section", labelIds: ["feature"] },
      { title: "Localize the home page", labelIds: ["chore"], assigneeId: "emma" },
      { title: "Search on docs", labelIds: ["feature", "research"] },
    ],
    1: [{ title: "New navigation", labelIds: ["design"], assigneeId: "chloe", due: day(4) }],
    2: [
      { title: "Hero animation", labelIds: ["feature", "design"], assigneeId: "diego", checklist: checklist(["Prototype", true], ["Reduce Motion fallback", false]) },
      { title: "Image CDN", labelIds: ["chore"], assigneeId: "ben" },
    ],
    3: [{ title: "Broken links report", labelIds: ["bug"], assigneeId: "emma", due: day(0) }],
    4: [{ title: "Dark mode", labelIds: ["design"], assigneeId: "ava" }],
  });

  const home = fill(newBoard("Home", "orange", "house.fill", ["Ideas", "Doing", "Done"]), {
    0: [{ title: "Repaint the hallway" }, { title: "Plan summer trip", labelIds: ["research"] }],
    1: [{ title: "Sort out the garage", checklist: checklist(["Shelves", true], ["Bikes", false], ["Recycling", false]) }],
    2: [{ title: "Fix the leaky tap" }],
  });

  return [launch, website, home];
}

// MARK: Queries

export const activeColumns = (board: Board) => board.columns.filter((c) => !c.archived);
export const columnCards = (board: Board, column: Column) => column.cardIds.map((id) => board.cards[id]).filter((c): c is Card => !!c && !c.archived);
export const archivedCards = (board: Board) => Object.values(board.cards).filter((c) => c.archived);
export const cardCount = (board: Board) => activeColumns(board).reduce((n, col) => n + columnCards(board, col).length, 0);

export type Filters = { labelIds: string[]; assigneeId: string | null; query: string };
export const noFilters: Filters = { labelIds: [], assigneeId: null, query: "" };
export const UNASSIGNED = "__unassigned";

export const filterCount = (f: Filters) => f.labelIds.length + (f.assigneeId ? 1 : 0);

export function matches(card: Card, f: Filters): boolean {
  if (f.labelIds.length && !card.labelIds.some((id) => f.labelIds.includes(id))) return false;
  if (f.assigneeId === UNASSIGNED ? card.assigneeId !== null : f.assigneeId && card.assigneeId !== f.assigneeId) return false;
  const q = f.query.trim().toLowerCase();
  if (q && !card.title.toLowerCase().includes(q) && !card.description.toLowerCase().includes(q)) return false;
  return true;
}

export function dueLabel(due: number, today: number): { text: string; tone: "overdue" | "soon" | "later" } {
  const days = differenceInCalendarDays(due, today);
  if (days < 0) return { text: days === -1 ? "Yesterday" : format(due, "MMM d"), tone: "overdue" };
  if (days === 0) return { text: "Today", tone: "soon" };
  if (days === 1) return { text: "Tomorrow", tone: "soon" };
  if (days < 7) return { text: format(due, "EEE"), tone: "later" };
  return { text: format(due, "MMM d"), tone: "later" };
}
