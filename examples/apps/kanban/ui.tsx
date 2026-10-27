// Small pieces shared by the screens.
import type { ReactNode } from "react";
import { HStack, VStack, Image, Text, Circle, ScrollView, type Color } from "swiftjsx";
import { boardColors, initials, type BoardColor, type CardLabel, type Member } from "./model";

export function Avatar({ member, size = 22 }: { member: Member; size?: number }) {
  return (
    <Text
      font={{ size: size * 0.42, weight: "bold", design: "rounded" }}
      foregroundStyle="white"
      frame={{ width: size, height: size }}
      background={member.color}
      cornerRadius="capsule"
      accessibilityLabel={`Assigned to ${member.name}`}
    >
      {initials(member.name)}
    </Text>
  );
}

/** A label as a colored capsule. `compact` is the card's dot-and-name style. */
export function LabelCapsule({ label, compact = false }: { label: CardLabel; compact?: boolean }) {
  return (
    <Text
      font={compact ? { size: 11, weight: "semibold" } : "footnote"}
      fontWeight="semibold"
      foregroundStyle={label.color}
      padding={{ horizontal: compact ? 7 : 10, vertical: compact ? 2 : 4 }}
      background={`${label.color}/15` as Color}
      cornerRadius="capsule"
      lineLimit={1}
    >
      {label.name}
    </Text>
  );
}

export function BoardIcon({ color, symbol, size = 40 }: { color: BoardColor; symbol: string; size?: number }) {
  return (
    <Image
      systemName={symbol}
      font={size > 56 ? "title" : "headline"}
      foregroundStyle="white"
      frame={{ width: size, height: size }}
      background={{ gradient: boardColors[color].gradient, start: "topLeading", end: "bottomTrailing" }}
      cornerRadius={size * 0.26}
      accessibilityHidden
    />
  );
}

/** A row of color dots; the selected one has a check. */
export function SwatchPicker({ colors, value, onChange }: { colors: Color[]; value: Color; onChange(color: Color): void }) {
  return (
    <ScrollView axis="horizontal" spacing={10}>
      {colors.map((color) => (
        <Image
          key={color}
          systemName="checkmark"
          font="caption"
          fontWeight="bold"
          foregroundStyle={color === value ? "white" : "clear"}
          frame={{ width: 30, height: 30 }}
          background={color}
          cornerRadius="capsule"
          padding={{ vertical: 6 }}
          scale={color === value ? 1.12 : 1}
          animation="snappy"
          onTapGesture={() => onChange(color)}
          accessibilityLabel={color}
          accessibilityTraits={color === value ? ["button", "selected"] : "button"}
        />
      ))}
    </ScrollView>
  );
}

export function EmptyState({ symbol, title, message, children }: { symbol: string; title: string; message: string; children?: ReactNode }) {
  return (
    <VStack spacing={10} padding={32} frame={{ maxWidth: "infinity", maxHeight: "infinity" }}>
      <Image systemName={symbol} font={{ size: 44, weight: "light" }} foregroundStyle="tertiary" />
      <Text font="title3" fontWeight="semibold">{title}</Text>
      <Text font="subheadline" foregroundStyle="secondary" textAlignment="center">{message}</Text>
      {children}
    </VStack>
  );
}

export function MemberRow({ member }: { member: Member }) {
  return (
    <HStack spacing={10}>
      <Avatar member={member} size={26} />
      <Text>{member.name}</Text>
    </HStack>
  );
}

export function Dot({ color, size = 8 }: { color: Color; size?: number }) {
  return <Circle fill={color} frame={{ width: size, height: size }} accessibilityHidden />;
}
