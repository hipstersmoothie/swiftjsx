import { useState, type ComponentProps } from "react";
import {
  Screen, VStack, HStack, Text, Image, Spacer, Picker,
  useSharedValue, useAnimatedStyle, withSpring, runOnJS,
} from "swiftjsx";

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

export function GesturesDemo() {
  const [drag, setDrag] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const [zoom, setZoom] = useState({ base: 1, live: 1 });
  const [angle, setAngle] = useState({ base: 0, live: 0 });
  const [liked, setLiked] = useState(false);
  const [status, setStatus] = useState("Double-tap the heart, long-press the bell");
  const [mode, setMode] = useState("worklet");
  const dropped = (distance: number) => setStatus(`Dropped ${Math.round(distance)} pt away`);

  return (
    <Screen title="Gestures">
      <VStack spacing={20} padding={20}>
        <Text font="footnote" foregroundStyle="secondary" accessibilityIdentifier="gesture-status">{status}</Text>

        <HStack spacing={20}>
          <Image
            systemName={liked ? "heart.fill" : "heart"}
            font="largeTitle"
            foregroundStyle="pink"
            frame={{ width: 90, height: 90 }}
            background="#8881"
            cornerRadius={20}
            scale={liked ? 1.15 : 1}
            animation="bouncy"
            onDoubleTap={() => {
              setLiked((l) => !l);
              setStatus(liked ? "Unliked" : "Liked!");
            }}
            accessibilityLabel="Like"
            accessibilityValue={liked ? "liked" : "not liked"}
            accessibilityHint="Double-tap with one finger twice to toggle"
            accessibilityIdentifier="heart"
          />
          <Image
            systemName="bell.badge"
            font="largeTitle"
            foregroundStyle="orange"
            frame={{ width: 90, height: 90 }}
            background="#8881"
            cornerRadius={20}
            onLongPress={() => setStatus("Long-pressed the bell")}
            accessibilityLabel="Bell"
            accessibilityIdentifier="bell"
          />
        </HStack>

        {/* Pinch and rotate at the same time; double-tap to reset. */}
        <Image
          systemName="photo.artframe"
          font="largeTitle"
          foregroundStyle="indigo"
          frame={{ width: 140, height: 140 }}
          background="#8881"
          cornerRadius={24}
          scale={zoom.base * zoom.live}
          rotation={angle.base + angle.live}
          animation={zoom.live === 1 && angle.live === 0 ? "spring" : undefined}
          onMagnify={({ scale }) => setZoom((z) => ({ ...z, live: scale }))}
          onMagnifyEnd={({ scale }) => setZoom((z) => ({ base: clamp(z.base * scale, 0.5, 3), live: 1 }))}
          onRotate={({ degrees }) => setAngle((a) => ({ ...a, live: degrees }))}
          onRotateEnd={({ degrees }) => setAngle((a) => ({ base: a.base + degrees, live: 0 }))}
          onDoubleTap={() => {
            setZoom({ base: 1, live: 1 });
            setAngle({ base: 0, live: 0 });
          }}
          accessibilityLabel="Picture frame. Pinch to zoom, rotate with two fingers."
        />

        <Spacer />

        <Picker
          value={mode}
          onChange={setMode}
          pickerStyle="segmented"
          options={[
            { value: "worklet", label: "Main thread" },
            { value: "react", label: "React state" },
          ]}
        />
        {mode === "worklet" ? <WorkletCard onDropped={dropped} /> : <ReactCard onDropped={dropped} />}
      </VStack>
    </Screen>
  );
}

type CardProps = { onDropped: (distance: number) => void };

/**
 * Worklets: the drag handlers run on the main thread inside the touch event,
 * so the card moves in the same frame as the finger. React doesn't render
 * during the drag at all.
 */
function WorkletCard({ onDropped }: CardProps) {
  const offset = useSharedValue({ x: 0, y: 0 });
  const dragging = useSharedValue(false);
  const style = useAnimatedStyle(() => ({
    offset: offset.get(),
    scale: dragging.get() ? 1.05 : 1,
    shadow: dragging.get() ? 16 : 4,
    background: dragging.get() ? "blue" : "indigo",
  }));

  return (
    <Card
      label="Drag me (main thread)"
      animatedStyle={style}
      onDrag={(e) => {
        "worklet";
        if (!dragging.get()) dragging.set(withSpring(true, { duration: 0.25 }));
        offset.set(e.translation);
      }}
      onDragEnd={(e) => {
        "worklet";
        dragging.set(withSpring(false));
        offset.set(withSpring({ x: 0, y: 0 }, { bounce: 0.3 }));
        runOnJS(onDropped)(Math.hypot(e.translation.x, e.translation.y));
      }}
    />
  );
}

/** The same card driven by React state: each move is a render on the JS thread. */
function ReactCard({ onDropped }: CardProps) {
  const [drag, setDrag] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  return (
    <Card
      label="Drag me (React state)"
      background={dragging ? "blue" : "indigo"}
      shadow={dragging ? 16 : 4}
      offset={drag}
      scale={dragging ? 1.05 : 1}
      animation={dragging ? undefined : "spring"}
      onDrag={({ translation }) => {
        setDragging(true);
        setDrag(translation);
      }}
      onDragEnd={({ translation }) => {
        setDragging(false);
        setDrag({ x: 0, y: 0 });
        onDropped(Math.hypot(translation.x, translation.y));
      }}
    />
  );
}

function Card({ label, ...props }: { label: string } & Omit<ComponentProps<typeof VStack>, "children">) {
  return (
    <VStack
      spacing={6}
      padding={20}
      background="indigo"
      cornerRadius={20}
      accessibilityElement="combine"
      accessibilityIdentifier="drag-card"
      {...props}
    >
      <Image systemName="hand.draw" font="title" foregroundStyle="white" />
      <Text font="headline" foregroundStyle="white">{label}</Text>
    </VStack>
  );
}
