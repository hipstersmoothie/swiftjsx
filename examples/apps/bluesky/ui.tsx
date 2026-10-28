// Shared pieces: colors, avatars, a ticking clock for relative times, loading
// skeletons, error and empty states, and the toast.
import { useSyncExternalStore } from "react";
import {
  VStack, HStack, ZStack, Text, Image, Button, Circle, RoundedRectangle, useEnvironment, type ColorValue,
} from "swiftjsx";
import { useUI } from "./store";

// MARK: Colors

/** Bluesky's blue. */
export const brand: ColorValue = { light: "#0a7aff", dark: "#208bfe" };
export const likeColor: ColorValue = "#ec4899";
export const repostColor: ColorValue = { light: "#13b55c", dark: "#20bc6c" };
export const hairline: ColorValue = { light: "#e5e8eb", dark: "#2e3a47" };
export const subtle: ColorValue = { light: "#6f869f", dark: "#8d9fb4" };
export const cardBackground: ColorValue = { light: "#f1f3f5", dark: "#1e2936" };
export const screenBackground: ColorValue = { light: "white", dark: "#161e27" };

// MARK: Layout

/** Avatar size in feeds, and the column the post's content starts after. */
export const AVATAR = 42;
export const GUTTER = 12;
export const H_PADDING = 14;

/** The width the post body gets in a feed cell (embeds are sized from it). */
export function useContentWidth(indent = 0) {
  const { window } = useEnvironment();
  return Math.max(200, window.width - H_PADDING * 2 - AVATAR - GUTTER - indent);
}

export const useWindowWidth = () => useEnvironment().window.width;

// MARK: Clock

// One timer for every relative time on screen: a tick a minute re-renders
// only the components that read it.
let now = Date.now();
const listeners = new Set<() => void>();
setInterval(() => {
  now = Date.now();
  listeners.forEach((l) => l());
}, 60_000);
const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};
export const useNow = () => useSyncExternalStore(subscribe, () => now);

// MARK: Avatar

type AvatarProps = { uri?: string; size: number; label?: string; square?: boolean };

/** A round avatar (square-ish for feeds and labelers), or a placeholder silhouette. */
export function Avatar({ uri, size, label, square = false }: AvatarProps) {
  const radius = square ? size * 0.22 : size / 2;
  if (!uri) {
    return (
      <ZStack frame={{ width: size, height: size }} background={brand} cornerRadius={radius} accessibilityLabel={label} accessibilityHidden={!label}>
        <Image systemName={square ? "number" : "person.fill"} font={{ size: size * 0.5 }} foregroundStyle="white" />
      </ZStack>
    );
  }
  return (
    <Image
      src={uri.replace("/img/avatar/plain/", "/img/avatar_thumbnail/plain/")}
      contentMode="fill"
      frame={{ width: size, height: size }}
      cornerRadius={radius}
      border={{ color: "black/8", width: 0.5 }}
      accessibilityLabel={label}
      accessibilityHidden={!label}
    />
  );
}

// MARK: Skeletons

/** A gray post while the feed loads. */
export function PostSkeleton() {
  return (
    <HStack alignment="top" spacing={GUTTER} padding={{ horizontal: H_PADDING, vertical: 12 }} accessibilityHidden>
      <Circle fill="systemGray5" frame={{ width: AVATAR, height: AVATAR }} />
      <VStack alignment="leading" spacing={8}>
        <HStack spacing={6}>
          <RoundedRectangle cornerRadius={4} fill="systemGray5" frame={{ width: 110, height: 13 }} />
          <RoundedRectangle cornerRadius={4} fill="systemGray6" frame={{ width: 80, height: 13 }} />
        </HStack>
        <RoundedRectangle cornerRadius={4} fill="systemGray6" frame={{ maxWidth: "infinity", height: 13 }} />
        <RoundedRectangle cornerRadius={4} fill="systemGray6" frame={{ maxWidth: "infinity", height: 13 }} />
        <RoundedRectangle cornerRadius={4} fill="systemGray6" frame={{ width: 160, height: 13 }} />
        <HStack spacing={0} padding={{ top: 4 }}>
          {[0, 1, 2, 3].map((i) => (
            <HStack key={i} frame={{ maxWidth: "infinity", alignment: "leading" }}>
              <RoundedRectangle cornerRadius={4} fill="systemGray6" frame={{ width: 34, height: 12 }} />
            </HStack>
          ))}
        </HStack>
      </VStack>
    </HStack>
  );
}

