// Open-Meteo (https://open-meteo.com): forecasts and city search, no API key.
// Responses are validated with zod and reshaped into rows the UI can map over.
import { z } from "zod";
import { queryOptions } from "@tanstack/react-query";

export type City = { id: number; name: string; region: string; latitude: number; longitude: number };

const nums = z.array(z.number());

const ForecastResponse = z
  .object({
    utc_offset_seconds: z.number(),
    current: z.object({
      time: z.string(),
      temperature_2m: z.number(),
      apparent_temperature: z.number(),
      weather_code: z.number(),
      wind_speed_10m: z.number(),
      relative_humidity_2m: z.number(),
      is_day: z.number(),
    }),
    hourly: z.object({ time: z.array(z.string()), temperature_2m: nums, weather_code: nums, is_day: nums }),
    daily: z.object({
      time: z.array(z.string()),
      weather_code: nums,
      temperature_2m_max: nums,
      temperature_2m_min: nums,
      sunrise: z.array(z.string()),
      sunset: z.array(z.string()),
      precipitation_probability_max: z.array(z.number().nullable()),
    }),
  })
  // Times are the city's local wall-clock time ("2026-10-27T14:00", no offset).
  .transform(({ utc_offset_seconds, current, hourly, daily }) => ({
    utcOffsetSeconds: utc_offset_seconds,
    current: {
      time: current.time,
      temperature: current.temperature_2m,
      feelsLike: current.apparent_temperature,
      code: current.weather_code,
      windSpeed: current.wind_speed_10m,
      humidity: current.relative_humidity_2m,
      isDay: current.is_day === 1,
    },
    hours: hourly.time.map((time, i) => ({
      time,
      temperature: hourly.temperature_2m[i],
      code: hourly.weather_code[i],
      isDay: hourly.is_day[i] === 1,
    })),
    days: daily.time.map((date, i) => ({
      date,
      code: daily.weather_code[i],
      min: daily.temperature_2m_min[i],
      max: daily.temperature_2m_max[i],
      sunrise: daily.sunrise[i],
      sunset: daily.sunset[i],
      precipitation: daily.precipitation_probability_max[i],
    })),
  }));

export type Forecast = z.output<typeof ForecastResponse>;
export type Hour = Forecast["hours"][number];
export type Day = Forecast["days"][number];

const SearchResponse = z
  .object({
    results: z
      .array(
        z.object({
          id: z.number(),
          name: z.string(),
          latitude: z.number(),
          longitude: z.number(),
          admin1: z.string().optional(),
          country: z.string().optional(),
        }),
      )
      .optional(),
  })
  .transform(({ results = [] }): City[] =>
    results.map(({ id, name, latitude, longitude, admin1, country }) => ({
      id,
      name,
      latitude,
      longitude,
      region: [admin1, country].filter((part) => part && part !== name).join(", "),
    })),
  );

async function get<T>(url: string, schema: { parse(data: unknown): T }, signal?: AbortSignal): Promise<T> {
  const response = await fetch(url, { signal });
  const body = await response.json().catch(() => null);
  if (!response.ok) throw new Error(body?.reason ?? `Open-Meteo: ${response.status} ${response.statusText}`);
  return schema.parse(body);
}

export function fetchForecast(city: City, signal?: AbortSignal) {
  const params = new URLSearchParams({
    latitude: String(city.latitude),
    longitude: String(city.longitude),
    current: "temperature_2m,apparent_temperature,weather_code,wind_speed_10m,relative_humidity_2m,is_day",
    hourly: "temperature_2m,weather_code,is_day",
    daily: "weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset,precipitation_probability_max",
    timezone: "auto",
    forecast_days: "10",
  });
  return get(`https://api.open-meteo.com/v1/forecast?${params}`, ForecastResponse, signal);
}

export function searchCities(name: string, signal?: AbortSignal) {
  const params = new URLSearchParams({ name, count: "10", language: "en" });
  return get(`https://geocoding-api.open-meteo.com/v1/search?${params}`, SearchResponse, signal);
}

/** Shared by the city list and the detail screen, so opening a city is instant. */
export const forecastQuery = (city: City) =>
  queryOptions({
    queryKey: ["forecast", city.latitude, city.longitude],
    queryFn: ({ signal }) => fetchForecast(city, signal),
  });
