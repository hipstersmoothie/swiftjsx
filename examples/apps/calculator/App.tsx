// Calculator: an iOS-style calculator. Exact decimal arithmetic (BigInt),
// immediate-execution chaining, a scientific mode with three extra columns,
// keys sized from the measured screen (onLayout), swipe the display to delete
// a digit, long-press it to copy or paste, and a history sheet persisted in
// localStorage.
import { useEffect, useReducer, useRef, useState } from "react";
import {
  Navigator, Screen, ToolbarItem, Button, Menu, Picker, Divider, VStack, Text, Image, Label, Spacer, Sheet, ContextMenu,
  Overlay, withAnimation, haptic, toast, type DragEvent,
} from "swiftjsx";
import {
  reduce, initialState, displayText, displayPlain, showsClearEntry, activeOp, maxDigits, decode,
  type Action, type CalcState, type HistoryEntry,
} from "./engine";
import { keyRows, type KeySpec } from "./keys";
import { Keypad } from "./Keypad";
import { HistoryScreen } from "./History";
import { copyText, readText, clipboardKind } from "./clipboard";
import { delocalize, plainValue } from "./format";
import { parse } from "./decimal";

export function CalculatorApp() {
  return (
    <Navigator colorScheme="dark">
      <CalculatorScreen />
    </Navigator>
  );
}

// MARK: Persistence

const STORAGE_KEY = "calculator.v1";
type Saved = Pick<CalcState, "history" | "scientific" | "angle">;

function load(): Partial<Saved> {
  try {
    const data = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "null");
    if (!data || typeof data !== "object") return {};
    const history = Array.isArray(data.history)
      ? (data.history as HistoryEntry[]).filter((h) => h && typeof h.id === "string" && typeof h.result === "string" && parse(h.result))
      : [];
    return { history, scientific: data.scientific === true, angle: data.angle === "rad" ? "rad" : "deg" };
  } catch {
    return {};
  }
}

function usePersisted(state: CalcState) {
  const { history, scientific, angle } = state;
  useEffect(() => {
    const saved: Saved = { history, scientific, angle };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(saved));
  }, [history, scientific, angle]);
}

// MARK: Layout

type Size = { width: number; height: number };

const clampTo = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
const H_PADDING = 18;

function layoutFor({ width, height }: Size, scientific: boolean) {
  const columns = scientific ? 7 : 4;
  const rows = 5;
  const available = width - H_PADDING * 2;
  const spacing = scientific ? clampTo(available * 0.022, 6, 12) : clampTo(available * 0.04, 10, 18);
  const byWidth = (available - (columns - 1) * spacing) / columns;
  // Leave the display about a third of the height (landscape, iPad sheets).
  const byHeight = (height * 0.68 - H_PADDING - (rows - 1) * spacing) / rows;
  const key = Math.floor(Math.min(byWidth, byHeight));
  return {
    key,
    spacing,
    padWidth: columns * key + (columns - 1) * spacing,
    displayFont: clampTo(key * (scientific ? 1.45 : 1.15), 44, 96),
  };
}

// MARK: Screen

