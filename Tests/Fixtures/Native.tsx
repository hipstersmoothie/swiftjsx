import { useState } from "react";
import { render, VStack, Text, Button, native, onMain, isNativeAvailable, useNativeValue } from "swiftjsx";

let reads = 0;
const countRead = () => ++reads;

function App() {
  const [hop, setHop] = useState("none");
  const [after, setAfter] = useState("none");
  const [note, setNote] = useState("none");
  const [rejected, setRejected] = useState("none");
  const [sorted, setSorted] = useState("none");
  const process = useNativeValue(() => native.NSProcessInfo.processInfo.processName, { mainThread: false });
  const refreshes = useNativeValue(countRead, { notifications: "SwiftJSXTestRefresh" });

  return (
    <VStack>
      <Text>available {String(isNativeAvailable())}</Text>
      <Text>process {process ?? "…"}</Text>
      <Text>reads {refreshes ?? 0}</Text>
      <Button
        title="hop"
        onPress={async () => {
          try {
            setHop(String(await onMain(() => native.NSThread.isMainThread)));
            setAfter(String(native.NSThread.isMainThread));
          } catch (e) {
            setHop("error: " + (e as Error).message);
          }
        }}
      />
      <Text>hop {hop}</Text>
      <Text>after {after}</Text>
      <Button
        title="observe"
        onPress={() => {
          native.NSNotificationCenter.defaultCenter.addObserverForNameObjectQueueUsingBlock("SwiftJSXTestNote", null, null, () =>
            setNote(String(native.NSThread.isMainThread)),
          );
          setNote("observing");
        }}
      />
      <Text>note {note}</Text>
      <Button
        title="reject"
        onPress={() =>
          onMain(() => {
            throw new Error("boom");
          }).catch((e: Error) => setRejected("rejected " + e.message))
        }
      />
      <Text>reject {rejected}</Text>
      <Button
        title="make sorter"
        onPress={() => {
          (globalThis as any).sorter = native.NSSortDescriptor.sortDescriptorWithKeyAscendingComparator(null, true, (a: any, b: any) =>
            a < b ? -1 : a > b ? 1 : 0,
          );
        }}
      />
      <Button
        title="sort"
        onPress={() =>
          setSorted(native.NSArray.arrayWithArray([3, 1, 2]).sortedArrayUsingDescriptors([(globalThis as any).sorter]).componentsJoinedByString(","))
        }
      />
      <Text>sorted {sorted}</Text>
    </VStack>
  );
}

render(<App />);
