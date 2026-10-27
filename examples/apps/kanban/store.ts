// Boards in zustand (immer for mutations), persisted to localStorage. Actions
// are plain functions next to the store, so components don't select them.
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";
import { nanoid } from "nanoid";
import type { Color } from "swiftjsx";
import { newBoard, newCard, newColumn, seedBoards, type Board, type BoardColor, type Card, type Column } from "./model";

type State = { boards: Board[] };

export const useKanban = create<State>()(
  persist(
    immer(() => ({ boards: seedBoards() })),
    { name: "kanban", version: 1, storage: createJSONStorage(() => localStorage) },
  ),
);

/** A board, selected as raw state (zustand v5 loops on selectors that build new objects). */
export const useBoard = (id: string) => useKanban((s) => s.boards.find((b) => b.id === id));

// MARK: Helpers (immer drafts)

function updateBoard(boardId: string, fn: (board: Board) => void) {
  useKanban.setState((s) => {
    const board = s.boards.find((b) => b.id === boardId);
    if (board) fn(board);
  });
}

function updateCardIn(boardId: string, cardId: string, fn: (card: Card, board: Board) => void) {
  updateBoard(boardId, (board) => {
    const card = board.cards[cardId];
    if (card) fn(card, board);
  });
}

const detach = (board: Board, cardId: string) => {
  for (const column of board.columns) column.cardIds = column.cardIds.filter((id) => id !== cardId);
};

// MARK: Boards

export function addBoard(name: string, color: BoardColor, symbol: string, columnNames?: string[]): string {
  const board = newBoard(name, color, symbol, columnNames);
  useKanban.setState((s) => {
    s.boards.push(board);
  });
  return board.id;
}

export function updateBoardInfo(boardId: string, changes: Partial<Pick<Board, "name" | "color" | "symbol">>) {
  updateBoard(boardId, (board) => Object.assign(board, changes));
}

export function deleteBoard(boardId: string) {
  useKanban.setState((s) => {
    s.boards = s.boards.filter((b) => b.id !== boardId);
  });
}

// MARK: Columns

export function addColumn(boardId: string, name: string, color: Color) {
  updateBoard(boardId, (board) => {
    board.columns.push(newColumn(name, color));
  });
}

export function updateColumn(boardId: string, columnId: string, changes: Partial<Pick<Column, "name" | "color">>) {
  updateBoard(boardId, (board) => {
    const column = board.columns.find((c) => c.id === columnId);
    if (column) Object.assign(column, changes);
  });
}

/** Moves a column one place left (-1) or right (+1) among the unarchived ones. */
export function shiftColumn(boardId: string, columnId: string, by: -1 | 1) {
  updateBoard(boardId, (board) => {
    const visible = board.columns.filter((c) => !c.archived);
    const from = visible.findIndex((c) => c.id === columnId);
    const neighbor = visible[from + by];
    if (from < 0 || !neighbor) return;
    const a = board.columns.findIndex((c) => c.id === columnId);
    const b = board.columns.findIndex((c) => c.id === neighbor.id);
    [board.columns[a], board.columns[b]] = [board.columns[b], board.columns[a]];
  });
}

export function setColumnArchived(boardId: string, columnId: string, archived: boolean) {
  updateBoard(boardId, (board) => {
    const column = board.columns.find((c) => c.id === columnId);
    if (column) column.archived = archived;
  });
}

export function deleteColumn(boardId: string, columnId: string) {
  updateBoard(boardId, (board) => {
    const column = board.columns.find((c) => c.id === columnId);
    if (!column) return;
    for (const id of column.cardIds) delete board.cards[id];
    for (const card of Object.values(board.cards)) if (card.columnId === columnId) delete board.cards[card.id];
    board.columns = board.columns.filter((c) => c.id !== columnId);
  });
}

// MARK: Cards

export function addCard(boardId: string, columnId: string, title: string): string {
  const card = newCard(columnId, title);
  updateBoard(boardId, (board) => {
    board.cards[card.id] = card;
    board.columns.find((c) => c.id === columnId)?.cardIds.push(card.id);
  });
  return card.id;
}

export function updateCard(boardId: string, cardId: string, changes: Partial<Omit<Card, "id" | "columnId" | "archived">>) {
  updateCardIn(boardId, cardId, (card) => Object.assign(card, changes));
}

/**
 * Moves a card to `columnId`, before the card `beforeId` (or to the end when
 * null). `beforeId` can be any card of that column, so a drop between two
 * visible cards works while filters hide others.
 */
export function moveCard(boardId: string, cardId: string, columnId: string, beforeId: string | null) {
  updateCardIn(boardId, cardId, (card, board) => {
    const column = board.columns.find((c) => c.id === columnId);
    if (!column || beforeId === cardId) return;
    detach(board, cardId);
    const at = beforeId ? column.cardIds.indexOf(beforeId) : -1;
    if (at < 0) column.cardIds.push(cardId);
    else column.cardIds.splice(at, 0, cardId);
    card.columnId = columnId;
  });
}

export function setCardArchived(boardId: string, cardId: string, archived: boolean) {
  updateCardIn(boardId, cardId, (card, board) => {
    card.archived = archived;
    detach(board, cardId);
    if (archived) return;
    // Back to its column, or the first one if that's gone or archived.
    const home = board.columns.find((c) => c.id === card.columnId && !c.archived) ?? board.columns.find((c) => !c.archived);
    if (!home) return;
    card.columnId = home.id;
    home.cardIds.push(card.id);
  });
}

export function deleteCard(boardId: string, cardId: string) {
  updateBoard(boardId, (board) => {
    detach(board, cardId);
    delete board.cards[cardId];
  });
}

export function toggleLabel(boardId: string, cardId: string, labelId: string) {
  updateCardIn(boardId, cardId, (card) => {
    card.labelIds = card.labelIds.includes(labelId) ? card.labelIds.filter((id) => id !== labelId) : [...card.labelIds, labelId];
  });
}

// MARK: Checklists

export function addChecklistItem(boardId: string, cardId: string, text: string) {
  updateCardIn(boardId, cardId, (card) => {
    card.checklist.push({ id: nanoid(6), text, done: false });
  });
}

export function updateChecklistItem(boardId: string, cardId: string, itemId: string, changes: { text?: string; done?: boolean }) {
  updateCardIn(boardId, cardId, (card) => {
    const item = card.checklist.find((i) => i.id === itemId);
    if (item) Object.assign(item, changes);
  });
}

export function removeChecklistItem(boardId: string, cardId: string, itemId: string) {
  updateCardIn(boardId, cardId, (card) => {
    card.checklist = card.checklist.filter((i) => i.id !== itemId);
  });
}
