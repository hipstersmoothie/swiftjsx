import { useState } from "react";
import { render, withAnimation, VStack, ZStack, Text, Button } from "swiftjsx";

function App() {
  const [open, setOpen] = useState(false);
  const [count, setCount] = useState(0);
  const [finished, setFinished] = useState("none");
  const [badge, setBadge] = useState(false);
  const [keyed, setKeyed] = useState({ key: 0, other: 0 });
  return (
    <VStack>
      <Text>{open ? "open" : "closed"}</Text>
      <Text>count {count}</Text>
      <Button title="Animated" onPress={() => withAnimation({ type: "spring", bounce: 0.3 }, () => setOpen((o) => !o))} />
      <Text>finished {finished}</Text>
      {/* The insert and the parent's new animation land in one commit. */}
      <ZStack animation={badge ? "bouncy" : undefined}>{badge ? <Text transition="scale">badge</Text> : null}</ZStack>
      <Button title="Show badge" onPress={() => setBadge(true)} />
      <VStack animation="snappy" animationKey={keyed.key}>
        <Text>{`keyed ${keyed.key} ${keyed.other}`}</Text>
      </VStack>
      <Button title="Change key" onPress={() => setKeyed((k) => ({ ...k, key: k.key + 1 }))} />
      <Button title="Change other" onPress={() => setKeyed((k) => ({ ...k, other: k.other + 1 }))} />
      <Button
        title="With completion"
        onPress={() => withAnimation("snappy", () => setOpen((o) => !o), () => setFinished("animated"))}
      />
      <Button title="Nothing changes" onPress={() => withAnimation("snappy", () => {}, () => setFinished("no-op"))} />
      <Button title="Plain" onPress={() => setCount((c) => c + 1)} />
    </VStack>
  );
}

render(<App />);
