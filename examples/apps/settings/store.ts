// Everything the app remembers, in one zustand store (with immer) persisted to
// localStorage. Actions are plain functions next to the store.
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";
import type { Color } from "swiftjsx";

export type Profile = {
  name: string;
  username: string;
  email: string;
  phone: string;
  bio: string;
  /** "yyyy-MM-dd", or "" when not set. */
  birthday: string;
  /** One of `pronounOptions`' values, or "custom" (then `customPronouns`). */
  pronouns: string;
  customPronouns: string;
  website: string;
};

export type Theme = "system" | "light" | "dark";
export type PreviewSetting = "always" | "unlocked" | "never";
/** Location has all four; the rest are allowed / never. */
export type Access = "never" | "ask" | "whileUsing" | "always" | "allowed";

export type AccentName = "blue" | "purple" | "pink" | "red" | "orange" | "yellow" | "green" | "teal" | "graphite";

export const accents: Record<AccentName, { label: string; color: Color; gradient: [Color, Color] }> = {
  blue: { label: "Blue", color: "blue", gradient: ["#5AC8FA", "#007AFF"] },
  purple: { label: "Purple", color: "purple", gradient: ["#D69CFF", "#AF52DE"] },
  pink: { label: "Pink", color: "pink", gradient: ["#FF8DB4", "#FF2D55"] },
  red: { label: "Red", color: "red", gradient: ["#FF8A80", "#FF3B30"] },
  orange: { label: "Orange", color: "orange", gradient: ["#FFC266", "#FF9500"] },
  yellow: { label: "Yellow", color: "yellow", gradient: ["#FFE680", "#FFCC00"] },
  green: { label: "Green", color: "green", gradient: ["#7EE38F", "#34C759"] },
  teal: { label: "Teal", color: "teal", gradient: ["#7FDBEA", "#30B0C7"] },
  graphite: { label: "Graphite", color: "gray", gradient: ["#C7C7CC", "#8E8E93"] },
};
export const accentNames = Object.keys(accents) as AccentName[];

export type State = {
  signedIn: boolean;
  profile: Profile;
  notifications: {
    enabled: boolean;
    previews: PreviewSetting;
    messages: boolean;
    mentions: boolean;
    updates: boolean;
    digest: boolean;
    badges: boolean;
    sound: string;
    quietHours: boolean;
    /** Minutes after midnight. */
    quietFrom: number;
    quietTo: number;
  };
  appearance: {
    theme: Theme;
    accent: AccentName;
    /** An index into `textSizes`. */
    textSize: number;
    boldText: boolean;
  };
  privacy: {
    locationServices: boolean;
    /** permission id → app id → access. */
    access: Record<string, Record<string, Access>>;
    allowTracking: boolean;
    analytics: boolean;
    personalizedAds: boolean;
  };
  storage: {
    cacheBytes: number;
    offloadUnused: boolean;
  };
};

export const demoProfile: Profile = {
  name: "Jordan Rivera",
  username: "jordan.rivera",
  email: "jordan@example.com",
  phone: "(415) 555-0132",
  bio: "Designer & tinkerer. Coffee, cycling, and very small apps.",
  birthday: "1991-03-14",
  pronouns: "they/them",
  customPronouns: "",
  website: "https://jordan.example.com",
};

const blankProfile: Profile = {
  name: "", username: "", email: "", phone: "", bio: "", birthday: "", pronouns: "", customPronouns: "", website: "",
};

const CACHE_SEED = 2_870_000_000;

function seed(): State {
  return {
    signedIn: true,
    profile: demoProfile,
    notifications: {
      enabled: true,
      previews: "unlocked",
      messages: true,
      mentions: true,
      updates: false,
      digest: true,
      badges: true,
      sound: "chime",
      quietHours: true,
      quietFrom: 22 * 60,
      quietTo: 7 * 60,
    },
    appearance: { theme: "system", accent: "blue", textSize: 3, boldText: false },
    privacy: {
      locationServices: true,
      access: {
        location: { maps: "whileUsing", weather: "always", trailhead: "ask", snapshots: "never" },
        camera: { snapshots: "allowed", chat: "allowed", trailhead: "never" },
        microphone: { chat: "allowed", snapshots: "never" },
        photos: { snapshots: "allowed", chat: "never" },
        contacts: { chat: "allowed" },
        calendars: { trailhead: "never" },
        bluetooth: { trailhead: "allowed" },
      },
      allowTracking: false,
      analytics: true,
      personalizedAds: false,
    },
    storage: { cacheBytes: CACHE_SEED, offloadUnused: false },
  };
}

export const useSettings = create<State>()(
  persist(
    immer(() => seed()),
    {
      name: "settings-app",
      version: 1,
      storage: createJSONStorage(() => localStorage),
      // The default merge is shallow: a section saved by an older build would
      // replace the whole section and drop fields added since.
      merge: (persisted, current) => {
        const saved = (persisted ?? {}) as Partial<State>;
        return {
          ...current,
          ...saved,
          profile: { ...current.profile, ...saved.profile },
          notifications: { ...current.notifications, ...saved.notifications },
          appearance: { ...current.appearance, ...saved.appearance },
          privacy: { ...current.privacy, ...saved.privacy },
          storage: { ...current.storage, ...saved.storage },
        };
      },
    },
  ),
);

/** Mutate the state with immer: `update((s) => { s.notifications.badges = false })`. */
export function update(recipe: (draft: State) => void) {
  useSettings.setState(recipe);
}

export function saveProfile(profile: Profile) {
  update((s) => {
    s.profile = profile;
  });
}

export function setAccess(permission: string, app: string, access: Access) {
  update((s) => {
    (s.privacy.access[permission] ??= {})[app] = access;
  });
}

export function clearCache() {
  update((s) => {
    s.storage.cacheBytes = 0;
  });
}

export function signOut() {
  update((s) => {
    s.signedIn = false;
    s.profile = blankProfile;
  });
}

export function signIn() {
  update((s) => {
    s.signedIn = true;
    s.profile = demoProfile;
    s.storage.cacheBytes = Math.max(s.storage.cacheBytes, 180_000_000);
  });
}

/** The current accent color (for `tint` and highlights). */
export const useAccent = () => accents[useSettings((s) => s.appearance.accent)];

/** What to pass to `colorScheme` (undefined follows the system). */
export const useColorScheme = () => {
  const theme = useSettings((s) => s.appearance.theme);
  return theme === "system" ? undefined : theme;
};
