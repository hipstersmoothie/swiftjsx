// Now Playing: big artwork on a background tinted by it, a scrubber, the
// transport, volume, and Up Next. Drag the top half down to close (a worklet:
// the screen follows the finger on the main thread).
import { useRef, useState } from "react";
import {
  VStack, HStack, ZStack, ScrollView, Text, Image, Button, Slider, Spacer, ProgressView, Capsule, ConfirmationDialog,
  useSharedValue, useAnimatedStyle, withSpring, runOnJS, type HostInstance,
} from "swiftjsx";
import { formatTime, type Track } from "./api";
import { useArtworkTint, type Tint } from "./artwork";
import { useIsLiked, useLibrary } from "./library";
import {
  advance, cycleRepeat, jumpTo, playNext, previous, seek, setVolume, togglePlay, useCurrentTrack, usePlayer,
} from "./player";
import { useRouter } from "./router";
import { Artwork } from "./ui";
import { NativeNotice } from "./NativeNotice";

const DISMISS_DISTANCE = 140;

export function NowPlaying({ onClose }: { onClose(): void }) {
  const track = useCurrentTrack();
  const tint = useArtworkTint(track?.artwork);
  const [showQueue, setShowQueue] = useState(false);
  // The screen's width, for the artwork: there's no GeometryReader, so measure.
  const root = useRef<HostInstance>(null);
  const [width, setWidth] = useState(0);
  const drag = useSharedValue(0);
  const followFinger = useAnimatedStyle(() => ({ offset: { y: drag.get() } }));

  const measure = (retries = 3) => {
    drag.set(0);
    root.current?.measure().then((frame) => {
      // On the first appearance the frame may not be laid out yet.
      if (frame.width > 0) setWidth(frame.width);
      else if (retries > 0) setTimeout(() => measure(retries - 1), 100);
    });
  };

  return (
    <VStack
      ref={root}
      spacing={0}
      frame={{ maxWidth: "infinity", maxHeight: "infinity" }}
      background={{ gradient: [tint.top, tint.bottom], start: "top", end: "bottom" }}
      colorScheme="dark"
      foregroundStyle="white"
      animatedStyle={followFinger}
      onAppear={() => measure()}
    >
      {/* The drag area is the header and artwork, not Up Next: a drag over a ScrollView would fight its scrolling. */}
      <VStack
        spacing={0}
        frame={{ maxWidth: "infinity", maxHeight: showQueue ? undefined : "infinity" }}
        onDrag={(e) => {
          "worklet";
          drag.set(Math.max(0, e.translation.y));
        }}
        onDragEnd={(e) => {
          "worklet";
          if (e.translation.y > DISMISS_DISTANCE || e.predictedEndTranslation.y > DISMISS_DISTANCE * 3) {
            runOnJS(onClose)();
          } else {
            drag.set(withSpring(0, { bounce: 0.2 }));
          }
        }}
      >
        <Header onClose={onClose} showQueue={showQueue} track={track} />
        {!showQueue && track ? <ArtworkStage track={track} size={width ? Math.min(width - 64, 420) : 300} /> : null}
      </VStack>
      {showQueue ? <UpNext tint={tint} /> : null}
      {track ? null : <Spacer />}

      {track ? (
        <VStack spacing={18} padding={{ horizontal: 28, bottom: 20 }}>
          <TitleRow track={track} compact={showQueue} />
          <Scrubber accent={tint.accent} />
          <Transport />
          <Volume />
          <BottomBar showQueue={showQueue} onToggleQueue={() => setShowQueue((q) => !q)} />
        </VStack>
      ) : (
        <Text foregroundStyle="white/70" padding={40}>Nothing is playing.</Text>
      )}
    </VStack>
  );
}

function Header({ onClose, showQueue, track }: { onClose(): void; showQueue: boolean; track: Track | undefined }) {
  const source = usePlayer((s) => s.source);
  const router = useRouter();
  const [menu, setMenu] = useState(false);
  return (
    <VStack spacing={6} padding={{ horizontal: 16, top: 8 }}>
      <Capsule fill="white/35" frame={{ width: 38, height: 5 }} accessibilityHidden />
      <HStack>
        <Button buttonStyle="plain" onPress={onClose} accessibilityLabel="Close" accessibilityIdentifier="close-now-playing">
          <Image systemName="chevron.down" font="title3" fontWeight="semibold" frame={{ width: 44, height: 44 }} />
        </Button>
        <Spacer />
        <VStack spacing={1}>
          <Text font="caption2" fontWeight="semibold" foregroundStyle="white/60" textCase="uppercase" kerning={0.6}>
            {showQueue ? "Up Next" : "Playing From"}
          </Text>
          <Text font="footnote" fontWeight="semibold" lineLimit={1}>{source || "Music"}</Text>
        </VStack>
        <Spacer />
        <Button buttonStyle="plain" onPress={() => setMenu(true)} disabled={!track} accessibilityLabel="More">
          <Image systemName="ellipsis" font="title3" fontWeight="semibold" frame={{ width: 44, height: 44 }} />
          {track ? (
            <ConfirmationDialog isPresented={menu} onDismiss={() => setMenu(false)} title={track.title} message={`${track.artist} — ${track.album}`}>
              <Button title="Go to Album" onPress={() => router.openAlbum(track.albumId)} />
              <Button title="Go to Artist" onPress={() => router.openArtist(track.artistId, track.artist)} />
              <Button title="Play Again Next" onPress={() => playNext(track)} />
            </ConfirmationDialog>
          ) : null}
        </Button>
      </HStack>
    </VStack>
  );
}

