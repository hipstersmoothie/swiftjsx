// Shared pieces: layout constants, avatars, skeletons with a shimmer, the
// error state and buttons. Colors come from the theme (light, dim or dark).
import { useState } from "react";
import {
  VStack, HStack, ZStack, Text, Image, Button, Circle, RoundedRectangle, Rectangle, Overlay, ProgressView, Path, ContentUnavailable, useEnvironment,
} from "swiftjsx";
import { T, ty, useTheme, type Palette } from "./theme";

export { useTheme, ty, T, type Palette };

// MARK: Layout

/** Avatar size in feeds, and the column the post's content starts after. */
export const AVATAR = 42;
export const GUTTER = 10;
export const H_PADDING = 16;

/** The width the post body gets in a feed cell (embeds are sized from it). */
export function useContentWidth(indent = 0) {
  const { window } = useEnvironment();
  return Math.max(200, window.width - H_PADDING * 2 - AVATAR - GUTTER - indent);
}

export const useWindowWidth = () => useEnvironment().window.width;

/**
 * A view's own top safe-area inset: the status bar (none inside a sheet) plus
 * the navigation bar when there is one. Spread `onSafeAreaChange` on a view
 * that doesn't ignore the safe area. `fallback` is used until it's measured.
 */
export function useSafeTop(fallback = 0) {
  const [top, setTop] = useState<number | null>(null);
  return {
    top: top ?? fallback,
    measured: top !== null,
    onSafeAreaChange: (insets: { top: number }) => {
      const next = Math.round(insets.top);
      if (next !== top) setTop(next);
    },
  };
}

// MARK: Avatar

type AvatarProps = { uri?: string; size: number; label?: string; square?: boolean; full?: boolean };

/**
 * A round avatar (rounded square for feeds and labelers), or Bluesky's default silhouette.
 * Not the kit's <Avatar>: its fallback is initials (no symbol), and it shows that
 * fallback while loading where Bluesky shows a plain gray disc.
 */
export function Avatar({ uri, size, label, square = false, full = false }: AvatarProps) {
  const t = useTheme();
  const radius = square ? Math.max(6, size * 0.2) : size / 2;
  if (!uri) {
    return (
      <ZStack frame={{ width: size, height: size }} background={t.primary} cornerRadius={radius} accessibilityLabel={label} accessibilityHidden={!label}>
        <Image systemName={square ? "number" : "person.fill"} font={{ size: size * 0.52 }} foregroundStyle="white" offset={{ y: square ? 0 : size * 0.06 }} />
      </ZStack>
    );
  }
  return (
    <Image
      src={full ? uri : uri.replace("/img/avatar/plain/", "/img/avatar_thumbnail/plain/")}
      contentMode="fill"
      frame={{ width: size, height: size }}
      background={t.bg100}
      cornerRadius={radius}
      accessibilityLabel={label}
      accessibilityHidden={!label}
    />
  );
}

// MARK: Skeletons

/** A light band sweeping across whatever it's laid over (the gaps are the background, so it shows on the shapes). */
export function Shimmer() {
  const t = useTheme();
  const width = useWindowWidth();
  return (
    <Overlay alignment="leading">
      <Rectangle
        fill={{ gradient: ["clear", t.shimmer, "clear"], start: "leading", end: "trailing" }}
        frame={{ width: 140, maxHeight: "infinity" }}
        offset={{ x: -160 }}
        keyframes={{ steps: [{ x: width + 320, animation: { type: "easeInOut", duration: 1.15 } }, { x: width + 320, duration: 0.35 }], settle: { type: "linear", duration: 0.01 }, repeat: true }}
        allowsHitTesting={false}
      />
    </Overlay>
  );
}

function Bar({ width, height = 12, strong = false }: { width?: number; height?: number; strong?: boolean }) {
  const t = useTheme();
  return <RoundedRectangle cornerRadius={4} fill={strong ? t.bg100 : t.bg50} frame={width ? { width, height } : { maxWidth: "infinity", height }} />;
}

