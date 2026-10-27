import { useState } from "react";
import { render, VStack, Text, Button, useSharedValue, useAnimatedStyle, withSpring, withTiming, runOnJS, type DragEvent } from "swiftjsx";

const LIMIT = 100;

// A worklet helper declared as a function (and typed).
function clampX(x: number): number {
  "worklet";
  return Math.min(x, LIMIT);
}

function App() {
  const offset = useSharedValue({ x: 0, y: 0 });
  const [drops, setDrops] = useState(0);
  const [read, setRead] = useState("");
  const [droppedAt, setDroppedAt] = useState("");
  const lifted = useSharedValue(false);
  const style = useAnimatedStyle(() => ({ offset: offset.get(), opacity: offset.get().y > 50 ? 0.5 : 1, scale: lifted.get() ? 1.1 : 1 }));
  // Runs after the worklet, and sees the values it wrote.
  const dropped = () => {
    setDrops((n) => n + 1);
    setDroppedAt(`${offset.get().x},${offset.get().y}`);
  };

  return (
    <VStack>
      <Text>drops {drops}</Text>
      <Text>read {read}</Text>
      <Text>dropped at {droppedAt}</Text>
      <VStack
        accessibilityIdentifier="card"
        animatedStyle={style}
        onDrag={(e: DragEvent) => {
          "worklet";
          if (!lifted.get()) lifted.set(withSpring(true));
          offset.set({ x: clampX(e.translation.x), y: e.translation.y });
        }}
        onDragEnd={() => {
          "worklet";
          lifted.set(withSpring(false, { bounce: 0.2 }));
          offset.set(withTiming({ x: 0, y: 0 }, { duration: 0.2 }));
          runOnJS(dropped)();
        }}
      >
        <Text>card</Text>
      </VStack>
      <Button title="Set from JS" onPress={() => offset.set({ x: 5, y: 5 })} />
      <Button title="Read" onPress={() => setRead(`${offset.get().x},${offset.get().y}`)} />
    </VStack>
  );
}

render(<App />);
