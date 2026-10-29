// Folders and notes in zustand (with immer), persisted to localStorage.
// `useStorageSize()` reports what we write, so the sidebar can show it.
import { useSyncExternalStore } from "react";
import { create } from "zustand";
import { persist, createJSONStorage, type StateStorage } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";
import { nanoid } from "nanoid";
import { seed } from "./seed";

export type Folder = { id: string; name: string; icon: string };

export type Note = {
  id: string;
  folderId: string;
  title: string;
  /** Lightweight markdown, lines separated by "\n". */
  body: string;
  createdAt: number;
  updatedAt: number;
  pinned: boolean;
  /** Set while the note is in Recently Deleted. */
  deletedAt: number | null;
};

export type Sort = "edited" | "created" | "title";

/** What the notes column shows: every note, one folder, or Recently Deleted. */
export type Scope = "all" | "deleted" | { folderId: string };

export const DEFAULT_FOLDER = "notes";
export const RETENTION_DAYS = 30;
const DAY = 24 * 60 * 60 * 1000;

export type State = { folders: Folder[]; notes: Note[]; sort: Sort };

// MARK: Storage

let writtenBytes = 0;
const sizeListeners = new Set<() => void>();
const measure = (value: string | null) => {
  // UTF-16 code units; the file is UTF-8, so this is an estimate.
  writtenBytes = value?.length ?? 0;
  sizeListeners.forEach((l) => l());
};

const measuredStorage: StateStorage = {
  getItem: (key) => {
    const value = localStorage.getItem(key);
    measure(value);
    return value;
  },
  setItem: (key, value) => {
    localStorage.setItem(key, value);
    measure(value);
  },
  removeItem: (key) => {
    localStorage.removeItem(key);
    measure(null);
  },
};

/** Size (in UTF-16 code units, ~bytes) of the last state we wrote or read. */
export function useStorageSize(): number {
  return useSyncExternalStore(
    (onChange) => {
      sizeListeners.add(onChange);
      return () => sizeListeners.delete(onChange);
    },
    () => writtenBytes,
  );
}

export const useNotes = create<State>()(
  persist(
    immer(() => seed()),
    {
      name: "notes",
      version: 1,
      storage: createJSONStorage(() => measuredStorage),
    },
  ),
);

// MARK: Actions

/** Creates an empty note and returns its id. */
export function createNote(folderId: string): string {
  const now = Date.now();
  const id = nanoid();
  useNotes.setState((s) => {
    s.notes.unshift({ id, folderId, title: "", body: "", createdAt: now, updatedAt: now, pinned: false, deletedAt: null });
  });
  return id;
}

/** Saves the editor's draft. Only bumps `updatedAt` when something changed. */
export function saveNote(id: string, changes: { title: string; body: string }) {
  useNotes.setState((s) => {
    const note = s.notes.find((n) => n.id === id);
    if (!note || (note.title === changes.title && note.body === changes.body)) return;
    note.title = changes.title;
    note.body = changes.body;
    note.updatedAt = Date.now();
  });
}

export function updateNote(id: string, changes: Partial<Pick<Note, "pinned" | "folderId">>) {
  useNotes.setState((s) => {
    const note = s.notes.find((n) => n.id === id);
    if (note) Object.assign(note, changes);
  });
}

/** Moves notes to Recently Deleted. */
export function trashNotes(ids: string[]) {
  const now = Date.now();
  useNotes.setState((s) => {
    for (const note of s.notes) if (ids.includes(note.id)) {
      note.deletedAt = now;
      note.pinned = false;
    }
  });
}

export function restoreNote(id: string) {
  useNotes.setState((s) => {
    const note = s.notes.find((n) => n.id === id);
    if (!note) return;
    note.deletedAt = null;
    // Its folder may have been deleted since.
    if (!s.folders.some((f) => f.id === note.folderId)) note.folderId = DEFAULT_FOLDER;
  });
}

export function destroyNotes(ids: string[]) {
  useNotes.setState((s) => {
    s.notes = s.notes.filter((n) => !ids.includes(n.id));
  });
}

/** Permanently deletes notes that have been in Recently Deleted for 30 days. */
export function purgeExpired(now: number) {
  const cutoff = now - RETENTION_DAYS * DAY;
  const expired = useNotes.getState().notes.filter((n) => n.deletedAt !== null && n.deletedAt < cutoff);
  if (expired.length) destroyNotes(expired.map((n) => n.id));
}

export function daysLeft(note: Note, now: number): number {
  return Math.max(0, Math.ceil(((note.deletedAt ?? now) + RETENTION_DAYS * DAY - now) / DAY));
}

export function setSort(sort: Sort) {
  useNotes.setState((s) => {
    s.sort = sort;
  });
}

export function addFolder(name: string, icon: string): string {
  const id = nanoid();
  useNotes.setState((s) => {
    s.folders.push({ id, name, icon });
  });
  return id;
}

/** Deletes a folder; its notes go to Recently Deleted (and restore to Notes). */
export function deleteFolder(id: string) {
  if (id === DEFAULT_FOLDER) return;
  const now = Date.now();
  useNotes.setState((s) => {
    s.folders = s.folders.filter((f) => f.id !== id);
    for (const note of s.notes) if (note.folderId === id) {
      note.folderId = DEFAULT_FOLDER;
      if (note.deletedAt === null) {
        note.deletedAt = now;
        note.pinned = false;
      }
    }
  });
}

// MARK: Queries

export function inScope(note: Note, scope: Scope): boolean {
  if (scope === "deleted") return note.deletedAt !== null;
  if (note.deletedAt !== null) return false;
  return scope === "all" || note.folderId === scope.folderId;
}

export const sameScope = (a: Scope, b: Scope) =>
  typeof a === "string" || typeof b === "string" ? a === b : a.folderId === b.folderId;

export function scopeName(scope: Scope, folders: Folder[]): string {
  if (scope === "all") return "All Notes";
  if (scope === "deleted") return "Recently Deleted";
  return folders.find((f) => f.id === scope.folderId)?.name ?? "Notes";
}
