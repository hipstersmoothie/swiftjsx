// Shared pieces: the window width, avatars with story rings, and rich text
// (@mentions / #hashtags).
import { createContext, useContext, type ComponentProps } from "react";
import { Avatar as KitAvatar, Text, Image, useEnvironment, type ColorValue, type Gradient } from "swiftjsx";
import { avatarURL, user as getUser, ME, type Story } from "./data";
import { tokenize } from "./format";

// MARK: Width

/** The window's width: carousel pages and grid cells are sized from it. */
export const useWidth = () => useEnvironment().window.width;

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
  const width = ring === "unseen" ? Math.max(2, size / 28) : 1;
  return (
    <KitAvatar
      src={avatarURL(u)}
      name={u.name}
      // With a ring, the picture shrinks a little inside the same outer size.
      size={ring === "none" ? size : size - 2}
      ring={ring === "none" ? undefined : ring === "unseen" ? storyRing : "systemGray4"}
      ringWidth={width}
      ringGap={gap + 1 - width}
      badge={
        badge ? (
          <Image
            systemName="plus.circle.fill"
            font={{ size: size * 0.3 }}
            symbolRenderingMode="palette"
            paletteColors={["white", brandBlue]}
            background="systemBackground"
            cornerRadius={size}
          />
        ) : undefined
      }
      accessibilityHidden
    />
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
 * wrap together; with `onMention`, tapping a mention calls it with the user.
 */
export function RichText({
  lead,
  text,
  onMention,
  ...props
}: { lead?: string; text: string; onMention?: (user: string) => void } & Omit<ComponentProps<typeof Text>, "children">) {
  return (
    <Text {...props}>
      {lead ? <Text fontWeight="semibold">{`${lead} `}</Text> : null}
      {tokenize(text).map((token, i) =>
        token.kind === "text" ? (
          <Text key={i}>{token.text}</Text>
        ) : (
          <Text
            key={i}
            foregroundStyle={linkColor}
            onPress={token.kind === "mention" && onMention ? () => onMention(token.text.slice(1)) : undefined}
          >
            {token.text}
          </Text>
        ),
      )}
    </Text>
  );
}

export const isMe = (id: string) => id === ME;
