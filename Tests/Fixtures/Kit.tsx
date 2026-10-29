import { render, VStack, Text, Button, ContentUnavailable, format, usePersistentState, useDebouncedValue, toast } from "swiftjsx";
import { useState } from "react";

function App() {
  const [count, setCount] = usePersistentState("kit-count", 0);
  const [typed, setTyped] = useState("a");
  const [settled, pending] = useDebouncedValue(typed, 100);
  const now = Date.UTC(2026, 9, 28, 12, 0, 0);
  return (
    <VStack>
      <Text>{`compact ${format.compact(12_400)}`}</Text>
      <Text>{`percent ${format.percent(0.42)}`}</Text>
      <Text>{`currency ${format.currency(12.5, "USD")}`}</Text>
      <Text>{`bytes ${format.bytes(1_500_000)}`}</Text>
      <Text>{`duration ${format.duration(3909)} ${format.duration(309)} ${format.duration(3909, "short")}`}</Text>
      <Text>{`count ${format.count(1, { one: "# card", other: "# cards" })} ${format.count(3, { one: "# card", other: "# cards" })}`}</Text>
      <Text>{`list ${format.list(["a", "b", "c"])}`}</Text>
      <Text>{`ago ${format.relativeTime(now - 5 * 60_000, { now })} ${format.relativeTime(now - 3 * 3600_000, { now })} ${format.relativeTime(now - 5 * 60_000, { now, style: "long" })}`}</Text>
      <Text>{`day ${format.relativeDay(now, { now })} ${format.relativeDay(now - 86_400_000, { now })}`}</Text>
      <Text>{`stored ${count}`}</Text>
      <Text>{`debounced ${settled} ${pending}`}</Text>
      <Text date={now} dateStyle="time" />
      <ContentUnavailable systemImage="tray" title="Nothing here" description="Add something">
        <Button title="Add" onPress={() => setCount((c) => c + 1)} />
      </ContentUnavailable>
      <Button title="inc" onPress={() => setCount((c) => c + 1)} />
      <Button title="type" onPress={() => setTyped((t) => t + "b")} />
      <Button title="toast" onPress={() => toast("Saved", { systemImage: "checkmark" })} />
    </VStack>
  );
}

render(<App />);
