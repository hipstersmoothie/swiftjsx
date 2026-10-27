// Sheets for creating a deck and adding or editing a card. Each one renders
// inside its own <Navigator> so it gets a title and Cancel / Save buttons.
import { useEffect, useRef, useState } from "react";
import { Screen, ToolbarItem, Form, Section, TextField, Button, VStack, HStack, Text, type HostInstance } from "swiftjsx";
import { dueIn, type Card } from "./model";
import { useFlashcards, useNow } from "./store";
import { symbols, themeOf, type ThemeName } from "./theme";
import { BoxMeter, DeckIcon, SymbolPicker, ThemePicker } from "./ui";

/** Focuses a text field once its sheet is up. */
function useAutoFocus() {
  const ref = useRef<HostInstance>(null);
  useEffect(() => {
    // Focusing during the sheet's presentation animation is ignored.
    const id = setTimeout(() => ref.current?.focus(), 450);
    return () => clearTimeout(id);
  }, []);
  return ref;
}

export function NewDeckForm({ onCancel, onCreate }: { onCancel(): void; onCreate(deckId: string): void }) {
  const addDeck = useFlashcards((s) => s.addDeck);
  const [name, setName] = useState("");
  const [theme, setTheme] = useState<ThemeName>("blue");
  const [symbol, setSymbol] = useState(symbols[0]);
  const nameField = useAutoFocus();
  const valid = name.trim().length > 0;
  const create = () => valid && onCreate(addDeck({ name: name.trim(), theme, symbol }));

  return (
    <Screen title="New Deck" titleDisplayMode="inline">
      <ToolbarItem placement="cancellationAction">
        <Button title="Cancel" onPress={onCancel} />
      </ToolbarItem>
      <ToolbarItem placement="confirmationAction">
        <Button title="Create" onPress={create} disabled={!valid} accessibilityIdentifier="create-deck" />
      </ToolbarItem>
      <Form>
        <Section>
          <VStack spacing={12} padding={{ vertical: 12 }} frame={{ maxWidth: "infinity" }}>
            <DeckIcon theme={theme} symbol={symbol} size={72} />
            <Text font="title3" fontWeight="semibold" foregroundStyle={valid ? "primary" : "secondary"}>
              {name.trim() || "New Deck"}
            </Text>
          </VStack>
        </Section>
        <Section header="Name">
          <TextField ref={nameField} placeholder="e.g. French verbs" value={name} onChange={setName} onSubmit={create} accessibilityIdentifier="deck-name" />
        </Section>
        <Section header="Color">
          <ThemePicker value={theme} onChange={setTheme} />
        </Section>
        <Section header="Icon">
          <SymbolPicker value={symbol} theme={theme} onChange={setSymbol} />
        </Section>
      </Form>
    </Screen>
  );
}

type CardFormProps = { card?: Card; theme: ThemeName; onCancel(): void; onSave(card: { front: string; back: string }): void };

export function CardForm({ card, theme, onCancel, onSave }: CardFormProps) {
  const [front, setFront] = useState(card?.front ?? "");
  const [back, setBack] = useState(card?.back ?? "");
  const frontField = useAutoFocus();
  const backField = useRef<HostInstance>(null);
  const now = useNow();
  const valid = front.trim().length > 0 && back.trim().length > 0;
  const save = () => valid && onSave({ front: front.trim(), back: back.trim() });

  return (
    <Screen title={card ? "Edit Card" : "New Card"} titleDisplayMode="inline">
      <ToolbarItem placement="cancellationAction">
        <Button title="Cancel" onPress={onCancel} />
      </ToolbarItem>
      <ToolbarItem placement="confirmationAction">
        <Button title={card ? "Save" : "Add"} onPress={save} disabled={!valid} accessibilityIdentifier="save-card" />
      </ToolbarItem>
      <Form>
        <Section header="Front" footer="The question or prompt you'll see first.">
          <TextField
            ref={frontField}
            placeholder="Question"
            value={front}
            onChange={setFront}
            onSubmit={() => backField.current?.focus()}
            accessibilityIdentifier="card-front"
          />
        </Section>
        <Section header="Back">
          <TextField ref={backField} placeholder="Answer" value={back} onChange={setBack} onSubmit={save} accessibilityIdentifier="card-back" />
        </Section>
        {card ? (
          <Section header="Progress">
            <HStack>
              <Text>Box {card.box}</Text>
              <BoxMeter box={card.box} fill={themeOf(theme).tint} />
              <Text foregroundStyle="secondary" frame={{ maxWidth: "infinity", alignment: "trailing" }}>Due {dueIn(card.due, now)}</Text>
            </HStack>
          </Section>
        ) : null}
      </Form>
    </Screen>
  );
}
