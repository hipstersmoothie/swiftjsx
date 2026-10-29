// The detail screen's sections: hourly strip, 10-day list, and detail tiles,
// on frosted cards over the condition gradient.
import { Fragment, type ReactNode } from "react";
import { VStack, HStack, AbsoluteStack, ScrollView, LazyVGrid, Text, Image, Label, Divider, Spacer, format, type Color } from "swiftjsx";
import type { Day, Forecast } from "./api";
import { conditionLabel, conditionSymbol, temperatureColor } from "./conditions";
import { useTemperature, useWindSpeed, hourLabel, weekday, clockTime } from "./format";

/** Dimmed version of the white text on the gradient (hierarchical secondary). */
export const dim = "secondary";
const faint: Color = "#ffffff40";

function Card({ title, icon, children }: { title: string; icon: string; children: ReactNode }) {
  return (
    <VStack
      alignment="leading"
      spacing={10}
      padding={14}
      frame={{ maxWidth: "infinity", alignment: "leading" }}
      background="ultraThinMaterial"
      cornerRadius={16}
    >
      <Label title={title.toUpperCase()} systemImage={icon} font="caption" fontWeight="semibold" foregroundStyle={dim} />
      {children}
    </VStack>
  );
}

export function HourlyForecast({ forecast }: { forecast: Forecast }) {
  const temp = useTemperature();
  const thisHour = forecast.current.time.slice(0, 13); // "2026-10-27T14"
  // Two statements: `Math.max(0, list.findIndex(…))` in one trips a React
  // Compiler bug ("MethodCall::property must be an unpromoted + unmemoized
  // MemberExpression") and leaves the component unmemoized.
  const found = forecast.hours.findIndex((hour) => hour.time.startsWith(thisHour));
  const start = Math.max(0, found);
  const hours = forecast.hours.slice(start, start + 24);

  return (
    <Card title="Hourly forecast" icon="clock">
      <Text font="subheadline">{summary(forecast)}</Text>
      <Divider />
      <ScrollView axis="horizontal">
        <HStack spacing={24} padding={{ horizontal: 4, bottom: 4 }}>
          {hours.map((hour, i) => (
            <VStack key={hour.time} spacing={10} accessibilityElement="combine">
              <Text font="subheadline" fontWeight="semibold">{i === 0 ? "Now" : hourLabel(hour.time)}</Text>
              <Image
                systemName={conditionSymbol(hour.code, hour.isDay)}
                symbolRenderingMode="multicolor"
                font="title3"
                frame={{ height: 28 }}
                accessibilityLabel={conditionLabel(hour.code)}
              />
              <Text font="title3" fontWeight="medium">{temp(hour.temperature)}</Text>
            </VStack>
          ))}
        </HStack>
      </ScrollView>
    </Card>
  );
}

/** "Rain expected around 4PM.", like the header of the system app's hourly card. */
function summary({ current, days, hours }: Forecast) {
  const now = conditionLabel(current.code);
  const next = hours.find((hour) => hour.time > current.time && conditionLabel(hour.code) !== now);
  if (next && next.time.slice(0, 10) === days[0].date) return `${conditionLabel(next.code)} expected around ${hourLabel(next.time)}.`;
  return `${now} conditions for the rest of the day.`;
}

export function DailyForecast({ forecast }: { forecast: Forecast }) {
  const { days, current } = forecast;
  const low = Math.min(...days.map((day) => day.min));
  const high = Math.max(...days.map((day) => day.max));

  return (
    <Card title="10-day forecast" icon="calendar">
      {days.map((day, i) => (
        <Fragment key={day.date}>
          <Divider />
          <DayRow day={day} label={i === 0 ? "Today" : weekday(day.date)} low={low} high={high} current={i === 0 ? current.temperature : undefined} />
        </Fragment>
      ))}
    </Card>
  );
}

function DayRow({ day, label, low, high, current }: { day: Day; label: string; low: number; high: number; current?: number }) {
  const temp = useTemperature();
  const rainy = (day.precipitation ?? 0) >= 20;
  return (
    <HStack spacing={12} accessibilityElement="combine">
      <Text font="title3" fontWeight="medium" frame={{ width: 60, alignment: "leading" }}>{label}</Text>
      <VStack spacing={0} frame={{ width: 34 }}>
        <Image systemName={conditionSymbol(day.code)} symbolRenderingMode="multicolor" font="body" accessibilityLabel={conditionLabel(day.code)} />
        {rainy ? <Text font="caption2" fontWeight="bold" foregroundStyle="#81cfff">{percent(day.precipitation ?? 0)}</Text> : null}
      </VStack>
      <Text font="title3" fontWeight="medium" monospacedDigit foregroundStyle={dim} frame={{ width: 40, alignment: "trailing" }} accessibilityLabel={`Low ${temp(day.min)}`}>
        {temp(day.min)}
      </Text>
      <TemperatureBar min={day.min} max={day.max} low={low} high={high} current={current} />
      <Text font="title3" fontWeight="medium" monospacedDigit frame={{ width: 40, alignment: "trailing" }} accessibilityLabel={`High ${temp(day.max)}`}>
        {temp(day.max)}
      </Text>
    </HStack>
  );
}

