import type { ReactNode } from "react";
import { VStack, HStack, Text, Image, Spacer, format, type Color, type Modifiers } from "swiftjsx";
import type { Stat } from "./model";

/** A rounded card on the grouped background. */
export function Card({ children, spacing = 12, ...modifiers }: Modifiers & { children: ReactNode; spacing?: number }) {
  return (
    <VStack
      alignment="leading"
      spacing={spacing}
      padding={16}
      frame={{ maxWidth: "infinity", alignment: "leading" }}
      background="secondarySystemGroupedBackground"
      cornerRadius={16}
      {...modifiers}
    >
      {children}
    </VStack>
  );
}

export function SectionTitle({ title, action }: { title: string; action?: ReactNode }) {
  return (
    <HStack padding={{ top: 8, horizontal: 4 }}>
      <Text font="title2" fontWeight="bold">{title}</Text>
      <Spacer />
      {action}
    </HStack>
  );
}

/** A card header: a colored symbol and title, like the Health app. */
export function CardHeader({ icon, title, color, trailing }: { icon: string; title: string; color: Color; trailing?: string }) {
  return (
    <HStack spacing={6}>
      <Image systemName={icon} font="subheadline" foregroundStyle={color} />
      <Text font="subheadline" fontWeight="semibold" foregroundStyle={color}>{title}</Text>
      <Spacer />
      {trailing ? <Text font="footnote" foregroundStyle="secondary">{trailing}</Text> : null}
    </HStack>
  );
}

/** A value with a smaller unit after it: "8,432 steps". */
export function ValueText({ value, unit, size = 28, color }: { value: string; unit: string; size?: number; color?: Color }) {
  return (
    <Text font={{ size, weight: "semibold", design: "rounded" }} foregroundStyle={color ?? "primary"} monospacedDigit lineLimit={1} minimumScaleFactor={0.6} animation="snappy">
      {value}
      {unit ? <Text font={{ size: size * 0.55, weight: "semibold", design: "rounded" }} foregroundStyle="secondary"> {unit}</Text> : null}
    </Text>
  );
}

/** "▲ 8%" in green or "▼ 3%" in orange (or the other way round when lower is better). */
export function ChangeBadge({ change, lowerIsBetter = false }: { change: number; lowerIsBetter?: boolean }) {
  const flat = Math.abs(change) < 2;
  const good = flat ? null : change > 0 !== lowerIsBetter;
  const color: Color = good === null ? "secondary" as Color : good ? "green" : "orange";
  return (
    <HStack spacing={3} accessibilityElement="combine" accessibilityLabel={flat ? "About the same" : `${change > 0 ? "Up" : "Down"} ${Math.abs(change)} percent`}>
      <Image systemName={flat ? "equal" : change > 0 ? "arrow.up.right" : "arrow.down.right"} font="caption" fontWeight="bold" foregroundStyle={color} />
      <Text font="caption" fontWeight="semibold" foregroundStyle={color} monospacedDigit>{flat ? "Steady" : format.percent(Math.abs(change) / 100)}</Text>
    </HStack>
  );
}

export function StatTile({ stat }: { stat: Stat }) {
  return (
    <VStack
      alignment="leading"
      spacing={4}
      padding={14}
      frame={{ maxWidth: "infinity", minHeight: 92, alignment: "topLeading" }}
      background="secondarySystemGroupedBackground"
      cornerRadius={14}
      accessibilityElement="combine"
    >
      <HStack spacing={5}>
        {stat.icon ? <Image systemName={stat.icon} font="caption" foregroundStyle={stat.color ?? "secondary"} /> : null}
        <Text font="caption" fontWeight="semibold" foregroundStyle="secondary" textCase="uppercase" lineLimit={1}>{stat.title}</Text>
      </HStack>
      <Text font={{ size: 20, weight: "semibold", design: "rounded" }} monospacedDigit lineLimit={1} minimumScaleFactor={0.7} animation="snappy">{stat.value}</Text>
      {stat.detail ? <Text font="caption" foregroundStyle="secondary" lineLimit={1}>{stat.detail}</Text> : null}
    </VStack>
  );
}
