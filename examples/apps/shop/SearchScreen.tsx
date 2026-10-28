// Search: debounced queries against /products/search, results as rows, and
// suggestions (popular terms, categories) while the field is empty.
import { useEffect, useState } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useNavigation, Screen, List, Section, ScrollView, VStack, HStack, Text, Image, Button, Spacer, Flow, ProgressView, Divider } from "swiftjsx";
import { categoriesQuery, searchQuery, stockLevel, type Product } from "./api";
import { plural } from "./format";
import { ProductScreen } from "./ProductScreen";
import { CategoryScreen } from "./CategoryScreen";
import { ACCENT, EmptyState, ErrorState, HeartButton, PriceTag, RatingStars } from "./ui";

const popular = ["phone", "laptop", "watch", "perfume", "sunglasses", "shoes", "lipstick", "chair"];

/** `value`, once it has stopped changing for `ms`. */
function useDebounced<T>(value: T, ms: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), ms);
    return () => clearTimeout(timer);
  }, [value, ms]);
  return debounced;
}

export function SearchScreen() {
  const [text, setText] = useState("");
  const term = useDebounced(text.trim().toLowerCase(), 300);
  const typing = text.trim().toLowerCase() !== term;

  return (
    <Screen title="Search" searchText={text} onSearchTextChange={setText} searchPrompt="Products, brands and more">
      {text.trim() ? <Results term={term} typing={typing} /> : <Suggestions onPick={setText} />}
    </Screen>
  );
}

function Results({ term, typing }: { term: string; typing: boolean }) {
  // Keep showing the last results while the next ones load.
  const search = useQuery({ ...searchQuery(term), placeholderData: keepPreviousData });
  const nav = useNavigation();

  if (search.isError) return <ErrorState message={search.error.message} retry={() => search.refetch()} />;
  if (!search.data) {
    return (
      <VStack padding={40} frame={{ maxWidth: "infinity" }}>
        <ProgressView />
      </VStack>
    );
  }
  if (!search.data.products.length) {
    return <EmptyState icon="magnifyingglass" title={`No results for “${term}”`} message="Check the spelling or try a more general term." />;
  }

  return (
    <List listStyle="plain">
      <Section header={`${plural(search.data.total, "result")}${typing || search.isFetching ? "…" : ""}`}>
        {search.data.products.map((product) => (
          <ResultRow key={product.id} product={product} onPress={() => nav.push(<ProductScreen product={product} />)} />
        ))}
      </Section>
    </List>
  );
}

function ResultRow({ product, onPress }: { product: Product; onPress(): void }) {
  const stock = stockLevel(product.stock);
  return (
    <HStack spacing={12} padding={{ vertical: 4 }}>
      <Button buttonStyle="plain" onPress={onPress} accessibilityIdentifier="search-result" accessibilityLabel={product.title}>
        <HStack spacing={12}>
          <Image
            src={product.thumbnail}
            contentMode="fit"
            frame={{ width: 64, height: 64 }}
            padding={4}
            background={{ light: "#f4f4f6", dark: "#1f1f23" }}
            cornerRadius={12}
          />
          <VStack alignment="leading" spacing={3}>
            <Text font="subheadline" fontWeight="medium" lineLimit={2}>
              {product.title}
            </Text>
            <RatingStars rating={product.rating} size={10} />
            <HStack spacing={8}>
              <PriceTag product={product} />
              {!stock.available || product.stock < 10 ? (
                <Text font="caption2" fontWeight="semibold" foregroundStyle={stock.color}>
                  {stock.label}
                </Text>
              ) : null}
            </HStack>
          </VStack>
          <Spacer />
        </HStack>
      </Button>
      <HeartButton product={product} size={14} onMaterial={false} />
    </HStack>
  );
}

function Suggestions({ onPick }: { onPick(term: string): void }) {
  const categories = useQuery(categoriesQuery);
  const nav = useNavigation();
  return (
    <ScrollView>
      <VStack alignment="leading" spacing={14} padding={{ horizontal: 16, top: 8 }}>
        <Text font="headline">Popular searches</Text>
        <Flow spacing={8}>
          {popular.map((term) => (
            <Button key={term} onPress={() => onPick(term)} pressedScale={0.94} accessibilityIdentifier="popular-search">
              <HStack spacing={5} padding={{ horizontal: 12, vertical: 7 }} background="secondarySystemFill" cornerRadius="capsule">
                <Image systemName="arrow.up.right" font="caption2" foregroundStyle="secondaryLabel" />
                <Text font="subheadline" foregroundStyle="label">
                  {term}
                </Text>
              </HStack>
            </Button>
          ))}
        </Flow>
        <Text font="headline" padding={{ top: 10 }}>
          Browse categories
        </Text>
        <VStack spacing={0} background="secondarySystemGroupedBackground" cornerRadius={14}>
          {(categories.data ?? []).map((c, i) => (
            <VStack key={c.slug} spacing={0}>
              <Button buttonStyle="plain" onPress={() => nav.push(<CategoryScreen slug={c.slug} name={c.name} />)} pressedBackground="systemFill">
                <HStack padding={{ horizontal: 14, vertical: 12 }} contentShape="rectangle">
                  <Image systemName={categoryIcon(c.slug)} foregroundStyle={ACCENT} frame={{ width: 26 }} />
                  <Text foregroundStyle="label">{c.name}</Text>
                  <Spacer />
                  <Image systemName="chevron.right" font="footnote" fontWeight="semibold" foregroundStyle="tertiaryLabel" />
                </HStack>
              </Button>
              {i < (categories.data?.length ?? 0) - 1 ? (
                <HStack spacing={0} padding={{ leading: 54 }}>
                  <Divider />
                </HStack>
              ) : null}
            </VStack>
          ))}
        </VStack>
      </VStack>
    </ScrollView>
  );
}

const icons: Record<string, string> = {
  beauty: "sparkles",
  fragrances: "drop",
  furniture: "sofa",
  groceries: "cart",
  "home-decoration": "lamp.table",
  "kitchen-accessories": "fork.knife",
  laptops: "laptopcomputer",
  "mens-shirts": "tshirt",
  "mens-shoes": "shoe",
  "mens-watches": "applewatch",
  "mobile-accessories": "cable.connector",
  motorcycle: "bicycle",
  "skin-care": "hands.sparkles",
  smartphones: "iphone",
  "sports-accessories": "sportscourt",
  sunglasses: "sunglasses",
  tablets: "ipad",
  tops: "tshirt",
  vehicle: "car",
  "womens-bags": "handbag",
  "womens-dresses": "figure.stand.dress",
  "womens-jewellery": "sparkle",
  "womens-shoes": "shoe.2",
  "womens-watches": "watch.analog",
};

export const categoryIcon = (slug: string) => icons[slug] ?? "tag";
