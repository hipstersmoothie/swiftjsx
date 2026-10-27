import { useRef, useState } from "react";
import {
  useNavigation, Screen, VStack, HStack, Text, Label, Button, ProgressView, withAnimation,
} from "swiftjsx";
import { dueCards, dueIn, plural, shuffle, type Card, type Deck } from "./model";
import { useDeck, useFlashcards, useNow } from "./store";
import { themeOf, type Theme } from "./theme";
import { CardStack, FLY_DURATION, type Exit } from "./CardStack";
import { Summary } from "./Summary";
import { DeckScreen } from "./DeckScreen";
import { EmptyState } from "./ui";

/** Studies a deck's due cards (or all of them with `practiceAll`). */
export function StudyScreen({ deckId, practiceAll = false }: { deckId: string; practiceAll?: boolean }) {
  const deck = useDeck(deckId);
  // Each round is a fixed, shuffled queue; a new id starts a fresh session.
  const [round, setRound] = useState(() => {
    const cards = deck ? shuffle(practiceAll ? deck.cards : dueCards(deck, Date.now())) : [];
    return cards.length ? { id: 1, cards } : null;
  });
  const start = (cards: Card[]) => setRound((r) => ({ id: (r?.id ?? 0) + 1, cards: shuffle(cards) }));

  if (!deck) return <Screen title="Deck" />;
  return (
    <Screen title={deck.name} titleDisplayMode="inline">
      {round ? (
        <Session key={round.id} deck={deck} cards={round.cards} onRestart={start} />
      ) : (
        <NothingDue deck={deck} onStart={start} />
      )}
    </Screen>
  );
}

function Session({ deck, cards, onRestart }: { deck: Deck; cards: Card[]; onRestart(cards: Card[]): void }) {
  const nav = useNavigation();
  const review = useFlashcards((s) => s.review);
  const theme = themeOf(deck.theme);
  const [index, setIndex] = useState(0);
  const [results, setResults] = useState<boolean[]>([]);
  const [exit, setExit] = useState<Exit | null>(null);
  // Set synchronously so a double tap on a button can't answer twice.
  const answering = useRef(false);

  const answer = (knewIt: boolean, fling: boolean) => {
    if (answering.current) return;
    answering.current = true;
    review(deck.id, cards[index].id, knewIt);
    setResults((r) => [...r, knewIt]);
    setExit({ knewIt, fling });
    // Animations have no completion callback: wait out the fly-off, then advance.
    setTimeout(() => {
      answering.current = false;
      withAnimation("smooth", () => {
        setExit(null);
        setIndex((i) => i + 1);
      });
    }, FLY_DURATION * 1000);
  };

  if (index >= cards.length) {
    const missed = cards.filter((_, i) => !results[i]).map((c) => c.id);
    return (
      <Summary
        theme={theme}
        results={results}
        onReviewMissed={() => onRestart(deck.cards.filter((c) => missed.includes(c.id)))}
        onDone={nav.pop}
      />
    );
  }

  return (
    <VStack spacing={20} padding={{ horizontal: 20, top: 8, bottom: 16 }} frame={{ maxHeight: "infinity" }} transition="opacity">
      <SessionProgress done={results.length} total={cards.length} theme={theme} />
      <CardStack cards={cards} index={index} exit={exit} theme={theme} onSwipe={(knewIt) => answer(knewIt, false)} />
      <AnswerButtons onAnswer={(knewIt) => answer(knewIt, true)} />
    </VStack>
  );
}

function SessionProgress({ done, total, theme }: { done: number; total: number; theme: Theme }) {
  return (
    <HStack spacing={12} accessibilityElement="ignore" accessibilityLabel="Progress" accessibilityValue={`${done} of ${total} cards`}>
      <ProgressView value={done} total={total} tint={theme.tint} animation="smooth" />
      <Text font="subheadline" fontWeight="medium" monospacedDigit foregroundStyle="secondary" animation="snappy">
        {done}/{total}
      </Text>
    </HStack>
  );
}

function AnswerButtons({ onAnswer }: { onAnswer(knewIt: boolean): void }) {
  return (
    <HStack spacing={12}>
      <Button
        buttonStyle="bordered"
        tint="red"
        onPress={() => onAnswer(false)}
        accessibilityIdentifier="again"
        accessibilityHint="You'll see this card again today"
      >
        <Label title="Again" systemImage="arrow.counterclockwise" font="headline" padding={{ vertical: 8 }} frame={{ maxWidth: "infinity" }} />
      </Button>
      <Button
        buttonStyle="borderedProminent"
        tint="green"
        onPress={() => onAnswer(true)}
        accessibilityIdentifier="got-it"
        accessibilityHint="Moves this card up a box, so it comes back later"
      >
        <Label title="Got it" systemImage="checkmark" font="headline" padding={{ vertical: 8 }} frame={{ maxWidth: "infinity" }} />
      </Button>
    </HStack>
  );
}

/** Nothing to study: an empty deck, cards added since, or everything scheduled for later. */
function NothingDue({ deck, onStart }: { deck: Deck; onStart(cards: Card[]): void }) {
  const nav = useNavigation();
  const now = useNow();
  const due = dueCards(deck, now);
  const nextDue = Math.min(...deck.cards.map((c) => c.due));

  if (!deck.cards.length) {
    return (
      <EmptyState symbol="rectangle.stack.badge.plus" title="No cards yet" message="Add a few cards to start studying this deck.">
        <Button title="Add Cards" buttonStyle="borderedProminent" onPress={() => nav.push(<DeckScreen deckId={deck.id} />)} />
      </EmptyState>
    );
  }
  if (due.length) {
    return (
      <EmptyState symbol="play.circle" title={`${plural(due.length, "card")} ready`} message="New and missed cards are due today.">
        <Button title="Start" buttonStyle="borderedProminent" onPress={() => onStart(due)} />
      </EmptyState>
    );
  }
  return (
    <EmptyState symbol="checkmark.seal.fill" title="All caught up" message={`Your next review is ${dueIn(nextDue, now)}. Practicing now won't hurt, though.`}>
      <Button title="Practice All Cards" buttonStyle="borderedProminent" onPress={() => onStart(deck.cards)} />
    </EmptyState>
  );
}
