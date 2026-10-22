import { useEffect, useState } from "react";
import { render, VStack, Text, Button } from "swiftjsx";

// Counts commits of <Expensive> from an effect (mutating module state during
// render would make the compiler skip the component).
const renders = { expensive: 0 };

function Expensive({ label }: { label: string }) {
  useEffect(() => {
    renders.expensive++;
  });
  return <Text>{label}</Text>;
}

function App() {
  const [count, setCount] = useState(0);
  const [reported, setReported] = useState(-1);
  // No memo(), useMemo or useCallback anywhere: the compiler adds them.
  return (
    <VStack>
      <Text>count {count}</Text>
      <Expensive label="static child" />
      <Button title="inc" onPress={() => setCount((c) => c + 1)} />
      <Button title="report" onPress={() => setReported(renders.expensive)} />
      <Text>expensive renders {reported}</Text>
    </VStack>
  );
}

render(<App />);