function ArtworkStage({ track, size }: { track: Track; size: number }) {
  const playing = usePlayer((s) => s.playing);
  return (
    <VStack frame={{ maxWidth: "infinity", maxHeight: "infinity" }} padding={{ vertical: 12 }}>
      <Spacer />
      {/* Like Apple Music: the artwork shrinks back while paused. */}
      <VStack scale={playing ? 1 : 0.82} animation={{ type: "spring", bounce: 0.3 }}>
        <Artwork url={track.artwork} size={size} radius={14} shadow />
      </VStack>
      <Spacer />
    </VStack>
  );
}

function TitleRow({ track, compact }: { track: Track; compact: boolean }) {
  const liked = useIsLiked(track.id);
  const toggleLike = useLibrary((s) => s.toggleLike);
  const error = usePlayer((s) => s.error);
  const backend = usePlayer((s) => s.backend);
  return (
    <VStack alignment="leading" spacing={8}>
      {backend === "simulated" && !compact ? <NativeNotice compact /> : null}
      <HStack spacing={12}>
        {compact ? <Artwork url={track.artwork} size={52} radius={6} /> : null}
        <VStack alignment="leading" spacing={2}>
          <Text font="title3" fontWeight="bold" lineLimit={1} accessibilityIdentifier="now-playing-title">{track.title}</Text>
          <Text font="title3" foregroundStyle="white/65" lineLimit={1}>{track.artist}</Text>
        </VStack>
        <Spacer />
        <Button buttonStyle="plain" onPress={() => toggleLike(track)} accessibilityLabel={liked ? "Unlove" : "Love"} accessibilityIdentifier="like">
          <Image
            systemName={liked ? "heart.fill" : "heart"}
            font="title2"
            foregroundStyle={liked ? "pink" : "white"}
            frame={{ width: 40, height: 40 }}
            background="white/15"
            cornerRadius="capsule"
            scale={liked ? 1.08 : 1}
            animation="bouncy"
          />
        </Button>
      </HStack>
      {error ? (
        <HStack spacing={6}>
          <Image systemName="exclamationmark.triangle.fill" foregroundStyle="yellow" />
          <Text font="footnote" foregroundStyle="white/80" lineLimit={2}>{error}</Text>
        </HStack>
      ) : null}
    </VStack>
  );
}

/**
 * The progress slider. While the finger moves, it shows the finger's value
 * instead of the player's; the seek happens once the value settles (Slider
 * has no "editing ended" event).
 */
function Scrubber({ accent }: { accent: Tint["accent"] }) {
  const position = usePlayer((s) => s.position);
  const duration = usePlayer((s) => s.duration);
  const buffering = usePlayer((s) => s.buffering);
  const [scrub, setScrub] = useState<number | null>(null);
  const settle = useRef<number | undefined>(undefined);
  const shown = Math.min(scrub ?? position, duration);

  const onChange = (value: number) => {
    setScrub(value);
    clearTimeout(settle.current);
    settle.current = setTimeout(() => {
      seek(value).then(() => setScrub(null));
    }, 250);
  };

  return (
    <VStack spacing={4}>
      <Slider
        value={shown}
        onChange={onChange}
        min={0}
        max={Math.max(duration, 1)}
        tint={scrub === null ? "white" : accent}
        accessibilityIdentifier="scrubber"
        accessibilityLabel="Position"
        accessibilityValue={`${formatTime(shown)} of ${formatTime(duration)}`}
      />
      <HStack>
        <Text font="caption" fontWeight="medium" monospacedDigit foregroundStyle="white/60" accessibilityIdentifier="elapsed">
          {formatTime(shown)}
        </Text>
        <Spacer />
        {buffering ? <ProgressView tint="white" scale={0.6} frame={{ height: 12 }} /> : null}
        <Spacer />
        <Text font="caption" fontWeight="medium" monospacedDigit foregroundStyle="white/60" accessibilityIdentifier="remaining">
          -{formatTime(Math.max(0, duration - shown))}
        </Text>
      </HStack>
    </VStack>
  );
}

