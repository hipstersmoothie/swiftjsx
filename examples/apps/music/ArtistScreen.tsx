// An artist: a header tinted by their latest album, top songs, and albums.
import { useQuery } from "@tanstack/react-query";
import { Screen, ScrollView, LazyVStack, VStack, HStack, Text, Button, ProgressView, Divider, LazyVGrid, Spacer, Image, useNavigation } from "swiftjsx";
import { lookupArtist } from "./api";
import { playTracks, shuffleTracks } from "./player";
import { useArtworkTint } from "./artwork";
import { Artwork, ErrorView, TrackRow } from "./ui";
import { AlbumScreen } from "./AlbumScreen";

export function ArtistScreen({ id, name }: { id: number; name: string }) {
  const nav = useNavigation();
  const { data, isPending, isError, error, refetch } = useQuery({
    queryKey: ["artist", id],
    queryFn: ({ signal }) => lookupArtist(id, signal),
    staleTime: 30 * 60_000,
  });
  const cover = data?.albums[0]?.artwork ?? data?.songs[0]?.artwork;
  const tint = useArtworkTint(cover);

  if (isPending) return <Screen title={name} titleDisplayMode="inline"><ProgressView frame={{ maxWidth: "infinity", maxHeight: "infinity" }} /></Screen>;
  if (isError) return <Screen title={name} titleDisplayMode="inline"><ErrorView message={error.message} retry={() => refetch()} /></Screen>;

  const { artist, songs, albums } = data;
  const top = songs.slice(0, 10);
  const source = artist?.name ?? name;

  return (
    <Screen title={source} titleDisplayMode="inline">
      <ScrollView>
        <LazyVStack alignment="leading" spacing={0}>
          <VStack
            alignment="leading"
            spacing={14}
            padding={{ horizontal: 20, top: 28, bottom: 20 }}
            frame={{ maxWidth: "infinity", alignment: "leading" }}
            background={{ gradient: [tint.top, tint.bottom], start: "top", end: "bottom" }}
            colorScheme="dark"
          >
            <HStack spacing={16}>
              {cover ? <Artwork url={cover} size={96} radius={48} shadow /> : null}
              <VStack alignment="leading" spacing={4}>
                <Text font="largeTitle" fontWeight="bold" foregroundStyle="white" lineLimit={2} minimumScaleFactor={0.6}>{source}</Text>
                {artist?.genre ? <Text font="subheadline" foregroundStyle="white/70">{artist.genre}</Text> : null}
              </VStack>
            </HStack>
            <HStack spacing={12}>
              <Button buttonStyle="borderedProminent" tint="white" disabled={!songs.length} onPress={() => playTracks(top, 0, source)}>
                <HStack spacing={6} padding={{ horizontal: 8, vertical: 4 }}>
                  <Image systemName="play.fill" foregroundStyle="black" />
                  <Text fontWeight="semibold" foregroundStyle="black">Play</Text>
                </HStack>
              </Button>
              <Button buttonStyle="bordered" tint="white" disabled={!songs.length} onPress={() => shuffleTracks(songs, source)}>
                <HStack spacing={6} padding={{ horizontal: 8, vertical: 4 }}>
                  <Image systemName="shuffle" />
                  <Text fontWeight="semibold">Shuffle</Text>
                </HStack>
              </Button>
            </HStack>
          </VStack>

          <Text font="title2" fontWeight="bold" padding={{ horizontal: 20, top: 20, bottom: 6 }}>Top Songs</Text>
          {top.map((track, i) => (
            <VStack key={track.id} spacing={0}>
              <VStack padding={{ horizontal: 20, vertical: 6 }}>
                <TrackRow track={track} detail="album" onPress={() => playTracks(top, i, source)} accessibilityIdentifier="artist-song" />
              </VStack>
              <Divider padding={{ leading: 80 }} />
            </VStack>
          ))}

          {albums.length ? (
            <VStack alignment="leading" spacing={10} padding={{ horizontal: 20, top: 24, bottom: 24 }}>
              <HStack>
                <Text font="title2" fontWeight="bold">Albums</Text>
                <Spacer />
                <Text font="subheadline" foregroundStyle="secondary">{albums.length}</Text>
              </HStack>
              <LazyVGrid columns={2} spacing={16}>
                {albums.map((album) => (
                  <Button key={album.id} buttonStyle="plain" onPress={() => nav.push(<AlbumScreen id={album.id} />)} accessibilityIdentifier="artist-album">
                    <VStack alignment="leading" spacing={4}>
                      <Artwork url={album.artwork} size={160} />
                      <Text font="footnote" fontWeight="medium" lineLimit={1}>{album.title}</Text>
                      <Text font="footnote" foregroundStyle="secondary">{album.year}</Text>
                    </VStack>
                  </Button>
                ))}
              </LazyVGrid>
            </VStack>
          ) : null}
        </LazyVStack>
      </ScrollView>
    </Screen>
  );
}