function CalculatorScreen() {
  const [state, dispatch] = useReducer(reduce, undefined, () => initialState(load()));
  const [historyOpen, setHistoryOpen] = useState(false);
  // The space the calculator has (below the navigation bar), from onLayout.
  const [size, setSize] = useState<Size | null>(null);
  usePersisted(state);
  // A buzz when a calculation fails.
  useEffect(() => {
    if (state.error) haptic("error");
  }, [state.error]);

  const layout = layoutFor(size ?? { width: 390, height: 700 }, state.scientific);
  const rows = keyRows(showsClearEntry(state), state.scientific, state.angle);
  const op = activeOp(state);
  const activeKey = op === null ? null : op === "pow" ? "x^y" : op;

  const press = (spec: KeySpec) => dispatch(spec.action());
  const send = (action: Action) => dispatch(action);

  const copy = (text: string | null) => {
    if (text === null) return;
    copyText(text).then(
      () => toast(clipboardKind() === "system" ? "Copied" : "Copied (in app)"),
      () => toast("Couldn't copy"),
    );
  };
  const paste = () => {
    readText().then(
      (text) => {
        const value = text ? parse(delocalize(text)) : null;
        if (value) send({ type: "recall", value });
        else toast(text ? "Not a number" : "Nothing to paste");
      },
      () => toast("Couldn't paste"),
    );
  };

  return (
    <Screen toolbarBackground="hidden" toolbarColorScheme="dark" titleDisplayMode="inline">
      <ToolbarItem placement="navigation">
        <Button onPress={() => setHistoryOpen(true)} accessibilityLabel="History" accessibilityIdentifier="show-history">
          <Image systemName="list.bullet" foregroundStyle="orange" />
        </Button>
      </ToolbarItem>
      <ToolbarItem placement="primaryAction">
        <Menu
          systemImage={state.scientific ? "function" : "plus.forwardslash.minus"}
          tint="orange"
          accessibilityLabel="Calculator mode"
          accessibilityIdentifier="mode-menu"
        >
          <Picker
            label="Mode"
            value={state.scientific ? "scientific" : "basic"}
            onChange={(mode) => withAnimation("snappy", () => send({ type: "setScientific", on: mode === "scientific" }))}
            options={[{ value: "basic", label: "Basic" }, { value: "scientific", label: "Scientific" }]}
            pickerStyle="inline"
          />
          {state.scientific ? (
            <Picker
              label="Angles"
              value={state.angle}
              onChange={(angle) => angle !== state.angle && send({ type: "toggleAngle" })}
              options={[{ value: "deg", label: "Degrees" }, { value: "rad", label: "Radians" }]}
              pickerStyle="inline"
            />
          ) : null}
          <Divider />
          <Button onPress={() => setHistoryOpen(true)}>
            <Label title="History" systemImage="clock" />
          </Button>
        </Menu>
      </ToolbarItem>

      <VStack
        spacing={0}
        frame={{ maxWidth: "infinity", maxHeight: "infinity" }}
        background="black"
        onLayout={(next) => setSize((s) => (s && Math.abs(s.width - next.width) < 0.5 && Math.abs(s.height - next.height) < 0.5 ? s : next))}
      >
        <Spacer minLength={0} />
        {/* Hidden until measured, so the keys don't visibly resize as the sheet opens. */}
        <VStack spacing={0} opacity={size ? 1 : 0} animation={{ type: "easeOut", duration: 0.15 }}>
          <Display
            text={displayText(state)}
            expression={state.expression}
            angle={state.scientific ? state.angle : null}
            width={layout.padWidth}
            fontSize={layout.displayFont}
            onBackspace={() => {
              haptic("selection");
              send({ type: "backspace" });
            }}
            onCopy={() => copy(displayPlain(state))}
            onPaste={paste}
          />
          <Keypad
            rows={rows}
            size={layout.key}
            spacing={layout.spacing}
            activeKey={activeKey}
            onPress={press}
          />
        </VStack>
        <VStack frame={{ height: H_PADDING }} />
      </VStack>

      <Sheet isPresented={historyOpen} onDismiss={() => setHistoryOpen(false)} detents={["medium", "large"]}>
        <Navigator>
          <HistoryScreen
            history={state.history}
            maxDigits={maxDigits(state)}
            onUse={(entry) => {
              send({ type: "recall", value: decode(entry.result) });
              setHistoryOpen(false);
            }}
            onCopy={(entry) => copy(plainValue(decode(entry.result), maxDigits(state)))}
            onDelete={(id) => send({ type: "deleteHistory", id })}
            onClear={() => send({ type: "clearHistory" })}
            onDone={() => setHistoryOpen(false)}
          />
        </Navigator>
      </Sheet>
    </Screen>
  );
}

// MARK: Display

type DisplayProps = {
  text: string;
  expression: string;
  angle: "deg" | "rad" | null;
  width: number;
  fontSize: number;
  onBackspace(): void;
  onCopy(): void;
  onPaste(): void;
};

/** Swipe sideways to delete the last digit; long-press for Copy and Paste. */
function Display({ text, expression, angle, width, fontSize, onBackspace, onCopy, onPaste }: DisplayProps) {
  // One digit per swipe: remember that this drag already deleted.
  const swiped = useRef(false);
  const onDrag = (e: DragEvent) => {
    const { x, y } = e.translation;
    if (!swiped.current && Math.abs(x) > 28 && Math.abs(x) > Math.abs(y) * 1.5) {
      swiped.current = true;
      onBackspace();
    }
  };

  return (
    <VStack frame={{ width }} padding={{ bottom: 8 }}>
      <VStack
        alignment="trailing"
        spacing={0}
        frame={{ maxWidth: "infinity", alignment: "trailing" }}
        // The whole area takes the swipe (and the long press), not just the glyphs.
        contentShape="rectangle"
        onDrag={onDrag}
        onDragEnd={() => {
          swiped.current = false;
        }}
        dragMinimumDistance={12}
        accessibilityElement="contain"
      >
        <Text
          font={{ size: clampTo(fontSize * 0.34, 18, 30), weight: "regular" }}
          foregroundStyle="#8E8E93"
          lineLimit={1}
          minimumScaleFactor={0.5}
          accessibilityIdentifier="expression"
        >
          {expression || " "}
        </Text>
        <Text
          font={{ size: fontSize, weight: "thin" }}
          foregroundStyle="white"
          lineLimit={1}
          minimumScaleFactor={0.3}
          frame={{ maxWidth: "infinity", alignment: "trailing" }}
          padding={{ horizontal: fontSize * 0.08 }}
          accessibilityIdentifier="display"
          accessibilityHint="Swipe left or right to delete the last digit. Touch and hold to copy."
        >
          {text}
        </Text>
        <ContextMenu>
          <Button onPress={onCopy}>
            <Label title="Copy" systemImage="doc.on.doc" />
          </Button>
          <Button onPress={onPaste}>
            <Label title="Paste" systemImage="doc.on.clipboard" />
          </Button>
        </ContextMenu>
      </VStack>

      <Overlay alignment="topLeading">
        {angle ? (
          <Text font="footnote" fontWeight="semibold" foregroundStyle="#8E8E93" padding={{ leading: 6, top: 6 }} accessibilityIdentifier="angle-mode">
            {angle === "deg" ? "Deg" : "Rad"}
          </Text>
        ) : null}
      </Overlay>
    </VStack>
  );
}
