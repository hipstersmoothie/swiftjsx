// Browse: a random "Today's pick", the categories as a photo grid, and the
// cuisines as chips. Each opens a grid of recipes (FilterScreen).
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  useNavigation, Screen, ScrollView, VStack, ZStack, Text, Image, Button, LazyVGrid, Flow, Rectangle, ProgressView,
} from "swiftjsx";
import { areasQuery, categoriesQuery, randomQuery, recipeQuery, thumbSize, type Category } from "./api";
import { RecipeScreen } from "./RecipeScreen";
import { FilterScreen } from "./FilterScreen";
import { ACCENT, Chip, ErrorView, Loading, SectionTitle } from "./ui";

export function BrowseScreen() {
  const categories = useQuery(categoriesQuery);
  const areas = useQuery(areasQuery);
  const random = useQuery(randomQuery);
  const nav = useNavigation();

  return (
    <Screen title="Recipes">
      <ScrollView
        onRefresh={() => Promise.all([random.refetch(), categories.refetch(), areas.refetch()])}
        accessibilityIdentifier="browse"
      >
        <VStack alignment="leading" spacing={28} padding={{ horizontal: 16, top: 4, bottom: 24 }}>
          <TodaysPick />

          <VStack alignment="leading" spacing={12}>
            <SectionTitle title="Categories" />
            {categories.isPending ? (
              <Loading />
            ) : categories.isError ? (
              <ErrorView message={categories.error.message} retry={() => categories.refetch()} />
            ) : (
              <LazyVGrid columns={{ minimum: 150 }} spacing={12}>
                {categories.data.map((category) => (
                  <CategoryTile
                    key={category.id}
                    category={category}
                    onPress={() => nav.push(<FilterScreen filter={{ kind: "category", value: category.name }} description={category.description} />)}
                  />
                ))}
              </LazyVGrid>
            )}
          </VStack>

          {areas.data?.length ? (
            <VStack alignment="leading" spacing={12}>
              <SectionTitle title="Cuisines" />
              <Flow spacing={8} lineSpacing={8}>
                {areas.data.map((area) => (
                  <Chip key={area} title={area} systemImage="globe" onPress={() => nav.push(<FilterScreen filter={{ kind: "area", value: area }} />)} />
                ))}
              </Flow>
            </VStack>
          ) : null}
        </VStack>
      </ScrollView>
    </Screen>
  );
}

function TodaysPick() {
  const random = useQuery(randomQuery);
  const nav = useNavigation();
  const client = useQueryClient();
  const recipe = random.data;

  if (random.isPending) {
    return (
      <ZStack frame={{ maxWidth: "infinity", height: 220 }} background="secondarySystemFill" cornerRadius={20}>
        <ProgressView />
      </ZStack>
    );
  }
  if (!recipe) return null;

  return (
    <Button
      buttonStyle="plain"
      pressedScale={0.98}
      onPress={() => {
        // We already have the whole recipe: no second request.
        client.setQueryData(recipeQuery(recipe.id).queryKey, recipe);
        nav.push(<RecipeScreen id={recipe.id} preview={recipe} />);
      }}
      accessibilityIdentifier="recipe-card"
      accessibilityLabel={`Today's pick: ${recipe.name}, ${recipe.category}, ${recipe.area}`}
    >
      <ZStack alignment="bottomLeading" frame={{ maxWidth: "infinity", height: 220 }} cornerRadius={20} shadow={{ radius: 10, y: 4, color: "black/20" }}>
        <Image src={thumbSize(recipe.thumb, "large")} contentMode="fill" frame={{ maxWidth: "infinity", height: 220 }} />
        <Rectangle fill={{ gradient: ["clear", "black/75"], start: "center", end: "bottom" }} frame={{ maxWidth: "infinity", height: 220 }} />
        <VStack alignment="leading" spacing={4} padding={16}>
          <Text font="caption" fontWeight="bold" foregroundStyle={ACCENT} textCase="uppercase" kerning={1}>Today's pick</Text>
          <Text font={{ size: 26, weight: "bold", design: "serif" }} foregroundStyle="white" lineLimit={2}>{recipe.name}</Text>
          <Text font="subheadline" foregroundStyle="white/80">
            {recipe.category} · {recipe.area} · {recipe.ingredients.length} ingredients
          </Text>
        </VStack>
      </ZStack>
    </Button>
  );
}

function CategoryTile({ category, onPress }: { category: Category; onPress(): void }) {
  return (
    <Button buttonStyle="plain" pressedScale={0.96} onPress={onPress} accessibilityLabel={category.name} accessibilityIdentifier="category-tile">
      <VStack spacing={6} padding={12} frame={{ maxWidth: "infinity" }} background="secondarySystemBackground" cornerRadius={18}>
        <Image src={category.thumb} contentMode="fit" frame={{ height: 84, maxWidth: "infinity" }} />
        <Text font="headline" lineLimit={1}>{category.name}</Text>
      </VStack>
    </Button>
  );
}
