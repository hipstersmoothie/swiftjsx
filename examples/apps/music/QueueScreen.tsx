// The queue: what's playing, what's next (swipe to remove), what played.
import { Screen, ToolbarItem, List, Section, Button, Label, SwipeActions, HStack, VStack, Text, Spacer, ContentUnavailable } from "swiftjsx";
import { clearUpcoming, cycleRepeat, jumpTo, removeFromQueue, shuffleUpcoming, usePlayer } from "./player";
import { RegisterNavigation, useRouter } from "./router";
import { TrackRow } from "./ui";

export function QueueScreen() {
  const queue = usePlayer((s) => s.queue);
  const index = usePlayer((s) => s.index);
  const upcoming = queue.length - index - 1;

  return (
    <Screen title="Up Next">
      <RegisterNavigation tab="queue" />
      {upcoming > 0 ? (
        <ToolbarItem placement="primaryAction">
          <Button onPress={clearUpcoming} accessibilityLabel="Clear Up Next">
            <Text>Clear</Text>
          </Button>
        </ToolbarItem>
      ) : null}
      {index < 0 ? (
        <ContentUnavailable systemImage="list.bullet" title="Nothing Queued" description="Play something from Search or your Library, then long-press songs to add them here." />
      ) : (
        <QueueList />
      )}
    </Screen>
  );
}

function QueueList() {
  const queue = usePlayer((s) => s.queue);
  const index = usePlayer((s) => s.index);
  const source = usePlayer((s) => s.source);
  const repeat = usePlayer((s) => s.repeat);
  const router = useRouter();
  const current = queue[index];
  const history = queue.slice(0, Math.max(0, index));
  const upcoming = queue.slice(index + 1);

  return (
    <List>
      {current ? (
        <Section header="Now Playing">
          <TrackRow track={current} detail="both" onPress={router.openNowPlaying} accessibilityIdentifier="queue-current" />
        </Section>
      ) : null}
      <Section header={source ? `Up Next · from ${source}` : "Up Next"} footer={upcoming.length ? "Swipe left to remove a song." : undefined}>
        <HStack spacing={12}>
          <Button buttonStyle="bordered" tint="pink" onPress={shuffleUpcoming} disabled={upcoming.length < 2}>
            <Label title="Shuffle" systemImage="shuffle" />
          </Button>
          <Button buttonStyle={repeat === "off" ? "bordered" : "borderedProminent"} tint="pink" onPress={cycleRepeat} accessibilityValue={repeat}>
            <Label title={repeat === "one" ? "Repeat One" : "Repeat"} systemImage={repeat === "one" ? "repeat.1" : "repeat"} />
          </Button>
          <Spacer />
        </HStack>
        {upcoming.length ? (
          upcoming.map((track, i) => {
            const at = index + 1 + i;
            return (
              <TrackRow key={`${at}-${track.id}`} track={track} detail="artist" onPress={() => jumpTo(at)} accessibilityIdentifier="queue-item">
                <SwipeActions edge="trailing">
                  <Button role="destructive" onPress={() => removeFromQueue(at)}>
                    <Label title="Remove" systemImage="minus.circle" />
                  </Button>
                </SwipeActions>
              </TrackRow>
            );
          })
        ) : (
          <VStack alignment="leading" spacing={2} padding={{ vertical: 4 }}>
            <Text foregroundStyle="secondary">Nothing up next.</Text>
            <Text font="footnote" foregroundStyle="tertiary">Long-press a song and choose Play Next or Play Last.</Text>
          </VStack>
        )}
      </Section>
      {history.length ? (
        <Section header="History">
          {history.map((track, i) => (
            <TrackRow key={`${i}-${track.id}`} track={track} detail="artist" onPress={() => jumpTo(i)} accessibilityIdentifier="queue-history" />
          ))}
        </Section>
      ) : null}
    </List>
  );
}
