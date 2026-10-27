// End of a session: score, best run, day streak, and a little celebration.
import { useEffect, useState } from "react";
import {
  ScrollView, VStack, HStack, ZStack, Text, Image, Label, Button,
  useSharedValue, useAnimatedStyle, withSpring, withTiming, type SharedValue, type Color,
} from "swiftjsx";
import { bestRun, currentStreak, plural } from "./model";
import { useFlashcards, useNow } from "./store";
import type { Theme } from "./theme";

type Props = { theme: Theme; results: boolean[]; onReviewMissed(): void; onDone(): void };

export function Summary({ theme, results, onReviewMissed, onDone }: Props) {
  const streak = useFlashcards((s) => s.streak);
  const now = useNow();
  const correct = results.filter(Boolean).length;
  const missed = results.length - correct;
  const score = Math.round((correct / results.length) * 100);
  const verdict =
    score >= 80 ? { symbol: "trophy.fill", color: "yellow" as const, title: "Excellent!" }
    : score >= 50 ? { symbol: "star.fill", color: "orange" as const, title: "Nice work" }
    : { symbol: "figure.walk", color: theme.tint, title: "Keep going" };

  return (
    <ScrollView transition="opacity">
      <VStack spacing={28} padding={{ horizontal: 24, vertical: 32 }}>
        <Celebration symbol={verdict.symbol} color={verdict.color} />
        <VStack spacing={6} accessibilityElement="combine">
          <Text font="largeTitle" fontWeight="bold" fontDesign="rounded">{verdict.title}</Text>
          <Text foregroundStyle="secondary">You knew {correct} of {plural(results.length, "card")}.</Text>
        </VStack>
        <HStack spacing={12}>
          <StatTile value={`${score}%`} label="Score" symbol="target" color="blue" />
          <StatTile value={`${bestRun(results)}`} label="Best run" symbol="bolt.fill" color="yellow" />
          <StatTile value={`${currentStreak(streak, now)}`} label="Day streak" symbol="flame.fill" color="orange" />
        </HStack>
        <VStack spacing={12}>
          {missed ? (
            <Button buttonStyle="borderedProminent" tint={theme.tint} onPress={onReviewMissed} accessibilityIdentifier="review-missed">
              <Label title={`Review ${missed} Missed`} systemImage="arrow.counterclockwise" font="headline" padding={{ vertical: 8 }} frame={{ maxWidth: "infinity" }} />
            </Button>
          ) : null}
          <Button buttonStyle="bordered" onPress={onDone} accessibilityIdentifier="done">
            <Text font="headline" padding={{ vertical: 8 }} frame={{ maxWidth: "infinity" }}>Done</Text>
          </Button>
        </VStack>
      </VStack>
    </ScrollView>
  );
}

/** Where the sparks end up, around the badge. */
const SPARKS = Array.from({ length: 10 }, (_, i) => {
  const angle = (i / 10) * Math.PI * 2;
  const distance = i % 2 ? 90 : 120;
  return { x: Math.cos(angle) * distance, y: Math.sin(angle) * distance };
});

/** The badge springs in with a wobble while sparks burst out from behind it, and a glow keeps breathing. */
function Celebration({ symbol, color }: { symbol: string; color: Color }) {
  const appear = useSharedValue(0);
  const burst = useSharedValue(0);
  const [breathing, setBreathing] = useState(false);
  useEffect(() => {
    appear.set(withSpring(1, { duration: 0.7, bounce: 0.55 }));
    burst.set(withTiming(1, { duration: 0.9, easing: "easeOut", delay: 0.1 }));
  }, [appear, burst]);

  // Styles only map end states; SwiftUI interpolates the props (with the spring's overshoot).
  const badge = useAnimatedStyle(() => ({
    scale: 0.2 + 0.8 * appear.get(),
    rotation: -30 * (1 - appear.get()),
    opacity: appear.get(),
  }));

  return (
    <ZStack frame={{ width: 220, height: 220 }} accessibilityHidden>
      <VStack
        frame={{ width: 150, height: 150 }}
        cornerRadius={75}
        background={color}
        opacity={breathing ? 0.25 : 0.12}
        scale={breathing ? 1.08 : 0.92}
        animation={{ type: "easeInOut", duration: 1.4, repeatForever: true }}
        onAppear={() => setBreathing(true)}
      />
      {SPARKS.map((to, i) => (
        <Spark key={i} to={to} progress={burst} color={i % 2 ? color : "pink"} />
      ))}
      <Image systemName={symbol} resizable frame={{ width: 92, height: 92 }} foregroundStyle={color} shadow={{ radius: 10, y: 4, color: "#0000002A" }} animatedStyle={badge} />
    </ZStack>
  );
}

function Spark({ to, progress, color }: { to: { x: number; y: number }; progress: SharedValue<number>; color: Color }) {
  const style = useAnimatedStyle(() => ({
    offset: { x: to.x * progress.get(), y: to.y * progress.get() },
    scale: 0.4 + progress.get(),
    opacity: 1 - progress.get(),
  }));
  return <Image systemName="sparkle" font="title3" foregroundStyle={color} animatedStyle={style} />;
}

function StatTile({ value, label, symbol, color }: { value: string; label: string; symbol: string; color: Color }) {
  return (
    <VStack
      spacing={6}
      padding={{ vertical: 14 }}
      frame={{ maxWidth: "infinity" }}
      background="tertiarySystemFill"
      cornerRadius={16}
      accessibilityElement="combine"
    >
      <Image systemName={symbol} foregroundStyle={color} />
      <Text font="title2" fontWeight="bold" fontDesign="rounded" monospacedDigit>{value}</Text>
      <Text font="caption" foregroundStyle="secondary">{label}</Text>
    </VStack>
  );
}
