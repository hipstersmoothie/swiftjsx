// PokeAPI (https://pokeapi.co): free, no key, and the data never changes, so
// everything is cached for the life of the app.
import { queryOptions } from "@tanstack/react-query";

/** What the list endpoints give us: enough for a card. */
export type Entry = { id: number; name: string };

export type Pokemon = {
  id: number;
  name: string;
  speciesId: number;
  types: string[];
  /** Decimetres. */
  height: number;
  /** Hectograms. */
  weight: number;
  baseExperience: number | null;
  abilities: { name: string; hidden: boolean }[];
  stats: { name: string; value: number }[];
};

export type Species = { flavorText: string | null; genus: string | null };

const API = "https://pokeapi.co/api/v2/";
export const PAGE_SIZE = 30;

async function get<T>(path: string, signal?: AbortSignal): Promise<T> {
  const response = await fetch(API + path, { signal });
  if (!response.ok) throw new Error(`PokeAPI: ${response.status} ${response.statusText}`);
  return response.json();
}

type NamedList = { count: number; next: string | null; results: { name: string; url: string }[] };

// Resource URLs end in their id: ".../pokemon/25/".
const idFromURL = (url: string) => Number(url.split("/").filter(Boolean).pop());
const toEntries = (list: NamedList): Entry[] => list.results.map((r) => ({ id: idFromURL(r.url), name: r.name }));

export async function fetchPage(offset: number, signal?: AbortSignal) {
  const list = await get<NamedList>(`pokemon?limit=${PAGE_SIZE}&offset=${offset}`, signal);
  return { entries: toEntries(list), count: list.count, next: list.next ? offset + PAGE_SIZE : undefined };
}

export const indexQuery = queryOptions({
  queryKey: ["pokemon-index"],
  queryFn: async ({ signal }) => toEntries(await get<NamedList>("pokemon?limit=2000", signal)),
});

export const pokemonQuery = (id: number) =>
  queryOptions({
    queryKey: ["pokemon", id],
    queryFn: async ({ signal }): Promise<Pokemon> => {
      const p = await get<any>(`pokemon/${id}`, signal);
      return {
        id: p.id,
        name: p.name,
        speciesId: idFromURL(p.species.url),
        types: p.types.map((t: any) => t.type.name),
        height: p.height,
        weight: p.weight,
        baseExperience: p.base_experience,
        abilities: p.abilities.map((a: any) => ({ name: a.ability.name, hidden: a.is_hidden })),
        stats: p.stats.map((s: any) => ({ name: s.stat.name, value: s.base_stat })),
      };
    },
  });

export const speciesQuery = (id: number) =>
  queryOptions({
    queryKey: ["species", id],
    queryFn: async ({ signal }): Promise<Species> => {
      const s = await get<any>(`pokemon-species/${id}`, signal);
      const english = (e: any) => e.language.name === "en";
      // Entries run oldest game first; the newest reads best (no "POKéMON" caps).
      const flavor = s.flavor_text_entries.filter(english).pop()?.flavor_text;
      return { flavorText: flavor ? cleanFlavorText(flavor) : null, genus: s.genera.find(english)?.genus ?? null };
    },
  });

/** Game text has hard line breaks, form feeds and soft hyphens from the cartridge. */
const cleanFlavorText = (text: string) =>
  text.replace(/­\n/g, "").replace(/[\n\f\r­]+/g, " ").replace(/\s+/g, " ").replace(/POKéMON/g, "Pokémon").trim();

/**
 * Name or number: "25" and "#025" match by number prefix, anything else by
 * name (prefix matches first). "mr mime" finds "mr-mime".
 */
export function searchEntries(entries: readonly Entry[], term: string): Entry[] {
  const digits = term.match(/^#?0*(\d+)$/)?.[1];
  if (digits) return entries.filter((e) => String(e.id).startsWith(digits));
  const name = term.toLowerCase().replace(/\s+/g, "-");
  const matches = entries.filter((e) => e.name.includes(name));
  return [...matches.filter((e) => e.name.startsWith(name)), ...matches.filter((e) => !e.name.startsWith(name))];
}

export const artwork = (id: number) =>
  `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${id}.png`;

export const formatNumber = (id: number) => `#${String(id).padStart(3, "0")}`;

/** "mr-mime" → "Mr Mime", "ho-oh" → "Ho Oh". */
export const displayName = (name: string) => name.split("-").map(capitalize).join(" ");

export const capitalize = (word: string) => word.charAt(0).toUpperCase() + word.slice(1);
