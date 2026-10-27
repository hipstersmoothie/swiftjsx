// The key grid. Keys are capsules sized from the measured width (a circle
// when one column wide, the 0 key spans two). Press feedback runs on the main
// thread: a drag gesture with no minimum distance is the "touch down", and
// worklets scale the key and fade in a highlight in the same frame, with no
// React render. Lifting the finger over the key presses it (runOnJS).
import { ZStack, VStack, HStack, Capsule, Text, Image, useSharedValue, useAnimatedStyle, withTiming, runOnJS, type Color } from "swiftjsx";
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
  const pressed = useSharedValue(false);
  // Two nodes, two styles: the whole key shrinks a little, the highlight fades in.
  const shrink = useAnimatedStyle(() => ({ scale: pressed.get() ? 0.93 : 1 }));
  const glow = useAnimatedStyle(() => ({ opacity: pressed.get() ? 1 : 0 }));

  const palette = (selected && selectedPalettes[spec.kind]) || palettes[spec.kind];
  const width = spec.wide ? size * 2 + spacing : size;
  const height = size;
  const fontSize = spec.kind === "digit" ? size * 0.45 : spec.kind === "scientific" ? size * 0.34 : size * 0.38;
  const press = () => onPress(spec);

  return (
    <ZStack
      frame={{ width, height }}
      animatedStyle={shrink}
      dragMinimumDistance={0}
      onDrag={(e) => {
        "worklet";
        // Sliding off the key un-highlights it, like a UIButton.
        const inside = Math.abs(e.translation.x) < width * 0.8 && Math.abs(e.translation.y) < height * 0.8;
        if (inside !== pressed.get()) pressed.set(inside ? withTiming(true, { duration: 0.05 }) : withTiming(false, { duration: 0.25 }));
      }}
      onDragEnd={(e) => {
        "worklet";
        const inside = Math.abs(e.translation.x) < width * 0.8 && Math.abs(e.translation.y) < height * 0.8;
        pressed.set(withTiming(false, { duration: 0.35, easing: "easeOut" }));
        if (inside) runOnJS(press)();
      }}
      accessibilityElement="ignore"
      accessibilityLabel={spec.label}
      accessibilityTraits={selected ? ["button", "selected"] : "button"}
      accessibilityIdentifier={`key-${spec.id}`}
    >
      <Capsule fill={palette.background} animation={{ type: "easeOut", duration: 0.2 }} />
      <Capsule fill={palette.highlight} opacity={0} animatedStyle={glow} />
      <KeyLabel spec={spec} size={size} fontSize={fontSize} color={palette.foreground} />
    </ZStack>
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