/** A gray post while the feed loads (Bluesky's PostFeedLoadingPlaceholder). */
export function PostSkeleton() {
  const t = useTheme();
  return (
    <HStack alignment="top" spacing={GUTTER} padding={{ horizontal: H_PADDING, top: 14, bottom: 12 }} accessibilityHidden>
      <Circle fill={t.bg50} frame={{ width: AVATAR, height: AVATAR }} />
      <VStack alignment="leading" spacing={9} padding={{ top: 2 }}>
        <HStack spacing={6}>
          <Bar width={96} strong />
          <Bar width={72} />
        </HStack>
        <Bar />
        <Bar />
        <Bar width={150} />
        <HStack spacing={0} padding={{ top: 6 }}>
          {["bubble.left", "arrow.2.squarepath", "heart"].map((icon) => (
            <HStack key={icon} frame={{ maxWidth: "infinity", alignment: "leading" }}>
              <Image systemName={icon} font={{ size: 16 }} foregroundStyle={t.bg100} />
            </HStack>
          ))}
          <Image systemName="ellipsis" font={{ size: 16 }} foregroundStyle={t.bg100} frame={{ width: 44, alignment: "trailing" }} />
        </HStack>
      </VStack>
    </HStack>
  );
}

export function FeedSkeleton({ count = 6 }: { count?: number }) {
  return (
    <VStack spacing={0} frame={{ maxWidth: "infinity", maxHeight: "infinity", alignment: "top" }} accessibilityLabel="Loading" accessibilityIdentifier="feed-loading">
      {Array.from({ length: count }, (_, i) => (
        <VStack key={i} spacing={0}>
          <PostSkeleton />
          <Separator />
        </VStack>
      ))}
      <Shimmer />
    </VStack>
  );
}

/** Rows of people (followers, search results) while loading. */
export function ProfileRowSkeleton({ count = 8 }: { count?: number }) {
  const t = useTheme();
  return (
    <VStack spacing={0} frame={{ maxWidth: "infinity", maxHeight: "infinity", alignment: "top" }} accessibilityLabel="Loading" accessibilityIdentifier="feed-loading">
      {Array.from({ length: count }, (_, i) => (
        <HStack key={i} spacing={12} padding={{ horizontal: H_PADDING, vertical: 12 }}>
          <Circle fill={t.bg50} frame={{ width: 42, height: 42 }} />
          <VStack alignment="leading" spacing={7}>
            <Bar width={120} strong />
            <Bar width={90} />
          </VStack>
          <ZStack frame={{ maxWidth: "infinity", alignment: "trailing" }}>
            <RoundedRectangle cornerRadius={999} fill={t.bg50} frame={{ width: 74, height: 30 }} />
          </ZStack>
        </HStack>
      ))}
      <Shimmer />
    </VStack>
  );
}

export function Separator({ inset = 0 }: { inset?: number }) {
  const t = useTheme();
  return <Rectangle fill={t.border} frame={{ maxWidth: "infinity", height: 0.5 }} padding={{ leading: inset }} />;
}

/** Bluesky's spinner: the system one, in the theme's low-contrast color. */
export function Spinner({ height = 72 }: { height?: number }) {
  const t = useTheme();
  return <ProgressView tint={t.textLow} frame={{ maxWidth: "infinity", height }} accessibilityIdentifier="loading-more" />;
}

// MARK: States

// Errors and empty lists are the system's ContentUnavailable (SF Pro, a gray
// symbol, Bluesky's pill for the action). Bluesky draws the symbol in a tinted
// circle on Inter; close enough. The sign-in prompts (Notifications, Me) stay
// our own: a brand-tinted tile, the butterfly and two buttons.

export function ErrorView({ error, retry, title = "Oops!" }: { error: unknown; retry(): void; title?: string }) {
  const t = useTheme();
  const message = error instanceof Error ? error.message : String(error);
  return (
    <ContentUnavailable
      systemImage="exclamationmark.circle"
      title={title}
      description={message || "Something went wrong. Check your connection and try again."}
      frame={{ maxWidth: "infinity", maxHeight: "infinity" }}
      background={t.bg}
      accessibilityIdentifier="error-view"
    >
      <PillButton title="Try again" systemImage="arrow.clockwise" onPress={retry} />
    </ContentUnavailable>
  );
}

/** Below the last post: a little room, like Bluesky (no "the end" banner). */
export function EndOfFeed() {
  const t = useTheme();
  return (
    <VStack padding={{ top: 28, bottom: 120 }} frame={{ maxWidth: "infinity" }} accessibilityIdentifier="end-of-feed">
      <Circle fill={t.border} frame={{ width: 6, height: 6 }} />
    </VStack>
  );
}

// MARK: Buttons

/**
 * Bluesky's rounded buttons: "primary" (solid blue), "secondary" (gray fill),
 * "outline". Small ones sit in rows (Follow), large ones on screens.
 */
