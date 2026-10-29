// Flashcards: decks with Leitner-box spaced repetition. Study by swiping
// cards (worklet-driven drag, tilt, fly-off), flip them with a tap, and keep
// a daily streak. Decks and progress persist in zustand + localStorage.
import { useState } from "react";
import {
  Navigator, useNavigation, Screen, ToolbarItem, List, Section, Button, HStack, VStack, Text, Image, Label, Spacer,
  Sheet, Alert, SwipeActions, ContextMenu, ContentUnavailable, withAnimation, useNow, format,
} from "swiftjsx";
import { currentStreak, dueCards, MAX_BOX, type Deck } from "./model";
import { useFlashcards } from "./store";
import { themeOf } from "./theme";
import { DeckIcon } from "./ui";
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
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState<Deck | null>(null);
  const due = decks.reduce((n, deck) => n + dueCards(deck, now).length, 0);

  return (
    <Screen title="Flashcards">
      <ToolbarItem placement="primaryAction">
        <Button
          onPress={() => setCreating(true)}
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
              <DeckRow key={deck.id} deck={deck} now={now} onDelete={() => setDeleting(deck)} />
            ))}
          </Section>
        </List>
      ) : (
        <ContentUnavailable systemImage="rectangle.on.rectangle.angled" title="No decks" description="Create a deck and add a few cards to start learning.">
          <Button title="New Deck" buttonStyle="borderedProminent" onPress={() => setCreating(true)} />
        </ContentUnavailable>
      )}

      <Sheet isPresented={creating} onDismiss={() => setCreating(false)}>
        <Navigator>
          <NewDeckForm
            onCancel={() => setCreating(false)}
            onCreate={(deckId) => {
              setCreating(false);
              nav.push(<DeckScreen deckId={deckId} />);
            }}
          />
        </Navigator>
      </Sheet>

      <Alert
        item={deleting}
        onDismiss={() => setDeleting(null)}
        title={(deck) => `Delete "${deck.name}"?`}
        message={(deck) => `Its ${format.count(deck.cards.length, { one: "# card", other: "# cards" })} and your progress on them will be gone.`}
      >
        {(deck) => (
          <>
            <Button title="Delete" role="destructive" onPress={() => withAnimation("default", () => removeDeck(deck.id))} />
            <Button title="Cancel" role="cancel" onPress={() => {}} />
          </>
        )}
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
          {format.count(streak, { one: "# day", other: "# days" })}
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
            {format.count(deck.cards.length, { one: "# card", other: "# cards" })}{mastered ? ` · ${mastered} mastered` : ""}
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
