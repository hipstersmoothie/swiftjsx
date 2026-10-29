// Home: category chips, a paging carousel of the best deals, and an
// infinitely loading product grid (all products, or one category's).
import { useRef, useState } from "react";
import { useInfiniteQuery, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  withAnimation,
  haptic,
  useNavigation,
  Screen,
  ToolbarItem,
  ScrollView,
  VStack,
  HStack,
  ZStack,
  Text,
  Image,
  Button,
  Spacer,
  RoundedRectangle,
  ProgressView,
  Chip,
  Pager,
  PageIndicator,
  type HostInstance,
} from "swiftjsx";
import { categoriesQuery, featuredQuery, productsQuery, salePrice, type Product } from "./api";
import { formatPercent, money, plural, toCents } from "./format";
import { ProductScreen } from "./ProductScreen";
import { ACCENT, CartButton, ErrorState, ProductGrid, SkeletonGrid } from "./ui";

export function HomeScreen() {
  const [category, setCategory] = useState<string | null>(null);
  const client = useQueryClient();
  const categories = useQuery(categoriesQuery);
  const name = category ? (categories.data?.find((c) => c.slug === category)?.name ?? category) : "All Products";

  return (
    <Screen title="Shop">
      <ToolbarItem placement="primaryAction">
        <CartButton />
      </ToolbarItem>
      <ScrollView
        spacing={20}
        onRefresh={() => client.refetchQueries({ queryKey: ["products"] }).then(() => client.refetchQueries({ queryKey: ["featured"] }))}
      >
        <CategoryChips selected={category} onSelect={(slug) => withAnimation("snappy", () => setCategory(slug))} />
        {category === null ? <Featured /> : null}
        <HStack padding={{ horizontal: 16 }} alignment="firstTextBaseline">
          <Text font="title2" fontWeight="bold" accessibilityTraits="header">
            {name}
          </Text>
          <Spacer />
        </HStack>
        {/* Keyed: a new category starts with its own pages. */}
        <Catalog key={category ?? "all"} category={category} />
      </ScrollView>
    </Screen>
  );
}

function CategoryChips({ selected, onSelect }: { selected: string | null; onSelect(slug: string | null): void }) {
  const { data } = useQuery(categoriesQuery);
  const scroller = useRef<HostInstance>(null);
  const chips = useRef(new Map<string, HostInstance>());

  const select = (slug: string | null) => {
    haptic("selection");
    onSelect(slug);
    const chip = chips.current.get(slug ?? "all");
    if (chip) scroller.current?.scrollTo(chip, { anchor: "center" });
  };

  const options = [{ slug: null as string | null, name: "All" }, ...(data ?? [])];
  return (
    <ScrollView ref={scroller} axis="horizontal" showsIndicators={false} spacing={8} contentMargins={{ horizontal: 16 }}>
      {options.map((c) => (
        // Wrapped for the ref: selecting a chip scrolls it to the middle.
        <HStack
          key={c.slug ?? "all"}
          ref={(instance) => {
            if (instance) chips.current.set(c.slug ?? "all", instance);
            else chips.current.delete(c.slug ?? "all");
          }}
        >
          <Chip
            label={c.name}
            selected={selected === c.slug}
            tint={ACCENT}
            pressedScale={0.94}
            animation="snappy"
            accessibilityIdentifier="category-chip"
            onPress={() => select(c.slug)}
          />
        </HStack>
      ))}
    </ScrollView>
  );
}

// MARK: Featured carousel

const CAROUSEL_HEIGHT = 190;
/** Seconds per deal (paused while the user drags). */
const AUTO_ADVANCE = 4.5;

