// A Pokédex on PokeAPI: an infinite LazyVGrid of type-tinted cards, search
// over every Pokémon, a detail screen with stats and flavor text, and
// favorites in localStorage (context menu, toolbar filter).
import { useState } from "react";
import { QueryClient, QueryClientProvider, useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { Navigator, Screen, ToolbarItem, Button, Image, Text, ProgressView } from "swiftjsx";
import { fetchPage, indexQuery, searchEntries, PAGE_SIZE } from "./api";
import { useFavorites } from "./favorites";
import { PokemonGrid } from "./PokemonGrid";
import { Loading, ErrorView, EmptyState } from "./States";

// Pokémon don't change: fetch each thing once per launch.
const queryClient = new QueryClient({ defaultOptions: { queries: { staleTime: Infinity, retry: 1 } } });

export function PokedexApp() {
  return (
    <QueryClientProvider client={queryClient}>
      <Navigator>
        <PokedexScreen />
      </Navigator>
    </QueryClientProvider>
  );
}

function PokedexScreen() {
  const [search, setSearch] = useState("");
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const term = search.trim();

  return (
    <Screen
      title={favoritesOnly ? "Favorites" : "Pokédex"}
      searchText={search}
      onSearchTextChange={setSearch}
      searchPrompt={favoritesOnly ? "Search favorites" : "Name or number"}
    >
      <ToolbarItem placement="primaryAction">
        <Button
          onPress={() => setFavoritesOnly((f) => !f)}
          accessibilityLabel={favoritesOnly ? "Show all Pokémon" : "Show favorites"}
          accessibilityIdentifier="favorites-filter"
        >
          <Image systemName={favoritesOnly ? "heart.fill" : "heart"} foregroundStyle={favoritesOnly ? "pink" : "accent"} />
        </Button>
      </ToolbarItem>
      {favoritesOnly ? (
        <FavoritesGrid term={term} />
      ) : term ? (
        // Keyed so a new search starts at the top with one page of results.
        <SearchResults key={term} term={term} />
      ) : (
        <AllPokemon />
      )}
    </Screen>
  );
}

function AllPokemon() {
  const query = useInfiniteQuery({
    queryKey: ["pokemon-pages"],
    queryFn: ({ pageParam, signal }) => fetchPage(pageParam, signal),
    initialPageParam: 0,
    getNextPageParam: (last) => last.next,
  });

  if (query.isPending) return <Loading label="Loading Pokédex…" />;
  // Not isError: a failed next page is an error too, but keeps the pages we have.
  if (query.isLoadingError) return <ErrorView message={query.error.message} retry={() => query.refetch()} />;

  const entries = query.data.pages.flatMap((page) => page.entries);
  const footer = query.isFetchNextPageError ? (
    <Button title="Couldn't load more. Try again" buttonStyle="bordered" onPress={() => query.fetchNextPage()} />
  ) : query.hasNextPage ? (
    <ProgressView />
  ) : (
    <Text font="footnote" foregroundStyle="secondary">{query.data.pages[0].count.toLocaleString()} Pokémon</Text>
  );

  return (
    <PokemonGrid
      entries={entries}
      onEndReached={() => query.hasNextPage && !query.isFetchingNextPage && query.fetchNextPage()}
      footer={footer}
    />
  );
}

function SearchResults({ term }: { term: string }) {
  const index = useQuery(indexQuery);
  // The grid renders every match it's given, so hand it a page at a time.
  const [limit, setLimit] = useState(PAGE_SIZE);

  if (index.isPending) return <Loading label="Loading Pokémon names…" />;
  if (index.isError) return <ErrorView message={index.error.message} retry={() => index.refetch()} />;

  const matches = searchEntries(index.data, term);
  if (!matches.length) {
    return <EmptyState icon="magnifyingglass" title="No Pokémon found" message={`Nothing matches “${term}”. Try a name or a number.`} />;
  }
  return (
    <PokemonGrid
      entries={matches.slice(0, limit)}
      onEndReached={() => setLimit((l) => l + PAGE_SIZE)}
      footer={<Text font="footnote" foregroundStyle="secondary">{matches.length === 1 ? "1 match" : `${matches.length} matches`}</Text>}
    />
  );
}

function FavoritesGrid({ term }: { term: string }) {
  const favorites = useFavorites((s) => s.entries);
  const shown = term ? searchEntries(favorites, term) : favorites;

  if (!favorites.length) {
    return <EmptyState icon="heart" title="No favorites yet" message="Tap the heart on a Pokémon, or touch and hold its card." />;
  }
  if (!shown.length) {
    return <EmptyState icon="magnifyingglass" title="No favorites found" message={`None of your favorites match “${term}”.`} />;
  }
  return <PokemonGrid entries={shown} />;
}
