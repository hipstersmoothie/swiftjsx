import { useState } from "react";
import { render, VStack, Text, TextField, Button } from "swiftjsx";

function App() {
  const [digits, setDigits] = useState("12");
  const [dimmed, setDimmed] = useState(false);
  return (
    <VStack>
      {/* Rejects anything that isn't a digit. */}
      <TextField placeholder="Digits" value={digits} onChange={(v) => /^\d*$/.test(v) && setDigits(v)} />
      <TextField placeholder="Dimmed" value="" onChange={() => {}} opacity={dimmed ? 0.5 : undefined} />
      <Text>Plain</Text>
      <Text padding={dimmed ? 8 : undefined}>Padded</Text>
      <Button title="Dim" onPress={() => setDimmed((d) => !d)} />
    </VStack>
  );
}

render(<App />);
