// The study deck: the top card follows your finger on the main thread
// (worklets), tilts as it goes, and shows a "Got it" / "Again" hint. Let go
// past the threshold and it flies off; otherwise it springs back. The next
// card waits behind it, scaled down, and grows into place.
import { useEffect, useState } from "react";
import {
  ZStack, VStack, HStack, Text, Label, Spacer, withAnimation,
  useSharedValue, useAnimatedStyle, withSpring, withTiming, runOnJS,
  type SharedValue, type AnimatedStyle, type Color,
} from "swiftjsx";
import type { Card } from "./model";
import type { Theme } from "./theme";
import { BoxMeter } from "./ui";

type Point = { x: number; y: number };
// A local alias: the worklets pass would capture an imported type named in a
// worklet's signature as if it were a value.
type Offset = SharedValue<Point>;
/** How the top card is leaving: `fling` when a button (not a swipe) answered. */
export type Exit = { knewIt: boolean; fling: boolean };

/** Points the card must be dragged (or flicked) sideways to count as an answer. */
const SWIPE_THRESHOLD = 110;
const FLY_DISTANCE = 650;
/** Seconds. The session waits this long before showing the next card. */
export const FLY_DURATION = 0.3;

const swipeProgress = (x: number) => {
  "worklet";
  return Math.min(Math.abs(x) / SWIPE_THRESHOLD, 1);
};

/** Sends a card off screen. Runs on the main thread (swipes) or the JS thread (buttons). */
const flyOff = (offset: Offset, direction: number, y: number, easing: "easeIn" | "easeOut") => {
  "worklet";
  offset.set(withTiming({ x: direction * FLY_DISTANCE, y }, { duration: FLY_DURATION, easing }));
};

type StackProps = {
  cards: Card[];
  index: number;
  exit: Exit | null;
  theme: Theme;
  onSwipe(knewIt: boolean): void;
};

export function CardStack({ cards, index, exit, theme, onSwipe }: StackProps) {
  // Back to front: the next card first, so the top card draws over it.
  const visible = cards.slice(index, index + 2).reverse();
  return (
    <ZStack frame={{ maxWidth: "infinity", maxHeight: "infinity" }} animation="spring">
      {visible.map((card) =>
        card === cards[index] ? (
          <StackCard key={card.id} card={card} theme={theme} position="top" exit={exit} onSwipe={onSwipe} />
        ) : (
          <StackCard key={card.id} card={card} theme={theme} position={exit ? "rising" : "behind"} />
        ),
      )}
    </ZStack>
  );
}

type CardProps = {
  card: Card;
  theme: Theme;
  /** "rising": the top card is leaving and this one is taking its place. */
  position: "top" | "behind" | "rising";
  exit?: Exit | null;
  onSwipe?(knewIt: boolean): void;
};

