// TheMealDB (https://www.themealdb.com/api.php): free, no key with the test
// key "1". Responses are validated with zod and reshaped into what the UI
// wants: ingredient/measure pairs instead of strIngredient1…20, steps split
// out of the instructions, tags as an array.
import { z } from "zod";
import { queryOptions } from "@tanstack/react-query";
import { splitSteps } from "./steps";

const API = "https://www.themealdb.com/api/json/v1/1/";

/** What list endpoints (filter.php) give: enough for a card. */
export type RecipeSummary = { id: string; name: string; thumb: string; category?: string; area?: string };

export type Ingredient = { name: string; measure: string };

export type Recipe = RecipeSummary & {
  category: string;
  area: string;
  instructions: string;
  steps: string[];
  ingredients: Ingredient[];
  tags: string[];
  youtube: string | null;
  source: string | null;
};

export type Category = { id: string; name: string; thumb: string; description: string };

/** "" and null both mean "not there" in TheMealDB. */
const text = z
  .string()
  .nullish()
  .transform((s) => s?.trim() || null);

// strIngredient1…20 / strMeasure1…20 are read off the loose object below.
const MealSchema = z
  .looseObject({
    idMeal: z.string(),
    strMeal: z.string(),
    strMealThumb: z.string(),
    strCategory: text,
    strArea: text,
    strInstructions: text,
    strTags: text,
    strYoutube: text,
    strSource: text,
  })
  .transform((m): Recipe => {
    const raw = m as Record<string, unknown>;
    const ingredients: Ingredient[] = [];
    for (let i = 1; i <= 20; i++) {
      const name = String(raw[`strIngredient${i}`] ?? "").trim();
      if (!name) continue;
      ingredients.push({ name, measure: String(raw[`strMeasure${i}`] ?? "").trim() });
    }
    const instructions = m.strInstructions ?? "";
    return {
      id: m.idMeal,
      name: m.strMeal.trim(),
      thumb: m.strMealThumb,
      category: m.strCategory ?? "Other",
      area: m.strArea ?? "Unknown",
      instructions,
      steps: splitSteps(instructions),
      ingredients,
      tags: (m.strTags ?? "")
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
      youtube: m.strYoutube,
      source: m.strSource,
    };
  });

const MealsResponse = z.object({ meals: z.array(MealSchema).nullable() });

const SummaryResponse = z.object({
  meals: z
    .array(z.object({ idMeal: z.string(), strMeal: z.string(), strMealThumb: z.string() }))
    .nullable(),
});

const CategoriesResponse = z.object({
  categories: z.array(
    z.object({ idCategory: z.string(), strCategory: z.string(), strCategoryThumb: z.string(), strCategoryDescription: text }),
  ),
});

const AreasResponse = z.object({ meals: z.array(z.object({ strArea: z.string() })).nullable() });

async function get<T>(path: string, schema: z.ZodType<T>, signal?: AbortSignal): Promise<T> {
  const response = await fetch(API + path, { signal });
  if (!response.ok) throw new Error(`TheMealDB: ${response.status} ${response.statusText}`);
  const parsed = schema.safeParse(await response.json());
  if (!parsed.success) throw new Error(`TheMealDB sent something unexpected (${parsed.error.issues[0]?.message ?? "invalid"})`);
  return parsed.data;
}

const DAY = 24 * 60 * 60 * 1000;

export const categoriesQuery = queryOptions({
  queryKey: ["categories"],
  staleTime: DAY,
  queryFn: async ({ signal }): Promise<Category[]> =>
    (await get("categories.php", CategoriesResponse, signal)).categories.map((c) => ({
      id: c.idCategory,
      name: c.strCategory,
      thumb: c.strCategoryThumb,
      // "…since prehistoric times.[1] Beef is…": drop Wikipedia's footnote marks.
      description: (c.strCategoryDescription ?? "").replace(/\[\d+\]/g, "").replace(/\s+/g, " ").trim(),
    })),
});

export const areasQuery = queryOptions({
  queryKey: ["areas"],
  staleTime: DAY,
  queryFn: async ({ signal }) =>
    ((await get("list.php?a=list", AreasResponse, signal)).meals ?? []).map((a) => a.strArea).filter((a) => a !== "Unknown"),
});

export type RecipeFilter = { kind: "category" | "area"; value: string };

export const filterQuery = (filter: RecipeFilter) =>
  queryOptions({
    queryKey: ["filter", filter.kind, filter.value],
    staleTime: DAY,
    queryFn: async ({ signal }): Promise<RecipeSummary[]> => {
      const param = filter.kind === "category" ? "c" : "a";
      const { meals } = await get(`filter.php?${param}=${encodeURIComponent(filter.value)}`, SummaryResponse, signal);
      return (meals ?? []).map((m) => ({
        id: m.idMeal,
        name: m.strMeal.trim(),
        thumb: m.strMealThumb,
        ...(filter.kind === "category" ? { category: filter.value } : { area: filter.value }),
      }));
    },
  });

export const searchQuery = (term: string) =>
  queryOptions({
    queryKey: ["search", term.toLowerCase()],
    staleTime: 10 * 60 * 1000,
    queryFn: async ({ signal }) => (await get(`search.php?s=${encodeURIComponent(term)}`, MealsResponse, signal)).meals ?? [],
  });

export const recipeQuery = (id: string) =>
  queryOptions({
    queryKey: ["recipe", id],
    staleTime: DAY,
    queryFn: async ({ signal }): Promise<Recipe> => {
      const { meals } = await get(`lookup.php?i=${encodeURIComponent(id)}`, MealsResponse, signal);
      if (!meals?.length) throw new Error("This recipe isn't on TheMealDB any more.");
      return meals[0];
    },
  });

/** A random recipe for the Browse header; one per launch. */
export const randomQuery = queryOptions({
  queryKey: ["random"],
  staleTime: Infinity,
  queryFn: async ({ signal }): Promise<Recipe | null> => (await get("random.php", MealsResponse, signal)).meals?.[0] ?? null,
});

/** TheMealDB's ingredient photos (transparent PNGs). */
export const ingredientImage = (name: string) =>
  `https://www.themealdb.com/images/ingredients/${encodeURIComponent(name.trim())}-Small.png`;

/** Recipe photos come in sizes: append /small, /medium or /large. */
export const thumbSize = (thumb: string, size: "small" | "medium" | "large") => `${thumb}/${size}`;

export const summaryOf = (r: RecipeSummary): RecipeSummary => ({
  id: r.id,
  name: r.name,
  thumb: r.thumb,
  category: r.category,
  area: r.area,
});
