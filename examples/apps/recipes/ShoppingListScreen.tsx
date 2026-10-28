// The shopping list: ingredients from every recipe added, merged ("2 eggs"
// + "3 eggs" → "5 eggs", "200 g" + "1 kg" flour → "1.2 kg"), scaled to each
// recipe's servings. Tick things off as you shop; checked items sink to the
// bottom. The recipes it came from are listed (and adjustable) below.
import { useState } from "react";
import {
  useNavigation, Screen, ToolbarItem, List, Section, VStack, HStack, Text, Image, Button, Menu, Label, Divider, Stepper,
  ConfirmationDialog, haptic,
} from "swiftjsx";
import { thumbSize } from "./api";
import { aggregate, type ListItem } from "./quantity";
import { useRecipes, BASE_SERVINGS } from "./store";
import { RecipeScreen } from "./RecipeScreen";
import { ACCENT, EmptyState } from "./ui";

export function ShoppingListScreen() {
  const list = useRecipes((s) => s.list);
  const checked = useRecipes((s) => s.checked);
  // Not `useRecipes.getState()`: the React Compiler reads `useRecipes.x` as a
  // hook used as a value and skips the whole component.
  const toggleChecked = useRecipes((s) => s.toggleChecked);
  const clearChecked = useRecipes((s) => s.clearChecked);
  const uncheckAll = useRecipes((s) => s.uncheckAll);
  const clearList = useRecipes((s) => s.clearList);
  const removeFromList = useRecipes((s) => s.removeFromList);
  const setListServings = useRecipes((s) => s.setListServings);
  const [confirmClear, setConfirmClear] = useState(false);
  const [copied, setCopied] = useState(false);
  const nav = useNavigation();

  const items = aggregate(list.map((r) => ({ recipeId: r.id, recipeName: r.name, factor: r.servings / BASE_SERVINGS, ingredients: r.ingredients })));
  const toBuy = items.filter((i) => !checked[i.key]);
  const inBasket = items.filter((i) => checked[i.key]);

  const copy = async () => {
    const lines = toBuy.map((i) => `• ${i.name}${i.amount ? ` — ${i.amount}` : ""}`);
    await navigator.clipboard.writeText([`Shopping list (${list.map((r) => r.name).join(", ")})`, ...lines].join("\n"));
    haptic("success");
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  if (!list.length) {
    return (
      <Screen title="Shopping List">
        <EmptyState icon="cart" title="Your list is empty" message="Open a recipe and tap “Add to List”. Ingredients from several recipes are added up for you." />
      </Screen>
    );
  }

  return (
    <Screen title="Shopping List">
      <ToolbarItem placement="primaryAction">
        <Menu systemImage="ellipsis.circle" accessibilityLabel="List actions" accessibilityIdentifier="list-actions">
          <Button onPress={() => void copy()}>
            <Label title={copied ? "Copied" : "Copy List"} systemImage={copied ? "checkmark" : "doc.on.doc"} />
          </Button>
          <Button onPress={uncheckAll} disabled={!inBasket.length}>
            <Label title="Uncheck All" systemImage="arrow.uturn.backward" />
          </Button>
          <Button onPress={clearChecked} disabled={!inBasket.length}>
            <Label title="Remove Checked Items" systemImage="checkmark.circle.badge.xmark" />
          </Button>
          <Divider />
          <Button role="destructive" onPress={() => setConfirmClear(true)}>
            <Label title="Clear List" systemImage="trash" />
          </Button>
        </Menu>
      </ToolbarItem>
      <List listStyle="insetGrouped">
        <Section header={toBuy.length ? `To buy · ${toBuy.length}` : "To buy"}>
          {toBuy.length ? (
            toBuy.map((item) => <ItemRow key={item.key} item={item} done={false} onToggle={() => toggleChecked(item.key)} />)
          ) : (
            <HStack spacing={10}>
              <Image systemName="checkmark.seal.fill" foregroundStyle="green" />
              <Text foregroundStyle="secondary">Everything's in the basket.</Text>
            </HStack>
          )}
        </Section>
        {inBasket.length ? (
          <Section header={`In the basket · ${inBasket.length}`}>
            {inBasket.map((item) => (
              <ItemRow key={item.key} item={item} done onToggle={() => toggleChecked(item.key)} />
            ))}
          </Section>
        ) : null}
        <Section header="Recipes" footer="Swipe a recipe to remove its ingredients. Servings rescale its amounts." onDelete={(indices) => indices.forEach((i) => removeFromList(list[i].id))}>
          {list.map((recipe) => (
            <HStack key={recipe.id} spacing={12}>
              <Button buttonStyle="plain" onPress={() => nav.push(<RecipeScreen id={recipe.id} preview={recipe} />)} accessibilityLabel={recipe.name}>
                <HStack spacing={12}>
                  <Image src={thumbSize(recipe.thumb, "small")} contentMode="fill" frame={{ width: 44, height: 44 }} cornerRadius={8} />
                  <VStack alignment="leading" spacing={2}>
                    <Text font="subheadline" fontWeight="semibold" lineLimit={2}>{recipe.name}</Text>
                    <Text font="caption" foregroundStyle="secondary">Serves {recipe.servings} · {recipe.ingredients.length} ingredients</Text>
                  </VStack>
                </HStack>
              </Button>
              <Stepper
                value={recipe.servings}
                onChange={(v) => setListServings(recipe.id, v)}
                min={1}
                max={24}
                fixedSize
                accessibilityLabel={`Servings for ${recipe.name}`}
                accessibilityValue={String(recipe.servings)}
              />
            </HStack>
          ))}
        </Section>
      </List>
      <ConfirmationDialog
        isPresented={confirmClear}
        onDismiss={() => setConfirmClear(false)}
        title="Clear the shopping list?"
        message={`${items.length} items from ${list.length} ${list.length === 1 ? "recipe" : "recipes"}.`}
      >
        <Button title="Clear List" role="destructive" onPress={clearList} />
        <Button title="Cancel" role="cancel" onPress={() => setConfirmClear(false)} />
      </ConfirmationDialog>
    </Screen>
  );
}

function ItemRow({ item, done, onToggle }: { item: ListItem; done: boolean; onToggle(): void }) {
  return (
    <Button
      buttonStyle="plain"
      onPress={() => {
        haptic("selection");
        onToggle();
      }}
      accessibilityIdentifier="list-item"
      accessibilityLabel={`${item.name}, ${item.amount}`}
      accessibilityValue={done ? "checked" : "not checked"}
    >
      <HStack spacing={12} contentShape="rectangle">
        <Image systemName={done ? "checkmark.circle.fill" : "circle"} font="title3" foregroundStyle={done ? ACCENT : "tertiaryLabel"} />
        <VStack alignment="leading" spacing={2} frame={{ maxWidth: "infinity", alignment: "leading" }}>
          <Text strikethrough={done} foregroundStyle={done ? "secondary" : "primary"}>{item.name}</Text>
          {item.recipes.length > 1 ? (
            <Text font="caption" foregroundStyle="tertiaryLabel" lineLimit={1}>{item.recipes.join(", ")}</Text>
          ) : null}
        </VStack>
        <Text font="subheadline" fontWeight="medium" foregroundStyle={done ? "tertiaryLabel" : ACCENT} monospacedDigit lineLimit={1}>
          {item.amount}
        </Text>
      </HStack>
    </Button>
  );
}
