import { useState } from "react";
import { render, VStack, Text, Button, useSharedValue, useAnimatedStyle, withSpring, runOnJS } from "swiftjsx";

const LIMIT = 100;

function App() {
  const offset = useSharedValue({ x: 0, y: 0 });
  const [drops, setDrops] = useState(0);
  const [read, setRead] = useState("");
  const style = useAnimatedStyle(() => ({ offset: offset.get(), opacity: offset.get().y > 50 ? 0.5 : 1 }));
  const dropped = () => setDrops((n) => n + 1);

  return (
    <VStack>
      <Text>drops {drops}</Text>
      <Text>read {read}</Text>
      <VStack
        accessibilityIdentifier="card"
        animatedStyle={style}
        onDrag={(e) => {
          "worklet";
          offset.set({ x: Math.min(e.translation.x, LIMIT), y: e.translation.y });
        }}
        onDragEnd={() => {
          "worklet";
          offset.set(withSpring({ x: 0, y: 0 }, { bounce: 0.2 }));
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
