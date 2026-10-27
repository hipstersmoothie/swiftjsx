// Saved cities and the temperature unit, persisted with zustand + localStorage.
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { City } from "./api";

export type Unit = "celsius" | "fahrenheit";

type Settings = {
  cities: City[];
  unit: Unit;
  add(city: City): void;
  remove(id: number): void;
  setUnit(unit: Unit): void;
};

const seed: City[] = [
  { id: 5341145, name: "Cupertino", region: "California, United States", latitude: 37.323, longitude: -122.03218 },
  { id: 2643743, name: "London", region: "England, United Kingdom", latitude: 51.50853, longitude: -0.12574 },
  { id: 1850147, name: "Tokyo", region: "Japan", latitude: 35.6895, longitude: 139.69171 },
];

export const useSettings = create<Settings>()(
  persist(
    (set) => ({
      cities: seed,
      unit: "celsius",
      add: (city) => set(({ cities }) => (cities.some((c) => c.id === city.id) ? {} : { cities: [...cities, city] })),
      remove: (id) => set(({ cities }) => ({ cities: cities.filter((c) => c.id !== id) })),
      setUnit: (unit) => set({ unit }),
    }),
    { name: "weather-settings", storage: createJSONStorage(() => localStorage) },
  ),
);

export const useIsSaved = (id: number) => useSettings((s) => s.cities.some((c) => c.id === id));
