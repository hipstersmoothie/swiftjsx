import { useState } from "react";
import { render, VStack, Text, Button, AnimatePresence } from "swiftjsx";

function App() {
  const [items, setItems] = useState(["a", "b", "c"]);
  const [done, setDone] = useState<string[]>([]);
  return (
    <VStack>
      <AnimatePresence exit={{ opacity: 0, offset: { x: 0, y: -40 } }} animation="snappy" onExitComplete={(key) => setDone((d) => [...d, String(key)])}>
        {items.map((item) => (
          <Text key={item}>item {item}</Text>
        ))}
      </AnimatePresence>
      <Text>exited {done.join(",")}</Text>
      <Button title="remove b" onPress={() => setItems((list) => list.filter((i) => i !== "b"))} />
      <Button title="add b" onPress={() => setItems((list) => [...list, "b"])} />
    </VStack>
  );
}

render(<App />);
