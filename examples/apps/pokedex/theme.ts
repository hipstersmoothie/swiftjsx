import type { Color } from "swiftjsx";

type Hex = `#${string}`;

const typeColors: Record<string, Hex> = {
  normal: "#A8A77A", fire: "#EE8130", water: "#6390F0", electric: "#F7D02C", grass: "#7AC74C", ice: "#96D9D6",
  fighting: "#C22E28", poison: "#A33EA1", ground: "#E2BF65", flying: "#A98FF3", psychic: "#F95587", bug: "#A6B91A",
  rock: "#B6A136", ghost: "#735797", dragon: "#6F35FC", dark: "#705746", steel: "#B7B7CE", fairy: "#D685AD",
};

export const typeColor = (type: string | undefined): Hex => (type && typeColors[type]) || "#8E8E93";

/** A `#rrggbb` color at `opacity` (0–1), as `#rrggbbaa`. */
export const withOpacity = (hex: Hex, opacity: number): Color =>
  `${hex}${Math.round(opacity * 255).toString(16).padStart(2, "0")}`;

export const statLabels: Record<string, string> = {
  hp: "HP", attack: "Attack", defense: "Defense", "special-attack": "Sp. Atk", "special-defense": "Sp. Def", speed: "Speed",
};

/** The highest base stat any Pokémon has (Blissey's HP). */
export const MAX_STAT = 255;
