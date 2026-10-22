import { useRef } from "react";
import { render, VirtualList, VStack, Text, Button, HostInstance } from "swiftjsx";

const data = Array.from({ length: 100_000 }, (_, i) => i);

function App() {
  const list = useRef<HostInstance>(null);
  return (
    <VStack>
      <Button title="jump" onPress={() => list.current?.scrollTo(500)} />
      <VirtualList ref={list} data={data} overscan={10} renderItem={(i) => <Text>row {i}</Text>} />
    </VStack>
  );
}

render(<App />);
