// Statistics per board size (pushed screen; reads the store itself, since a
// pushed screen keeps the props it was pushed with).
import { useState, type ReactNode } from "react";
import { format, Screen, List, Section, HStack, Text, Spacer, Button, Picker, ConfirmationDialog } from "swiftjsx";
import { useGame, BOARD_SIZES, type BoardSize } from "./store";
import { tileStyle } from "./theme";

export function StatsScreen() {
  const size = useGame((s) => s.size);
  const slot = useGame((s) => s.slots[s.size]);
  const [confirming, setConfirming] = useState(false);
  const { stats } = slot;
  const winRate = stats.played > 0 ? stats.won / stats.played : 0;
  const best = tileStyle(stats.bestTile);

  return (
    <Screen title="Statistics" titleDisplayMode="inline">
      <List listStyle="insetGrouped">
        <Section>
          <Picker
            label="Board"
            value={String(size)}
            onChange={(value) => useGame.getState().setSize(Number(value) as BoardSize)}
            options={BOARD_SIZES.map((n) => ({ value: String(n), label: `${n} × ${n}` }))}
            pickerStyle="segmented"
            accessibilityIdentifier="stats-size"
          />
        </Section>
        <Section header={`${size} × ${size}`}>
          <Row label="Games played" id="stat-played">{stats.played}</Row>
          <Row label="Wins" id="stat-wins">{stats.won}</Row>
          <Row label="Win rate" id="stat-win-rate">{format.percent(winRate)}</Row>
          <Row label="Best score" id="stat-best-score">{stats.bestScore}</Row>
          <Row label="Highest tile" id="stat-best-tile">
            {stats.bestTile > 0 ? (
              <Text
                font={{ size: 15, weight: "bold" }}
                foregroundStyle={best.foreground}
                padding={{ horizontal: 8, vertical: 3 }}
                background={best.background}
                cornerRadius={5}
              >
                {String(stats.bestTile)}
              </Text>
            ) : (
              "—"
            )}
          </Row>
          <Row label="Moves" id="stat-moves">{stats.totalMoves}</Row>
          <Row label="Fastest 2048" id="stat-fastest">{stats.fastestWinMs == null ? "—" : format.duration(Math.floor(stats.fastestWinMs / 1000))}</Row>
        </Section>
        <Section footer="Swipe on the board (or use the arrow buttons) to slide every tile. Two tiles with the same number merge into one. Reach 2048 to win.">
          <Button role="destructive" onPress={() => setConfirming(true)} accessibilityIdentifier="reset-stats">
            <Text>Reset Statistics</Text>
            <ConfirmationDialog
              isPresented={confirming}
              onDismiss={() => setConfirming(false)}
              title={`Reset ${size} × ${size} statistics?`}
              message="Your current game stays."
            >
              <Button title="Reset Statistics" role="destructive" onPress={() => useGame.getState().resetStats()} />
              <Button title="Cancel" role="cancel" onPress={() => {}} />
            </ConfirmationDialog>
          </Button>
        </Section>
      </List>
    </Screen>
  );
}

function Row({ label, id, children }: { label: string; id: string; children: ReactNode }) {
  const plain = typeof children === "string" || typeof children === "number";
  return (
    <HStack accessibilityElement="combine" accessibilityIdentifier={id}>
      <Text>{label}</Text>
      <Spacer />
      {plain ? (
        <Text foregroundStyle="secondaryLabel" monospacedDigit>
          {String(children)}
        </Text>
      ) : (
        children
      )}
    </HStack>
  );
}
