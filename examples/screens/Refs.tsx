import { useRef, useState } from "react";
import { Screen, ScrollView, VStack, HStack, Text, TextField, Button, Divider, HostInstance, type Frame } from "swiftjsx";

export function RefsDemo() {
  const input = useRef<HostInstance>(null);
  const scroller = useRef<HostInstance>(null);
  const target = useRef<HostInstance>(null);
  const [text, setText] = useState("");
  const [focused, setFocused] = useState(false);
  const [frame, setFrame] = useState<Frame | null>(null);

  return (
    <Screen title="Refs">
      <VStack alignment="leading" spacing={12} padding={20}>
        <Text font="headline">focus() / blur()</Text>
        <TextField
          ref={input}
          placeholder="Tap a button to focus me"
          value={text}
          onChange={setText}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
        />
        <HStack>
          <Button title="Focus" buttonStyle="bordered" onPress={() => input.current?.focus()} />
          <Button title="Blur" buttonStyle="bordered" onPress={() => input.current?.blur()} />
          <Text foregroundStyle={focused ? "green" : "secondary"}>{focused ? "focused" : "not focused"}</Text>
        </HStack>

        <Divider />
        <Text font="headline">scrollTo() / measure()</Text>
        <HStack>
          <Button title="Top" buttonStyle="bordered" onPress={() => scroller.current?.scrollTo("top")} />
          <Button title="Item 30" buttonStyle="bordered" onPress={() => scroller.current?.scrollTo(target.current!, { anchor: "center" })} />
          <Button title="End" buttonStyle="bordered" onPress={() => scroller.current?.scrollTo("end")} />
          <Button title="Measure 30" buttonStyle="bordered" onPress={async () => setFrame(await target.current!.measure())} />
        </HStack>
        {frame && (
          <Text font="caption" fontDesign="monospaced">
            item 30 → x {Math.round(frame.x)}, y {Math.round(frame.y)}, {Math.round(frame.width)}×{Math.round(frame.height)}
          </Text>
        )}
      </VStack>
      <ScrollView ref={scroller} background="#8881">
        <VStack alignment="leading" spacing={8} padding={16}>
          {Array.from({ length: 60 }, (_, i) => (
            <Text
              key={i}
              ref={i === 30 ? target : undefined}
              padding={10}
              frame={{ maxWidth: "infinity", alignment: "leading" }}
              background={i === 30 ? "pink" : "#8882"}
              cornerRadius={8}
            >
              Item {i}
            </Text>
          ))}
        </VStack>
      </ScrollView>
    </Screen>
  );
}
