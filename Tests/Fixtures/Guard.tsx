import { useState } from "react";
import { render, VStack, Text, Button, native, onMain } from "swiftjsx";

// macOS fixture; `native`'s types are iOS's, so reach AppKit untyped.
const appKit = native as any;

function attempt(fn: () => unknown): string {
  try {
    fn();
    return "ran";
  } catch (e) {
    const error = e as Error & { code?: string };
    return `threw ${error.code ?? "?"}: ${error.message}`;
  }
}

function App() {
  const [off, setOff] = useState("none");
  const [on, setOn] = useState("none");
  const [allowed, setAllowed] = useState("none");
  return (
    <VStack>
      <Text>guard {String((globalThis as any).__swiftjsx_mainThreadGuard)}</Text>
      {/* NSView inherits @MainActor from NSResponder. */}
      <Button title="off main" onPress={() => setOff(attempt(() => appKit.NSView.new()))} />
      <Text>off {off}</Text>
      <Button title="on main" onPress={() => onMain(() => attempt(() => appKit.NSView.new())).then(setOn)} />
      <Text>on {on}</Text>
      <Button title="allowed" onPress={() => setAllowed(attempt(() => native.NSProcessInfo.processInfo.processName))} />
      <Text>allowed {allowed}</Text>
    </VStack>
  );
}

render(<App />);
