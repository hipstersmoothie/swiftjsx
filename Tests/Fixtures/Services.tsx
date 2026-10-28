import { useState } from "react";
import { render, VStack, Text, Button, notifications, speech } from "swiftjsx";

function App() {
  const [log, setLog] = useState<string[]>([]);
  const add = (line: string) => setLog((l) => [...l, line]);
  return (
    <VStack>
      <Text>{log.join("|")}</Text>
      <Button title="status" onPress={async () => add(`status ${await notifications.getPermission()}`)} />
      <Button title="voices" onPress={async () => add(`voices ${(await speech.voices()).length > 0}`)} />
      <Button
        title="speak"
        onPress={async () => {
          let words = 0;
          const result = await speech.speak("hello there", { volume: 0, rate: 1, onWord: () => words++ });
          add(`spoke ${result} ${words > 0}`);
        }}
      />
      <Button title="listen" onPress={() => notifications.addListener("response", (r) => add(`tapped ${r.id} ${JSON.stringify(r.data)}`))} />
    </VStack>
  );
}

render(<App />);
