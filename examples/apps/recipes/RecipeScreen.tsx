// A recipe: hero photo, tags, servings (rescales every measure), the
// ingredients checklist, the method with tappable timers, YouTube and the
// original source. "Start cooking" opens cooking mode full screen.
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Screen, ToolbarItem, ScrollView, VStack, HStack, ZStack, Text, Image, Button, Stepper, Rectangle, Flow, Divider, Label,
  Sheet, haptic, openURL,
} from "swiftjsx";
import { recipeQuery, thumbSize, type Recipe, type RecipeSummary } from "./api";
import { useIsFavorite, useIsOnList, useRecipes, useServings, BASE_SERVINGS } from "./store";
import { findDurations, formatDuration } from "./steps";
import { useTimers } from "./timers";
import { IngredientList } from "./Ingredients";
import { CookingMode } from "./CookingMode";
import { TimerButton } from "./TimerButton";
import { ACCENT, Chip, ErrorView, Loading, SectionTitle } from "./ui";

export function RecipeScreen({ id, preview }: { id: string; preview?: RecipeSummary }) {
  const query = useQuery(recipeQuery(id));
  const recipe = query.data;
  const summary = recipe ?? preview;
  const favorite = useIsFavorite(id);
  const toggleFavorite = useRecipes((s) => s.toggleFavorite);
  const [cooking, setCooking] = useState(false);
  // Sheet content is rendered by React even while the sheet is down, so
  // cooking mode mounts the first time it opens (not for every recipe you
  // look at) and then stays, so it can animate away with its content.
  const [cookedOnce, setCookedOnce] = useState(false);
  if (cooking && !cookedOnce) setCookedOnce(true);
  // Ticked-off ingredients, shared with cooking mode (not persisted: per cook).
  const [checked, setChecked] = useState<ReadonlySet<number>>(new Set());
  const toggleIngredient = (i: number) =>
    setChecked((current) => {
      const next = new Set(current);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });

  return (
    <Screen title={summary?.name ?? "Recipe"} titleDisplayMode="inline">
      <ToolbarItem placement="primaryAction">
        <Button
          onPress={() => {
            if (!summary) return;
            haptic(favorite ? "light" : "success");
            toggleFavorite(summary);
          }}
          disabled={!summary}
          accessibilityIdentifier="favorite-button"
          accessibilityLabel={favorite ? "Remove from Favorites" : "Add to Favorites"}
        >
          <Image systemName={favorite ? "heart.fill" : "heart"} foregroundStyle={favorite ? "pink" : ACCENT} symbolEffect={{ type: "bounce", value: favorite }} />
        </Button>
      </ToolbarItem>
      <ScrollView>
        <Hero recipe={recipe} preview={preview} />
        {query.isPending ? (
          <Loading label="Loading recipe…" />
        ) : query.isError ? (
          <ErrorView message={query.error.message} retry={() => query.refetch()} />
        ) : (
          <RecipeBody recipe={query.data} checked={checked} onToggle={toggleIngredient} onCook={() => setCooking(true)} />
        )}
      </ScrollView>
      {/* `open`: cooking mode keeps the screen awake and speaks only while it's up. */}
      <Sheet isPresented={cooking && !!recipe} onDismiss={() => setCooking(false)} fullScreen>
        {recipe && cookedOnce ? (
          <CookingMode recipe={recipe} open={cooking} onClose={() => setCooking(false)} checked={checked} onToggleIngredient={toggleIngredient} />
        ) : null}
      </Sheet>
    </Screen>
  );
}

