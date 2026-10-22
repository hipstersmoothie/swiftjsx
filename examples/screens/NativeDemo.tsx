import { useState } from "react";
import {
  Screen, ScrollView, VStack, HStack, Text, Button, Image, Divider, ProgressView,
  native, onMain, isNativeAvailable, useNativeValue,
} from "swiftjsx";

const isIOS = () => "UIDevice" in native;

function Row({ label, value }: { label: string; value: string | undefined }) {
  return (
    <HStack>
      <Text foregroundStyle="secondary">{label}</Text>
      <Text frame={{ maxWidth: "infinity", alignment: "trailing" }} fontDesign="monospaced">{value ?? "…"}</Text>
    </HStack>
  );
}

const thermalNames = ["nominal", "fair", "serious", "critical"];

function DeviceInfo() {
  // UIDevice is main-thread-only (@MainActor in the SDK), so read it there.
  const device = useNativeValue(() => {
    if (!isIOS()) return `${native.NSProcessInfo.processInfo.hostName}`;
    const d = native.UIDevice.currentDevice;
    return `${d.model}, ${d.systemName} ${d.systemVersion}`;
  });
  // NSProcessInfo is fine on any thread; refresh when the system says so.
  // `?? null`: some properties are missing from a platform's metadata (the macOS
  // build currently lacks this one); null shows "n/a" instead of loading forever.
  const lowPower = useNativeValue(() => native.NSProcessInfo.processInfo.lowPowerModeEnabled ?? null, {
    mainThread: false,
    notifications: "NSProcessInfoPowerStateDidChangeNotification",
  });
  const thermal = useNativeValue(() => native.NSProcessInfo.processInfo.thermalState, {
    mainThread: false,
    notifications: "NSProcessInfoThermalStateDidChangeNotification",
  });
  return (
    <VStack alignment="leading" spacing={8}>
      <Row label="Device" value={device} />
      <Row label="Low Power Mode" value={lowPower === undefined ? undefined : lowPower === null ? "n/a" : lowPower ? "on" : "off"} />
      <Row label="Thermal state" value={thermal === undefined ? undefined : thermalNames[Number(thermal)] ?? String(thermal)} />
    </VStack>
  );
}

function Battery() {
  const level = useNativeValue(
    () => {
      const device = native.UIDevice.currentDevice;
      device.batteryMonitoringEnabled = true;
      return device.batteryLevel;
    },
    { notifications: ["UIDeviceBatteryLevelDidChangeNotification", "UIDeviceBatteryStateDidChangeNotification"] },
  );
  if (level === undefined) return <Row label="Battery" value={undefined} />;
  if (level < 0) return <Row label="Battery" value="unknown (simulator)" />;
  return (
    <VStack alignment="leading" spacing={4}>
      <Row label="Battery" value={`${Math.round(level * 100)}%`} />
      <ProgressView value={level} />
    </VStack>
  );
}

function Haptics() {
  const [count, setCount] = useState(0);
  const tap = (style: number) =>
    onMain(() => {
      const generator = native.UIImpactFeedbackGenerator.alloc().initWithStyle(style);
      generator.impactOccurred();
    }).then(() => setCount((c) => c + 1));
  return (
    <VStack alignment="leading" spacing={8}>
      <HStack spacing={8}>
        <Button title="Light" buttonStyle="bordered" onPress={() => tap(0)} />
        <Button title="Medium" buttonStyle="bordered" onPress={() => tap(1)} />
        <Button title="Heavy" buttonStyle="borderedProminent" onPress={() => tap(2)} />
      </HStack>
      <Text font="caption" foregroundStyle="secondary">{count} haptic taps (UIKit, via onMain)</Text>
    </VStack>
  );
}

function Threads() {
  const [report, setReport] = useState<string[]>([]);
  const check = async () => {
    const here = native.NSThread.isMainThread;
    const there = await onMain(() => native.NSThread.isMainThread);
    const after = native.NSThread.isMainThread;
    setReport([
      `event handler: ${here ? "main" : "JS thread"}`,
      `inside onMain(): ${there ? "main" : "JS thread"}`,
      `after await: ${after ? "main" : "JS thread"}`,
    ]);
  };
  return (
    <VStack alignment="leading" spacing={6}>
      <Button title="Where does my code run?" buttonStyle="bordered" onPress={check} />
      {report.map((line) => (
        <Text key={line} font="caption" fontDesign="monospaced">{line}</Text>
      ))}
    </VStack>
  );
}

export function NativeDemo() {
  if (!isNativeAvailable()) {
    return (
      <Screen title="Native">
        <VStack spacing={12} padding={24}>
          <Image systemName="cpu" font="largeTitle" foregroundStyle="secondary" />
          <Text>The native backend is off.</Text>
          <Text font="caption" foregroundStyle="secondary">
            Build the add-on (scripts/build-nativescript.sh) and create the runtime with native: NativeOptions(…).
          </Text>
        </VStack>
      </Screen>
    );
  }
  return (
    <Screen title="Native">
      <ScrollView>
        <VStack alignment="leading" spacing={16} padding={20}>
          <Text font="caption" foregroundStyle="secondary">
            Straight Objective-C from React: every SDK class is on `native`. Main-thread-only calls go through onMain().
          </Text>
          <Text font="headline">System</Text>
          <DeviceInfo />
          {isIOS() && <Battery />}
          <Divider />
          {isIOS() && (
            <>
              <Text font="headline">Haptics</Text>
              <Haptics />
              <Divider />
            </>
          )}
          <Text font="headline">Threads</Text>
          <Threads />
        </VStack>
      </ScrollView>
    </Screen>
  );
}
