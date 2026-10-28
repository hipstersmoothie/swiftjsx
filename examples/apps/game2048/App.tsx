// 2048: slide numbered tiles on a 4×4 (or 5×5, 6×6) grid; equal tiles merge.
// Swipe on the board (direction-locked, main-thread worklets) or use the
// arrow buttons. Tiles slide to their cells (stable ids → animated offsets),
// merged tiles pop, new tiles grow in. Score with floating "+N", best score,
// one-step undo, a move counter and a clock that pauses in the background.
// Games, bests and stats per size persist with zustand + localStorage.
import { useRef, useState } from "react";
import {
  Navigator, useNavigation, Screen, ToolbarItem, VStack, HStack, Text, Image, Spacer, Button, Menu, Picker, Divider, Label,
  ConfirmationDialog, haptic, useSharedValue, withSpring, withTiming,
} from "swiftjsx";
import type { Direction } from "./game";
import { useGame, useSlot, useGameClock, BOARD_SIZES, type BoardSize } from "./store";
import { BoardArea } from "./Board";
import { ScoreBox, Clock, Stat, GameButton, EndCard, GAIN_MS, type Gain } from "./ui";
import { StatsScreen } from "./StatsScreen";
import { palette, SETTLE_MS } from "./theme";

export function Game2048App() {
  return (
    <Navigator>
      <GameScreen />
    </Navigator>
  );
}

const ARROWS: { direction: Direction; icon: string }[] = [
  { direction: "left", icon: "arrow.left" },
  { direction: "up", icon: "arrow.up" },
  { direction: "down", icon: "arrow.down" },
  { direction: "right", icon: "arrow.right" },
];

/** Points the board bumps toward a direction that doesn't move anything. */
const BUMP = 6;

function GameScreen() {
  const nav = useNavigation();
  const size = useGame((s) => s.size);
  const since = useGame((s) => s.clockSince);
  const { game, previous, stats } = useSlot();
  const [gains, setGains] = useState<Gain[]>([]);
  const [confirmingNew, setConfirmingNew] = useState(false);
  const nextGain = useRef(0);
  // The board's lean: the drag worklets write it, and so does a blocked move here.
  const nudge = useSharedValue({ x: 0, y: 0 });

  const showingWin = game.won && !game.keepPlaying && !game.over;
  const blocked = game.over || showingWin;
  useGameClock(game.moves > 0 && !blocked, game.id);

  const swipe = (direction: Direction) => {
    const result = useGame.getState().move(direction);
    if (!result) return;
    if (!result.moved) {
      // Nothing moves that way: bump the board toward it and back.
      const x = direction === "left" ? -BUMP : direction === "right" ? BUMP : 0;
      const y = direction === "up" ? -BUMP : direction === "down" ? BUMP : 0;
      nudge.set(withTiming({ x, y }, { duration: 0.06, easing: "easeOut" }));
      setTimeout(() => nudge.set(withSpring({ x: 0, y: 0 }, { duration: 0.3, bounce: 0.5 })), 60);
      haptic("rigid");
      return;
    }
    if (result.reachedWin) haptic("success");
    else if (result.ended) haptic("error");
    else if (result.merges > 0) haptic("light");

    if (result.gained > 0) {
      const id = ++nextGain.current;
      setGains((g) => [...g, { id, amount: result.gained }]);
      setTimeout(() => setGains((g) => g.filter((x) => x.id !== id)), GAIN_MS);
    }
    const { id, moves } = result.game;
    setTimeout(() => useGame.getState().settle(id, moves), SETTLE_MS);
  };

  const startNewGame = () => {
    setGains([]);
    useGame.getState().newGame();
  };
  // Only ask when there's a game in progress to lose.
  const askNewGame = () => {
    if (game.moves === 0 || game.over) startNewGame();
    else setConfirmingNew(true);
  };
  const undo = () => useGame.getState().undo();

  const best = Math.max(stats.bestScore, game.score);
  const overlay = game.over ? (
    <EndCard kind="over" score={game.score} canUndo={previous !== null} onPrimary={startNewGame} onSecondary={undo} />
  ) : showingWin ? (
    <EndCard kind="won" score={game.score} canUndo={false} onPrimary={() => useGame.getState().keepPlaying()} onSecondary={startNewGame} />
  ) : null;

  return (
    <Screen title="2048" titleDisplayMode="inline">
      <ToolbarItem placement="topBarLeading">
        <Button onPress={() => nav.push(<StatsScreen />)} accessibilityLabel="Statistics" accessibilityIdentifier="show-stats">
          <Image systemName="chart.bar.xaxis" />
        </Button>
      </ToolbarItem>
      <ToolbarItem placement="primaryAction">
        <Menu systemImage="square.grid.3x3" accessibilityLabel="Board size" accessibilityIdentifier="size-menu">
          <Picker
            label="Board size"
            value={String(size)}
            onChange={(value) => {
              setGains([]);
              useGame.getState().setSize(Number(value) as BoardSize);
            }}
            options={BOARD_SIZES.map((n) => ({ value: String(n), label: `${n} × ${n}` }))}
            pickerStyle="inline"
          />
          <Divider />
          <Button onPress={askNewGame}>
            <Label title="New Game" systemImage="arrow.counterclockwise" />
          </Button>
        </Menu>
      </ToolbarItem>

      <VStack spacing={14} padding={{ horizontal: 16, top: 8, bottom: 12 }} frame={{ maxWidth: "infinity", maxHeight: "infinity" }} background={palette.page}>
        <HStack spacing={8}>
          <VStack alignment="leading" spacing={0}>
            <Text font={{ size: 46, weight: "heavy" }} foregroundStyle={palette.text} accessibilityTraits="header">
              2048
            </Text>
            <Text font={{ size: 13, weight: "medium" }} foregroundStyle={palette.subtext}>
              {`${size} × ${size} · get to the 2048 tile`}
            </Text>
          </VStack>
          <Spacer />
          <ScoreBox label="SCORE" value={game.score} identifier="score" gains={gains} />
          <ScoreBox label="BEST" value={best} identifier="best-score" />
        </HStack>

        <HStack spacing={14}>
          <Stat icon="arrow.up.and.down.and.arrow.left.and.right" accessibilityIdentifier="moves" label={`${game.moves} moves`}>
            {String(game.moves)}
          </Stat>
          <Clock elapsedMs={game.elapsedMs} since={since} />
          <Spacer />
          <GameButton
            icon="arrow.uturn.backward"
            onPress={undo}
            disabled={previous === null}
            accessibilityLabel="Undo"
            accessibilityIdentifier="undo"
          />
          <GameButton title="New Game" onPress={askNewGame} accessibilityIdentifier="new-game">
            <ConfirmationDialog
              isPresented={confirmingNew}
              onDismiss={() => setConfirmingNew(false)}
              title="Start a new game?"
              message={`Your current game (${game.score} points) will be lost.`}
            >
              <Button title="New Game" role="destructive" onPress={startNewGame} />
              <Button title="Keep Playing" role="cancel" onPress={() => {}} />
            </ConfirmationDialog>
          </GameButton>
        </HStack>

        <BoardArea game={game} nudge={nudge} enabled={!blocked} onSwipe={swipe} overlay={overlay} />

        <HStack spacing={10}>
          {ARROWS.map(({ direction, icon }) => (
            <GameButton
              key={direction}
              icon={icon}
              width={58}
              height={44}
              onPress={() => swipe(direction)}
              disabled={blocked}
              accessibilityLabel={`Move ${direction}`}
              accessibilityIdentifier={`move-${direction}`}
            />
          ))}
        </HStack>
      </VStack>
    </Screen>
  );
}
