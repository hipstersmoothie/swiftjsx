import { useEffect, useRef, useState } from "react";
import { render, VStack, Text, Button, runOnJS, useSharedValue, useAnimatedStyle } from "swiftjsx";

// Counts commits of <Expensive> from an effect (mutating module state during
// render would make the compiler skip the component).
const renders = { expensive: 0 };

function Expensive({ label }: { label: string }) {
  useEffect(() => {
    renders.expensive++;
  });
  return <Text>{label}</Text>;
}

// A worklet that captures a function reading a ref: compiled (the worklets
// pass runs after the compiler).
function Draggable() {
  const drags = useRef(0);
  const offset = useSharedValue(0);
  const style = useAnimatedStyle(() => ({ offset: { x: offset.get(), y: 0 } }));
  const count = () => {
    drags.current += 1;
  };
  return (
    <Text
      animatedStyle={style}
      onDrag={(e) => {
        "worklet";
        offset.set(e.translation.x);
        runOnJS(count)();
      }}
    >
      drag me
    </Text>
  );
}

function App() {
  const [count, setCount] = useState(0);
  const [reported, setReported] = useState(-1);
  // No memo(), useMemo or useCallback anywhere: the compiler adds them.
  return (
    <VStack>
      <Text>count {count}</Text>
      <Expensive label="static child" />
      <Draggable />
      <Button title="inc" onPress={() => setCount((c) => c + 1)} />
      <Button title="report" onPress={() => setReported(renders.expensive)} />
      <Text>expensive renders {reported}</Text>
    </VStack>
  );
}

render(<App />);
