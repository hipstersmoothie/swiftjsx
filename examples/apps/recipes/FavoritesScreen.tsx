// Favorite recipes (persisted), as a grid, filterable by category.
import { useState } from "react";
import { Screen, ToolbarItem, ScrollView, VStack, LazyVGrid, Menu, Picker } from "swiftjsx";
import { useRecipes } from "./store";
import { EmptyState, RecipeCard } from "./ui";

export function FavoritesScreen() {
  const favorites = useRecipes((s) => s.favorites);
  const [category, setCategory] = useState("all");
  const [search, setSearch] = useState("");
  const term = search.trim().toLowerCase();

  const categories = [...new Set(favorites.map((f) => f.category).filter((c): c is string => !!c))].sort();
  const shown = favorites.filter(
    (f) => (category === "all" || f.category === category) && (!term || f.name.toLowerCase().includes(term)),
  );

  if (!favorites.length) {
    return (
      <Screen title="Favorites">
        <EmptyState icon="heart" title="No favorites yet" message="Tap the heart on a recipe, or touch and hold a recipe card." />
      </Screen>
    );
  }

  return (
    <Screen title="Favorites" searchText={search} onSearchTextChange={setSearch} searchPrompt="Search favorites">
      {categories.length > 1 ? (
        <ToolbarItem placement="primaryAction">
          <Menu systemImage={category === "all" ? "line.3.horizontal.decrease.circle" : "line.3.horizontal.decrease.circle.fill"} accessibilityLabel="Filter">
            <Picker
              label="Category"
              value={category}
              onChange={setCategory}
              options={[{ value: "all", label: "All Categories" }, ...categories.map((c) => ({ value: c, label: c }))]}
            />
          </Menu>
        </ToolbarItem>
      ) : null}
      {shown.length ? (
        <ScrollView>
          <VStack padding={{ horizontal: 16, top: 4, bottom: 24 }}>
            <LazyVGrid columns={{ minimum: 155 }} spacing={16}>
              {shown.map((recipe) => (
                <RecipeCard key={recipe.id} recipe={recipe} />
              ))}
            </LazyVGrid>
          </VStack>
        </ScrollView>
      ) : (
        <EmptyState icon="magnifyingglass" title="No matches" message="None of your favorites match." />
      )}
    </Screen>
  );
}
