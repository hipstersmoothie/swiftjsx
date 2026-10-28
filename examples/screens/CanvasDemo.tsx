import { useState } from "react";
import {
  Screen, ScrollView, VStack, HStack, Text, Button, Canvas, useSharedValue, withSpring, runOnJS, type DragEvent, type Color,
} from "swiftjsx";

const BARS = 7;
const randomBars = () => Array.from({ length: BARS }, () => 0.15 + Math.random() * 0.85);

export function CanvasDemo() {
  // Strokes as [x0, y0, x1, y1, …], drawn while the finger moves (all on the main thread).
  const strokes = useSharedValue<number[][]>([]);
  const [count, setCount] = useState(0);
  // Bar heights (0…1): a spring on the whole array animates every bar.
  const bars = useSharedValue(randomBars());

  return (
    <Screen title="Canvas" titleDisplayMode="inline">
      <ScrollView>
        <VStack alignment="leading" spacing={14} padding={20}>
          <Text font="headline">Draw</Text>
          <Canvas
            frame={{ height: 220 }}
            background="secondarySystemBackground"
            cornerRadius={14}
            dragMinimumDistance={0}
            onDragStart={(e?: DragEvent) => {
              "worklet";
              if (!e) return;
              strokes.set([...strokes.get(), [e.localLocation.x, e.localLocation.y]]);
            }}
            onDrag={(e: DragEvent) => {
              "worklet";
              const all = strokes.get();
              const last = all[all.length - 1] ?? [];
              strokes.set([...all.slice(0, -1), [...last, e.localLocation.x, e.localLocation.y]]);
            }}
            onDragEnd={() => {
              "worklet";
              runOnJS(setCount)(strokes.get().length);
            }}
            draw={(ctx) => {
              ctx.strokeStyle = "indigo";
              ctx.lineWidth = 4;
              ctx.lineCap = "round";
              ctx.lineJoin = "round";
              for (const stroke of strokes.get()) {
                ctx.beginPath();
                ctx.moveTo(stroke[0], stroke[1]);
                for (let i = 2; i < stroke.length; i += 2) ctx.lineTo(stroke[i], stroke[i + 1]);
                if (stroke.length === 2) ctx.lineTo(stroke[0] + 0.1, stroke[1]);
                ctx.stroke();
              }
            }}
            accessibilityIdentifier="drawing-pad"
          />
          <HStack>
            <Text font="footnote" foregroundStyle="secondary" accessibilityIdentifier="stroke-count">{`${count} strokes`}</Text>
            <Button title="Clear" buttonStyle="bordered" onPress={() => { strokes.set([]); setCount(0); }} />
          </HStack>

          <Text font="headline" padding={{ top: 8 }}>Animated drawing</Text>
          <Canvas
            frame={{ height: 140 }}
            draw={(ctx, { width, height }) => {
              const values = bars.get();
              const gap = 10;
              const w = (width - gap * (values.length - 1)) / values.length;
              const gradient = ctx.createLinearGradient(0, height, 0, 0);
              gradient.addColorStop(0, "teal");
              gradient.addColorStop(1, "mint");
              values.forEach((v, i) => {
                const h = Math.max(4, v * height);
                ctx.beginPath();
                ctx.roundRect(i * (w + gap), height - h, w, h, 6);
                ctx.fill(gradient);
              });
            }}
            accessibilityIdentifier="bars-canvas"
          />
          <Button title="Shuffle bars" buttonStyle="borderedProminent" onPress={() => bars.set(withSpring(randomBars(), { bounce: 0.35 }))} />

          <Text font="headline" padding={{ top: 8 }}>Every frame</Text>
          <HStack spacing={16}>
            <Canvas
              continuous
              frame={{ width: 120, height: 120 }}
              draw={(ctx, { width, height }) => {
                const now = new Date();
                const cx = width / 2, cy = height / 2, r = Math.min(cx, cy) - 4;
                ctx.lineWidth = 3;
                ctx.strokeStyle = "separator";
                ctx.circle(cx, cy, r);
                ctx.stroke();
                const hand = (turns: number, length: number, color: Color, w: number) => {
                  const a = turns * Math.PI * 2 - Math.PI / 2;
                  ctx.beginPath();
                  ctx.moveTo(cx, cy);
                  ctx.lineTo(cx + Math.cos(a) * length, cy + Math.sin(a) * length);
                  ctx.strokeStyle = color;
                  ctx.lineWidth = w;
                  ctx.lineCap = "round";
                  ctx.stroke();
                };
                const seconds = now.getSeconds() + now.getMilliseconds() / 1000;
                hand(((now.getHours() % 12) + now.getMinutes() / 60) / 12, r * 0.5, "label", 4);
                hand((now.getMinutes() + seconds / 60) / 60, r * 0.75, "label", 3);
                hand(seconds / 60, r * 0.85, "orange", 1.5);
              }}
              accessibilityIdentifier="clock"
            />
            <Canvas
              continuous
              frame={{ maxWidth: Infinity, height: 120 }}
              draw={(ctx, { width, height }, time) => {
                ctx.beginPath();
                for (let x = 0; x <= width; x += 4) {
                  const y = height / 2 + Math.sin(x / 18 + time * 3) * (height / 3) * Math.sin(time * 0.7 + x / 90);
                  if (x === 0) ctx.moveTo(x, y);
                  else ctx.lineTo(x, y);
                }
                ctx.strokeStyle = "pink";
                ctx.lineWidth = 3;
                ctx.stroke();
              }}
            />
          </HStack>
        </VStack>
      </ScrollView>
    </Screen>
  );
}