export function PillButton({
  title, systemImage, onPress, prominent = true, variant, id, small = false, wide = false,
}: {
  title: string;
  systemImage?: string;
  onPress(): void;
  prominent?: boolean;
  variant?: "primary" | "secondary" | "outline" | "inverted";
  id?: string;
  small?: boolean;
  wide?: boolean;
}) {
  const t = useTheme();
  const kind = variant ?? (prominent ? "primary" : "secondary");
  const bg = kind === "primary" ? t.primary : kind === "secondary" ? t.bg50 : kind === "inverted" ? t.text : "clear";
  const fg = kind === "primary" ? "white" : kind === "inverted" ? t.bg : t.text;
  return (
    <Button onPress={onPress} pressedOpacity={0.75} accessibilityIdentifier={id} accessibilityLabel={title} frame={wide ? { maxWidth: "infinity" } : undefined}>
      <HStack
        spacing={small ? 4 : 6}
        padding={{ horizontal: small ? 12 : 18, vertical: small ? 6.5 : 10 }}
        frame={wide ? { maxWidth: "infinity" } : undefined}
        background={bg}
        cornerRadius="capsule"
        border={kind === "outline" ? { color: t.border, width: 1 } : undefined}
      >
        {systemImage ? <Image systemName={systemImage} font={{ size: small ? 12 : 14, weight: "bold" }} foregroundStyle={fg} /> : null}
        <Text font={ty(small ? T.sm : T.md, "semibold")} foregroundStyle={fg} lineLimit={1}>{title}</Text>
      </HStack>
    </Button>
  );
}

/** A circular icon button (headers, the profile's back / more on the banner). */
export function IconButton({ icon, label, onPress, id, size = 34 }: { icon: string; label: string; onPress(): void; id?: string; size?: number }) {
  const t = useTheme();
  return (
    <Button onPress={onPress} pressedOpacity={0.6} accessibilityLabel={label} accessibilityIdentifier={id}>
      <Image systemName={icon} font={{ size: size * 0.55, weight: "medium" }} foregroundStyle={t.text} frame={{ width: size, height: size }} contentShape="rectangle" />
    </Button>
  );
}

/** Bluesky's toggle-button group: a capsule track with the chosen option raised. */
export function Segmented<V extends string>({
  options, value, onChange, id,
}: { options: { value: V; label: string; icon?: string }[]; value: V; onChange(value: V): void; id?: string }) {
  const t = useTheme();
  return (
    <HStack spacing={0} padding={3} background={t.bg50} cornerRadius="capsule" accessibilityElement="contain" accessibilityIdentifier={id}>
      {options.map((o) => {
        const on = o.value === value;
        return (
          <Button
            key={o.value}
            onPress={() => onChange(o.value)}
            pressedOpacity={0.7}
            accessibilityLabel={o.label}
            accessibilityIdentifier={id ? `${id}-${o.value}` : undefined}
            accessibilityTraits={on ? ["button", "selected"] : "button"}
            frame={{ maxWidth: "infinity" }}
          >
            <HStack spacing={5} padding={{ vertical: 8 }} frame={{ maxWidth: "infinity" }} background={on ? t.bg : "clear"} cornerRadius="capsule" shadow={on ? { radius: 2, y: 1, color: "black/10" } : undefined} animation="snappy">
              {o.icon ? <Image systemName={o.icon} font={{ size: 13, weight: "semibold" }} foregroundStyle={on ? t.text : t.textMedium} /> : null}
              <Text font={ty(T.sm, "semibold")} foregroundStyle={on ? t.text : t.textMedium}>{o.label}</Text>
            </HStack>
          </Button>
        );
      })}
    </HStack>
  );
}

/**
 * A butterfly mark in the brand blue (SF Symbols has none). A simple shape of
 * our own, standing in for Bluesky's logo, which this example doesn't embed.
 */
export function Butterfly({ size = 28, color }: { size?: number; color?: import("swiftjsx").Color }) {
  const t = useTheme();
  return (
    <Path
      d="M32 27 C27 13 14 3 7 6 C1 9 3 21 13 25 C19 27.5 27 28.5 32 27 Z M32 27 C37 13 50 3 57 6 C63 9 61 21 51 25 C45 27.5 37 28.5 32 27 Z M31 29 C24 30 15 33 14.5 41 C14 49 24 51 30 39 Z M33 29 C40 30 49 33 49.5 41 C50 49 40 51 34 39 Z"
      viewBox={[0, 0, 64, 52]}
      preserveAspectRatio="fit"
      fill={color ?? t.primary}
      frame={{ width: size * 1.23, height: size }}
      accessibilityLabel="Bluesky"
    />
  );
}
