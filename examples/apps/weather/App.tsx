// A weather app: Open-Meteo through TanStack Query, zod-validated responses,
// saved cities and units in zustand + localStorage, navigation-bar search,
// condition gradients and frosted cards.
import { useState } from "react";
import { QueryClient, QueryClientProvider, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Navigator, useNavigation, Screen, ToolbarItem, Sheet, ContextMenu, ScrollView, LazyVStack, VStack, HStack, Text, Image, Label,
  Button, ProgressView, Spacer,
} from "swiftjsx";
import { forecastQuery, type City } from "./api";
import { conditionGradient, conditionLabel } from "./conditions";
import { cityClock, useNow, useTemperature } from "./format";
import { useSettings } from "./store";
import { CityScreen } from "./CityScreen";
import { SearchResults } from "./Search";
import { SettingsSheet } from "./Settings";
import { dim } from "./Forecast";

const queryClient = new QueryClient({ defaultOptions: { queries: { staleTime: 10 * 60_000 } } });

export function WeatherApp() {
  return (
    <QueryClientProvider client={queryClient}>
      <Navigator>
        <CitiesScreen />
      </Navigator>
    </QueryClientProvider>
  );
}

function CitiesScreen() {
  const [search, setSearch] = useState("");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const query = search.trim();

  return (
    <Screen title="Weather" searchText={search} onSearchTextChange={setSearch} searchPrompt="Search for a city">
      <ToolbarItem placement="primaryAction">
        <Button onPress={() => setSettingsOpen(true)} accessibilityLabel="Settings" accessibilityIdentifier="settings">
          <Image systemName="ellipsis.circle" />
        </Button>
      </ToolbarItem>
      {query ? <SearchResults query={query} onAdded={() => setSearch("")} /> : <CityList />}
      <Sheet isPresented={settingsOpen} onDismiss={() => setSettingsOpen(false)} detents={["medium", "large"]}>
        <SettingsSheet onDone={() => setSettingsOpen(false)} />
      </Sheet>
    </Screen>
  );
}

function CityList() {
  const cities = useSettings((s) => s.cities);
  const client = useQueryClient();
  const now = useNow();

  if (!cities.length) {
    return (
      <VStack spacing={10} padding={24} frame={{ maxWidth: "infinity", maxHeight: "infinity" }}>
        <Image systemName="cloud.sun" font="largeTitle" foregroundStyle="secondary" />
        <Text textAlignment="center" foregroundStyle="secondary">Search for a city to see its weather.</Text>
      </VStack>
    );
  }

  return (
    <ScrollView onRefresh={() => client.refetchQueries({ queryKey: ["forecast"], type: "active" })}>
      <LazyVStack spacing={12} padding={{ horizontal: 16, vertical: 8 }}>
        {cities.map((city) => (
          <CityCard key={city.id} city={city} now={now} />
        ))}
      </LazyVStack>
    </ScrollView>
  );
}

function CityCard({ city, now }: { city: City; now: number }) {
  const nav = useNavigation();
  const remove = useSettings((s) => s.remove);
  const temp = useTemperature();
  const { data, isError } = useQuery(forecastQuery(city));
  const gradient = data ? conditionGradient(data.current.code, data.current.isDay) : conditionGradient(3, true);

  return (
    <Button buttonStyle="plain" onPress={() => nav.push(<CityScreen city={city} />)} accessibilityIdentifier="city-row">
      <VStack spacing={18} padding={16} background={{ gradient }} cornerRadius={20} foregroundStyle="white">
        <HStack alignment="top">
          <VStack alignment="leading" spacing={2}>
            <Text font="title2" fontWeight="bold" lineLimit={1}>{city.name}</Text>
            <Text font="subheadline" fontWeight="medium" lineLimit={1}>
              {data ? cityClock(now, data.utcOffsetSeconds) : city.region}
            </Text>
          </VStack>
          <Spacer />
          {data ? (
            <Text font="largeTitle" fontWeight="light" monospacedDigit>{temp(data.current.temperature)}</Text>
          ) : isError ? (
            <Image systemName="exclamationmark.triangle.fill" font="title2" />
          ) : (
            <ProgressView tint="white" />
          )}
        </HStack>
        <HStack>
          <Text font="subheadline" fontWeight="medium" foregroundStyle={dim} lineLimit={1}>
            {data ? conditionLabel(data.current.code) : isError ? "Couldn’t load the forecast" : "Loading…"}
          </Text>
          <Spacer />
          {data ? <Text font="subheadline" fontWeight="medium">{`H:${temp(data.days[0].max)}  L:${temp(data.days[0].min)}`}</Text> : null}
        </HStack>
      </VStack>
      <ContextMenu>
        <Button role="destructive" onPress={() => remove(city.id)}>
          <Label title="Remove" systemImage="trash" />
        </Button>
      </ContextMenu>
    </Button>
  );
}
