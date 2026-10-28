import { useState } from "react";
import {
  render, VStack, Text, Button, native, onMain, isNativeAvailable, useNativeValue, defineNativeClass, keepAlive, nativePromise,
} from "swiftjsx";

// Module level: nothing registers until first use.
const pinger = (reply: string) =>
  defineNativeClass("SwiftJSXTestPinger", {
    // The selector, as written: one argument, one colon.
    exposed: { "ping:": { returns: "id", params: ["id"] } },
    methods: {
      "ping:"(value: unknown) {
        return `${reply} ${String(value)}`;
      },
    },
  });
const Pinger = pinger("pong");
const evicted: string[] = [];
const CacheDelegate = defineNativeClass("SwiftJSXTestCacheDelegate", {
  protocols: ["NSCacheDelegate"],
  methods: {
    cacheWillEvictObject(_cache: unknown, object: unknown) {
      evicted.push(String(object));
    },
  },
});

let reads = 0;
const countRead = () => ++reads;

function App() {
  const [hop, setHop] = useState("none");
  const [classes, setClasses] = useState("none");
  const [promise, setPromise] = useState("none");
  const [exception, setException] = useState("none");
  const [after, setAfter] = useState("none");
  const [note, setNote] = useState("none");
  const [rejected, setRejected] = useState("none");
  const [sorted, setSorted] = useState("none");
  const process = useNativeValue(() => native.NSProcessInfo.processInfo.processName, { mainThread: false });
  const refreshes = useNativeValue(countRead, { notifications: "SwiftJSXTestRefresh" });

  return (
    <VStack>
      <Text>available {String(isNativeAvailable())}</Text>
      <Button
        title="classes"
        onPress={() => {
          const p = Pinger.new();
          const first = String(p.performSelectorWithObject("ping:", "a"));
          pinger("pang"); // a Fast Refresh redefinition
          const second = String(p.performSelectorWithObject("ping:", "b"));
          const cache = native.NSCache.new();
          cache.countLimit = 1;
          cache.delegate = keepAlive(CacheDelegate.new());
          cache.setObjectForKey("one", "k1");
          cache.setObjectForKey("two", "k2");
          setClasses(`${first}|${second}|evicted ${evicted.join(",")}`);
        }}
      />
      <Text>classes {classes}</Text>
      <Button
        title="promise"
        onPress={async () => {
          const onMainQueue = await nativePromise<boolean>((resolve) =>
            native.NSOperationQueue.new().addOperationWithBlock(() => resolve(native.NSThread.isMainThread)),
          );
          setPromise(`${onMainQueue} then ${native.NSThread.isMainThread}`);
        }}
      />
      <Text>promise {promise}</Text>
      <Button
        title="exception"
        onPress={() => {
          try {
            native.NSArray.array().objectAtIndex(3);
            setException("no throw");
          } catch (e) {
            setException(`threw ${String((e as Error).message ?? e).slice(0, 40)}`);
          }
        }}
      />
      <Text>exception {exception}</Text>
      <Button
        title="leave a delegate behind"
        onPress={() => {
          // An NSCache with a JS delegate, parked where it outlives this runtime.
          const cache = native.NSCache.new();
          cache.countLimit = 1;
          cache.delegate = keepAlive(CacheDelegate.new());
          cache.setObjectForKey("left", "k1");
          native.NSThread.mainThread.threadDictionary.setObjectForKey(cache, "SwiftJSXTestCache" as never);
        }}
      />

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
