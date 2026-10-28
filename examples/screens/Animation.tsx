import { useState } from "react";
import { Screen, ScrollView, VStack, HStack, Text, Button, AbsoluteStack, AnimatePresence, withAnimation, haptic } from "swiftjsx";

const COLORS = ["orange", "pink", "indigo", "teal", "green", "red", "blue", "purple", "yellow"] as const;
const SLOTS = 9; // A 3×3 board.

type Tile = { id: number; slot: number };

/** A slot's position as fractions of the board: no measuring. */
function place(slot: number) {
  const col = slot % 3;
  const row = Math.floor(slot / 3);
  return { x: `${col * 33.33 + 1.5}%`, y: `${row * 33.33 + 1.5}%`, width: "30.33%", height: "30.33%" } as const;
}

function shuffled(tiles: Tile[]): Tile[] {
  const slots = Array.from({ length: SLOTS }, (_, i) => i).sort(() => Math.random() - 0.5);
  return tiles.map((t, i) => ({ ...t, slot: slots[i] }));
}

export function AnimationDemo() {
  const [tiles, setTiles] = useState<Tile[]>([
    { id: 1, slot: 0 },
    { id: 2, slot: 4 },
    { id: 3, slot: 8 },
  ]);
  const [nextId, setNextId] = useState(4);
  const [finished, setFinished] = useState(0);
  const [exited, setExited] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [pops, setPops] = useState(0);
  const [shakes, setShakes] = useState(0);

  const shuffle = () =>
    withAnimation(
      { type: "spring", duration: 0.5, bounce: 0.3 },
      () => setTiles(shuffled),
      () => setFinished((n) => n + 1),
    );

  const add = () => {
    const used = new Set(tiles.map((t) => t.slot));
    const free = Array.from({ length: SLOTS }, (_, i) => i).filter((i) => !used.has(i));
    if (!free.length) return haptic("error");
    // No withAnimation: the tile's transition carries its own animation.
    setTiles((list) => [...list, { id: nextId, slot: free[Math.floor(Math.random() * free.length)] }]);
    setNextId((n) => n + 1);
  };

  return (
    <Screen title="Animation" titleDisplayMode="inline">
      <ScrollView>
        <VStack alignment="leading" spacing={16} padding={20}>
          <Text font="headline">AbsoluteStack, transitions, exits</Text>
          <Text font="footnote" foregroundStyle="secondary">
            Tiles are placed by percentages of the board. New tiles pop in with their own spring; tapped tiles fly off and fade
            (AnimatePresence), then unmount.
          </Text>
          <AbsoluteStack frame={{ height: 300 }} background="secondarySystemBackground" cornerRadius={16} accessibilityIdentifier="absolute-board" accessibilityElement="contain">
            <AnimatePresence
              exit={{ scale: 1.6, opacity: 0, offset: { x: 0, y: -60 } }}
              animation={{ type: "easeOut", duration: 0.35 }}
              onExitComplete={() => setExited((n) => n + 1)}
            >
              {tiles.map((tile) => (
                <VStack
                  key={tile.id}
                  position={place(tile.slot)}
                  background={COLORS[tile.id % COLORS.length]}
                  cornerRadius={14}
                  transition={{ insert: { type: "scale", animation: "bouncy" }, remove: "identity" }}
                  onTapGesture={() => setTiles((list) => list.filter((t) => t.id !== tile.id))}
                  accessibilityIdentifier={`tile-${tile.id}`}
                  accessibilityElement="combine"
                >
                  <Text font={{ size: 28, weight: "bold", design: "rounded" }} foregroundStyle="white" frame={{ maxWidth: "infinity", maxHeight: "infinity" }}>
                    {tile.id}
                  </Text>
                </VStack>
              ))}
            </AnimatePresence>
          </AbsoluteStack>
          <HStack spacing={12}>
            <Button title="Shuffle" buttonStyle="borderedProminent" onPress={shuffle} accessibilityIdentifier="shuffle" />
            <Button title="Add tile" buttonStyle="bordered" onPress={add} accessibilityIdentifier="add-tile" />
          </HStack>
          <Text font="footnote" monospacedDigit foregroundStyle="secondary" accessibilityIdentifier="animation-status">
            {`Shuffles finished: ${finished} · tiles exited: ${exited}`}
          </Text>

          <Text font="headline" padding={{ top: 12 }}>3D, keyframes</Text>
          <HStack spacing={16}>
            {/* A card flip: the back face is shown past 90°. */}
            <VStack
              frame={{ width: 120, height: 160 }}
              background={flipped ? "indigo" : "orange"}
              cornerRadius={16}
              rotation3D={{ degrees: flipped ? 180 : 0, axis: { y: 1 }, perspective: 0.6 }}
              animation={{ type: "spring", duration: 0.6, bounce: 0.2 }}
              onTapGesture={() => setFlipped((f) => !f)}
              accessibilityIdentifier="flip-card"
              accessibilityLabel={flipped ? "Back" : "Front"}
            >
              <Text font="title" fontWeight="bold" foregroundStyle="white" scaleX={flipped ? -1 : 1}>
                {flipped ? "Back" : "Front"}
              </Text>
            </VStack>
            <VStack spacing={14}>
              <Button
                title="Pop"
                buttonStyle="borderedProminent"
                keyframes={{ trigger: pops, steps: [{ scale: 1.3, duration: 0.12 }, { scale: 0.92, duration: 0.1 }, { scale: 1 }] }}
                onPress={() => setPops((n) => n + 1)}
                accessibilityIdentifier="pop"
              />
              <Button
                title="Shake"
                buttonStyle="bordered"
                tint="red"
                keyframes={{ trigger: shakes, steps: [{ x: -10, duration: 0.06 }, { x: 10, duration: 0.06 }, { x: -6, duration: 0.06 }, { x: 6, duration: 0.06 }, { x: 0 }] }}
                onPress={() => setShakes((n) => n + 1)}
                accessibilityIdentifier="shake"
              />
              <Text
                font="title2"
                keyframes={{ repeat: true, steps: [{ rotation: -12, duration: 0.5 }, { rotation: 12, duration: 0.5 }] }}
              >
                🔔
              </Text>
            </VStack>
          </HStack>
        </VStack>
      </ScrollView>
    </Screen>
  );
}
