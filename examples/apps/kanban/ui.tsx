// Small pieces shared by the screens.
import { HStack, Image, Text, Circle, ScrollView, Avatar, IconTile, type Color } from "swiftjsx";
import { boardColors, type BoardColor, type CardLabel, type Member } from "./model";

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
    <IconTile
      systemImage={symbol}
      size={size}
      color={{ gradient: boardColors[color].gradient, start: "topLeading", end: "bottomTrailing" }}
      // The app's glyph size (IconTile's default is 55% of the tile).
      font={size > 56 ? "title" : "headline"}
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

export function MemberRow({ member }: { member: Member }) {
  return (
    <HStack spacing={10}>
      <Avatar name={member.name} color={member.color} size={26} />
      <Text>{member.name}</Text>
    </HStack>
  );
}

export function Dot({ color, size = 8 }: { color: Color; size?: number }) {
  return <Circle fill={color} frame={{ width: size, height: size }} accessibilityHidden />;
}