function StackCard({ card, theme, position, exit, onSwipe }: CardProps) {
  const [flipped, setFlipped] = useState(false);
  const offset = useSharedValue<Point>({ x: 0, y: 0 });
  const lifted = useSharedValue(false);
  const gone = useSharedValue(false);
  const isTop = position === "top";

  // Separate nodes: one style update takes a single animation, so a springy
  // lift would otherwise also animate the offset that tracks the finger.
  const drag = useAnimatedStyle(() => ({ offset: offset.get(), rotation: offset.get().x / 16 }));
  const lift = useAnimatedStyle(() => ({
    scale: lifted.get() ? 1.03 : 1,
    shadow: { radius: lifted.get() ? 24 : 12, y: lifted.get() ? 14 : 6, color: "#00000040" },
  }));
  // One layer per color: styles are evaluated at an animation's end state, so
  // a single layer picking its color from x would turn green as it springs back to 0.
  const knewTint = useAnimatedStyle(() => ({ opacity: offset.get().x > 0 ? swipeProgress(offset.get().x) * 0.35 : 0 }));
  const againTint = useAnimatedStyle(() => ({ opacity: offset.get().x < 0 ? swipeProgress(offset.get().x) * 0.35 : 0 }));
  const knewStamp = useAnimatedStyle(() => ({ opacity: offset.get().x > 0 ? swipeProgress(offset.get().x) : 0 }));
  const againStamp = useAnimatedStyle(() => ({ opacity: offset.get().x < 0 ? swipeProgress(offset.get().x) : 0 }));

  // The "Got it" / "Again" buttons throw the card; a swipe already did.
  const fling = exit?.fling ? (exit.knewIt ? 1 : -1) : 0;
  useEffect(() => {
    if (!fling) return;
    gone.set(true);
    flyOff(offset, fling, 40, "easeIn");
  }, [fling, gone, offset]);

  const flip = () => withAnimation({ type: "spring", duration: 0.35 }, () => setFlipped((f) => !f));

  return (
    // Three layers: the place in the stack (plain props), the drag and tilt,
    // and the card itself, which lifts while held.
    <VStack
      scale={position === "behind" ? 0.92 : 1}
      offset={{ y: position === "behind" ? 34 : 0 }}
      animation="spring"
      transition="opacity"
      accessibilityHidden={!isTop}
    >
      <ZStack
        animatedStyle={drag}
        onTapGesture={isTop ? flip : undefined}
        onDrag={
          isTop
            ? (e) => {
                "worklet";
                if (gone.get()) return;
                if (!lifted.get()) lifted.set(withSpring(true, { duration: 0.25 }));
                offset.set(e.translation);
              }
            : undefined
        }
        onDragEnd={
          isTop
            ? (e) => {
                "worklet";
                if (gone.get()) return;
                lifted.set(withSpring(false));
                const { x, y } = e.translation;
                const flick = e.predictedEndTranslation.x;
                const decisive = Math.abs(x) > SWIPE_THRESHOLD ? x : Math.abs(flick) > SWIPE_THRESHOLD * 2.5 ? flick : 0;
                if (decisive === 0) {
                  offset.set(withSpring({ x: 0, y: 0 }, { bounce: 0.35 }));
                  return;
                }
                gone.set(true);
                flyOff(offset, Math.sign(decisive), y + e.velocity.y * 0.15, "easeOut");
                runOnJS(onSwipe!)(decisive > 0);
              }
            : undefined
        }
        accessibilityElement="ignore"
        accessibilityLabel={flipped ? `Answer: ${card.back}` : `Question: ${card.front}`}
        accessibilityHint="Double-tap to flip the card. Use Got it or Again below to answer."
        accessibilityTraits="button"
        accessibilityIdentifier={isTop ? "study-card" : undefined}
      >
        <ZStack frame={{ maxWidth: "infinity", maxHeight: "infinity" }} cornerRadius={28} animatedStyle={lift}>
          <CardFace key={flipped ? "back" : "front"} card={card} theme={theme} side={flipped ? "back" : "front"} />
          <VStack frame={{ maxWidth: "infinity", maxHeight: "infinity" }} background="green" animatedStyle={knewTint} />
          <VStack frame={{ maxWidth: "infinity", maxHeight: "infinity" }} background="red" animatedStyle={againTint} />
          <Stamp label="GOT IT" color="green" alignment="topLeading" rotation={-12} style={knewStamp} />
          <Stamp label="AGAIN" color="red" alignment="topTrailing" rotation={12} style={againStamp} />
        </ZStack>
      </ZStack>
    </VStack>
  );
}

function CardFace({ card, theme, side }: { card: Card; theme: Theme; side: "front" | "back" }) {
  const front = side === "front";
  const text = front ? card.front : card.back;
  return (
    <VStack
      spacing={16}
      padding={28}
      frame={{ maxWidth: "infinity", maxHeight: "infinity" }}
      background={front ? { gradient: theme.gradient, start: "topLeading", end: "bottomTrailing" } : { gradient: ["#3A3A3C", "#1C1C1E"] }}
      transition="opacity"
    >
      <HStack>
        <Text font="caption" fontWeight="bold" foregroundStyle={front ? "secondary" : theme.tint}>
          {front ? "QUESTION" : "ANSWER"}
        </Text>
        <Spacer />
        <BoxMeter box={card.box} fill="white" track="#FFFFFF40" />
      </HStack>
      <Spacer />
      <Text
        font={text.length > 50 ? "title2" : "largeTitle"}
        fontWeight="bold"
        fontDesign="rounded"
        foregroundStyle="white"
        textAlignment="center"
      >
        {text}
      </Text>
      <Spacer />
      <Label
        title={front ? "Tap to reveal" : "Swipe right if you knew it"}
        systemImage={front ? "hand.tap" : "hand.draw"}
        font="footnote"
        foregroundStyle="secondary"
      />
    </VStack>
  );
}

type StampProps = { label: string; color: Color; alignment: "topLeading" | "topTrailing"; rotation: number; style: AnimatedStyle };

function Stamp({ label, color, alignment, rotation, style }: StampProps) {
  return (
    <VStack frame={{ maxWidth: "infinity", maxHeight: "infinity", alignment }} padding={{ horizontal: 22, top: 44 }}>
      <Text
        font="title2"
        fontWeight="heavy"
        foregroundStyle="white"
        padding={{ horizontal: 12, vertical: 6 }}
        background={color}
        cornerRadius={10}
        rotation={rotation}
        animatedStyle={style}
      >
        {label}
      </Text>
    </VStack>
  );
}
