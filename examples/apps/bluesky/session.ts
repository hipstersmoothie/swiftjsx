// The signed-in account, if any. Kept in localStorage so it survives a
// relaunch. NOTE: localStorage is NOT the keychain: the tokens sit in a
// plain file in the app's container. A real client would keep the refresh
// token in the keychain (Security framework, e.g. through the native backend).
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { hot } from "swiftjsx";
import type { Session } from "./types";

type SessionStore = {
  session: Session | null;
  setSession(session: Session | null): void;
};

const makeSession = () =>
  create<SessionStore>()(
  persist(
    (set) => ({
      session: null,
      setSession: (session) => set({ session }),
    }),
    { name: "bluesky-session", storage: createJSONStorage(() => localStorage) },
  ),
);
export const useSession: ReturnType<typeof makeSession> = (hot.data.blueskySession ??= makeSession());

export const useSignedIn = () => useSession((s) => s.session !== null);
export const useMyDid = () => useSession((s) => s.session?.did ?? null);

/** App settings (not secret), also in localStorage. */
type Settings = {
  appearance: "system" | "light" | "dark";
  autoplayVideos: boolean;
  /** Feeds pinned to Home (generator URIs), signed in. */
  pinnedFeeds: string[];
  setAppearance(appearance: Settings["appearance"]): void;
  setAutoplay(on: boolean): void;
  togglePinned(uri: string): void;
};

const makeSettings = () =>
  create<Settings>()(
  persist(
    (set) => ({
      appearance: "system",
      autoplayVideos: true,
      pinnedFeeds: [],
      setAppearance: (appearance) => set({ appearance }),
      setAutoplay: (autoplayVideos) => set({ autoplayVideos }),
      togglePinned: (uri) =>
        set(({ pinnedFeeds }) => ({ pinnedFeeds: pinnedFeeds.includes(uri) ? pinnedFeeds.filter((u) => u !== uri) : [...pinnedFeeds, uri] })),
    }),
    { name: "bluesky-settings", storage: createJSONStorage(() => localStorage) },
  ),
);
export const useSettings: ReturnType<typeof makeSettings> = (hot.data.blueskySettings ??= makeSettings());