export function FeedSkeleton({ count = 6 }: { count?: number }) {
  return (
    <VStack spacing={0} frame={{ maxWidth: "infinity", maxHeight: "infinity", alignment: "top" }} keyframes={{ steps: [{ opacity: 0.55, duration: 0.8 }, { opacity: 1, duration: 0.8 }], repeat: true }} accessibilityLabel="Loading" accessibilityIdentifier="feed-loading">
      {Array.from({ length: count }, (_, i) => (
        <VStack key={i} spacing={0}>
          <PostSkeleton />
          <Separator />
        </VStack>
      ))}
    </VStack>
  );
}

export function Separator({ inset = 0 }: { inset?: number }) {
  return <RoundedRectangle cornerRadius={0} fill={hairline} frame={{ maxWidth: "infinity", height: 0.5 }} padding={{ leading: inset }} />;
}

// MARK: States

export function ErrorView({ error, retry }: { error: unknown; retry(): void }) {
  const message = error instanceof Error ? error.message : String(error);
  return (
    <VStack spacing={12} padding={32} frame={{ maxWidth: "infinity", maxHeight: "infinity" }} accessibilityIdentifier="error-view">
      <Image systemName="exclamationmark.icloud" font={{ size: 44, weight: "light" }} foregroundStyle={subtle} />
      <Text font="headline">Something went wrong</Text>
      <Text font="subheadline" foregroundStyle={subtle} textAlignment="center">{message}</Text>
      <Button buttonStyle="borderedProminent" tint={brand} onPress={retry} padding={{ top: 4 }}>
        <Text fontWeight="semibold" padding={{ horizontal: 8 }}>Try again</Text>
      </Button>
    </VStack>
  );
}

export function EmptyState({ icon, title, message }: { icon: string; title: string; message?: string }) {
  return (
    <VStack spacing={10} padding={{ horizontal: 32, vertical: 48 }} frame={{ maxWidth: "infinity" }}>
      <Image systemName={icon} font={{ size: 40, weight: "light" }} foregroundStyle={subtle} />
      <Text font="headline">{title}</Text>
      {message ? <Text font="subheadline" foregroundStyle={subtle} textAlignment="center">{message}</Text> : null}
    </VStack>
  );
}

export function EndOfFeed() {
  return (
    <VStack spacing={6} padding={{ vertical: 32 }} frame={{ maxWidth: "infinity" }}>
      <Image systemName="checkmark.circle" font="title2" foregroundStyle={subtle} />
      <Text font="footnote" foregroundStyle={subtle}>You've reached the end</Text>
    </VStack>
  );
}

// MARK: Toast

export function ToastView() {
  const toast = useUI((s) => s.toast);
  return (
    <VStack padding={{ bottom: 70 }} allowsHitTesting={false} animation="snappy">
      {toast ? (
        <HStack
          key={toast.id}
          spacing={8}
          padding={{ horizontal: 16, vertical: 11 }}
          background="regularMaterial"
          cornerRadius="capsule"
          shadow={{ radius: 12, y: 4, color: "black/15" }}
          transition={{ type: "move", edge: "bottom" }}
          accessibilityIdentifier="toast"
        >
          <Image systemName={toast.icon} fontWeight="semibold" />
          <Text font="subheadline" fontWeight="semibold">{toast.text}</Text>
        </HStack>
      ) : null}
    </VStack>
  );
}

/** A capsule-shaped primary button (Follow, Sign in). */
export function PillButton({
  title, systemImage, onPress, prominent = true, id, small = false,
}: { title: string; systemImage?: string; onPress(): void; prominent?: boolean; id?: string; small?: boolean }) {
  return (
    <Button onPress={onPress} pressedOpacity={0.7} accessibilityIdentifier={id} accessibilityLabel={title}>
      <HStack
        spacing={5}
        padding={{ horizontal: small ? 12 : 16, vertical: small ? 6 : 9 }}
        background={prominent ? brand : cardBackground}
        cornerRadius="capsule"
      >
        {systemImage ? <Image systemName={systemImage} font={small ? "caption" : "subheadline"} fontWeight="semibold" foregroundStyle={prominent ? "white" : "label"} /> : null}
        <Text font={small ? "footnote" : "subheadline"} fontWeight="semibold" foregroundStyle={prominent ? "white" : "label"}>{title}</Text>
      </HStack>
    </Button>
  );
}

