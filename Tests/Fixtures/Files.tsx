import { useState } from "react";
import { render, VStack, Text, Button, AsyncStorage, loadFont } from "swiftjsx";

function App() {
  const [log, setLog] = useState("none");
  return (
    <VStack>
      <Text>{log}</Text>
      <Button
        title="storage"
        onPress={async () => {
          const key = "swiftjsx-test/a key with / and spaces";
          await AsyncStorage.setItem(key, "one");
          await AsyncStorage.multiSet([["swiftjsx-test/b", "two"], ["swiftjsx-test/c", JSON.stringify({ x: 1 })]]);
          await AsyncStorage.mergeItem("swiftjsx-test/c", JSON.stringify({ y: 2 }));
          const a = await AsyncStorage.getItem(key);
          const many = await AsyncStorage.multiGet(["swiftjsx-test/b", "swiftjsx-test/missing"]);
          const keys = (await AsyncStorage.getAllKeys()).filter((k) => k.startsWith("swiftjsx-test/"));
          const c = await AsyncStorage.getItem("swiftjsx-test/c");
          await AsyncStorage.multiRemove(keys);
          const after = (await AsyncStorage.getAllKeys()).filter((k) => k.startsWith("swiftjsx-test/"));
          setLog(`${a}|${JSON.stringify(many)}|${keys.length}|${c}|${after.length}`);
        }}
      />
      <Button
        title="font"
        onPress={async () => {
          const font = await loadFont("file:///System/Library/Fonts/Supplemental/Arial%20Narrow.ttf");
          setLog(`font ${font.family} ${font.names[0]}`);
        }}
      />
    </VStack>
  );
}

render(<App />);
