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
          // (Not `let words = 0` + `words++`: the compiler can't lower an
          // update of a variable captured by a closure.)
          const words: number[] = [];
          const result = await speech.speak("hello there", { volume: 0, rate: 1, onWord: (range) => void words.push(range.start) });
          add(`spoke ${result} ${words.length > 0}`);
        }}
      />
      <Button title="listen" onPress={() => notifications.addListener("response", (r) => add(`tapped ${r.id} ${JSON.stringify(r.data)}`))} />
    </VStack>
  );
}

render(<App />);
