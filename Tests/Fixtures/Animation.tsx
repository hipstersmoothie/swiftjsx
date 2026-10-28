import { useState } from "react";
import { render, withAnimation, VStack, Text, Button } from "swiftjsx";

function App() {
  const [open, setOpen] = useState(false);
  const [count, setCount] = useState(0);
  const [finished, setFinished] = useState("none");
  return (
    <VStack>
      <Text>{open ? "open" : "closed"}</Text>
      <Text>count {count}</Text>
      <Button title="Animated" onPress={() => withAnimation({ type: "spring", bounce: 0.3 }, () => setOpen((o) => !o))} />
      <Text>finished {finished}</Text>
      <Button
        title="With completion"
        onPress={() => withAnimation("snappy", () => setOpen((o) => !o), () => setFinished("animated"))}
      />
      <Button title="Nothing changes" onPress={() => withAnimation("snappy", () => {}, () => setFinished("no-op"))} />
      <Button title="Plain" onPress={() => setCount((c) => c + 1)} />
    </VStack>
  );
}

render(<App />);
