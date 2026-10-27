import {
  Navigator, Screen, ToolbarItem, Form, Section, Picker, SwipeActions, HStack, VStack, Text, Label, Button, Spacer, openURL,
} from "swiftjsx";
import { useSettings, type Unit } from "./store";

const units: { value: Unit; label: string }[] = [
  { value: "celsius", label: "°C" },
  { value: "fahrenheit", label: "°F" },
];

export function SettingsSheet({ onDone }: { onDone(): void }) {
  const unit = useSettings((s) => s.unit);
  const setUnit = useSettings((s) => s.setUnit);
  const cities = useSettings((s) => s.cities);
  const remove = useSettings((s) => s.remove);

  return (
    <Navigator>
      <Screen title="Settings" titleDisplayMode="inline">
        <ToolbarItem placement="confirmationAction">
          <Button title="Done" onPress={onDone} />
        </ToolbarItem>
        <Form>
          <Section header="Units" footer="Wind speed follows: km/h with °C, mph with °F.">
            <Picker
              label="Temperature"
              pickerStyle="segmented"
              value={unit}
              onChange={(value) => setUnit(value as Unit)}
              options={units}
              accessibilityIdentifier="unit-picker"
            />
          </Section>
          <Section header="Cities" footer={cities.length ? "Swipe a city to remove it." : "Search for a city to add it."}>
            {cities.map((city) => (
              <HStack key={city.id}>
                <VStack alignment="leading" spacing={2}>
                  <Text>{city.name}</Text>
                  {city.region ? <Text font="caption" foregroundStyle="secondary">{city.region}</Text> : null}
                </VStack>
                <Spacer />
                <SwipeActions allowsFullSwipe>
                  <Button role="destructive" onPress={() => remove(city.id)}>
                    <Label title="Remove" systemImage="trash" />
                  </Button>
                </SwipeActions>
              </HStack>
            ))}
          </Section>
          <Section footer="Forecasts and city search by Open-Meteo.com, under CC BY 4.0.">
            <Button title="About Open-Meteo" onPress={() => openURL("https://open-meteo.com", { inApp: true })} />
          </Section>
        </Form>
      </Screen>
    </Navigator>
  );
}
