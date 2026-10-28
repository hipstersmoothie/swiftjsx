// Shared pieces: loading/error/empty states, chips, section titles and the
// recipe card used by every grid.
import type { ReactNode } from "react";
import {
  useNavigation, VStack, HStack, Text, Image, Button, ProgressView, Overlay, ContextMenu, Label, Spacer,
  type ColorValue,
} from "swiftjsx";
import { thumbSize, type RecipeSummary } from "./api";
import { useIsFavorite, useRecipes } from "./store";
import { RecipeScreen } from "./RecipeScreen";

export const ACCENT = "orange" as const;
const fill = { maxWidth: "infinity", maxHeight: "infinity" } as const;

// ProgressView's `label` only shows on determinate bars, so spinners get a Text.
export function Loading({ label }: { label?: string }) {
  return (
    <VStack spacing={10} frame={fill} padding={32}>
      <ProgressView />
      {label ? <Text font="footnote" foregroundStyle="secondary">{label}</Text> : null}
    </VStack>
  );
}

export function ErrorView({ message, retry }: { message: string; retry(): void }) {
  return (
    <VStack spacing={12} padding={32} frame={fill}>
      <Image systemName="wifi.exclamationmark" font="largeTitle" foregroundStyle="secondary" />
      <Text textAlignment="center" foregroundStyle="secondary">{message}</Text>
      <Button title="Try again" buttonStyle="bordered" onPress={retry} />
    </VStack>
  );
}

export function EmptyState({ icon, title, message, children }: { icon: string; title: string; message: string; children?: ReactNode }) {
  return (
    <VStack spacing={8} padding={32} frame={fill}>
      <Image systemName={icon} font="largeTitle" foregroundStyle="secondary" symbolRenderingMode="hierarchical" />
      <Text font="headline">{title}</Text>
      <Text font="subheadline" textAlignment="center" foregroundStyle="secondary">{message}</Text>
      {children}
    </VStack>
  );
}

export function SectionTitle({ title, trailing }: { title: string; trailing?: ReactNode }) {
  return (
    <HStack alignment="firstTextBaseline">
      <Text font="title2" fontWeight="bold" accessibilityTraits="header">{title}</Text>
      <Spacer />
      {trailing}
    </HStack>
  );
}

/** A small rounded label: categories, cuisines, tags. */
export function Chip({ title, systemImage, color = "secondarySystemFill", foreground, onPress }: {
  title: string;
  systemImage?: string;
  color?: ColorValue;
  foreground?: ColorValue;
  onPress?: () => void;
}) {
  const body = (
    <HStack spacing={4} padding={{ horizontal: 10, vertical: 5 }} background={color} cornerRadius="capsule">
      {systemImage ? <Image systemName={systemImage} font="caption" foregroundStyle={foreground ?? "secondaryLabel"} /> : null}
      <Text font="subheadline" fontWeight="medium" foregroundStyle={foreground ?? "label"} lineLimit={1}>{title}</Text>
    </HStack>
  );
  if (!onPress) return body;
  return (
    <Button buttonStyle="plain" pressedScale={0.95} onPress={onPress} accessibilityLabel={title}>
      {body}
    </Button>
  );
}

/** Square-ish photo card that opens the recipe. Long-press to favorite. */
export function RecipeCard({ recipe, subtitle }: { recipe: RecipeSummary; subtitle?: string }) {
  const nav = useNavigation();
  const favorite = useIsFavorite(recipe.id);
  const toggleFavorite = useRecipes((s) => s.toggleFavorite);
  const detail = subtitle ?? [recipe.category, recipe.area].filter(Boolean).join(" · ");

  return (
    <Button
      buttonStyle="plain"
      pressedScale={0.97}
      onPress={() => nav.push(<RecipeScreen id={recipe.id} preview={recipe} />)}
      accessibilityIdentifier="recipe-card"
      accessibilityLabel={`${recipe.name}${detail ? `, ${detail}` : ""}${favorite ? ", favorite" : ""}`}
    >
      <VStack alignment="leading" spacing={6} frame={{ maxWidth: "infinity", alignment: "topLeading" }}>
        <Image src={thumbSize(recipe.thumb, "medium")} contentMode="fill" frame={{ maxWidth: "infinity", height: 130 }} cornerRadius={14}>
          {/* Always mounted: adding or removing an Overlay later would rebuild the image. */}
          <Overlay alignment="topTrailing" padding={6}>
            <Image
              systemName="heart.fill"
              font="footnote"
              foregroundStyle="white"
              padding={7}
              background="pink"
              cornerRadius="capsule"
              opacity={favorite ? 1 : 0}
              scale={favorite ? 1 : 0.5}
              animation="bouncy"
              accessibilityHidden
            />
          </Overlay>
        </Image>
        <Text font="subheadline" fontWeight="semibold" lineLimit={2} frame={{ maxWidth: "infinity", alignment: "leading" }}>
          {recipe.name}
        </Text>
        {detail ? <Text font="caption" foregroundStyle="secondary" lineLimit={1}>{detail}</Text> : null}
      </VStack>
      <ContextMenu>
        <Button onPress={() => toggleFavorite(recipe)}>
          <Label title={favorite ? "Remove from Favorites" : "Add to Favorites"} systemImage={favorite ? "heart.slash" : "heart"} />
        </Button>
      </ContextMenu>
    </Button>
  );
}

/** Explains what's missing without the native backend (the app still works). */
export function NativeNotice({ items, dark }: { items: string[]; dark?: boolean }) {
  if (!items.length) return null;
  return (
    <HStack alignment="top" spacing={10} padding={12} background={dark ? "white/10" : "orange/12"} cornerRadius={12} accessibilityElement="combine" accessibilityIdentifier="native-off">
      <Image systemName="cpu" foregroundStyle={ACCENT} />
      <VStack alignment="leading" spacing={2}>
        <Text font="subheadline" fontWeight="semibold">Running without native APIs</Text>
        <Text font="footnote" foregroundStyle="secondary">{items.join(" ")}</Text>
      </VStack>
    </HStack>
  );
}
