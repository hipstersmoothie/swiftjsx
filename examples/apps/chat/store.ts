// Conversations, persisted with zustand + localStorage. Typing indicators are
// transient, so they're left out of what gets saved.
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";
import type { Color } from "swiftjsx";

export type Persona = "emoji" | "shout" | "mirror" | "pirate";
export type Contact = { id: string; name: string; colors: [Color, Color]; persona: Persona };

export type Message = {
  id: string;
  text: string;
  /** "me", or the contact's id. */
  from: string;
  at: number;
  /** Mine only: "sending" until the server echoes it back. */
  status?: "sending" | "sent";
  reaction?: string;
};

export type Conversation = { contact: Contact; messages: Message[]; unread: number };

type Chat = {
  conversations: Record<string, Conversation>;
  /** Replies being "typed", per contact. */
  typing: Record<string, number>;
  add(contactId: string, message: Message): void;
  markSent(contactId: string, id: string): void;
  remove(contactId: string, id: string): void;
  toggleReaction(contactId: string, id: string, emoji: string): void;
  setTyping(contactId: string, delta: 1 | -1): void;
  markRead(contactId: string): void;
  markUnread(contactId: string): void;
  clear(contactId: string): void;
};

// MARK: Seed data, for the first launch (declared before the store, which reads it)

const contacts: Contact[] = [
  { id: "maya", name: "Maya Chen", colors: ["#FF9A8B", "#FF6A88"], persona: "emoji" },
  { id: "sam", name: "Sam Rivera", colors: ["#56CCF2", "#2F80ED"], persona: "shout" },
  { id: "priya", name: "Priya Patel", colors: ["#B993D6", "#8CA6DB"], persona: "mirror" },
  { id: "leo", name: "Leo Okafor", colors: ["#F6D365", "#FDA085"], persona: "pirate" },
];

function seed(): Record<string, Conversation> {
  const minutes = (n: number) => Date.now() - n * 60_000;
  const thread = (contact: Contact, unread: number, lines: [mine: boolean, text: string, minutesAgo: number][]): Conversation => ({
    contact,
    unread,
    messages: lines.map(([mine, text, ago], i) => ({
      id: `${contact.id}-seed-${i}`,
      text,
      from: mine ? "me" : contact.id,
      at: minutes(ago),
      status: mine ? "sent" : undefined,
    })),
  });
  const day = 24 * 60;
  return {
    maya: thread(contacts[0], 1, [
      [false, "Are we still on for coffee?", day + 140],
      [true, "Yes! 10am at the usual place", day + 132],
      [false, "Perfect ☕️", day + 131],
      [false, "Also, I finished the book you lent me. Loved it", 18],
    ]),
    sam: thread(contacts[1], 0, [
      [true, "Did you see the game last night?", 3 * day],
      [false, "WHAT A FINISH", 3 * day - 2],
      [true, "Unreal. Rematch on Saturday?", 95],
      [false, "OBVIOUSLY", 94],
    ]),
    priya: thread(contacts[2], 0, [
      [false, "Can you send me the slides from today?", 2 * day + 30],
      [true, "Sent them to your email", 2 * day + 12],
      [false, "Got them, thanks!", 2 * day + 10],
    ]),
    leo: thread(contacts[3], 0, [
      [false, "Ahoy! Boat trip this weekend?", 6 * day],
      [true, "Only if you stop talking like a pirate", 6 * day - 5],
      [false, "Never 🏴‍☠️", 6 * day - 6],
    ]),
  };
}

// MARK: Store

export const useChat = create<Chat>()(
  persist(
    immer((set) => ({
      conversations: seed(),
      typing: {},
      add: (contactId, message) =>
        set((s) => {
          const conversation = s.conversations[contactId];
          conversation.messages.push(message);
          if (message.from !== "me") conversation.unread++;
        }),
      markSent: (contactId, id) =>
        set((s) => {
          const message = s.conversations[contactId]?.messages.find((m) => m.id === id);
          if (message) message.status = "sent";
        }),
      remove: (contactId, id) =>
        set((s) => {
          const conversation = s.conversations[contactId];
          conversation.messages = conversation.messages.filter((m) => m.id !== id);
        }),
      toggleReaction: (contactId, id, emoji) =>
        set((s) => {
          const message = s.conversations[contactId].messages.find((m) => m.id === id);
          if (message) message.reaction = message.reaction === emoji ? undefined : emoji;
        }),
      setTyping: (contactId, delta) =>
        set((s) => {
          s.typing[contactId] = Math.max(0, (s.typing[contactId] ?? 0) + delta);
        }),
      markRead: (contactId) =>
        set((s) => {
          s.conversations[contactId].unread = 0;
        }),
      markUnread: (contactId) =>
        set((s) => {
          s.conversations[contactId].unread = Math.max(1, s.conversations[contactId].unread);
        }),
      clear: (contactId) =>
        set((s) => {
          s.conversations[contactId].messages = [];
          s.conversations[contactId].unread = 0;
        }),
    })),
    {
      name: "chat-conversations",
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({ conversations: s.conversations }),
    },
  ),
);

export const lastMessage = (c: Conversation): Message | undefined => c.messages[c.messages.length - 1];

/** Mine that haven't been echoed yet: sent on (re)connect. */
export const queuedMessages = (s: Pick<Chat, "conversations">) =>
  Object.values(s.conversations)
    .flatMap((c) => c.messages.filter((m) => m.status === "sending").map((message) => ({ contactId: c.contact.id, message })))
    .sort((a, b) => a.message.at - b.message.at);

export const newMessage = (from: string, text: string): Message => ({
  id: crypto.randomUUID(),
  text,
  from,
  at: Date.now(),
  status: from === "me" ? "sending" : undefined,
});
