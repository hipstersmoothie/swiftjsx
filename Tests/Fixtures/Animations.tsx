import { useState } from "react";
import {
  render, VStack, Text, Button, Canvas, useSharedValue, useAnimatedStyle, useDerivedValue, useAnimatedReaction,
  withTiming, withSpring, withDecay, withSequence, withRepeat, withDelay, cancelAnimation, runOnJS,
} from "swiftjsx";

function App() {
  const x = useSharedValue(0);
  const doubled = useDerivedValue(() => x.get() * 2);
  const style = useAnimatedStyle(() => ({ offset: { x: x.get(), y: doubled.get() } }));
  const [log, setLog] = useState("none");
  const [over, setOver] = useState(false);
  useAnimatedReaction(
    () => x.get() > 50,
    (now, before) => {
      if (before !== null && now !== before) runOnJS(setOver)(now);
    },
  );

  return (
    <VStack>
      <Text>log {log}</Text>
      <Text>over {String(over)}</Text>
      <VStack accessibilityIdentifier="box" animatedStyle={style}>
        <Text>box</Text>
      </VStack>
      <Canvas
        accessibilityIdentifier="canvas"
        draw={(ctx, size) => {
          ctx.fillStyle = "red";
          ctx.fillRect(0, 0, x.get(), size.height);
          ctx.font = "bold 12px";
          ctx.fillText("hi", 1, 2);
        }}
      />
      <Canvas
        accessibilityIdentifier="fx-canvas"
        draw={(ctx) => {
          ctx.shadowColor = "black";
          ctx.shadowBlur = 6;
          ctx.globalCompositeOperation = "multiply";
          ctx.fillRect(0, 0, 10, 10);
          const size = ctx.measureText("Hello");
          ctx.fillText(`w${Math.round(size.width)}`, 0, 0);
          ctx.drawImage("https://example.invalid/a.png", 0, 0, 4, 4);
          ctx.drawImage("star.fill", 0, 0, 4, 4);
        }}
      />
      <Button title="timing" onPress={() => x.set(withTiming(100, { duration: 0.4, easing: "linear" }, (done) => setLog(`timing ${done}`)))} />
      <Button title="sequence" onPress={() => x.set(withSequence(withTiming(60, { duration: 0.1 }), withTiming(10, { duration: 0.1 })))} />
      <Button title="repeat" onPress={() => x.set(withRepeat(withTiming(30, { duration: 0.05 }), 4, true, (done) => setLog(`repeat ${done}`)))} />
      <Button title="decay" onPress={() => x.set(withDecay({ velocity: 1000 }, (done) => setLog(`decay ${done}`)))} />
      <Button title="spring" onPress={() => x.set(withSpring(0, { duration: 0.3, velocity: -2000 }, (done) => setLog(`spring ${done}`)))} />
      <Button title="physical" onPress={() => x.set(withSpring(50, { stiffness: 300, damping: 8, mass: 1 }, (done) => setLog(`physical ${done}`)))} />
      <Button title="delay" onPress={() => x.set(withDelay(0.2, withTiming(40, { duration: 0.1 })))} />
      <Button
        title="interrupt"
        onPress={() => {
          x.set(withTiming(200, { duration: 1 }, (done) => setLog(`interrupted ${!done}`)));
          setTimeout(() => x.set(5), 100);
        }}
      />
      <Button
        title="cancel"
        onPress={() => {
          x.set(withTiming(300, { duration: 1 }));
          setTimeout(() => cancelAnimation(x), 100);
        }}
      />
      <Button title="reset" onPress={() => x.set(0)} />
    </VStack>
  );
}

render(<App />);
