// The bar above the tab bar: tap (or swipe up) to open Now Playing.
import { VStack, HStack, Text, Image, Button, Spacer, ProgressView } from "swiftjsx";
import { advance, togglePlay, useCurrentTrack, usePlayer } from "./player";
import { Artwork } from "./ui";

export function MiniPlayer({ onOpen }: { onOpen(): void }) {
  const track = useCurrentTrack();
  const playing = usePlayer((s) => s.playing);
  const buffering = usePlayer((s) => s.buffering);
  const position = usePlayer((s) => s.position);
  const duration = usePlayer((s) => s.duration);
  const error = usePlayer((s) => s.error);
  if (!track) return null;

  return (
    <VStack padding={{ horizontal: 10, top: 4, bottom: 6 }} transition="move">
      <VStack
        spacing={0}
        background="regularMaterial"
        cornerRadius={14}
        border={{ color: "separator", width: 0.5 }}
        shadow={{ radius: 12, y: 4, color: "black/15" }}
        onTapGesture={onOpen}
        onDragEnd={(e) => {
          if (e.translation.y < -24) onOpen();
        }}
        accessibilityElement="contain"
        accessibilityIdentifier="mini-player"
        accessibilityHint="Opens Now Playing"
      >
        <HStack spacing={12} padding={{ leading: 8, trailing: 6, top: 8, bottom: 6 }}>
          <Artwork url={track.artwork} size={44} radius={6} />
          <VStack alignment="leading" spacing={1}>
            <Text font="subheadline" fontWeight="semibold" lineLimit={1} accessibilityIdentifier="mini-player-title">{track.title}</Text>
            {error ? (
              <Text font="footnote" foregroundStyle="red" lineLimit={1}>Couldn’t play this preview</Text>
            ) : (
              <Text font="footnote" foregroundStyle="secondary" lineLimit={1}>{track.artist}</Text>
            )}
          </VStack>
          <Spacer minLength={4} />
          {buffering ? <ProgressView scale={0.8} /> : null}
          <Button buttonStyle="plain" onPress={togglePlay} accessibilityLabel={playing ? "Pause" : "Play"} accessibilityIdentifier="mini-player-play-pause">
            <Image systemName={playing ? "pause.fill" : "play.fill"} font="title2" frame={{ width: 40, height: 40 }} />
          </Button>
          <Button buttonStyle="plain" onPress={() => advance()} accessibilityLabel="Next" accessibilityIdentifier="mini-player-next">
            <Image systemName="forward.fill" font="title3" frame={{ width: 36, height: 40 }} />
          </Button>
        </HStack>
        <ProgressView value={Math.min(position, duration)} total={Math.max(duration, 1)} tint="pink" padding={{ horizontal: 14, bottom: 6 }} accessibilityHidden />
      </VStack>
    </VStack>
  );
}

/** The mini player as the tab bar's accessory (iOS 26): the system draws the bar. */
export function MiniPlayerAccessory({ onOpen }: { onOpen(): void }) {
  const track = useCurrentTrack();
  const playing = usePlayer((s) => s.playing);
  if (!track) return null;
  return (
    <HStack spacing={10} padding={{ horizontal: 12 }} onTapGesture={onOpen} accessibilityElement="contain" accessibilityIdentifier="mini-player">
      <Artwork url={track.artwork} size={30} radius={5} />
      <Text font="subheadline" fontWeight="semibold" lineLimit={1} accessibilityIdentifier="mini-player-title">{track.title}</Text>
      <Spacer minLength={4} />
      <Button buttonStyle="plain" onPress={togglePlay} accessibilityLabel={playing ? "Pause" : "Play"} accessibilityIdentifier="mini-player-play-pause">
        <Image systemName={playing ? "pause.fill" : "play.fill"} font="title3" frame={{ width: 32, height: 32 }} />
      </Button>
      <Button buttonStyle="plain" onPress={() => advance()} accessibilityLabel="Next" accessibilityIdentifier="mini-player-next">
        <Image systemName="forward.fill" font="body" frame={{ width: 28, height: 32 }} />
      </Button>
    </HStack>
  );
}
