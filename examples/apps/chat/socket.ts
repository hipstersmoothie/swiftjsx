// The transport: one WebSocket to an echo server. Every message I send comes
// back; that echo is our "delivered" receipt. Messages typed while offline
// stay "sending" in the store and go out when the socket reconnects.
import { useEffect } from "react";
import { create } from "zustand";
import { z } from "zod";
import { newMessage, queuedMessages, useChat, type Message } from "./store";
import { replyTo } from "./bot";

const SERVER = "wss://echo.websocket.org";

export type ConnectionStatus = "connecting" | "online" | "offline";
export const useConnection = create<{ status: ConnectionStatus }>(() => ({ status: "connecting" }));

const Wire = z.object({ id: z.string(), text: z.string(), from: z.literal("me"), to: z.string(), at: z.number() });

let socket: WebSocket | null = null;

function transmit(to: string, message: Message) {
  if (socket?.readyState !== WebSocket.OPEN) return;
  const { id, text, at } = message;
  socket.send(JSON.stringify({ id, text, from: "me", to, at } satisfies z.infer<typeof Wire>));
}

export function sendMessage(contactId: string, text: string) {
  const message = newMessage("me", text);
  useChat.getState().add(contactId, message);
  transmit(contactId, message);
}

function onEcho(data: unknown) {
  // The server says hello in plain text first; anything that isn't one of
  // our messages is ignored.
  let json: unknown;
  try {
    json = JSON.parse(String(data));
  } catch {
    return;
  }
  const parsed = Wire.safeParse(json);
  if (!parsed.success) return;
  const { id, to, text } = parsed.data;
  const { conversations, markSent } = useChat.getState();
  // A message resent after a reconnect can echo twice; only the first counts.
  // (Deleted while in flight: no message, no reply.)
  if (conversations[to]?.messages.find((m) => m.id === id)?.status !== "sending") return;
  markSent(to, id);
  replyTo(to, text);
}

/** Keeps the socket open while the app is mounted. */
export function useChatSocket() {
  useEffect(() => connect(), []);
}

/** Opens the socket and reopens it with backoff whenever it closes. Returns a function that stops. */
function connect() {
  let attempt = 0;
  let retry: number | undefined;
  let stopped = false;

  const open = () => {
    clearTimeout(retry);
    retry = undefined;
    useConnection.setState({ status: "connecting" });
    const ws = new WebSocket(SERVER);
    socket = ws;
    ws.onopen = () => {
      attempt = 0;
      useConnection.setState({ status: "online" });
      for (const { contactId, message } of queuedMessages(useChat.getState())) transmit(contactId, message);
    };
    ws.onmessage = (event) => onEcho(event.data);
    ws.onclose = () => {
      if (socket === ws) socket = null;
      if (stopped) return;
      useConnection.setState({ status: "offline" });
      // 1s, 2s, 4s… up to 30s, jittered so clients don't retry in lockstep.
      const delay = Math.min(30_000, 1000 * 2 ** attempt++) * (0.75 + Math.random() / 2);
      retry = setTimeout(open, delay);
    };
  };

  // The OS knows about network changes before the socket does.
  const onOffline = () => socket?.close();
  const onOnline = () => retry !== undefined && open();
  addEventListener("offline", onOffline);
  addEventListener("online", onOnline);
  open();

  return () => {
    stopped = true;
    clearTimeout(retry);
    removeEventListener("offline", onOffline);
    removeEventListener("online", onOnline);
    socket?.close();
    socket = null;
  };
}
