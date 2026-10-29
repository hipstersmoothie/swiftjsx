// Past calculations, newest first, grouped by day. Tap one to use its result;
// swipe or long-press for more.
import { useState } from "react";
import {
  Screen, ToolbarItem, List, Section, Button, VStack, HStack, Text, Label, Spacer, SwipeActions, ContextMenu, Alert, ContentUnavailable,
  withAnimation, format, useToday,
} from "swiftjsx";
import { decode, opSymbol, type HistoryEntry } from "./engine";
import { formatValue, formattingInfo } from "./format";
import { clipboardKind } from "./clipboard";

type Props = {
  history: HistoryEntry[];
  maxDigits: number;
  onUse(entry: HistoryEntry): void;
  onCopy(entry: HistoryEntry): void;
  onDelete(id: string): void;
  onClear(): void;
  onDone(): void;
};

export function HistoryScreen({ history, maxDigits, onUse, onCopy, onDelete, onClear, onDone }: Props) {
  const [confirming, setConfirming] = useState(false);
  const today = useToday();

  // Consecutive entries from the same day share a section.
  const days: { title: string; entries: HistoryEntry[] }[] = [];
  for (const entry of history) {
    const title = format.relativeDay(entry.at, { now: today });
    const last = days[days.length - 1];
    if (last && last.title === title) last.entries.push(entry);
    else days.push({ title, entries: [entry] });
  }
  const footer = `${formattingInfo} Copy goes to ${clipboardKind() === "system" ? "the system clipboard" : "an in-app clipboard (no native backend)"}.`;

  return (
    <Screen title="History" titleDisplayMode="inline">
      <ToolbarItem placement="confirmationAction">
        <Button title="Done" onPress={onDone} accessibilityIdentifier="history-done" />
      </ToolbarItem>
      <ToolbarItem placement="cancellationAction">
        <Button title="Clear" role="destructive" disabled={!history.length} onPress={() => setConfirming(true)} accessibilityIdentifier="history-clear" />
      </ToolbarItem>

      {history.length ? (
        <List>
          {days.map((day, i) => (
            <Section key={day.title} header={day.title} footer={i === days.length - 1 ? footer : undefined}>
              {day.entries.map((entry) => (
                <Row key={entry.id} entry={entry} maxDigits={maxDigits} onUse={onUse} onCopy={onCopy} onDelete={onDelete} />
              ))}
            </Section>
          ))}
        </List>
      ) : (
        <ContentUnavailable title="No History" systemImage="clock.arrow.circlepath" description="Calculations you finish with = show up here.">
          <Text font="caption" foregroundStyle="tertiary" textAlignment="center" padding={{ top: 24 }}>{footer}</Text>
        </ContentUnavailable>
      )}

      <Alert isPresented={confirming} onDismiss={() => setConfirming(false)} title="Clear History?" message="This removes every saved calculation.">
        <Button title="Clear History" role="destructive" onPress={() => withAnimation("default", onClear)} />
        <Button title="Cancel" role="cancel" onPress={() => {}} />
      </Alert>
    </Screen>
  );
}

type RowProps = {
  entry: HistoryEntry;
  maxDigits: number;
  onUse(entry: HistoryEntry): void;
  onCopy(entry: HistoryEntry): void;
  onDelete(id: string): void;
};

function Row({ entry, maxDigits, onUse, onCopy, onDelete }: RowProps) {
  const a = formatValue(decode(entry.a), maxDigits);
  const b = formatValue(decode(entry.b), maxDigits);
  const result = formatValue(decode(entry.result), maxDigits);
  const remove = () => withAnimation("default", () => onDelete(entry.id));

  return (
    <Button onPress={() => onUse(entry)} accessibilityIdentifier="history-row" accessibilityHint="Puts the result on the display">
      <HStack alignment="firstTextBaseline" accessibilityElement="combine">
        <Text font="caption" foregroundStyle="tertiary" monospacedDigit date={entry.at} dateStyle="time" />
        <Spacer />
        <VStack alignment="trailing" spacing={2}>
          <Text font="callout" foregroundStyle="secondary" lineLimit={1} minimumScaleFactor={0.6}>
            {a} {opSymbol[entry.op]} {b}
          </Text>
          <Text font={{ size: 28, weight: "light" }} foregroundStyle="primary" lineLimit={1} minimumScaleFactor={0.5}>
            {result}
          </Text>
        </VStack>
      </HStack>

      <SwipeActions edge="trailing">
        <Button role="destructive" onPress={() => onDelete(entry.id)}>
          <Label title="Delete" systemImage="trash" />
        </Button>
      </SwipeActions>
      <ContextMenu>
        <Button onPress={() => onUse(entry)}>
          <Label title="Use Result" systemImage="arrow.uturn.backward" />
        </Button>
        <Button onPress={() => onCopy(entry)}>
          <Label title="Copy Result" systemImage="doc.on.doc" />
        </Button>
        <Button role="destructive" onPress={remove}>
          <Label title="Delete" systemImage="trash" />
        </Button>
      </ContextMenu>
    </Button>
  );
}
