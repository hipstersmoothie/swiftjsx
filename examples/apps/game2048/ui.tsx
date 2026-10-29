// Score boxes with floating "+N", the clock, buttons and the end-of-game cards.
import { useEffect, useState, type ReactNode } from "react";
import { format, VStack, HStack, Text, Image, Button, Overlay } from "swiftjsx";
import { palette } from "./theme";

// MARK: Score

export type Gain = { id: number; amount: number };

type ScoreBoxProps = {
  label: string;
  value: number;
  identifier: string;
  /** "+N" labels floating up from the box; the parent removes each after GAIN_MS. */
  gains?: Gain[];
};

export const GAIN_MS = 750;

export function ScoreBox({ label, value, identifier, gains = [] }: ScoreBoxProps) {
  return (
    <VStack
      spacing={0}
      padding={{ horizontal: 12, vertical: 6 }}
      frame={{ minWidth: 74 }}
      background={palette.scoreBox}
      cornerRadius={6}
      accessibilityElement="contain"
    >
      <Text font={{ size: 12, weight: "bold" }} foregroundStyle={palette.scoreLabel}>
        {label}
      </Text>
      <Text
        font={{ size: 22, weight: "bold" }}
        foregroundStyle="white"
        monospacedDigit
        lineLimit={1}
        minimumScaleFactor={0.5}
        animation="snappy"
        contentTransition="numericText"
        accessibilityIdentifier={identifier}
      >
        {String(value)}
      </Text>
      <Overlay alignment="bottom" allowsHitTesting={false}>
        {gains.map((gain) => (
          <FloatingGain key={gain.id} amount={gain.amount} />
        ))}
      </Overlay>
    </VStack>
  );
}

/**
 * "+N" rising out of the score and fading. It mounts at rest and starts
 * rising a moment later: a state change in the mount effect itself can land
 * in the same frame as the mount and not animate.
 */
function FloatingGain({ amount }: { amount: number }) {
  const [risen, setRisen] = useState(false);
  useEffect(() => {
    const id = setTimeout(() => setRisen(true), 30);
    return () => clearTimeout(id);
  }, []);
  return (
    <Text
      font={{ size: 22, weight: "bold" }}
      foregroundStyle={palette.gain}
      offset={{ y: risen ? -46 : -8 }}
      opacity={risen ? 0 : 1}
      animation={{ type: "easeIn", duration: 0.6 }}
      accessibilityHidden
    >
      +{amount}
    </Text>
  );
}

// MARK: Clock

/**
 * The game's time. While the clock runs it's a native timer, counting up from
 * when the game would have started without its pauses (nothing re-renders);
 * paused, it's the time committed to the game.
 */
export function Clock({ elapsedMs, since }: { elapsedMs: number; since: number | null }) {
  const font = { size: 15, weight: "semibold" } as const;
  return (
    <HStack spacing={4} accessibilityElement="combine" accessibilityIdentifier="timer">
      <Image systemName="timer" font={{ size: 13, weight: "semibold" }} foregroundStyle={palette.subtext} accessibilityLabel="Time" />
      {since == null ? (
        <Text font={font} foregroundStyle={palette.text} monospacedDigit>
          {format.duration(Math.floor(elapsedMs / 1000))}
        </Text>
      ) : (
        <Text font={font} foregroundStyle={palette.text} monospacedDigit date={since - elapsedMs} dateStyle="timer" />
      )}
    </HStack>
  );
}

export function Stat({ icon, label, accessibilityIdentifier, children }: { icon: string; label: string; accessibilityIdentifier: string; children: ReactNode }) {
  return (
    <HStack spacing={4} accessibilityElement="ignore" accessibilityLabel={label} accessibilityIdentifier={accessibilityIdentifier}>
      <Image systemName={icon} font={{ size: 13, weight: "semibold" }} foregroundStyle={palette.subtext} />
      <Text font={{ size: 15, weight: "semibold" }} foregroundStyle={palette.text} monospacedDigit>
        {children}
      </Text>
    </HStack>
  );
}

// MARK: Buttons

type GameButtonProps = {
  title?: string;
  icon?: string;
  onPress(): void;
  disabled?: boolean;
  accessibilityLabel?: string;
  accessibilityIdentifier?: string;
  /** For attachments (a ConfirmationDialog anchored here). */
  children?: ReactNode;
  width?: number;
  height?: number;
};

/** The classic brown button, with press feedback. */
export function GameButton({ title, icon, onPress, disabled, accessibilityLabel, accessibilityIdentifier, children, width, height = 36 }: GameButtonProps) {
  return (
    <Button
      onPress={onPress}
      disabled={disabled}
      pressedScale={0.94}
      pressedOpacity={0.85}
      accessibilityLabel={accessibilityLabel ?? title}
      accessibilityIdentifier={accessibilityIdentifier}
    >
      <HStack
        spacing={6}
        padding={{ horizontal: title ? 14 : 0 }}
        frame={{ width, height, minWidth: height }}
        background={palette.button}
        cornerRadius={8}
        opacity={disabled ? 0.45 : 1}
      >
        {icon ? <Image systemName={icon} font={{ size: 15, weight: "bold" }} foregroundStyle={palette.buttonText} /> : null}
        {title ? (
          <Text font={{ size: 15, weight: "bold" }} foregroundStyle={palette.buttonText} lineLimit={1}>
            {title}
          </Text>
        ) : null}
      </HStack>
      {children}
    </Button>
  );
}

// MARK: End of game

type EndCardProps = {
  kind: "won" | "over";
  score: number;
  onPrimary(): void;
  onSecondary(): void;
  canUndo: boolean;
};

/** Covers the board: "You win!" (keep going / new game) or "Game over!" (try again / undo). */
export function EndCard({ kind, score, onPrimary, onSecondary, canUndo }: EndCardProps) {
  const won = kind === "won";
  return (
    <VStack
      spacing={18}
      frame={{ maxWidth: "infinity", maxHeight: "infinity" }}
      background={won ? "#EDC22E80" : { light: "#EEE4DABA", dark: "#1C1A17C0" }}
      cornerRadius={8}
      transition="opacity"
      accessibilityElement="contain"
      accessibilityIdentifier={won ? "win-card" : "game-over-card"}
    >
      <Text
        font={{ size: 44, weight: "heavy" }}
        foregroundStyle={won ? "#F9F6F2" : palette.text}
        accessibilityTraits="header"
        accessibilityIdentifier={won ? "you-win" : "game-over"}
      >
        {won ? "You win!" : "Game over!"}
      </Text>
      <Text font={{ size: 17, weight: "semibold" }} foregroundStyle={won ? "#F9F6F2" : palette.text}>
        Score {score}
      </Text>
      <HStack spacing={10}>
        <GameButton
          title={won ? "Keep going" : "Try again"}
          onPress={onPrimary}
          accessibilityIdentifier={won ? "keep-going" : "try-again"}
        />
        {won ? (
          <GameButton title="New game" onPress={onSecondary} accessibilityIdentifier="win-new-game" />
        ) : canUndo ? (
          <GameButton title="Undo" icon="arrow.uturn.backward" onPress={onSecondary} accessibilityIdentifier="over-undo" />
        ) : null}
      </HStack>
    </VStack>
  );
}
