import { useState } from "react";
import { render, VStack, Text, Picker } from "swiftjsx";

function App() {
  const [size, setSize] = useState(1);
  return (
    <VStack>
      <Picker value={size} onChange={setSize} options={[{ value: 1, label: "Small" }, { value: 2, label: "Large" }]} />
      <Text>{`size ${typeof size} ${size}`}</Text>
    </VStack>
  );
}

render(<App />);
