// Lists and todos in zustand (with immer), persisted to localStorage. Actions
// are plain functions next to the store, so components don't select them.
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";
import { addDays, startOfToday } from "date-fns";
import type { Color } from "swiftjsx";

export type TodoList = { id: string; name: string; color: Color; icon: string };

export type Todo = {
  id: string;
  listId: string;
  title: string;
  notes: string;
  done: boolean;
  flagged: boolean;
  /** Start of the day it's due (ms), or null. */
  due: number | null;
  createdAt: number;
};

/** What a todo screen shows: one list, or a smart list across all of them. */
export type Scope = { kind: "list"; listId: string } | { kind: "today" | "flagged" | "all" };

export const INBOX = "inbox";

export const smartLists: { scope: Scope; name: string; icon: string; color: Color }[] = [
  { scope: { kind: "today" }, name: "Today", icon: "calendar", color: "blue" },
  { scope: { kind: "flagged" }, name: "Flagged", icon: "flag.fill", color: "orange" },
  { scope: { kind: "all" }, name: "All", icon: "tray.2.fill", color: "gray" },
];

type State = { lists: TodoList[]; todos: Todo[] };

function newTodo(listId: string, title: string, extra: Partial<Todo> = {}): Todo {
  return { id: crypto.randomUUID(), listId, title, notes: "", done: false, flagged: false, due: null, createdAt: Date.now(), ...extra };
}

// What a first launch looks like (persisted state replaces it afterwards).
function seed(): State {
  const day = (n: number) => addDays(startOfToday(), n).getTime();
  return {
    lists: [
      { id: INBOX, name: "Inbox", color: "cyan", icon: "tray.fill" },
      { id: "work", name: "Work", color: "indigo", icon: "briefcase.fill" },
      { id: "personal", name: "Personal", color: "green", icon: "house.fill" },
    ],
    todos: [
      newTodo(INBOX, "Swipe right to flag, left to delete", { due: day(0) }),
      newTodo(INBOX, "Long-press a todo for more actions"),
      newTodo("work", "Review pull requests", { due: day(-1), flagged: true }),
      newTodo("work", "Prepare the sprint demo", { due: day(1) }),
      newTodo("work", "Update the roadmap", { done: true }),
      newTodo("personal", "Buy groceries", { due: day(0), notes: "Milk, eggs, coffee" }),
      newTodo("personal", "Book a dentist appointment", { due: day(5) }),
      newTodo("personal", "Call Mom", { flagged: true }),
      newTodo("personal", "Water the plants", { done: true }),
    ],
  };
}

export const useTodos = create<State>()(
  persist(
    immer(() => seed()),
    { name: "todos", version: 1, storage: createJSONStorage(() => localStorage) },
  ),
);

// MARK: Actions (immer: mutate the draft)

export function addTodo(title: string, scope: Scope, today: number) {
  // Smart lists add to the Inbox, set up so the new todo shows where it was added.
  const todo = newTodo(scope.kind === "list" ? scope.listId : INBOX, title, {
    flagged: scope.kind === "flagged",
    due: scope.kind === "today" ? today : null,
  });
  useTodos.setState((s) => {
    s.todos.unshift(todo);
  });
}

export function updateTodo(id: string, changes: Partial<Omit<Todo, "id">>) {
  useTodos.setState((s) => {
    const todo = s.todos.find((t) => t.id === id);
    if (todo) Object.assign(todo, changes);
  });
}

export function deleteTodos(ids: string[]) {
  useTodos.setState((s) => {
    s.todos = s.todos.filter((t) => !ids.includes(t.id));
  });
}

export function addList(list: Omit<TodoList, "id">) {
  useTodos.setState((s) => {
    s.lists.push({ id: crypto.randomUUID(), ...list });
  });
}

export function deleteList(id: string) {
  useTodos.setState((s) => {
    s.lists = s.lists.filter((l) => l.id !== id);
    s.todos = s.todos.filter((t) => t.listId !== id);
  });
}

// MARK: Queries

export function inScope(todo: Todo, scope: Scope, today: number): boolean {
  switch (scope.kind) {
    case "list":
      return todo.listId === scope.listId;
    case "today":
      // Overdue todos stay in Today until they're done.
      return todo.due !== null && (todo.due === today || (todo.due < today && !todo.done));
    case "flagged":
      return todo.flagged;
    case "all":
      return true;
  }
}

export function scopeName(scope: Scope, lists: TodoList[]): string {
  if (scope.kind === "list") return lists.find((l) => l.id === scope.listId)?.name ?? "List";
  return smartLists.find((s) => s.scope.kind === scope.kind)!.name;
}

/** `query` is already trimmed and lowercased. */
export const matchesSearch = (todo: Todo, query: string) =>
  !query || todo.title.toLowerCase().includes(query) || todo.notes.toLowerCase().includes(query);

/** Open todos first, newest first within each group (the sort is stable). */
export const sortTodos = (todos: Todo[]) => [...todos].sort((a, b) => Number(a.done) - Number(b.done));
