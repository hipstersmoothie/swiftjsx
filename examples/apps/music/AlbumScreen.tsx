// An album: big artwork, play/shuffle, the track list (iTunes Lookup).
import { useQuery } from "@tanstack/react-query";
import { Screen, ToolbarItem, ScrollView, LazyVStack, VStack, HStack, Text, Button, Image, ProgressView, Divider, useNavigation } from "swiftjsx";
import { formatMinutes, lookupAlbum } from "./api";
import { playTracks, shuffleTracks } from "./player";
import { useLibrary } from "./library";
import { Artwork, ErrorView, PlayShuffle, TrackRow } from "./ui";
import { ArtistScreen } from "./ArtistScreen";

export const albumQuery = (id: number) => ({
  queryKey: ["album", id],
  queryFn: ({ signal }: { signal: AbortSignal }) => lookupAlbum(id, signal),
  staleTime: 30 * 60_000,
});

export function AlbumScreen({ id }: { id: number }) {
  const nav = useNavigation();
  const { data, isPending, isError, error, refetch } = useQuery(albumQuery(id));
  const liked = useLibrary((s) => s.liked);
  const toggleLike = useLibrary((s) => s.toggleLike);

  if (isPending) return <Screen title="" titleDisplayMode="inline"><ProgressView frame={{ maxWidth: "infinity", maxHeight: "infinity" }} /></Screen>;
  if (isError) return <Screen title="Album" titleDisplayMode="inline"><ErrorView message={error.message} retry={() => refetch()} /></Screen>;

  const { album, tracks } = data;
  const title = album?.title ?? tracks[0]?.album ?? "Album";
  const artist = album?.artist ?? tracks[0]?.artist ?? "";
  const artistId = album?.artistId ?? tracks[0]?.artistId ?? 0;
  const artwork = album?.artwork ?? tracks[0]?.artwork ?? "";
  const totalMs = tracks.reduce((sum, t) => sum + t.durationMs, 0);
  const allLiked = tracks.length > 0 && tracks.every((t) => liked.some((l) => l.id === t.id));
  const discs = new Set(tracks.map((t) => t.discNumber)).size;

  return (
    <Screen title={title} titleDisplayMode="inline">
      <ToolbarItem placement="primaryAction">
        <Button
          onPress={() => tracks.filter((t) => allLiked || !liked.some((l) => l.id === t.id)).forEach(toggleLike)}
          accessibilityLabel={allLiked ? "Remove album from Liked" : "Love every song"}
        >
          <Image systemName={allLiked ? "heart.fill" : "heart"} foregroundStyle="pink" />
        </Button>
      </ToolbarItem>
      <ScrollView>
        <LazyVStack spacing={0}>
          <VStack spacing={6} padding={{ horizontal: 20, top: 12, bottom: 18 }}>
            <Artwork url={artwork} size={250} radius={10} shadow />
            <Text font="title2" fontWeight="bold" textAlignment="center" padding={{ top: 14 }}>{title}</Text>
            <Button
              buttonStyle="plain"
              onPress={() => artistId && nav.push(<ArtistScreen id={artistId} name={artist} />)}
              accessibilityHint="Opens the artist"
            >
              <Text font="title3" foregroundStyle="pink" textAlignment="center">{artist}</Text>
            </Button>
            <Text font="footnote" fontWeight="medium" foregroundStyle="secondary" textCase="uppercase">
              {[album?.genre, album?.year].filter(Boolean).join(" · ")}
            </Text>
            <PlayShuffle
              disabled={!tracks.length}
              onPlay={() => playTracks(tracks, 0, title)}
              onShuffle={() => shuffleTracks(tracks, title)}
            />
          </VStack>
          <Divider padding={{ leading: 20 }} />
          {tracks.map((track, i) => (
            <VStack key={track.id} spacing={0}>
              {discs > 1 && (i === 0 || tracks[i - 1].discNumber !== track.discNumber) ? (
                <Text font="headline" frame={{ maxWidth: "infinity", alignment: "leading" }} padding={{ horizontal: 20, top: 16, bottom: 6 }}>
                  Disc {track.discNumber}
                </Text>
              ) : null}
              <VStack padding={{ horizontal: 20, vertical: 8 }}>
                <TrackRow
                  track={track}
                  leading="number"
                  // Compilations: show who's on each track.
                  detail={track.artist !== artist ? "artist" : "none"}
                  onPress={() => playTracks(tracks, i, title)}
                  accessibilityIdentifier="album-track"
                />
              </VStack>
              <Divider padding={{ leading: 58 }} />
            </VStack>
          ))}
          <VStack alignment="leading" spacing={4} padding={20} frame={{ maxWidth: "infinity", alignment: "leading" }}>
            <Text font="footnote" foregroundStyle="secondary">
              {tracks.length} {tracks.length === 1 ? "song" : "songs"}, {formatMinutes(totalMs)}
            </Text>
            {album?.copyright ? <Text font="footnote" foregroundStyle="secondary">{album.copyright}</Text> : null}
          </VStack>
        </LazyVStack>
      </ScrollView>
    </Screen>
  );
}
