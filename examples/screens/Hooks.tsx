import { useState, useEffect, useReducer } from "react";
import {
  VStack, HStack, Text, Button, TextField, Toggle, Slider, Picker,
  Spacer, Image, Divider, ScrollView, ProgressView, Screen,
} from "swiftjsx";

type Todo = { id: number; title: string; done: boolean };
type Action =
  | { type: "add"; title: string }
  | { type: "toggle"; id: number }
  | { type: "remove"; id: number };

function todos(state: Todo[], action: Action): Todo[] {
  switch (action.type) {
    case "add":
      return [...state, { id: Date.now(), title: action.title, done: false }];
    case "toggle":
      return state.map((t) => (t.id === action.id ? { ...t, done: !t.done } : t));
    case "remove":
      return state.filter((t) => t.id !== action.id);
  }
}

// A custom hook, exactly like you'd write on the web.
function useTicker(running: boolean) {
  const [seconds, setSeconds] = useState(0);
  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, [running]);
  return seconds;
}

function Counter() {
  const [count, setCount] = useState(0);
  return (
    <HStack spacing={12}>
      <Button title="−" buttonStyle="bordered" onPress={() => setCount((c) => c - 1)} />
      <Text font="title" monospacedDigit frame={{ minWidth: 60 }} animation="bouncy">
        {count}
      </Text>
      <Button title="+" buttonStyle="borderedProminent" onPress={() => setCount((c) => c + 1)} />
    </HStack>
  );
}

function TodoRow({ todo, dispatch }: { todo: Todo; dispatch: (a: Action) => void }) {
  return (
    <HStack spacing={10} padding={{ vertical: 6, horizontal: 10 }} background="#8881" cornerRadius={8} transition="slide">
      <Image
        systemName={todo.done ? "checkmark.circle.fill" : "circle"}
        foregroundStyle={todo.done ? "green" : "secondary"}
        onTapGesture={() => dispatch({ type: "toggle", id: todo.id })}
      />
      <Text strikethrough={todo.done} foregroundStyle={todo.done ? "secondary" : "primary"}>
        {todo.title}
      </Text>
      <Spacer />
      <Button buttonStyle="borderless" role="destructive" onPress={() => dispatch({ type: "remove", id: todo.id })}>
        <Image systemName="trash" />
      </Button>
    </HStack>
  );
}

export function HooksDemo() {
  const [name, setName] = useState("");
  const [draft, setDraft] = useState("");
  const [items, dispatch] = useReducer(todos, [
    { id: 1, title: "Write a React renderer", done: true },
    { id: 2, title: "Point it at SwiftUI", done: false },
  ]);
  const [timerOn, setTimerOn] = useState(false);
  const seconds = useTicker(timerOn);
  const [size, setSize] = useState(24);
  const [accent, setAccent] = useState("blue");
  // No useMemo: the React Compiler only recomputes this when `items` changes.
  const remaining = items.filter((t) => !t.done).length;

  const add = () => {
    if (!draft.trim()) return;
    dispatch({ type: "add", title: draft.trim() });
    setDraft("");
  };

  return (
    <Screen title="Hooks">
      <ScrollView>
        <VStack alignment="leading" spacing={16} padding={24}>
          <HStack>
            <Image systemName="atom" font="largeTitle" foregroundStyle={accent as any} />
            <Text font="largeTitle" fontWeight="bold">
              Hello{name ? `, ${name}` : ""}!
            </Text>
          </HStack>
          <TextField placeholder="Your name" value={name} onChange={setName} />

          <Divider />
          <Text font="headline">useState</Text>
          <Counter />

          <Divider />
          <Text font="headline">useReducer · {remaining} left</Text>
          <VStack alignment="leading" spacing={6} animation="default">
            {items.map((t) => (
              <TodoRow key={t.id} todo={t} dispatch={dispatch} />
            ))}
          </VStack>
          <HStack>
            <TextField placeholder="New todo…" value={draft} onChange={setDraft} onSubmit={add} />
            <Button title="Add" onPress={add} disabled={!draft.trim()} />
          </HStack>

          <Divider />
          <Text font="headline">useEffect + custom hook</Text>
          <Toggle label={`Timer: ${seconds}s`} value={timerOn} onChange={setTimerOn} />
          <ProgressView value={seconds % 10} total={10} />

          <Divider />
          <Text font="headline">Controls</Text>
          <Picker
            label="Accent"
            pickerStyle="segmented"
            value={accent}
            onChange={setAccent}
            options={["blue", "purple", "pink", "orange", "green"].map((c) => ({ value: c, label: c }))}
          />
          <Slider value={size} min={12} max={64} onChange={setSize} />
          <Text foregroundStyle={accent as any} padding={12} background="#8882" cornerRadius={12}>
            Size {Math.round(size)}
          </Text>
          <Image systemName="swift" foregroundStyle={accent as any} frame={{ width: size * 2, height: size * 2 }} resizable animation="spring" />
        </VStack>
      </ScrollView>
    </Screen>
  );
}