function Transport() {
  const playing = usePlayer((s) => s.playing);
  const hasNext = usePlayer((s) => s.index + 1 < s.queue.length || s.repeat === "all");
  return (
    <HStack spacing={0}>
      <Spacer />
      <Button buttonStyle="plain" onPress={previous} accessibilityLabel="Previous" accessibilityIdentifier="previous">
        <Image systemName="backward.fill" font={{ size: 30 }} frame={{ width: 64, height: 64 }} />
      </Button>
      <Spacer />
      <Button buttonStyle="plain" onPress={togglePlay} accessibilityLabel={playing ? "Pause" : "Play"} accessibilityIdentifier="play-pause">
        <ZStack frame={{ width: 80, height: 80 }} animation="snappy">
          <Image key={playing ? "pause" : "play"} systemName={playing ? "pause.fill" : "play.fill"} font={{ size: 48 }} transition="scale" />
        </ZStack>
      </Button>
      <Spacer />
      <Button buttonStyle="plain" onPress={() => advance()} disabled={!hasNext} accessibilityLabel="Next" accessibilityIdentifier="next">
        <Image systemName="forward.fill" font={{ size: 30 }} frame={{ width: 64, height: 64 }} opacity={hasNext ? 1 : 0.4} />
      </Button>
      <Spacer />
    </HStack>
  );
}

function Volume() {
  const volume = useLibrary((s) => s.volume);
  return (
    <HStack spacing={10}>
      <Image systemName="speaker.fill" font="caption" foregroundStyle="white/60" accessibilityHidden />
      <Slider value={volume} onChange={setVolume} min={0} max={1} tint="white" accessibilityLabel="Volume" accessibilityIdentifier="volume" />
      <Image systemName="speaker.wave.3.fill" font="caption" foregroundStyle="white/60" accessibilityHidden />
    </HStack>
  );
}

function BottomBar({ showQueue, onToggleQueue }: { showQueue: boolean; onToggleQueue(): void }) {
  const repeat = usePlayer((s) => s.repeat);
  return (
    <HStack>
      <Spacer />
      <Button buttonStyle="plain" onPress={cycleRepeat} accessibilityLabel="Repeat" accessibilityValue={repeat} accessibilityIdentifier="repeat">
        <Image
          systemName={repeat === "one" ? "repeat.1" : "repeat"}
          font="body"
          fontWeight="semibold"
          foregroundStyle={repeat === "off" ? "white/60" : "white"}
          frame={{ width: 40, height: 32 }}
          background={repeat === "off" ? "clear" : "white/20"}
          cornerRadius={8}
        />
      </Button>
      <Spacer />
      <Image systemName="airplayaudio" font="body" foregroundStyle="white/30" accessibilityLabel="AirPlay (not available)" />
      <Spacer />
      <Button buttonStyle="plain" onPress={onToggleQueue} accessibilityLabel="Up Next" accessibilityIdentifier="toggle-queue">
        <Image
          systemName="list.bullet"
          font="body"
          fontWeight="semibold"
          foregroundStyle={showQueue ? "white" : "white/60"}
          frame={{ width: 40, height: 32 }}
          background={showQueue ? "white/20" : "clear"}
          cornerRadius={8}
        />
      </Button>
      <Spacer />
    </HStack>
  );
}

/** The queue, inline in Now Playing (a ScrollView: a List would bring its own background). */
function UpNext({ tint }: { tint: Tint }) {
  const queue = usePlayer((s) => s.queue);
  const index = usePlayer((s) => s.index);
  const upcoming = queue.slice(index + 1);
  return (
    <ScrollView frame={{ maxWidth: "infinity", maxHeight: "infinity" }}>
      <VStack alignment="leading" spacing={0} padding={{ horizontal: 20, vertical: 8 }}>
        {upcoming.length ? (
          upcoming.map((track, i) => (
            <Button key={`${index + 1 + i}-${track.id}`} buttonStyle="plain" onPress={() => jumpTo(index + 1 + i)} accessibilityIdentifier="up-next-item">
              <HStack spacing={12} padding={{ vertical: 7 }}>
                <Artwork url={track.artwork} size={44} radius={5} />
                <VStack alignment="leading" spacing={1}>
                  <Text font="subheadline" fontWeight="medium" lineLimit={1}>{track.title}</Text>
                  <Text font="footnote" foregroundStyle="white/60" lineLimit={1}>{track.artist}</Text>
                </VStack>
                <Spacer />
                <Image systemName="play.fill" font="caption" foregroundStyle={tint.accent} />
              </HStack>
            </Button>
          ))
        ) : (
          <Text font="subheadline" foregroundStyle="white/60" padding={{ vertical: 24 }}>Nothing up next. Long-press songs and choose Play Next.</Text>
        )}
      </VStack>
    </ScrollView>
  );
}