function Hero({ recipe, preview }: { recipe?: Recipe; preview?: RecipeSummary }) {
  const thumb = recipe?.thumb ?? preview?.thumb;
  const name = recipe?.name ?? preview?.name ?? "";
  const category = recipe?.category ?? preview?.category;
  const area = recipe?.area ?? preview?.area;
  return (
    <ZStack alignment="bottomLeading" frame={{ maxWidth: "infinity", height: 300 }} accessibilityElement="combine">
      {thumb ? (
        <Image src={thumbSize(thumb, "large")} contentMode="fill" frame={{ maxWidth: "infinity", height: 300 }} accessibilityLabel={`Photo of ${name}`} />
      ) : (
        <Rectangle fill="secondarySystemFill" frame={{ maxWidth: "infinity", height: 300 }} />
      )}
      <Rectangle fill={{ gradient: ["clear", "black/30", "black/80"], start: "center", end: "bottom" }} frame={{ maxWidth: "infinity", height: 300 }} allowsHitTesting={false} />
      <VStack alignment="leading" spacing={8} padding={20}>
        <HStack spacing={6}>
          {category ? <Chip title={category} color="white/20" foreground="white" /> : null}
          {area && area !== "Unknown" ? <Chip title={area} systemImage="globe" color="white/20" foreground="white" /> : null}
        </HStack>
        <Text font={{ size: 32, weight: "bold", design: "serif" }} foregroundStyle="white" lineLimit={3} minimumScaleFactor={0.7} shadow={{ radius: 6, color: "black/40" }}>
          {name}
        </Text>
      </VStack>
    </ZStack>
  );
}

function RecipeBody({ recipe, checked, onToggle, onCook }: {
  recipe: Recipe;
  checked: ReadonlySet<number>;
  onToggle(i: number): void;
  onCook(): void;
}) {
  const servings = useServings(recipe.id);
  const setServings = useRecipes((s) => s.setServings);
  const addToList = useRecipes((s) => s.addToList);
  const onList = useIsOnList(recipe.id);
  const startTimer = useTimers((s) => s.start);
  const factor = servings / BASE_SERVINGS;

  const timed = recipe.steps.flatMap((step) => findDurations(step));
  const totalSeconds = timed.reduce((sum, d) => sum + d.seconds, 0);

  return (
    <VStack alignment="leading" spacing={28} padding={{ horizontal: 20, top: 20, bottom: 40 }}>
      <HStack spacing={0} accessibilityElement="combine">
        <Fact value={String(recipe.ingredients.length)} label="ingredients" />
        <Divider frame={{ height: 36 }} />
        <Fact value={String(recipe.steps.length)} label={recipe.steps.length === 1 ? "step" : "steps"} />
        <Divider frame={{ height: 36 }} />
        <Fact value={totalSeconds ? formatDuration(totalSeconds) : "—"} label="timed" />
      </HStack>

      <VStack spacing={10}>
        <Button buttonStyle="borderedProminent" tint={ACCENT} onPress={onCook} accessibilityIdentifier="start-cooking" frame={{ maxWidth: "infinity" }}>
          <Label title="Start Cooking" systemImage="frying.pan.fill" font="headline" frame={{ maxWidth: "infinity" }} padding={{ vertical: 8 }} />
        </Button>
        <HStack spacing={10}>
          <Button
            buttonStyle="bordered"
            tint={onList ? "green" : ACCENT}
            onPress={() => {
              haptic("success");
              addToList(recipe, servings);
            }}
            frame={{ maxWidth: "infinity" }}
            accessibilityIdentifier="add-to-list"
          >
            <Label title={onList ? "Update List" : "Add to List"} systemImage={onList ? "checkmark.circle.fill" : "cart.badge.plus"} frame={{ maxWidth: "infinity" }} padding={{ vertical: 4 }} />
          </Button>
          {recipe.youtube ? (
            <Button buttonStyle="bordered" tint="red" onPress={() => void openURL(recipe.youtube ?? "")} frame={{ maxWidth: "infinity" }} accessibilityIdentifier="watch-youtube">
              <Label title="Watch" systemImage="play.rectangle.fill" frame={{ maxWidth: "infinity" }} padding={{ vertical: 4 }} />
            </Button>
          ) : null}
        </HStack>
      </VStack>

      <VStack alignment="leading" spacing={12}>
        <SectionTitle title="Ingredients" trailing={<Text font="subheadline" foregroundStyle="secondary" monospacedDigit>{checked.size}/{recipe.ingredients.length}</Text>} />
        {/* Stepper's children are its label. */}
        <Stepper
          value={servings}
          onChange={(v) => setServings(recipe.id, v)}
          min={1}
          max={24}
          padding={12}
          background="secondarySystemBackground"
          cornerRadius={12}
          accessibilityIdentifier="servings-stepper"
        >
          <VStack alignment="leading" spacing={2}>
            <Text font="headline">Serves {servings}</Text>
            <Text font="caption" foregroundStyle="secondary">
              {servings === BASE_SERVINGS ? `As written (about ${BASE_SERVINGS})` : `Scaled ×${formatFactor(factor)} from ${BASE_SERVINGS}`}
            </Text>
          </VStack>
        </Stepper>
        <IngredientList ingredients={recipe.ingredients} factor={factor} checked={checked} onToggle={onToggle} />
      </VStack>

      <VStack alignment="leading" spacing={14}>
        <SectionTitle title="Method" />
        {recipe.steps.map((step, i) => (
          <StepRow key={i} index={i} step={step} onTimer={(label, seconds) => startTimer(label, seconds, recipe.name)} />
        ))}
        {!recipe.steps.length ? <Text foregroundStyle="secondary">This recipe has no instructions.</Text> : null}
      </VStack>

      {recipe.tags.length ? (
        <VStack alignment="leading" spacing={10}>
          <SectionTitle title="Tags" />
          <Flow spacing={8} lineSpacing={8}>
            {recipe.tags.map((tag) => (
              <Chip key={tag} title={tag} systemImage="tag" />
            ))}
          </Flow>
        </VStack>
      ) : null}

      {recipe.source ? (
        <Button buttonStyle="plain" onPress={() => void openURL(recipe.source ?? "", { inApp: true })} accessibilityIdentifier="recipe-source">
          <HStack spacing={8}>
            <Image systemName="safari" foregroundStyle={ACCENT} />
            <Text foregroundStyle={ACCENT} lineLimit={1}>Original recipe · {hostOf(recipe.source)}</Text>
          </HStack>
        </Button>
      ) : null}
    </VStack>
  );
}

