// Small building blocks: cards, stat tiles, and the completion "burst" that
// plays when a habit is finished.
import { useState, type ReactNode } from "react";
import { VStack, HStack, ZStack, Text, Image, Circle, Spacer, type Color, type Modifiers } from "swiftjsx";

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
