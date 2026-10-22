import { useState } from "react";
import { render, VStack, Text, Button, native, onMain, isNativeAvailable } from "swiftjsx";

function App() {
  const [hop, setHop] = useState("none");
  const [access, setAccess] = useState("none");
  return (
    <VStack>
      <Text>available {String(isNativeAvailable())}</Text>
      <Button title="hop" onPress={() => onMain(() => 1).catch((e: Error) => setHop("error: " + e.message))} />
      <Text>hop {hop}</Text>
      <Button
        title="access"
        onPress={() => {
          try {
            setAccess("got " + String(native.NSProcessInfo));
          } catch (e) {
            setAccess("error: " + (e as Error).message);
          }
        }}
      />
      <Text>access {access}</Text>
    </VStack>
  );
}

render(<App />);
