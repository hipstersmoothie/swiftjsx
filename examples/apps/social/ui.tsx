// Shared pieces: the measured screen width, avatars with story rings, rich
// text (@mentions / #hashtags), a ticking clock for relative times, and the toast.
import { createContext, useContext, useSyncExternalStore, type ComponentProps } from "react";
import { ZStack, VStack, HStack, Text, Image, Circle, Overlay, type ColorValue, type Gradient } from "swiftjsx";
import { avatarURL, user as getUser, ME, type Story } from "./data";
import { tokenize } from "./format";
import { useUI } from "./store";

// MARK: Width

/**
 * The app's width, from `onLayout` on the root (there's no window-size API).
 * Carousel pages and grid cells are sized from it. Until the first layout
 * arrives it's an iPhone's width.
 */
export const WidthContext = createContext(393);
export const useWidth = () => useContext(WidthContext);

// MARK: Stories (made once per launch)

export const StoriesContext = createContext<Story[]>([]);
export const useStories = () => useContext(StoriesContext);

// MARK: Colors

export const linkColor: ColorValue = { light: "#00376b", dark: "#e0f1ff" };
export const brandBlue: ColorValue = "#0095f6";
export const storyRing: Gradient = {
  gradient: ["#feda75", "#fa7e1e", "#d62976", "#962fbf", "#4f5bd5"],
  start: "bottomLeading",
  end: "topTrailing",
};

// MARK: Avatar

type Ring = "none" | "unseen" | "seen";

/** A round avatar; with a story ring (gradient while unseen, gray once watched). */
export function Avatar({ user, size, ring = "none", badge = false }: { user: string; size: number; ring?: Ring; badge?: boolean }) {
  const u = getUser(user);
  const gap = ring === "none" ? 0 : Math.max(3, size * 0.07);
  const outer = size + gap * 2;
  return (
    <ZStack frame={{ width: outer, height: outer }}>
      {ring !== "none" ? (
        <Circle stroke={ring === "unseen" ? storyRing : "systemGray4"} lineWidth={ring === "unseen" ? Math.max(2, size / 28) : 1} />
      ) : null}
      <Image
        src={avatarURL(u)}
        contentMode="fill"
        frame={{ width: size - (ring === "none" ? 0 : 2), height: size - (ring === "none" ? 0 : 2) }}
        cornerRadius={size / 2}
        accessibilityHidden
      />
      {badge ? (
        <Overlay alignment="bottomTrailing">
          <Image
            systemName="plus.circle.fill"
            font={{ size: size * 0.3 }}
            symbolRenderingMode="palette"
            paletteColors={["white", brandBlue]}
            background="systemBackground"
            cornerRadius={size}
          />
        </Overlay>
      ) : null}
    </ZStack>
  );
}

/** The story ring a user's avatar gets: none without stories, else seen / unseen. */
export function useRing(userId: string, seen: Record<string, string[]>): Ring {
  const story = useStories().find((s) => s.user === userId);
  if (!story) return "none";
  const watched = seen[userId] ?? [];
  return story.items.every((item) => watched.includes(item.id)) ? "seen" : "unseen";
}

export function Verified({ size = "caption" }: { size?: "caption" | "footnote" | "subheadline" }) {
  return <Image systemName="checkmark.seal.fill" font={size} foregroundStyle={brandBlue} accessibilityLabel="Verified" />;
}

// MARK: Rich text

/**
 * Text with @mentions and #hashtags styled as links, optionally led by a
 * bold username (captions and comments). They're runs of one Text so they
 * wrap together; runs can't be tapped, so mentions don't navigate.
 */
export function RichText({ lead, text, ...props }: { lead?: string; text: string } & Omit<ComponentProps<typeof Text>, "children">) {
  return (
    <Text {...props}>
      {lead ? <Text fontWeight="semibold">{`${lead} `}</Text> : null}
      {tokenize(text).map((token, i) =>
        token.kind === "text" ? <Text key={i}>{token.text}</Text> : <Text key={i} foregroundStyle={linkColor}>{token.text}</Text>,
      )}
    </Text>
  );
}

// MARK: Clock

// One timer for every relative time on screen, running while anything listens.
let now = Date.now();
const listeners = new Set<() => void>();
let timer: number | undefined;

function subscribe(listener: () => void) {
  listeners.add(listener);
  if (timer === undefined) {
    timer = setInterval(() => {
      now = Date.now();
      listeners.forEach((l) => l());
    }, 30_000);
  }
  return () => {
    listeners.delete(listener);
    if (!listeners.size && timer !== undefined) {
      clearInterval(timer);
      timer = undefined;
    }
  };
}

/** The current time, updated every 30 seconds (for "5m ago" labels). */
export const useNow = () => useSyncExternalStore(subscribe, () => now);

// MARK: Toast

export function ToastView() {
  const toast = useUI((s) => s.toast);
  return (
    <VStack padding={{ bottom: 100 }} allowsHitTesting={false}>
      {toast ? (
        <HStack
          key={toast.id}
          spacing={8}
          padding={{ horizontal: 16, vertical: 11 }}
          background="regularMaterial"
          cornerRadius="capsule"
          shadow={{ radius: 14, y: 4, color: "#00000030" }}
          transition="move"
          accessibilityIdentifier="toast"
        >
          <Image systemName={toast.icon} font="subheadline" fontWeight="semibold" />
          <Text font="subheadline" fontWeight="semibold">{toast.text}</Text>
        </HStack>
      ) : null}
    </VStack>
  );
}

export const isMe = (id: string) => id === ME;