// The day's range is a capsule within the week's range, placed in percent of
// the bar's width (the bar takes the row's spare width).
const barHeight = 5;
const fill = { maxWidth: "infinity", height: barHeight } as const;

function TemperatureBar({ min, max, low, high, current }: { min: number; max: number; low: number; high: number; current?: number }) {
  const at = (celsius: number) => (celsius - low) / Math.max(high - low, 1);
  const pct = (fraction: number) => `${fraction * 100}%` as const;
  return (
    <AbsoluteStack frame={{ height: 8 }} accessibilityHidden>
      <VStack position={{ y: "50%", width: "100%", anchor: "leading" }} frame={fill} background={faint} cornerRadius={barHeight / 2} />
      <VStack
        position={{ x: pct(at(min)), y: "50%", width: pct(at(max) - at(min)), anchor: "leading" }}
        // At least a dot when the day's range is (nearly) one temperature.
        frame={{ ...fill, minWidth: barHeight }}
        background={{ gradient: [temperatureColor(min), temperatureColor(max)], start: "leading", end: "trailing" }}
        cornerRadius={barHeight / 2}
      />
      {current === undefined ? null : (
        <VStack
          position={{ x: pct(at(current)), y: "50%", anchor: "center" }}
          frame={{ width: 8, height: 8 }}
          background="white"
          cornerRadius={4}
          shadow={{ radius: 1, color: "#00000066" }}
        />
      )}
    </AbsoluteStack>
  );
}

export function DetailTiles({ forecast }: { forecast: Forecast }) {
  const temp = useTemperature();
  const wind = useWindSpeed();
  const { current, days } = forecast;
  const [today, tomorrow] = days;

  return (
    <LazyVGrid columns={2} spacing={12}>
      <Tile icon="thermometer.medium" title="Feels like" value={temp(current.feelsLike)} note={feelsLikeNote(current.temperature, current.feelsLike)} />
      <Tile icon="humidity.fill" title="Humidity" value={percent(current.humidity)} note={humidityNote(current.humidity)} />
      <Tile icon="wind" title="Wind" value={wind(current.windSpeed)} note={windNote(current.windSpeed)} />
      <Tile icon="umbrella.fill" title="Precipitation" value={percent(today.precipitation ?? 0)} note="Chance of rain or snow today." />
      <Tile icon="sunrise.fill" title="Sunrise" value={clockTime(today.sunrise)} note={`Sunset: ${clockTime(today.sunset)}`} />
      <Tile icon="sunset.fill" title="Sunset" value={clockTime(today.sunset)} note={tomorrow ? `Sunrise tomorrow: ${clockTime(tomorrow.sunrise)}` : ""} />
    </LazyVGrid>
  );
}

function Tile({ icon, title, value, note }: { icon: string; title: string; value: string; note: string }) {
  return (
    <VStack
      alignment="leading"
      spacing={8}
      padding={14}
      frame={{ height: 150, maxWidth: "infinity", alignment: "topLeading" }}
      background="ultraThinMaterial"
      cornerRadius={16}
      accessibilityElement="combine"
    >
      <Label title={title.toUpperCase()} systemImage={icon} font="caption" fontWeight="semibold" foregroundStyle={dim} />
      <Text font="title" fontWeight="medium" monospacedDigit>{value}</Text>
      <Spacer minLength={0} />
      <Text font="footnote">{note}</Text>
    </VStack>
  );
}

/** 0–100 from the API as "42%". */
const percent = (value: number) => format.percent(value / 100);

function feelsLikeNote(actual: number, feelsLike: number) {
  if (Math.abs(feelsLike - actual) < 2) return "Similar to the actual temperature.";
  return feelsLike < actual ? "Wind is making it feel cooler." : "Humidity is making it feel warmer.";
}

function humidityNote(humidity: number) {
  if (humidity < 30) return "The air is dry.";
  if (humidity < 65) return "Comfortable humidity.";
  return "It feels muggy.";
}

function windNote(kmh: number) {
  if (kmh < 6) return "Calm.";
  if (kmh < 20) return "A light breeze.";
  if (kmh < 40) return "Breezy.";
  if (kmh < 62) return "Strong winds.";
  return "Gale-force winds.";
}
