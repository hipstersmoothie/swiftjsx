// "Bake · 25 min" chips that start a timer, on the recipe page and in cooking mode.
import { HStack, Text, Image, Button, ContextMenu, Label } from "swiftjsx";
import { formatDuration } from "./steps";
import { ACCENT } from "./ui";

/**
 * "Bake · 25 min": starts a timer. Touch and hold for other lengths (a
 * context menu: a Menu can't have a custom label, only title + systemImage).
 */
export function TimerButton({ label, display, seconds, onStart, large }: {
  label: string;
  display: string;
  seconds: number;
  onStart(label: string, seconds: number): void;
  large?: boolean;
}) {
  return (
    <Button
      buttonStyle="plain"
      pressedScale={0.95}
      onPress={() => onStart(label, seconds)}
      accessibilityLabel={`Start ${label.toLowerCase()} timer, ${display}`}
      accessibilityHint="Touch and hold for other lengths"
    >
      <HStack spacing={6} padding={{ horizontal: large ? 16 : 12, vertical: large ? 10 : 6 }} background={large ? "orange/25" : "orange/15"} cornerRadius="capsule">
        <Image systemName="timer" font={large ? "title3" : "subheadline"} foregroundStyle={ACCENT} />
        <Text font={large ? "title3" : "subheadline"} fontWeight="semibold" foregroundStyle={ACCENT}>
          {label} · {display}
        </Text>
      </HStack>
      <ContextMenu>
        {[0.5, 0.75, 1.25, 1.5, 2].map((f) => (
          <Button key={f} onPress={() => onStart(label, Math.round(seconds * f))}>
            <Label title={`${label} · ${formatDuration(Math.round(seconds * f))}`} systemImage="timer" />
          </Button>
        ))}
      </ContextMenu>
    </Button>
  );
}
