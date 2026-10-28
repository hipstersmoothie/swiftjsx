import { useEffect, useRef, useState } from "react";
import { render, VStack, ScrollView, List, Section, Text, TextField, Button, HostInstance } from "swiftjsx";

function App() {
  const input = useRef<HostInstance>(null);
  const scroller = useRef<HostInstance>(null);
  const box = useRef<HostInstance>(null);
  const list = useRef<HostInstance>(null);
  const deep = useRef<HostInstance>(null);
  const [measured, setMeasured] = useState("none");

  useEffect(() => {
    input.current?.focus();
  }, []);

  return (
    <VStack>
      <TextField ref={input} value="" onChange={() => {}} />
      <ScrollView ref={scroller}>
        <Text>first</Text>
        <Text ref={box}>box</Text>
      </ScrollView>
      <List ref={list}>
        <Section header="rows">
          <Text>row 0</Text>
          <VStack>
            <Text ref={deep}>deep</Text>
          </VStack>
        </Section>
      </List>
      <Button title="blur" onPress={() => input.current?.blur()} />
      <Button title="scroll to box" onPress={() => scroller.current?.scrollTo(box.current!)} />
      <Button title="scroll to index" onPress={() => scroller.current?.scrollTo(1)} />
      <Button title="scroll list to deep" onPress={() => list.current?.scrollTo(deep.current!)} />
      <Button title="scroll to end" onPress={() => scroller.current?.scrollTo("end", { animated: false, anchor: "bottom" })} />
      <Button
        title="measure"
        onPress={async () => {
          const f = await box.current!.measure();
          setMeasured(`${f.width}x${f.height}`);
        }}
      />
      <Text>measured {measured}</Text>
    </VStack>
  );
}

render(<App />);
