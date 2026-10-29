// The key grid. Keys are capsules sized from the measured width (a circle
// when one column wide, the 0 key spans two). Each key is a Button: it
// shrinks natively while pressed (`pressedScale`), a highlight fades in on
// `onPressIn`, sliding off the key un-highlights it, and lifting the finger
// over the key presses it, like a UIButton.
import { useState } from "react";
import { Button, ZStack, VStack, HStack, Capsule, Text, Image, type Color } from "swiftjsx";
import type { KeyKind, KeySpec } from "./keys";

type Palette = { background: Color; foreground: Color; highlight: Color };

/** iOS Calculator colors. Selected operators invert. */
const palettes: Record<KeyKind, Palette> = {
  digit: { background: "#333333", foreground: "white", highlight: "white/35" },
  function: { background: "#A5A5A5", foreground: "black", highlight: "white/55" },
  operator: { background: "#FF9F0A", foreground: "white", highlight: "white/40" },
  scientific: { background: "#212121", foreground: "white", highlight: "white/30" },
};
const selectedPalettes: Partial<Record<KeyKind, Palette>> = {
  operator: { background: "white", foreground: "#FF9F0A", highlight: "#FF9F0A/25" },
  scientific: { background: "#A5A5A5", foreground: "black", highlight: "white/40" },
};

type KeyProps = {
  spec: KeySpec;
  /** Diameter of a one-column key. */
  size: number;
  spacing: number;
  selected: boolean;
  onPress(spec: KeySpec): void;
};

function Key({ spec, size, spacing, selected, onPress }: KeyProps) {
  // The highlight is drawn over the key's own fill, which `pressedBackground`
  // (a rectangle behind the label) can't do, so it follows the press in state.
  const [pressed, setPressed] = useState(false);

  const palette = (selected && selectedPalettes[spec.kind]) || palettes[spec.kind];
  const width = spec.wide ? size * 2 + spacing : size;
  const height = size;
  const fontSize = spec.kind === "digit" ? size * 0.45 : spec.kind === "scientific" ? size * 0.34 : size * 0.38;

  return (
    <Button
      onPress={() => onPress(spec)}
      pressedScale={0.93}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      accessibilityLabel={spec.label}
      accessibilityTraits={selected ? ["selected"] : undefined}
      accessibilityIdentifier={`key-${spec.id}`}
    >
      <ZStack frame={{ width, height }}>
        <Capsule fill={palette.background} animation={{ type: "easeOut", duration: 0.2 }} />
        <Capsule
          fill={palette.highlight}
          opacity={pressed ? 1 : 0}
          animation={pressed ? { type: "easeOut", duration: 0.05 } : { type: "easeOut", duration: 0.35 }}
        />
        <KeyLabel spec={spec} size={size} fontSize={fontSize} color={palette.foreground} />
      </ZStack>
    </Button>
  );
}

function KeyLabel({ spec, size, fontSize, color }: { spec: KeySpec; size: number; fontSize: number; color: Color }) {
  // The 0 key's label sits over the first column, like on iOS.
  const frame = spec.wide ? { maxWidth: "infinity" as const, alignment: "leading" as const } : undefined;
  const padding = spec.wide ? { leading: size / 2 - fontSize * 0.29 } : undefined;
  return spec.symbol ? (
    <Image
      systemName={spec.symbol}
      font={{ size: fontSize * 0.92, weight: "medium" }}
      foregroundStyle={color}
      animation={{ type: "easeOut", duration: 0.2 }}
    />
  ) : (
    <Text
      font={{ size: fontSize, weight: spec.kind === "digit" ? "regular" : "medium" }}
      foregroundStyle={color}
      lineLimit={1}
      minimumScaleFactor={0.5}
      padding={padding}
      frame={frame}
      animation={{ type: "easeOut", duration: 0.2 }}
    >
      {spec.text}
    </Text>
  );
}

type KeypadProps = {
  rows: KeySpec[][];
  size: number;
  spacing: number;
  /** Id of the highlighted operator key. */
  activeKey: string | null;
  onPress(spec: KeySpec): void;
};

export function Keypad({ rows, size, spacing, activeKey, onPress }: KeypadProps) {
  return (
    <VStack spacing={spacing}>
      {rows.map((row, r) => (
        <HStack key={r} spacing={spacing}>
          {row.map((spec, c) => (
            // Keyed by position: AC ↔ C and Deg ↔ Rad keep their key (and its press animation).
            <Key key={`${r}:${c}:${row.length}`} spec={spec} size={size} spacing={spacing} selected={spec.id === activeKey} onPress={onPress} />
          ))}
        </HStack>
      ))}
    </VStack>
  );
}
