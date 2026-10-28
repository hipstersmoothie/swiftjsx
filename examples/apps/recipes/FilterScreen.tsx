// All recipes in a category or cuisine, as a photo grid, with a search field
// that filters by name and a sort menu.
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Screen, ToolbarItem, ScrollView, VStack, Text, Button, LazyVGrid, Menu, Picker } from "swiftjsx";
import { filterQuery, type RecipeFilter } from "./api";
import { EmptyState, ErrorView, Loading, RecipeCard } from "./ui";

type Sort = "az" | "za";

export function FilterScreen({ filter, description }: { filter: RecipeFilter; description?: string }) {
  const query = useQuery(filterQuery(filter));
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<Sort>("az");
  const [expanded, setExpanded] = useState(false);
  const term = search.trim().toLowerCase();

  const recipes = (query.data ?? [])
    .filter((r) => !term || r.name.toLowerCase().includes(term))
    .sort((a, b) => (sort === "az" ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name)));

  return (
    <Screen title={filter.value} searchText={search} onSearchTextChange={setSearch} searchPrompt={`Search ${filter.value.toLowerCase()} recipes`}>
      <ToolbarItem placement="primaryAction">
        <Menu systemImage="arrow.up.arrow.down" accessibilityLabel="Sort">
          <Picker
            label="Sort"
            value={sort}
            onChange={(v) => setSort(v as Sort)}
            options={[
              { value: "az", label: "Name (A–Z)", systemImage: "textformat" },
              { value: "za", label: "Name (Z–A)", systemImage: "textformat" },
            ]}
          />
        </Menu>
      </ToolbarItem>
      {query.isPending ? (
        <Loading label={`Loading ${filter.value} recipes…`} />
      ) : query.isError ? (
        <ErrorView message={query.error.message} retry={() => query.refetch()} />
      ) : !recipes.length ? (
        <EmptyState icon="magnifyingglass" title="No recipes" message={term ? `Nothing in ${filter.value} matches “${search.trim()}”.` : "TheMealDB has nothing here yet."} />
      ) : (
        <ScrollView>
          <VStack alignment="leading" spacing={16} padding={{ horizontal: 16, bottom: 24 }}>
            {description && !term ? (
              <Button buttonStyle="plain" onPress={() => setExpanded((e) => !e)} accessibilityHint={expanded ? "Show less" : "Show more"}>
                <Text font="subheadline" foregroundStyle="secondary" lineLimit={expanded ? undefined : 3} animation="smooth">
                  {description}
                </Text>
              </Button>
            ) : null}
            <Text font="footnote" foregroundStyle="secondary">
              {recipes.length === 1 ? "1 recipe" : `${recipes.length} recipes`}
            </Text>
            <LazyVGrid columns={{ minimum: 155 }} spacing={16}>
              {recipes.map((recipe) => (
                <RecipeCard key={recipe.id} recipe={recipe} subtitle={filter.kind === "area" ? filter.value : undefined} />
              ))}
            </LazyVGrid>
          </VStack>
        </ScrollView>
      )}
    </Screen>
  );
}
