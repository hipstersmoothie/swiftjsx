// The ingredients checklist: photo, scaled measure, tap to tick off. Used on
// the recipe page and in cooking mode's ingredients sheet.
import { VStack, HStack, Text, Image, Button, Divider } from "swiftjsx";
import { ingredientImage, type Ingredient } from "./api";
import { scaleMeasure } from "./quantity";
import { ACCENT } from "./ui";

export function IngredientList({ ingredients, factor, checked, onToggle, large }: {
  ingredients: Ingredient[];
  factor: number;
  checked: ReadonlySet<number>;
  onToggle(index: number): void;
  /** Bigger rows for cooking mode (read from across the kitchen). */
  large?: boolean;
}) {
  return (
    <VStack spacing={0} alignment="leading">
      {ingredients.map((ingredient, i) => {
        const done = checked.has(i);
        const measure = scaleMeasure(ingredient.measure, factor);
        return (
          <VStack key={`${ingredient.name}-${i}`} spacing={0} alignment="leading">
            {i > 0 ? <Divider padding={{ leading: large ? 64 : 56 }} /> : null}
            <Button
              buttonStyle="plain"
              pressedBackground="systemFill"
              onPress={() => onToggle(i)}
              accessibilityLabel={`${measure} ${ingredient.name}`}
              accessibilityValue={done ? "checked" : "not checked"}
              accessibilityTraits={done ? ["button", "selected"] : "button"}
            >
              <HStack spacing={12} padding={{ vertical: large ? 10 : 8 }} contentShape="rectangle">
                <Image
                  systemName={done ? "checkmark.circle.fill" : "circle"}
                  font={large ? "title2" : "title3"}
                  foregroundStyle={done ? ACCENT : "tertiaryLabel"}
                  symbolEffect={{ type: "bounce", value: done }}
                />
                <Image src={ingredientImage(ingredient.name)} contentMode="fit" frame={{ width: large ? 40 : 34, height: large ? 40 : 34 }} opacity={done ? 0.4 : 1} />
                <VStack alignment="leading" spacing={1} frame={{ maxWidth: "infinity", alignment: "leading" }}>
                  <Text font={large ? "title3" : "body"} strikethrough={done} foregroundStyle={done ? "secondary" : "primary"}>
                    {ingredient.name}
                  </Text>
                  {measure ? (
                    <Text font={large ? "body" : "subheadline"} fontWeight="medium" foregroundStyle={done ? "tertiary" : ACCENT}>
                      {measure}
                    </Text>
                  ) : null}
                </VStack>
              </HStack>
            </Button>
          </VStack>
        );
      })}
    </VStack>
  );
}
