// Shared pieces: artwork, track rows (with their context menu), the error
// state.
import type { ReactNode } from "react";
import { Button, ContentUnavailable, ContextMenu, HStack, Image, Label, Spacer, Text, VStack, type ColorValue } from "swiftjsx";
import { art, formatTime, type Track } from "./api";
import { useIsLiked, useLibrary } from "./library";
import { addToQueue, playNext, useCurrentTrack, usePlayer } from "./player";
import { useRouter } from "./router";

/** Square artwork, fetched at the right pixel size for the screen scale. */
export function Artwork({ url, size, radius = 8, shadow }: { url: string; size: number; radius?: number; shadow?: boolean }) {
  const pixels = [100, 200, 300, 600, 1000].find((p) => p >= size * 3) ?? 1000;
  return (
    <Image
      src={url ? art(url, pixels) : ""}
      contentMode="fill"
      frame={{ width: size, height: size }}
      background="secondarySystemFill"
      cornerRadius={radius}
      shadow={shadow ? { radius: 24, y: 14, color: "black/35" } : undefined}
      accessibilityHidden
    />
  );
}

export type TrackRowProps = {
  track: Track;
  onPress(): void;
  /** "art" for search and lists, "number" for an album's track list. */
  leading?: "art" | "number";
  /** The second line: the artist (default) or the album. */
  detail?: "artist" | "album" | "both" | "none";
  accessibilityIdentifier?: string;
  /** Row attachments, e.g. `<SwipeActions>`. */
  children?: ReactNode;
};

export function TrackRow({ track, onPress, leading = "art", detail = "artist", accessibilityIdentifier, children }: TrackRowProps) {
  const current = useCurrentTrack();
  const playing = usePlayer((s) => s.playing);
  const liked = useIsLiked(track.id);
  const isCurrent = current?.id === track.id;
  const second =
    detail === "none" ? "" : detail === "album" ? track.album : detail === "both" ? `${track.artist} · ${track.album}` : track.artist;
  const accent: ColorValue | undefined = isCurrent ? "pink" : undefined;

  return (
    <Button buttonStyle="plain" onPress={onPress} accessibilityIdentifier={accessibilityIdentifier} accessibilityLabel={second ? `${track.title}, ${second}` : track.title}>
      <HStack spacing={12} padding={{ vertical: 2 }}>
        {leading === "art" ? (
          <Artwork url={track.artwork} size={48} radius={6} />
        ) : (
          <HStack frame={{ width: 26 }}>
            {isCurrent ? (
              <Image systemName={playing ? "waveform" : "speaker.fill"} font="subheadline" foregroundStyle="pink" />
            ) : (
              <Text font="body" monospacedDigit foregroundStyle="secondary">{track.trackNumber || "–"}</Text>
            )}
          </HStack>
        )}
        <VStack alignment="leading" spacing={2}>
          <HStack spacing={4}>
            <Text font="body" lineLimit={1} foregroundStyle={accent ?? "primary"}>{track.title}</Text>
            {track.explicit ? <Image systemName="e.square.fill" font="caption" foregroundStyle="secondary" accessibilityLabel="Explicit" /> : null}
          </HStack>
          {second ? <Text font="subheadline" foregroundStyle="secondary" lineLimit={1}>{second}</Text> : null}
        </VStack>
        <Spacer minLength={4} />
        {liked ? <Image systemName="heart.fill" font="caption" foregroundStyle="pink" accessibilityLabel="Liked" /> : null}
        {leading === "number" ? (
          <Text font="subheadline" monospacedDigit foregroundStyle="secondary">{formatTime(track.durationMs / 1000)}</Text>
        ) : isCurrent ? (
          <Image systemName={playing ? "waveform" : "speaker.fill"} font="subheadline" foregroundStyle="pink" />
        ) : null}
      </HStack>
      <TrackMenu track={track} />
      {children}
    </Button>
  );
}

/** Long-press menu for a track. */
export function TrackMenu({ track, hideAlbum, hideArtist }: { track: Track; hideAlbum?: boolean; hideArtist?: boolean }) {
  const router = useRouter();
  const liked = useIsLiked(track.id);
  const toggleLike = useLibrary((s) => s.toggleLike);
  return (
    <ContextMenu>
      <Button onPress={() => playNext(track)}>
        <Label title="Play Next" systemImage="text.line.first.and.arrowtriangle.forward" />
      </Button>
      <Button onPress={() => addToQueue(track)}>
        <Label title="Play Last" systemImage="text.line.last.and.arrowtriangle.forward" />
      </Button>
      <Button onPress={() => toggleLike(track)}>
        <Label title={liked ? "Remove from Liked" : "Love"} systemImage={liked ? "heart.slash" : "heart"} />
      </Button>
      {hideAlbum || !track.albumId ? null : (
        <Button onPress={() => router.openAlbum(track.albumId)}>
          <Label title="Go to Album" systemImage="square.stack" />
        </Button>
      )}
      {hideArtist || !track.artistId ? null : (
        <Button onPress={() => router.openArtist(track.artistId, track.artist)}>
          <Label title="Go to Artist" systemImage="music.mic" />
        </Button>
      )}
    </ContextMenu>
  );
}

export function ErrorView({ message, retry }: { message: string; retry(): void }) {
  return (
    <ContentUnavailable systemImage="wifi.exclamationmark" title="Couldn’t Load" description={message}>
      <Button title="Try Again" buttonStyle="bordered" onPress={retry} />
    </ContentUnavailable>
  );
}

/** Play / Shuffle, side by side, as on an album page. */
export function PlayShuffle({ onPlay, onShuffle, disabled }: { onPlay(): void; onShuffle(): void; disabled?: boolean }) {
  return (
    <HStack spacing={12}>
      <Button buttonStyle="bordered" tint="pink" onPress={onPlay} disabled={disabled} frame={{ maxWidth: "infinity" }}>
        <Label title="Play" systemImage="play.fill" fontWeight="semibold" frame={{ maxWidth: "infinity" }} padding={{ vertical: 6 }} />
      </Button>
      <Button buttonStyle="bordered" tint="pink" onPress={onShuffle} disabled={disabled} frame={{ maxWidth: "infinity" }}>
        <Label title="Shuffle" systemImage="shuffle" fontWeight="semibold" frame={{ maxWidth: "infinity" }} padding={{ vertical: 6 }} />
      </Button>
    </HStack>
  );
}
