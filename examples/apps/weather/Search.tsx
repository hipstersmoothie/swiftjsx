import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useNavigation, useDebouncedValue, List, VStack, HStack, Text, Image, Button, ProgressView, Spacer, ContentUnavailable } from "swiftjsx";
import { searchCities, type City } from "./api";
import { useIsSaved } from "./store";
import { CityScreen } from "./CityScreen";

/** Results for the navigation bar's search field. `onAdded` runs when a result is saved. */
export function SearchResults({ query, onAdded }: { query: string; onAdded(): void }) {
  const nav = useNavigation();
  const [term] = useDebouncedValue(query, 300);
  const { data, error, refetch } = useQuery({
    queryKey: ["search", term],
    queryFn: ({ signal }) => searchCities(term, signal),
    enabled: term.length >= 2,
    // Keep showing the last results while the next ones load.
    placeholderData: keepPreviousData,
  });

  if (term.length < 2) return <ContentUnavailable systemImage="magnifyingglass" title="Search for a City" description="Keep typing to see matching cities." />;
  if (error) {
    return (
      <ContentUnavailable systemImage="wifi.exclamationmark" title="Couldn’t Search" description={error.message}>
        <Button title="Try Again" buttonStyle="bordered" onPress={() => refetch()} />
      </ContentUnavailable>
    );
  }
  if (!data) return <ProgressView frame={{ maxWidth: "infinity", maxHeight: "infinity" }} />;
  if (!data.length) return <ContentUnavailable search={term} />;

  const open = (city: City) =>
    nav.push(
      <CityScreen
        city={city}
        onAdded={() => {
          onAdded();
          nav.pop();
        }}
      />,
    );

  return (
    <List>
      {data.map((city) => (
        <ResultRow key={city.id} city={city} onPress={() => open(city)} />
      ))}
    </List>
  );
}

function ResultRow({ city, onPress }: { city: City; onPress(): void }) {
  const saved = useIsSaved(city.id);
  // The default button style makes the whole row tappable; plain would only take taps on the text.
  return (
    <Button onPress={onPress} accessibilityIdentifier="search-result">
      <HStack spacing={12}>
        <VStack alignment="leading" spacing={2}>
          <Text font="body" fontWeight="medium" foregroundStyle="primary">{city.name}</Text>
          {city.region ? <Text font="subheadline" foregroundStyle="secondary">{city.region}</Text> : null}
        </VStack>
        <Spacer />
        {saved ? (
          <Image systemName="checkmark.circle.fill" foregroundStyle="green" accessibilityLabel="Saved" />
        ) : (
          <Image systemName="chevron.right" font="footnote" fontWeight="semibold" foregroundStyle="gray" />
        )}
      </HStack>
    </Button>
  );
}
