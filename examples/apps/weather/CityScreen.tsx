import { useQuery } from "@tanstack/react-query";
import { Screen, ToolbarItem, ScrollView, VStack, Text, Label, Button } from "swiftjsx";
import { forecastQuery, type City, type Forecast } from "./api";
import { conditionGradient, conditionLabel, conditionSymbol } from "./conditions";
import { useTemperature } from "./format";
import { useIsSaved, useSettings } from "./store";
import { HourlyForecast, DailyForecast, DetailTiles, dim } from "./Forecast";
import { Loading, ErrorView } from "./Status";

/** One city's forecast. From search results it's a preview with an Add button. */
export function CityScreen({ city, onAdded }: { city: City; onAdded?(): void }) {
  const { data, error, refetch } = useQuery(forecastQuery(city));
  const saved = useIsSaved(city.id);
  const add = useSettings((s) => s.add);
  const gradient = data ? conditionGradient(data.current.code, data.current.isDay) : conditionGradient(3, true);

  return (
    <Screen title="" titleDisplayMode="inline">
      {saved ? null : (
        <ToolbarItem placement="confirmationAction">
          <Button
            title="Add"
            onPress={() => {
              add(city);
              onAdded?.();
            }}
          />
        </ToolbarItem>
      )}
      <ScrollView background={{ gradient }} onRefresh={() => refetch()}>
        <VStack spacing={12} padding={{ horizontal: 16, bottom: 32 }} foregroundStyle="white">
          {data ? (
            <>
              <Hero city={city} forecast={data} />
              <HourlyForecast forecast={data} />
              <DailyForecast forecast={data} />
              <DetailTiles forecast={data} />
              <Text font="caption" foregroundStyle={dim} padding={{ top: 8 }}>Weather data by Open-Meteo.com</Text>
            </>
          ) : (
            <>
              <Text font="largeTitle" padding={{ top: 32 }}>{city.name}</Text>
              {error ? <ErrorView message={error.message} retry={() => refetch()} color="white" /> : <Loading tint="white" />}
            </>
          )}
        </VStack>
      </ScrollView>
    </Screen>
  );
}

function Hero({ city, forecast: { current, days } }: { city: City; forecast: Forecast }) {
  const temp = useTemperature();
  return (
    <VStack spacing={2} padding={{ top: 24, bottom: 20 }}>
      <Text font="largeTitle" lineLimit={1}>{city.name}</Text>
      <Text
        font={{ size: 96, weight: "thin" }}
        padding={{ leading: 8 }}
        accessibilityIdentifier="current-temp"
        accessibilityLabel={`${temp(current.temperature)}, ${conditionLabel(current.code)}`}
      >
        {temp(current.temperature)}
      </Text>
      <Label title={conditionLabel(current.code)} systemImage={conditionSymbol(current.code, current.isDay)} font="title3" fontWeight="medium" />
      <Text font="title3" fontWeight="medium">{`H:${temp(days[0].max)}  L:${temp(days[0].min)}`}</Text>
    </VStack>
  );
}
