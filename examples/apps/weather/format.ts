import { format, parseISO } from "date-fns";
import { format as kitFormat } from "swiftjsx";
import { useSettings } from "./store";

/** Formats °C from the API in the unit the user picked. */
export function useTemperature() {
  const unit = useSettings((s) => s.unit);
  return (celsius: number) => `${Math.round(unit === "fahrenheit" ? (celsius * 9) / 5 + 32 : celsius)}°`;
}

/** Formats km/h from the API; mph alongside °F, like the system Weather app. */
export function useWindSpeed() {
  const unit = useSettings((s) => s.unit);
  return (kmh: number) =>
    unit === "fahrenheit"
      ? kitFormat.number(kmh / 1.609, { style: "unit", unit: "mile-per-hour", maximumFractionDigits: 0 })
      : kitFormat.number(kmh, { style: "unit", unit: "kilometer-per-hour", maximumFractionDigits: 0 });
}

// Open-Meteo's times are the city's wall clock without an offset, so parseISO
// reads them as device-local, and date-fns prints them unchanged.
export const hourLabel = (time: string) => format(parseISO(time), "ha");
export const clockTime = (time: string) => format(parseISO(time), "h:mm a");
export const weekday = (date: string) => format(parseISO(date), "EEE");

/** The current time in a city `utcOffsetSeconds` from UTC. */
export function cityClock(now: number, utcOffsetSeconds: number) {
  const deviceOffset = new Date(now).getTimezoneOffset() * 60_000;
  return format(new Date(now + deviceOffset + utcOffsetSeconds * 1000), "h:mm a");
}
