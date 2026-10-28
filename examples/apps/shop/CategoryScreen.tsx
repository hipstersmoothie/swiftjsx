// One category (pushed from Search), with a sort menu.
import { useState } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { Screen, ToolbarItem, ScrollView, Menu, Picker, ProgressView, Text } from "swiftjsx";
import { productsQuery, salePrice, type Product } from "./api";
import { plural } from "./format";
import { CartButton, ErrorState, Loading, ProductGrid } from "./ui";

type Sort = "featured" | "price-asc" | "price-desc" | "rating" | "discount";

const sorts: { value: Sort; label: string; systemImage: string }[] = [
  { value: "featured", label: "Featured", systemImage: "star" },
  { value: "price-asc", label: "Price: Low to High", systemImage: "arrow.up" },
  { value: "price-desc", label: "Price: High to Low", systemImage: "arrow.down" },
  { value: "rating", label: "Top Rated", systemImage: "hand.thumbsup" },
  { value: "discount", label: "Biggest Discount", systemImage: "percent" },
];

const compare: Record<Sort, ((a: Product, b: Product) => number) | null> = {
  featured: null,
  "price-asc": (a, b) => salePrice(a) - salePrice(b),
  "price-desc": (a, b) => salePrice(b) - salePrice(a),
  rating: (a, b) => b.rating - a.rating,
  discount: (a, b) => b.discountPercentage - a.discountPercentage,
};

export function CategoryScreen({ slug, name }: { slug: string; name: string }) {
  const query = useInfiniteQuery(productsQuery(slug));
  const [sort, setSort] = useState<Sort>("featured");

  const products = query.data?.pages.flatMap((p) => p.products) ?? [];
  const by = compare[sort];
  const sorted = by ? [...products].sort(by) : products;

  return (
    <Screen title={name} titleDisplayMode="inline">
      <ToolbarItem placement="primaryAction">
        <Menu systemImage="arrow.up.arrow.down" accessibilityLabel="Sort">
          <Picker label="Sort by" value={sort} onChange={(v) => setSort(v as Sort)} options={sorts} />
        </Menu>
      </ToolbarItem>
      <ToolbarItem placement="primaryAction">
        <CartButton />
      </ToolbarItem>
      {query.isPending ? (
        <Loading label={`Loading ${name.toLowerCase()}…`} />
      ) : query.isLoadingError ? (
        <ErrorState message={query.error.message} retry={() => query.refetch()} />
      ) : (
        <ScrollView padding={{ top: 8 }}>
          <ProductGrid
            products={sorted}
            onEndReached={() => query.hasNextPage && !query.isFetchingNextPage && query.fetchNextPage()}
            footer={
              query.hasNextPage ? (
                <ProgressView />
              ) : (
                <Text font="footnote" foregroundStyle="secondaryLabel">
                  {plural(products.length, "product")}
                </Text>
              )
            }
          />
        </ScrollView>
      )}
    </Screen>
  );
}