function Fact({ value, label }: { value: string; label: string }) {
  return (
    <VStack spacing={2} frame={{ maxWidth: "infinity" }}>
      <Text font={{ size: 20, weight: "semibold", design: "rounded" }} lineLimit={1} minimumScaleFactor={0.6}>{value}</Text>
      <Text font="caption" foregroundStyle="secondary">{label}</Text>
    </VStack>
  );
}

function StepRow({ index, step, onTimer }: { index: number; step: string; onTimer(label: string, seconds: number): void }) {
  const durations = findDurations(step);
  return (
    <HStack alignment="top" spacing={12}>
      <Text
        font={{ size: 15, weight: "bold", design: "rounded" }}
        foregroundStyle="white"
        frame={{ width: 28, height: 28 }}
        background={ACCENT}
        cornerRadius="capsule"
        accessibilityHidden
      >
        {String(index + 1)}
      </Text>
      <VStack alignment="leading" spacing={8} frame={{ maxWidth: "infinity", alignment: "leading" }}>
        <Text lineSpacing={3} accessibilityLabel={`Step ${index + 1}. ${step}`}>{step}</Text>
        {durations.length ? (
          <Flow spacing={8} lineSpacing={8}>
            {durations.map((d) => (
              <TimerButton key={d.start} label={d.label} display={d.display} seconds={d.seconds} onStart={onTimer} />
            ))}
          </Flow>
        ) : null}
      </VStack>
    </HStack>
  );
}

const formatFactor = (f: number) => (Number.isInteger(f) ? String(f) : f.toFixed(2).replace(/0$/, ""));

function hostOf(url: string) {
  try {
    return new URL(url).host.replace(/^www\./, "");
  } catch {
    return url;
  }
}
