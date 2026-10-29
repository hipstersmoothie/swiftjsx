// Small pieces shared by the screens.
import { HStack, VStack, Image, LazyVGrid, IconTile, type Color } from "swiftjsx";
import { MAX_BOX, type Box } from "./model";
import { themeOf, themeNames, themes, symbols, type ThemeName } from "./theme";

export function DeckIcon({ theme, symbol, size = 44 }: { theme: string; symbol: string; size?: number }) {
  return (
    <IconTile
      systemImage={symbol}
      size={size}
      color={{ gradient: themeOf(theme).gradient, start: "topLeading", end: "bottomTrailing" }}
      // The app's glyph size (IconTile's default is 55% of the tile).
      font={size > 60 ? "largeTitle" : "title3"}
    />
  );
}

/** Which Leitner box a card is in, as five little bars. */
export function BoxMeter({ box, fill, track = "#8884" }: { box: Box; fill: Color; track?: Color }) {
  return (
    <HStack spacing={3} accessibilityElement="ignore" accessibilityLabel={`Box ${box} of ${MAX_BOX}`}>
      {Array.from({ length: MAX_BOX }, (_, i) => (
        <VStack key={i} frame={{ width: 12, height: 4 }} cornerRadius={2} background={i < box ? fill : track} />
      ))}
    </HStack>
  );
}

export function ThemePicker({ value, onChange }: { value: ThemeName; onChange(theme: ThemeName): void }) {
  return (
    <HStack spacing={12} padding={{ vertical: 6 }}>
      {themeNames.map((name) => (
        <Image
          key={name}
          systemName="checkmark"
          font="footnote"
          fontWeight="bold"
          foregroundStyle={name === value ? "white" : "clear"}
          frame={{ width: 32, height: 32 }}
          background={{ gradient: themes[name].gradient, start: "topLeading", end: "bottomTrailing" }}
          cornerRadius={16}
          scale={name === value ? 1.1 : 1}
          animation="snappy"
          onTapGesture={() => onChange(name)}
          accessibilityLabel={themes[name].name}
          accessibilityTraits={name === value ? ["button", "selected"] : "button"}
        />
      ))}
    </HStack>
  );
}

export function SymbolPicker({ value, theme, onChange }: { value: string; theme: ThemeName; onChange(symbol: string): void }) {
  return (
    <LazyVGrid columns={6} spacing={10} padding={{ vertical: 6 }}>
      {symbols.map((symbol) => (
        <Image
          key={symbol}
          systemName={symbol}
          foregroundStyle={symbol === value ? "white" : "secondary"}
          frame={{ width: 40, height: 40 }}
          background={symbol === value ? themes[theme].tint : "tertiarySystemFill"}
          cornerRadius={10}
          animation="snappy"
          onTapGesture={() => onChange(symbol)}
          accessibilityLabel={symbol.split(".")[0]}
          accessibilityTraits={symbol === value ? ["button", "selected"] : "button"}
        />
      ))}
    </LazyVGrid>
  );
}
