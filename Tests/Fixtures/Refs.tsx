import { useEffect, useRef, useState } from "react";
import { render, VStack, ScrollView, Text, TextField, Button, HostInstance } from "swiftjsx";

function App() {
  const input = useRef<HostInstance>(null);
  const scroller = useRef<HostInstance>(null);
  const box = useRef<HostInstance>(null);
  const [measured, setMeasured] = useState("none");

  useEffect(() => {
    input.current?.focus();
  }, []);

  return (
    <VStack>
      <TextField ref={input} value="" onChange={() => {}} />
      <ScrollView ref={scroller}>
        <Text ref={box}>box</Text>
      </ScrollView>
      <Button title="blur" onPress={() => input.current?.blur()} />
      <Button title="scroll to box" onPress={() => scroller.current?.scrollTo(box.current!)} />
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
