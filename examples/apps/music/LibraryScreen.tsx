// Library: liked songs (swipe to remove) and recently played.
import { useState } from "react";
import { Screen, ToolbarItem, List, Section, Button, Image, Label, Picker, SwipeActions, VStack } from "swiftjsx";
import { useLibrary } from "./library";
import { playTracks, shuffleTracks } from "./player";
import { RegisterNavigation } from "./router";
import { EmptyState, PlayShuffle, TrackRow } from "./ui";

type Shelf = "liked" | "recent";

export function LibraryScreen() {
  const [shelf, setShelf] = useState<Shelf>("liked");
  const liked = useLibrary((s) => s.liked);
  const recent = useLibrary((s) => s.recentlyPlayed);
  const toggleLike = useLibrary((s) => s.toggleLike);
  const tracks = shelf === "liked" ? liked : recent;
  const source = shelf === "liked" ? "Liked Songs" : "Recently Played";

  return (
    <Screen title="Library">
      <RegisterNavigation tab="library" />
      {shelf === "liked" && liked.length ? (
        <ToolbarItem placement="primaryAction">
          <Button onPress={() => shuffleTracks(liked, source)} accessibilityLabel="Shuffle liked songs">
            <Image systemName="shuffle" />
          </Button>
        </ToolbarItem>
      ) : null}
      <VStack spacing={0} frame={{ maxWidth: "infinity", maxHeight: "infinity" }}>
        <Picker
          value={shelf}
          onChange={(v) => setShelf(v as Shelf)}
          options={[
            { value: "liked", label: `Liked (${liked.length})` },
            { value: "recent", label: "Recently Played" },
          ]}
          pickerStyle="segmented"
          padding={{ horizontal: 16, vertical: 8 }}
        />
        {tracks.length ? (
          <List>
            <Section>
              <PlayShuffle onPlay={() => playTracks(tracks, 0, source)} onShuffle={() => shuffleTracks(tracks, source)} />
            </Section>
            <Section footer={shelf === "liked" ? "Swipe left on a song to remove it." : undefined}>
              {tracks.map((track, i) => (
                <TrackRow key={track.id} track={track} detail="both" onPress={() => playTracks(tracks, i, source)} accessibilityIdentifier="library-song">
                  {shelf === "liked" ? (
                    <SwipeActions edge="trailing">
                      <Button role="destructive" onPress={() => toggleLike(track)}>
                        <Label title="Remove" systemImage="heart.slash" />
                      </Button>
                    </SwipeActions>
                  ) : null}
                </TrackRow>
              ))}
            </Section>
          </List>
        ) : shelf === "liked" ? (
          <EmptyState icon="heart" title="No Liked Songs" message="Tap the heart in Now Playing, or long-press a song and choose Love." />
        ) : (
          <EmptyState icon="clock" title="Nothing Played Yet" message="Songs you play show up here." />
        )}
      </VStack>
    </Screen>
  );
}
