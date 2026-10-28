// Small building blocks: cards, progress rings, stat tiles, and the
// completion "burst" that plays when a habit is finished.
import { useState, type ReactNode } from "react";
import { VStack, HStack, ZStack, Text, Image, Circle, Spacer, type Color, type Fill, type Modifiers } from "swiftjsx";

/** A rounded card on the grouped background. */
export function Card({ children, spacing = 12, ...modifiers }: Modifiers & { children: ReactNode; spacing?: number }) {
  return (
    <VStack
      alignment="leading"
      spacing={spacing}
      padding={16}
      frame={{ maxWidth: "infinity", alignment: "leading" }}
      background="secondarySystemGroupedBackground"
      cornerRadius={18}
      {...modifiers}
    >
      {children}
    </VStack>
  );
}

export function CardTitle({ title, icon, color, trailing }: { title: string; icon?: string; color?: Color; trailing?: ReactNode }) {
  return (
    <HStack spacing={6}>
      {icon ? <Image systemName={icon} font="subheadline" fontWeight="semibold" foregroundStyle={color ?? "secondary"} /> : null}
      <Text font="headline">{title}</Text>
      <Spacer />
      {trailing}
    </HStack>
  );
}

/**
 * A progress ring: a track and a trimmed stroke that animates to `progress`
 * (0–1). Strokes are drawn inside the frame.
 */
export function Ring({
  progress, size, lineWidth, color, track, children, ...modifiers
}: Modifiers & { progress: number; size: number; lineWidth: number; color: Fill; track: Fill; children?: ReactNode }) {
  const frame = { width: size, height: size };
  const p = Math.max(0, Math.min(progress, 1));
  return (
    <ZStack frame={frame} {...modifiers}>
      <Circle stroke={track} lineWidth={lineWidth} frame={frame} />
      {/* trim can't be 0 exactly without the stroke vanishing mid-animation: hide it instead. */}
      <Circle
        stroke={color}
        lineWidth={lineWidth}
        trim={[0, Math.max(p, 0.001)]}
        rotation={-90}
        frame={frame}
        opacity={p > 0 ? 1 : 0}
        animation={{ type: "spring", duration: 0.5, bounce: 0.25 }}
      />
      {children}
    </ZStack>
  );
}

/**
 * A ring of dots that flies out and fades: mount it with a new `key` to play
 * it again. It starts collapsed and expands in `onAppear` (a state change in
 * a mount effect can land in the same frame as the mount and not animate).
 */
export function Burst({ color, size }: { color: Color; size: number }) {
  const [out, setOut] = useState(false);
  const dots = 10;
  return (
    <ZStack frame={{ width: size, height: size }} allowsHitTesting={false} onAppear={() => setOut(true)} accessibilityHidden>
      {Array.from({ length: dots }, (_, i) => {
        const angle = (i / dots) * 2 * Math.PI;
        const r = out ? size * (i % 2 ? 0.78 : 0.95) : size * 0.3;
        return (
          <Circle
            key={i}
            fill={color}
            frame={{ width: i % 2 ? 5 : 7, height: i % 2 ? 5 : 7 }}
            offset={{ x: Math.cos(angle) * r, y: Math.sin(angle) * r }}
            opacity={out ? 0 : 1}
            scale={out ? 0.4 : 1}
            animation={{ type: "easeOut", duration: 0.6 }}
          />
        );
      })}
    </ZStack>
  );
}

/** A widget-like tile: caption, a big rounded number, a detail line. */
export function StatTile({ icon, color, title, value, detail, ...modifiers }: Modifiers & {
  icon: string;
  color: Color;
  title: string;
  value: string;
  detail?: string;
}) {
  return (
    <VStack
      alignment="leading"
      spacing={4}
      padding={14}
      frame={{ maxWidth: "infinity", minHeight: 96, alignment: "topLeading" }}
      background="secondarySystemGroupedBackground"
      cornerRadius={16}
      accessibilityElement="combine"
      {...modifiers}
    >
      <HStack spacing={5}>
        <Image systemName={icon} font="caption" fontWeight="semibold" foregroundStyle={color} />
        <Text font="caption" fontWeight="semibold" foregroundStyle="secondaryLabel" textCase="uppercase" lineLimit={1}>{title}</Text>
      </HStack>
      <Text font={{ size: 26, weight: "bold", design: "rounded" }} monospacedDigit lineLimit={1} minimumScaleFactor={0.6} animation="snappy">
        {value}
      </Text>
      {detail ? <Text font="caption" foregroundStyle="secondaryLabel" lineLimit={2}>{detail}</Text> : null}
    </VStack>
  );
}

/** A habit's icon in a tinted rounded square. */
export function HabitIcon({ icon, color, size = 40 }: { icon: string; color: Color; size?: number }) {
  return (
    <Image
      systemName={icon}
      font={{ size: size * 0.45, weight: "semibold" }}
      foregroundStyle="white"
      frame={{ width: size, height: size }}
      background={color}
      cornerRadius={size * 0.28}
      accessibilityHidden
    />
  );
}

export function EmptyState({ icon, title, message, children }: { icon: string; title: string; message: string; children?: ReactNode }) {
  return (
    <VStack spacing={10} padding={{ vertical: 40, horizontal: 24 }} frame={{ maxWidth: "infinity" }}>
      <Image systemName={icon} font={{ size: 44, weight: "light" }} foregroundStyle="tertiaryLabel" />
      <Text font="title3" fontWeight="semibold">{title}</Text>
      <Text font="subheadline" foregroundStyle="secondaryLabel" textAlignment="center">{message}</Text>
      {children}
    </VStack>
  );
}
