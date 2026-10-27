// Edit a deck: its name, color and icon, and its cards.
import { useState } from "react";
import {
  Navigator, Screen, ToolbarItem, Form, Section, TextField, Button, HStack, VStack, Text, Image, Label, Spacer,
  Sheet, Alert, SwipeActions, withAnimation, type Color,
} from "swiftjsx";
import { plural, type Card } from "./model";
import { useDeck, useFlashcards } from "./store";
import { themeOf } from "./theme";
import { BoxMeter, SymbolPicker, ThemePicker } from "./ui";
import { CardForm } from "./forms";

export function DeckScreen({ deckId }: { deckId: string }) {
  const deck = useDeck(deckId);
  const { updateDeck, saveCard, removeCard, resetProgress } = useFlashcards();
  // Kept after closing, so the sheet's content doesn't vanish while it slides away.
  const [editor, setEditor] = useState<{ open: boolean; card?: Card; key: number }>({ open: false, key: 0 });
  const [confirmingReset, setConfirmingReset] = useState(false);

  if (!deck) return <Screen title="Deck" />;
  const tint = themeOf(deck.theme).tint;
  const openEditor = (card?: Card) => setEditor((e) => ({ open: true, card, key: e.key + 1 }));
  const closeEditor = () => setEditor((e) => ({ ...e, open: false }));

  return (
    <Screen title={deck.name || "Untitled Deck"} titleDisplayMode="inline">
      <ToolbarItem placement="primaryAction">
        <Button onPress={() => openEditor()} accessibilityLabel="Add card" accessibilityIdentifier="add-card">
          <Image systemName="plus" />
        </Button>
      </ToolbarItem>

      <Form>
        <Section header="Deck">
          <TextField placeholder="Name" value={deck.name} onChange={(name) => updateDeck(deck.id, { name })} />
          <ThemePicker value={deck.theme} onChange={(theme) => updateDeck(deck.id, { theme })} />
          <SymbolPicker value={deck.symbol} theme={deck.theme} onChange={(symbol) => updateDeck(deck.id, { symbol })} />
        </Section>

        <Section header={plural(deck.cards.length, "Card")} footer="Tap a card to edit it. Swipe left to delete.">
          {deck.cards.map((card) => (
            <CardRow
              key={card.id}
              card={card}
              tint={tint}
              onPress={() => openEditor(card)}
              onDelete={() => withAnimation("default", () => removeCard(deck.id, card.id))}
            />
          ))}
          <Button onPress={() => openEditor()}>
            <Label title="Add Card" systemImage="plus.circle.fill" />
          </Button>
        </Section>

        <Section footer="Moves every card back to box 1, due today.">
          <Button title="Reset Progress" role="destructive" onPress={() => setConfirmingReset(true)} />
        </Section>
      </Form>

      <Sheet isPresented={editor.open} onDismiss={closeEditor} detents={["medium", "large"]}>
        <Navigator>
          <CardForm
            key={editor.key}
            card={editor.card}
            theme={deck.theme}
            onCancel={closeEditor}
            onSave={(input) => {
              saveCard(deck.id, { ...input, id: editor.card?.id });
              closeEditor();
            }}
          />
        </Navigator>
      </Sheet>

      <Alert
        isPresented={confirmingReset}
        onDismiss={() => setConfirmingReset(false)}
        title={`Reset "${deck.name}"?`}
        message="You'll start learning every card from scratch."
      >
        <Button title="Reset" role="destructive" onPress={() => resetProgress(deck.id)} />
        <Button title="Cancel" role="cancel" onPress={() => {}} />
      </Alert>
    </Screen>
  );
}

function CardRow({ card, tint, onPress, onDelete }: { card: Card; tint: Color; onPress(): void; onDelete(): void }) {
  return (
    <Button onPress={onPress} accessibilityIdentifier="card-row">
      <HStack spacing={12}>
        <VStack alignment="leading" spacing={2}>
          <Text foregroundStyle="primary" lineLimit={2}>{card.front}</Text>
          <Text font="subheadline" foregroundStyle="secondary" lineLimit={2}>{card.back}</Text>
        </VStack>
        <Spacer />
        <BoxMeter box={card.box} fill={tint} />
      </HStack>
      <SwipeActions edge="trailing" allowsFullSwipe>
        <Button role="destructive" onPress={onDelete}>
          <Label title="Delete" systemImage="trash" />
        </Button>
      </SwipeActions>
    </Button>
  );
}
