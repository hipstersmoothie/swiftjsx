// Search: recent searches and genres when the field is empty; artists,
// albums and songs for a query (iTunes Search, debounced).
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Screen, List, Section, ScrollView, LazyVGrid, HStack, VStack, Text, Image, Button, ProgressView, Spacer, Divider,
  useNavigation,
} from "swiftjsx";
import { genres, searchSongs, type Track } from "./api";
import { useLibrary } from "./library";
import { playTracks } from "./player";
import { RegisterNavigation } from "./router";
import { Artwork, EmptyState, ErrorView, TrackRow } from "./ui";
import { AlbumScreen } from "./AlbumScreen";
import { ArtistScreen } from "./ArtistScreen";
import { NativeNotice } from "./NativeNotice";

function useDebounced<T>(value: T, ms: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), ms);
    return () => clearTimeout(timer);
  }, [value, ms]);
  return debounced;
}

export function SearchScreen() {
  const [text, setText] = useState("");
  const term = useDebounced(text.trim(), 350);
  const showResults = text.trim() !== "";

  return (
    <Screen title="Search" searchText={text} onSearchTextChange={setText} searchPrompt="Artists, Songs, Albums">
      <RegisterNavigation tab="search" />
      {showResults ? <Results term={term} /> : <Browse onPick={setText} />}
    </Screen>
  );
}

function Browse({ onPick }: { onPick(term: string): void }) {
  const recent = useLibrary((s) => s.recentSearches);
  const removeSearch = useLibrary((s) => s.removeSearch);
  const clearSearches = useLibrary((s) => s.clearSearches);

  return (
    <ScrollView>
      <VStack alignment="leading" spacing={22} padding={{ horizontal: 16, top: 4, bottom: 24 }}>
        <NativeNotice />
        {recent.length ? (
          <VStack alignment="leading" spacing={8}>
            <HStack>
              <Text font="title3" fontWeight="bold">Recently Searched</Text>
              <Spacer />
              <Button title="Clear" buttonStyle="borderless" tint="pink" onPress={clearSearches} />
            </HStack>
            {recent.map((term) => (
              <VStack key={term} spacing={8}>
                <HStack spacing={10} onTapGesture={() => onPick(term)} accessibilityElement="combine" accessibilityTraits="button">
                  <Image systemName="clock.arrow.circlepath" foregroundStyle="secondary" />
                  <Text lineLimit={1}>{term}</Text>
                  <Spacer />
                  <Button buttonStyle="plain" onPress={() => removeSearch(term)} accessibilityLabel={`Remove ${term}`}>
                    <Image systemName="xmark" font="caption" foregroundStyle="tertiary" padding={6} />
                  </Button>
                </HStack>
                <Divider padding={{ leading: 28 }} />
              </VStack>
            ))}
          </VStack>
        ) : null}
        <VStack alignment="leading" spacing={10}>
          <Text font="title3" fontWeight="bold">Browse Categories</Text>
          <LazyVGrid columns={2} spacing={12}>
            {genres.map((g) => (
              <Button key={g.title} buttonStyle="plain" onPress={() => onPick(g.term)} accessibilityIdentifier="genre">
                <VStack
                  alignment="leading"
                  padding={14}
                  frame={{ maxWidth: "infinity", height: 96, alignment: "bottomLeading" }}
                  background={{ gradient: g.colors, start: "topLeading", end: "bottomTrailing" }}
                  cornerRadius={12}
                >
                  <Text font="headline" fontWeight="bold" foregroundStyle="white">{g.title}</Text>
                </VStack>
              </Button>
            ))}
          </LazyVGrid>
        </VStack>
      </VStack>
    </ScrollView>
  );
}

function Results({ term }: { term: string }) {
  const nav = useNavigation();
  const addSearch = useLibrary((s) => s.addSearch);
  const { data, isPending, isError, error, refetch, isFetching } = useQuery({
    queryKey: ["search", term],
    queryFn: ({ signal }) => searchSongs(term, signal),
    enabled: term.length > 0,
    staleTime: 5 * 60_000,
    placeholderData: (previous) => previous,
  });

  if (isPending) return <ProgressView frame={{ maxWidth: "infinity", maxHeight: "infinity" }} />;
  if (isError) return <ErrorView message={error.message} retry={() => refetch()} />;
  if (!data.length) return <EmptyState icon="magnifyingglass" title={`No results for “${term}”`} message="Check the spelling, or try a new search." />;

  // There's no "search submitted" event, so a search counts as "recent" once
  // the user picks something from its results.
  const remember = () => addSearch(term);
  const artists = uniqueBy(data, (t) => t.artistId).slice(0, 3);
  const albums = uniqueBy(data, (t) => t.albumId).slice(0, 10);

  return (
    <List>
      {isFetching ? (
        <Section>
          <HStack spacing={8}>
            <ProgressView />
            <Text foregroundStyle="secondary">Searching…</Text>
          </HStack>
        </Section>
      ) : null}
      <Section header="Artists">
        {artists.map((t) => (
          <Button
            key={t.artistId}
            buttonStyle="plain"
            accessibilityIdentifier="search-artist"
            onPress={() => {
              remember();
              nav.push(<ArtistScreen id={t.artistId} name={t.artist} />);
            }}
          >
            <HStack spacing={12}>
              <Artwork url={t.artwork} size={48} radius={24} />
              <VStack alignment="leading" spacing={2}>
                <Text font="body" lineLimit={1}>{t.artist}</Text>
                <Text font="subheadline" foregroundStyle="secondary">Artist</Text>
              </VStack>
              <Spacer />
              <Image systemName="chevron.right" font="footnote" fontWeight="semibold" foregroundStyle="tertiary" />
            </HStack>
          </Button>
        ))}
      </Section>
      <Section header="Albums">
        <ScrollView axis="horizontal" spacing={14}>
          {albums.map((t) => (
            <Button
              key={t.albumId}
              buttonStyle="plain"
              accessibilityIdentifier="search-album"
              onPress={() => {
                remember();
                nav.push(<AlbumScreen id={t.albumId} />);
              }}
            >
              <VStack alignment="leading" spacing={4} frame={{ width: 132 }}>
                <Artwork url={t.artwork} size={132} />
                <Text font="footnote" fontWeight="medium" lineLimit={1}>{t.album}</Text>
                <Text font="footnote" foregroundStyle="secondary" lineLimit={1}>{t.artist}</Text>
              </VStack>
            </Button>
          ))}
        </ScrollView>
      </Section>
      <Section header="Songs">
        {data.map((track, i) => (
          <TrackRow
            key={track.id}
            track={track}
            detail="both"
            accessibilityIdentifier="search-result"
            onPress={() => {
              remember();
              playTracks(data, i, `“${term}”`);
            }}
          />
        ))}
      </Section>
      <Section>
        <HStack spacing={10}>
          <Image systemName="play.circle" foregroundStyle="pink" />
          <Text font="footnote" foregroundStyle="secondary">Songs play 30-second previews from Apple Music.</Text>
        </HStack>
      </Section>
    </List>
  );
}

function uniqueBy(tracks: Track[], key: (t: Track) => number): Track[] {
  const seen = new Set<number>();
  return tracks.filter((t) => {
    const k = key(t);
    if (!k || seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}
