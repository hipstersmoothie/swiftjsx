// Search TheMealDB by name. Typing is debounced; results keep showing while
// the next query loads. Before searching: recent searches and suggestions.
import { useEffect, useState } from "react";
import { keepPreviousData, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  useNavigation, Screen, ToolbarItem, List, Section, VStack, HStack, Text, Image, Button, Flow, ProgressView, SwipeActions,
} from "swiftjsx";
import { recipeQuery, searchQuery, thumbSize, type Recipe } from "./api";
import { useRecipes } from "./store";
import { RecipeScreen } from "./RecipeScreen";
import { ACCENT, Chip, EmptyState, ErrorView } from "./ui";

const SUGGESTIONS = ["Chicken", "Pasta", "Curry", "Soup", "Cake", "Salmon", "Beef", "Pie", "Tart", "Rice", "Lamb", "Pancakes"];

export function SearchScreen() {
  const [text, setText] = useState("");
  const [term, setTerm] = useState("");
  // Debounce: one request when typing pauses, not one per keystroke.
  useEffect(() => {
    const timer = setTimeout(() => setTerm(text.trim()), 350);
    return () => clearTimeout(timer);
  }, [text]);

  const query = useQuery({ ...searchQuery(term), enabled: term.length >= 2, placeholderData: keepPreviousData });
  const recent = useRecipes((s) => s.recentSearches);
  const forget = useRecipes((s) => s.forgetSearches);

  return (
    <Screen title="Search" searchText={text} onSearchTextChange={setText} searchPrompt="Dishes, like “lasagne”">
      {query.isFetching && term.length >= 2 ? (
        <ToolbarItem placement="primaryAction">
          <ProgressView />
        </ToolbarItem>
      ) : null}
      {term.length < 2 ? (
        <List listStyle="insetGrouped">
          {recent.length ? (
            <Section header="Recent">
              {recent.map((r) => (
                <Button key={r} buttonStyle="plain" onPress={() => setText(r)} accessibilityIdentifier="recent-search">
                  <HStack spacing={10} contentShape="rectangle" frame={{ maxWidth: "infinity", alignment: "leading" }}>
                    <Image systemName="clock.arrow.circlepath" foregroundStyle="secondary" />
                    <Text>{r}</Text>
                  </HStack>
                </Button>
              ))}
              <Button title="Clear Recent Searches" tint={ACCENT} onPress={forget} />
            </Section>
          ) : null}
          <Section header="Try">
            <Flow spacing={8} lineSpacing={8} padding={{ vertical: 6 }}>
              {SUGGESTIONS.map((s) => (
                <Chip key={s} title={s} onPress={() => setText(s)} />
              ))}
            </Flow>
          </Section>
        </List>
      ) : query.isPending ? (
        <VStack frame={{ maxWidth: "infinity", maxHeight: "infinity" }}><ProgressView /></VStack>
      ) : query.isError ? (
        <ErrorView message={query.error.message} retry={() => query.refetch()} />
      ) : !query.data.length ? (
        <EmptyState icon="fork.knife" title="No recipes found" message={`TheMealDB has nothing called “${term}”. Try a single word, like an ingredient.`} />
      ) : (
        <List listStyle="plain">
          <Section footer={query.data.length === 1 ? "1 recipe" : `${query.data.length} recipes`}>
            {query.data.map((recipe) => (
              <ResultRow key={recipe.id} recipe={recipe} term={term} />
            ))}
          </Section>
        </List>
      )}
    </Screen>
  );
}

function ResultRow({ recipe, term }: { recipe: Recipe; term: string }) {
  const nav = useNavigation();
  const client = useQueryClient();
  const remember = useRecipes((s) => s.rememberSearch);
  const favorites = useRecipes((s) => s.favorites);
  const toggleFavorite = useRecipes((s) => s.toggleFavorite);
  const favorite = favorites.some((f) => f.id === recipe.id);

  return (
    <Button
      buttonStyle="plain"
      onPress={() => {
        remember(term);
        // Search results are whole recipes: seed the detail query.
        client.setQueryData(recipeQuery(recipe.id).queryKey, recipe);
        nav.push(<RecipeScreen id={recipe.id} preview={recipe} />);
      }}
      accessibilityIdentifier="recipe-card"
      accessibilityLabel={`${recipe.name}, ${recipe.category}, ${recipe.area}`}
    >
      <HStack spacing={12} contentShape="rectangle">
        <Image src={thumbSize(recipe.thumb, "small")} contentMode="fill" frame={{ width: 64, height: 64 }} cornerRadius={10} />
        <VStack alignment="leading" spacing={3} frame={{ maxWidth: "infinity", alignment: "leading" }}>
          <Text font="headline" lineLimit={2}>{recipe.name}</Text>
          <Text font="subheadline" foregroundStyle="secondary" lineLimit={1}>{recipe.category} · {recipe.area}</Text>
          <Text font="caption" foregroundStyle="tertiaryLabel">
            {recipe.ingredients.length} ingredients · {recipe.steps.length} steps
          </Text>
        </VStack>
        {favorite ? <Image systemName="heart.fill" font="caption" foregroundStyle="pink" /> : null}
      </HStack>
      <SwipeActions edge="leading">
        <Button tint="pink" onPress={() => toggleFavorite(recipe)}>
          <Image systemName={favorite ? "heart.slash.fill" : "heart.fill"} />
        </Button>
      </SwipeActions>
    </Button>
  );
}