function Featured() {
  const { data } = useQuery(featuredQuery);
  const nav = useNavigation();
  const [page, setPage] = useState(0);

  if (!data) {
    return (
      <VStack padding={{ horizontal: 16 }}>
        <RoundedRectangle cornerRadius={22} fill="secondarySystemFill" frame={{ height: CAROUSEL_HEIGHT }} />
      </VStack>
    );
  }

  return (
    <VStack spacing={10}>
      <Pager
        onPageChange={setPage}
        autoAdvance={AUTO_ADVANCE}
        // The dots go under the cards, not over them.
        indicator="none"
        frame={{ height: CAROUSEL_HEIGHT }}
        accessibilityElement="contain"
        accessibilityIdentifier="featured-carousel"
      >
        {data.map((product) => (
          <VStack key={product.id} frame={{ height: CAROUSEL_HEIGHT }} padding={{ horizontal: 16 }}>
            <FeaturedCard product={product} onPress={() => nav.push(<ProductScreen product={product} />)} />
          </VStack>
        ))}
      </Pager>
      <PageIndicator style="capsule" count={data.length} page={page} tint={ACCENT} inactive="systemGray4" accessibilityLabel={`Deal ${page + 1} of ${data.length}`} />
    </VStack>
  );
}

const gradients = [
  ["#5e5ce6", "#bf5af2"],
  ["#ff375f", "#ff9f0a"],
  ["#0a84ff", "#64d2ff"],
  ["#30d158", "#66d4cf"],
  ["#ff9f0a", "#ffd60a"],
  ["#bf5af2", "#ff375f"],
] as const;

function FeaturedCard({ product, onPress }: { product: Product; onPress(): void }) {
  const colors = gradients[product.id % gradients.length];
  return (
    <Button
      onPress={onPress}
      pressedScale={0.98}
      accessibilityLabel={`Deal: ${product.title}, ${formatPercent(product.discountPercentage)} off`}
      accessibilityIdentifier="featured-card"
    >
      <HStack
        spacing={8}
        padding={{ leading: 20, trailing: 8, vertical: 16 }}
        frame={{ maxWidth: "infinity", maxHeight: "infinity" }}
        background={{ gradient: [colors[0], colors[1]], start: "topLeading", end: "bottomTrailing" }}
        cornerRadius={22}
        shadow={{ radius: 10, y: 6, color: "#00000026" }}
      >
        <VStack alignment="leading" spacing={6}>
          <Text font="caption" fontWeight="bold" foregroundStyle="white/80" textCase="uppercase" kerning={1}>
            Deal of the day
          </Text>
          <Text font={{ size: 34, weight: "heavy", design: "rounded" }} foregroundStyle="white">
            {formatPercent(product.discountPercentage)} off
          </Text>
          <Text font="headline" foregroundStyle="white" lineLimit={2}>
            {product.title}
          </Text>
          <Spacer minLength={0} />
          <HStack spacing={6}>
            <Text font="subheadline" fontWeight="bold" foregroundStyle="white" monospacedDigit>
              {money(salePrice(product))}
            </Text>
            <Text font="caption" foregroundStyle="white/70" strikethrough>
              {money(toCents(product.price))}
            </Text>
          </HStack>
        </VStack>
        <Spacer minLength={0} />
        <ZStack>
          <Image systemName="circle.fill" font={{ size: 130 }} foregroundStyle="white/20" />
          <Image src={product.thumbnail} contentMode="fit" frame={{ width: 130, height: 130 }} shadow={{ radius: 8, y: 6, color: "#00000040" }} />
        </ZStack>
      </HStack>
    </Button>
  );
}

// MARK: The grid

function Catalog({ category }: { category: string | null }) {
  const query = useInfiniteQuery(productsQuery(category));
  // Several cards near the end appear in one frame: ask once per length.
  const askedAt = useRef(-1);

  if (query.isPending) return <SkeletonGrid />;
  if (query.isLoadingError) return <ErrorState message={query.error.message} retry={() => query.refetch()} />;

  const products = query.data.pages.flatMap((p) => p.products);
  const total = query.data.pages[0]?.total ?? products.length;
  const loadMore = () => {
    if (!query.hasNextPage || query.isFetchingNextPage || askedAt.current === products.length) return;
    askedAt.current = products.length;
    void query.fetchNextPage();
  };

  const footer = query.isFetchNextPageError ? (
    <Button title="Couldn't load more. Try again" buttonStyle="bordered" onPress={() => query.fetchNextPage()} />
  ) : query.hasNextPage ? (
    <ProgressView />
  ) : (
    <Text font="footnote" foregroundStyle="secondaryLabel">
      {plural(total, "product")}
    </Text>
  );

  return <ProductGrid products={products} onEndReached={loadMore} footer={footer} />;
}
