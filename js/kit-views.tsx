// Views nearly every app was building from primitives: avatars, icon tiles,
// chips, badges, progress rings, page indicators and a pager.

import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  HStack, VStack, ZStack, Text, Image, Button, Circle, Capsule, Overlay, ScrollView,
  type Fill, type ColorValue, type Modifiers,
} from "./components";
import type { HostInstance } from "./renderer";

// MARK: Avatar

/** "Ada Lovelace" → "AL"; one word → its first two letters. */
export function initials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (!words.length) return "";
  const letters = words.length === 1 ? [...words[0]].slice(0, 2) : [[...words[0]][0], [...words[words.length - 1]][0]];
  return letters.join("").toLocaleUpperCase();
}

// A stable color per name, from the system palette.
const AVATAR_COLORS = ["blue", "indigo", "purple", "pink", "red", "orange", "teal", "green", "mint", "cyan"] as const;
function colorFor(name: string) {
  let hash = 0;
  for (const ch of name) hash = (hash * 31 + ch.codePointAt(0)!) | 0;
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

export type AvatarProps = Omit<Modifiers, "badge"> & {
  /** An image URL; while it loads (or without one) the initials show. */
  src?: string | null;
  /** For the initials, the fallback color and the accessibility label. */
  name?: string;
  size?: number;
  shape?: "circle" | "roundedSquare";
  /** The fallback's background (default: a color picked from the name). */
  color?: Fill;
  /** A ring around it (a story ring: a gradient), `ringWidth` wide with a `ringGap`. */
  ring?: Fill;
  ringWidth?: number;
  ringGap?: number;
  /** A view at the bottom-trailing corner (a status dot, a "+"). */
  badge?: ReactNode;
};

/** A person's picture, or their initials on a color. */
export function Avatar({ src, name = "", size = 40, shape = "circle", color, ring, ringWidth = 2.5, ringGap = 2, badge, ...props }: AvatarProps) {
  const corner = shape === "circle" ? "capsule" : size * 0.22;
  const fallback = (
    <Text font={{ size: size * 0.4, weight: "semibold" }} foregroundStyle="white" frame={{ width: size, height: size }} background={color ?? colorFor(name)}>
      {initials(name)}
    </Text>
  );
  const picture = src ? (
    <Image src={src} contentMode="fill" frame={{ width: size, height: size }} cornerRadius={corner}>
      {fallback}
    </Image>
  ) : (
    <ZStack frame={{ width: size, height: size }} cornerRadius={corner}>{fallback}</ZStack>
  );
  const outer = size + (ring ? (ringWidth + ringGap) * 2 : 0);
  return (
    <ZStack frame={{ width: outer, height: outer }} accessibilityElement="ignore" accessibilityLabel={name || undefined} {...props}>
      {ring ? (shape === "circle" ? <Circle stroke={ring} lineWidth={ringWidth} /> : null) : null}
      {picture}
      {badge ? <Overlay alignment="bottomTrailing">{badge}</Overlay> : null}
    </ZStack>
  );
}

// MARK: Icon tile

/** An SF Symbol on a rounded tile (Settings rows, list icons, app-style badges). */
export function IconTile({
  systemImage,
  color = "blue",
  size = 29,
  shape = "rounded",
  foreground = "white",
  ...props
}: Modifiers & { systemImage: string; color?: Fill; size?: number; shape?: "rounded" | "circle"; foreground?: ColorValue }) {
  return (
    <Image
      systemName={systemImage}
      font={{ size: size * 0.55, weight: "semibold" }}
      foregroundStyle={foreground}
      frame={{ width: size, height: size }}
      background={color}
      cornerRadius={shape === "circle" ? "capsule" : size * 0.225}
      accessibilityHidden
      {...props}
    />
  );
}

// MARK: Chip and badge

/** A small capsule: a filter, a tag, a selected option. */
export function Chip({
  label,
  systemImage,
  selected = false,
  tint = "accent",
  onPress,
  ...props
}: Modifiers & { label: string; systemImage?: string; selected?: boolean; tint?: ColorValue; onPress?: () => void }) {
  const body = (
    <HStack
      spacing={5}
      padding={{ horizontal: 12, vertical: 6 }}
      background={selected ? tint : "secondarySystemFill"}
      foregroundStyle={selected ? "white" : "primary"}
      cornerRadius="capsule"
    >
      {systemImage ? <Image systemName={systemImage} font="caption" /> : null}
      <Text font="subheadline" fontWeight="medium">{label}</Text>
    </HStack>
  );
  if (!onPress) return <HStack accessibilityElement="combine" {...props}>{body}</HStack>;
  return (
    <Button buttonStyle="plain" onPress={onPress} accessibilityTraits={selected ? ["selected"] : undefined} {...props}>
      {body}
    </Button>
  );
}

/**
 * A count ("3", "99+") or short text on a colored capsule. Put it on a view
 * with `<Overlay alignment="topTrailing"><Badge value={n} /></Overlay>`.
 * A count of 0 shows nothing.
 */
export function Badge({ value, max = 99, color = "red", ...props }: Modifiers & { value: number | string; max?: number; color?: Fill }) {
  if (value === 0 || value === "") return null;
  const text = typeof value === "number" && value > max ? `${max}+` : String(value);
  return (
    <Text
      font={{ size: 12, weight: "bold" }}
      monospacedDigit
      foregroundStyle="white"
      padding={{ horizontal: 6, vertical: 2 }}
      frame={{ minWidth: 20, minHeight: 20 }}
      background={color}
      cornerRadius="capsule"
      // Its own size, even in a small overlay (an icon's corner).
      fixedSize
      {...props}
    >
      {text}
    </Text>
  );
}

// MARK: Progress ring

/**
 * A ring that fills to `value` of `total` (default 1), with anything in the
 * middle. Past `total` with `allowsOverflow`, the stroke keeps going around.
 * Animates with the surrounding `animation` / `withAnimation`.
 */
export function ProgressRing({
  value,
  total = 1,
  lineWidth = 8,
  color = "accent",
  track = "systemFill",
  allowsOverflow = false,
  children,
  ...props
}: Modifiers & { value: number; total?: number; lineWidth?: number; color?: Fill; track?: Fill; allowsOverflow?: boolean; children?: ReactNode }) {
  const fraction = total > 0 ? value / total : 0;
  const shown = allowsOverflow ? fraction : Math.min(Math.max(fraction, 0), 1);
  // A trim of exactly 0 makes the stroke vanish mid-animation: start just above.
  const first = Math.max(0.0001, Math.min(shown, 1));
  return (
    <ZStack accessibilityElement="combine" accessibilityValue={`${Math.round(fraction * 100)}%`} {...props}>
      <Circle stroke={track} lineWidth={lineWidth} />
      <Circle stroke={color} lineWidth={lineWidth} lineCap="round" trim={[0, first]} rotation={-90} opacity={shown > 0 ? 1 : 0} />
      {shown > 1 ? <Circle stroke={color} lineWidth={lineWidth} lineCap="round" trim={[0, Math.min(shown - 1, 1)]} rotation={-90} shadow={{ radius: 2 }} /> : null}
      {children}
    </ZStack>
  );
}

// MARK: Page indicator

export type PageIndicatorStyle = "dots" | "capsule" | "counter" | "segments";

/**
 * Where you are among `count` pages: dots, a stretched capsule for the current
 * one, an "n / m" pill (readable over photos), or story-style segments
 * (`progress`, 0–1, fills the current one).
 */
export function PageIndicator({
  count,
  page,
  style = "dots",
  tint = "white",
  inactive,
  progress = 1,
  onSelect,
  ...props
}: Modifiers & {
  count: number;
  page: number;
  style?: PageIndicatorStyle;
  tint?: ColorValue;
  inactive?: Fill;
  progress?: number;
  onSelect?: (page: number) => void;
}) {
  const label = `Page ${page + 1} of ${count}`;
  if (style === "counter") {
    return (
      <Text font="caption" fontWeight="semibold" monospacedDigit foregroundStyle="white" padding={{ horizontal: 9, vertical: 4 }} background="black/55" cornerRadius="capsule" accessibilityLabel={label} {...props}>
        {`${page + 1} / ${count}`}
      </Text>
    );
  }
  if (style === "segments") {
    return (
      <HStack spacing={4} accessibilityElement="ignore" accessibilityLabel={label} {...props}>
        {Array.from({ length: count }, (_, i) => (
          <Capsule key={i} fill={inactive ?? "white/35"} frame={{ maxWidth: "infinity", height: 3 }}>
            <Overlay alignment="leading">
              {/* Filled by scaling from the leading edge (sizes relative to the parent aren't a thing). */}
              <Capsule
                fill={tint}
                scaleX={i < page ? 1 : i === page ? Math.max(0.001, Math.min(progress, 1)) : 0.001}
                transformAnchor="leading"
                opacity={i <= page ? 1 : 0}
              />
            </Overlay>
          </Capsule>
        ))}
      </HStack>
    );
  }
  return (
    <HStack spacing={6} accessibilityElement="ignore" accessibilityLabel={label} {...props}>
      {Array.from({ length: count }, (_, i) => (
        <Capsule
          key={i}
          fill={i === page ? tint : inactive ?? "white/45"}
          frame={{ width: style === "capsule" && i === page ? 18 : 7, height: 7 }}
          animation="snappy"
          onTapGesture={onSelect ? () => onSelect(i) : undefined}
        />
      ))}
    </HStack>
  );
}

// MARK: Pager

export type PagerProps = Modifiers & {
  children: ReactNode[];
  /** The page shown (controlled); changing it scrolls there. */
  page?: number;
  onPageChange?: (page: number) => void;
  /** Seconds per page, paused while the user drags; wraps around at the end. */
  autoAdvance?: number;
  indicator?: PageIndicatorStyle | "none";
  indicatorAlignment?: "bottom" | "top" | "bottomTrailing" | "topTrailing";
  indicatorTint?: ColorValue;
  /** Space between pages. */
  spacing?: number;
};

/**
 * Full-width pages you swipe between (a carousel, onboarding, a photo
 * gallery), with an indicator over them.
 */
export function Pager({
  children,
  page,
  onPageChange,
  autoAdvance,
  indicator = "dots",
  indicatorAlignment = "bottom",
  indicatorTint,
  spacing = 0,
  ...props
}: PagerProps) {
  const pages = children.filter((c) => c != null && c !== false);
  const ref = useRef<HostInstance>(null);
  const [shown, setShown] = useState(page ?? 0);
  const [dragging, setDragging] = useState(false);

  // Controlled: scroll when `page` changes from outside.
  useEffect(() => {
    if (page === undefined || page === shown) return;
    ref.current?.scrollTo(page, { animated: true });
  }, [page]);

  useEffect(() => {
    if (!autoAdvance || dragging || pages.length < 2) return;
    const timer = setTimeout(() => ref.current?.scrollTo((shown + 1) % pages.length, { animated: true }), autoAdvance * 1000);
    return () => clearTimeout(timer);
  }, [autoAdvance, dragging, shown, pages.length]);

  return (
    <ZStack {...props}>
      <ScrollView
        ref={ref}
        axis="horizontal"
        paging
        spacing={spacing}
        showsIndicators={false}
        onScrollIndexChange={(i) => {
          setShown(i);
          onPageChange?.(i);
        }}
        onScrollPhaseChange={(phase) => setDragging(phase === "tracking" || phase === "interacting")}
      >
        {pages.map((child, i) => (
          <ZStack key={i} relativeWidth={1}>
            {child}
          </ZStack>
        ))}
      </ScrollView>
      {indicator !== "none" && pages.length > 1 ? (
        <Overlay alignment={indicatorAlignment}>
          <PageIndicator count={pages.length} page={shown} style={indicator} tint={indicatorTint} padding={12} onSelect={(i) => ref.current?.scrollTo(i, { animated: true })} />
        </Overlay>
      ) : null}
    </ZStack>
  );
}
