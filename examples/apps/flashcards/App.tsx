// Flashcards: decks with Leitner-box spaced repetition. Study by swiping
// cards (worklet-driven drag, tilt, fly-off), flip them with a tap, and keep
// a daily streak. Decks and progress persist in zustand + localStorage.
import { useState } from "react";
import {
  Navigator, useNavigation, Screen, ToolbarItem, List, Section, Button, HStack, VStack, Text, Image, Label, Spacer,
  Sheet, Alert, SwipeActions, ContextMenu, withAnimation,
} from "swiftjsx";
import { currentStreak, dueCards, plural, MAX_BOX, type Deck } from "./model";
import { useFlashcards, useNow } from "./store";
import { themeOf } from "./theme";
import { DeckIcon, EmptyState } from "./ui";
import { StudyScreen } from "./StudyScreen";
import { DeckScreen } from "./DeckScreen";
import { NewDeckForm } from "./forms";

export function FlashcardsApp() {
  return (
    <Navigator>
      <HomeScreen />
    </Navigator>
  );
}

function HomeScreen() {
  const nav = useNavigation();
  const decks = useFlashcards((s) => s.decks);
  const streak = useFlashcards((s) => s.streak);
  const removeDeck = useFlashcards((s) => s.removeDeck);
  const now = useNow();
  // Presentations keep their last content while they animate away.
  const [creating, setCreating] = useState({ open: false, key: 0 });
  const [deleting, setDeleting] = useState<{ open: boolean; deck?: Deck }>({ open: false });
  const due = decks.reduce((n, deck) => n + dueCards(deck, now).length, 0);

  return (
    <Screen title="Flashcards">
      <ToolbarItem placement="primaryAction">
        <Button
          onPress={() => setCreating((c) => ({ open: true, key: c.key + 1 }))}
          accessibilityLabel="New deck"
          accessibilityIdentifier="new-deck"
        >
          <Image systemName="plus" />
        </Button>
      </ToolbarItem>

      {decks.length ? (
        <List>
          <Section>
            <TodayRow due={due} streak={currentStreak(streak, now)} />
          </Section>
          <Section header="Decks" footer="Long-press a deck for more options.">
            {decks.map((deck) => (
              <DeckRow key={deck.id} deck={deck} now={now} onDelete={() => setDeleting({ open: true, deck })} />
            ))}
          </Section>
        </List>
      ) : (
        <EmptyState symbol="rectangle.on.rectangle.angled" title="No decks" message="Create a deck and add a few cards to start learning.">
          <Button title="New Deck" buttonStyle="borderedProminent" onPress={() => setCreating((c) => ({ open: true, key: c.key + 1 }))} />
        </EmptyState>
      )}

      <Sheet isPresented={creating.open} onDismiss={() => setCreating((c) => ({ ...c, open: false }))}>
        <Navigator>
          <NewDeckForm
            key={creating.key}
            onCancel={() => setCreating((c) => ({ ...c, open: false }))}
            onCreate={(deckId) => {
              setCreating((c) => ({ ...c, open: false }));
              nav.push(<DeckScreen deckId={deckId} />);
            }}
          />
        </Navigator>
      </Sheet>

      <Alert
        isPresented={deleting.open}
        onDismiss={() => setDeleting((d) => ({ ...d, open: false }))}
        title={`Delete "${deleting.deck?.name}"?`}
        message={`Its ${deleting.deck?.cards.length} cards and your progress on them will be gone.`}
      >
        <Button title="Delete" role="destructive" onPress={() => deleting.deck && withAnimation("default", () => removeDeck(deleting.deck!.id))} />
        <Button title="Cancel" role="cancel" onPress={() => {}} />
      </Alert>
    </Screen>
  );
}

function TodayRow({ due, streak }: { due: number; streak: number }) {
  return (
    <HStack padding={{ vertical: 6 }} accessibilityElement="combine">
      <VStack alignment="leading" spacing={2}>
        <Text font="subheadline" foregroundStyle="secondary">Due today</Text>
        <Text font="largeTitle" fontWeight="bold" fontDesign="rounded" monospacedDigit animation="snappy">{due}</Text>
        <Text font="caption" foregroundStyle="secondary">{due ? "cards waiting for review" : "You're all caught up"}</Text>
      </VStack>
      <Spacer />
      <VStack spacing={4}>
        <Image systemName="flame.fill" font="largeTitle" foregroundStyle={streak ? "orange" : "secondary"} scale={streak ? 1 : 0.85} animation="bouncy" />
        <Text font="caption" fontWeight="semibold" foregroundStyle={streak ? "orange" : "secondary"}>
          {plural(streak, "day")}
        </Text>
      </VStack>
    </HStack>
  );
}

function DeckRow({ deck, now, onDelete }: { deck: Deck; now: number; onDelete(): void }) {
  const nav = useNavigation();
  const due = dueCards(deck, now).length;
  const mastered = deck.cards.filter((c) => c.box === MAX_BOX).length;
  const study = (practiceAll = false) => nav.push(<StudyScreen deckId={deck.id} practiceAll={practiceAll} />);
  const edit = () => nav.push(<DeckScreen deckId={deck.id} />);

  return (
    <Button onPress={() => study()} accessibilityIdentifier="deck-row" accessibilityHint="Studies the cards due today">
      <HStack spacing={14} padding={{ vertical: 4 }}>
        <DeckIcon theme={deck.theme} symbol={deck.symbol} />
        <VStack alignment="leading" spacing={3}>
          <Text font="headline" foregroundStyle="primary" lineLimit={1}>{deck.name || "Untitled Deck"}</Text>
          <Text font="subheadline" foregroundStyle="secondary">
            {plural(deck.cards.length, "card")}{mastered ? ` · ${mastered} mastered` : ""}
          </Text>
        </VStack>
        <Spacer />
        {due ? (
          <Text font="footnote" fontWeight="bold" monospacedDigit foregroundStyle="white" padding={{ horizontal: 10, vertical: 4 }} background={themeOf(deck.theme).tint} cornerRadius={12}>
            {due} due
          </Text>
        ) : (
          <Image systemName="checkmark.circle.fill" font="title3" foregroundStyle="green" accessibilityLabel="All caught up" />
        )}
      </HStack>

      <SwipeActions edge="trailing">
        <Button role="destructive" onPress={onDelete}>
          <Label title="Delete" systemImage="trash" />
        </Button>
        <Button tint="gray" onPress={edit}>
          <Label title="Edit" systemImage="pencil" />
        </Button>
      </SwipeActions>
      <ContextMenu>
        <Button onPress={() => study()}>
          <Label title="Study Due Cards" systemImage="play.fill" />
        </Button>
        <Button onPress={() => study(true)}>
          <Label title="Practice All Cards" systemImage="rectangle.stack" />
        </Button>
        <Button onPress={edit}>
          <Label title="Edit Deck" systemImage="pencil" />
        </Button>
        <Button role="destructive" onPress={onDelete}>
          <Label title="Delete Deck" systemImage="trash" />
        </Button>
      </ContextMenu>
    </Button>
  );
}
