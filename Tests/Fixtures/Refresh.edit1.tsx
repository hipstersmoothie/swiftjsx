import { useState } from "react";
import { render, VStack, Text, Button } from "swiftjsx";

function Counter() {
  const [count, setCount] = useState(0);
  return (
    <VStack>
      <Text>Clicks: {count}</Text>
      <Button title="inc" onPress={() => setCount((c) => c + 1)} />
    </VStack>
  );
}

render(<Counter />);
