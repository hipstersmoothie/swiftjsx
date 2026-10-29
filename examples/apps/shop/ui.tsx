// Building blocks shared by the screens: price tags, stars, badges, the heart
// button, product cards and the cart button with its badge.
import { createContext, useContext, type ReactNode, type Ref } from "react";
import {
  useNavigation,
  haptic,
  VStack,
  HStack,
  Text,
  Image,
  Button,
  ProgressView,
  Overlay,
  ContextMenu,
  Label,
  LazyVGrid,
  LabeledContent,
  LabeledContentLabel,
  RoundedRectangle,
  ContentUnavailable,
  Badge,
  type Color,
  type HostInstance,
} from "swiftjsx";
import { hasDiscount, salePrice, stockLevel, type Product } from "./api";
import { formatPercent, money, toCents } from "./format";
import { useCartCount, useIsWishlisted, useShop, type Order } from "./store";
// (ProductScreen imports this file too; the cycle is fine, nothing runs at import time.)
import { ProductScreen } from "./ProductScreen";

export const ACCENT: Color = "indigo";

// MARK: App-wide navigation (tabs and the order confirmation)

export type TabId = "home" | "wishlist" | "cart" | "search";
export type ShopRouter = {
  tab: TabId;
  setTab(tab: TabId): void;
  /** The full-screen "order placed" cover, above the tabs. */
  showConfirmation(order: Order): void;
};
export const RouterContext = createContext<ShopRouter>({ tab: "home", setTab: () => {}, showConfirmation: () => {} });
export const useRouter = () => useContext(RouterContext);

// MARK: Prices and ratings

export function PriceTag({ product, size = "body" }: { product: Product; size?: "body" | "large" }) {
  const sale = salePrice(product);
  const discounted = hasDiscount(product);
  const large = size === "large";
  return (
    <HStack spacing={6} alignment="firstTextBaseline" accessibilityElement="combine">
      <Text font={large ? { size: 28, weight: "bold", design: "rounded" } : "headline"} monospacedDigit>
        {money(sale)}
      </Text>
      {discounted ? (
        <Text
          font={large ? "body" : "caption"}
          foregroundStyle="secondaryLabel"
          strikethrough
          accessibilityLabel={`was ${money(toCents(product.price))}`}
        >
          {money(toCents(product.price))}
        </Text>
      ) : null}
    </HStack>
  );
}

export function DiscountBadge({ percent, large }: { percent: number; large?: boolean }) {
  return (
    <Text
      font={large ? "subheadline" : "caption2"}
      fontWeight="bold"
      foregroundStyle="white"
      padding={{ horizontal: large ? 10 : 6, vertical: large ? 4 : 2 }}
      background={{ gradient: ["#ff375f", "#ff9f0a"], start: "leading", end: "trailing" }}
      cornerRadius="capsule"
      accessibilityLabel={`${formatPercent(percent)} off`}
    >
      −{formatPercent(percent)}
    </Text>
  );
}

/** Five stars, with halves: 3.6 → ★★★½☆. */
export function RatingStars({ rating, size = 12, count }: { rating: number; size?: number; count?: number }) {
  const stars = [0, 1, 2, 3, 4].map((i) => {
    const fill = rating - i;
    return fill >= 0.75 ? "star.fill" : fill >= 0.25 ? "star.leadinghalf.filled" : "star";
  });
  return (
    <HStack
      spacing={2}
      accessibilityElement="ignore"
      accessibilityLabel={`Rated ${rating.toFixed(1)} out of 5${count != null ? `, ${count} reviews` : ""}`}
    >
      {stars.map((name, i) => (
        <Image key={i} systemName={name} font={{ size }} foregroundStyle="orange" />
      ))}
      <Text font={{ size: size + 1 }} foregroundStyle="secondaryLabel" monospacedDigit padding={{ leading: 3 }}>
        {rating.toFixed(1)}
        {count != null ? ` (${count})` : ""}
      </Text>
    </HStack>
  );
}

export function StockBadge({ stock }: { stock: number }) {
  const level = stockLevel(stock);
  return (
    <HStack
      spacing={4}
      padding={{ horizontal: 8, vertical: 4 }}
      background={`${level.color}/15` as Color}
      cornerRadius="capsule"
      accessibilityElement="combine"
    >
      <Image systemName={level.icon} font="caption" foregroundStyle={level.color} />
      <Text font="caption" fontWeight="semibold" foregroundStyle={level.color}>
        {level.label}
      </Text>
    </HStack>
  );
}

// MARK: Wishlist heart

export function HeartButton({ product, size = 15, onMaterial = true }: { product: Product; size?: number; onMaterial?: boolean }) {
  const wishlisted = useIsWishlisted(product.id);
  const toggle = useShop((s) => s.toggleWishlist);
  return (
    <Button
      buttonStyle="plain"
      onPress={() => {
        haptic(wishlisted ? "light" : "success");
        toggle(product);
      }}
      accessibilityLabel={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
      accessibilityIdentifier="wishlist-toggle"
      accessibilityValue={wishlisted ? "on" : "off"}
    >
      <Image
        systemName={wishlisted ? "heart.fill" : "heart"}
        font={{ size, weight: "semibold" }}
        foregroundStyle={wishlisted ? "pink" : "label"}
        symbolEffect={{ type: "bounce", value: wishlisted }}
        contentShape="circle"
        frame={{ width: size * 2.2, height: size * 2.2 }}
        background={onMaterial ? "thinMaterial" : undefined}
        cornerRadius="capsule"
      />
    </Button>
  );
}

// MARK: Product cards

export function ProductCard({ product, onAppear, width }: { product: Product; onAppear?(): void; width?: number }) {
  const nav = useNavigation();
  const wishlisted = useIsWishlisted(product.id);
  const toggleWishlist = useShop((s) => s.toggleWishlist);
  const open = () => nav.push(<ProductScreen product={product} />);

  return (
    <Button
      onPress={open}
      pressedScale={0.97}
      onAppear={onAppear}
      accessibilityIdentifier="product-card"
      accessibilityLabel={`${product.title}, ${money(salePrice(product))}`}
      accessibilityHint="Opens the product"
      frame={width ? { width } : undefined}
    >
      <VStack alignment="leading" spacing={8}>
        <Image
          src={product.thumbnail}
          contentMode="fit"
          aspectRatio={1}
          frame={{ maxWidth: "infinity" }}
          padding={8}
          background={{ light: "#f4f4f6", dark: "#1f1f23" }}
          cornerRadius={16}
          accessibilityHidden
        >
          {/* While loading (and if it fails): a faint bag instead of a gray box. */}
          <Image systemName="bag" font={{ size: 34, weight: "light" }} foregroundStyle="quaternaryLabel" />
          <Overlay alignment="topTrailing" padding={6}>
            <HeartButton product={product} size={13} />
          </Overlay>
          {hasDiscount(product) ? (
            <Overlay alignment="topLeading" padding={8}>
              <DiscountBadge percent={product.discountPercentage} />
            </Overlay>
          ) : null}
        </Image>
        <VStack alignment="leading" spacing={3} padding={{ horizontal: 2 }}>
          {product.brand ? (
            <Text font="caption2" fontWeight="semibold" foregroundStyle="secondaryLabel" textCase="uppercase" lineLimit={1}>
              {product.brand}
            </Text>
          ) : null}
          <Text font="subheadline" fontWeight="medium" foregroundStyle="label" lineLimit={2} frame={{ maxWidth: "infinity", alignment: "leading" }}>
            {product.title}
          </Text>
          <RatingStars rating={product.rating} size={10} />
          <PriceTag product={product} />
        </VStack>
      </VStack>
      <ContextMenu>
        <Button onPress={open}>
          <Label title="View Details" systemImage="eye" />
        </Button>
        <Button onPress={() => toggleWishlist(product)}>
          <Label title={wishlisted ? "Remove from Wishlist" : "Add to Wishlist"} systemImage={wishlisted ? "heart.slash" : "heart"} />
        </Button>
      </ContextMenu>
    </Button>
  );
}

/** Two columns on iPhone, more on wider screens. */
export function ProductGrid({ products, onEndReached, footer }: { products: Product[]; onEndReached?(): void; footer?: ReactNode }) {
  return (
    <VStack spacing={0}>
      <LazyVGrid columns={{ minimum: 150 }} spacing={16} padding={{ horizontal: 16 }}>
        {products.map((product, i) => (
          <ProductCard key={product.id} product={product} onAppear={onEndReached && i >= products.length - 4 ? onEndReached : undefined} />
        ))}
      </LazyVGrid>
      {footer ? (
        <VStack padding={{ vertical: 20 }} frame={{ maxWidth: "infinity" }}>
          {footer}
        </VStack>
      ) : null}
    </VStack>
  );
}

// MARK: The cart button (toolbar), with a count badge

export function CartButton({ buttonRef, bounce }: { buttonRef?: Ref<HostInstance>; bounce?: number }) {
  const count = useCartCount();
  const router = useRouter();
  return (
    <Button
      onPress={() => router.setTab("cart")}
      accessibilityLabel="Cart"
      accessibilityValue={count ? `${count} items` : "empty"}
      accessibilityIdentifier="cart-button"
    >
      <Image
        ref={buttonRef}
        systemName="bag"
        fontWeight="medium"
        symbolEffect={{ type: "bounce", value: bounce ?? count }}
        padding={{ trailing: 6, top: 4 }}
      >
        {count ? (
          <Overlay alignment="topTrailing">
            <Badge value={count} animation="bouncy" accessibilityIdentifier="cart-badge" />
          </Overlay>
        ) : null}
      </Image>
    </Button>
  );
}

// MARK: States

export function Loading({ label }: { label?: string }) {
  return (
    <VStack spacing={12} padding={40} frame={{ maxWidth: "infinity" }}>
      <ProgressView />
      {label ? (
        <Text font="footnote" foregroundStyle="secondaryLabel">
          {label}
        </Text>
      ) : null}
    </VStack>
  );
}

export function ErrorState({ message, retry }: { message: string; retry(): void }) {
  return (
    <ContentUnavailable systemImage="wifi.exclamationmark" title="Couldn't load the store" description={message}>
      <Button title="Try Again" buttonStyle="borderedProminent" tint={ACCENT} onPress={retry} />
    </ContentUnavailable>
  );
}

/** "Title ……… value" (like LabeledContent). */
export function SummaryRow({
  title,
  value,
  emphasis,
  color,
  identifier,
}: {
  title: string;
  value: string;
  emphasis?: boolean;
  color?: Color;
  identifier?: string;
}) {
  return (
    <LabeledContent label={emphasis ? undefined : title} font="subheadline" accessibilityIdentifier={identifier}>
      {emphasis ? (
        <LabeledContentLabel>
          <Text font="headline">{title}</Text>
        </LabeledContentLabel>
      ) : null}
      <Text
        font={emphasis ? { size: 20, weight: "bold", design: "rounded" } : undefined}
        foregroundStyle={color ?? "label"}
        monospacedDigit
        animation="snappy"
      >
        {value}
      </Text>
    </LabeledContent>
  );
}

/** Gray placeholder cards (redacted) while the first page loads. */
export function SkeletonGrid({ count = 6 }: { count?: number }) {
  return (
    <LazyVGrid columns={{ minimum: 150 }} spacing={16} padding={{ horizontal: 16 }} redacted accessibilityLabel="Loading products">
      {Array.from({ length: count }, (_, i) => (
        <VStack key={i} alignment="leading" spacing={8}>
          <RoundedRectangle cornerRadius={16} fill="secondarySystemFill" aspectRatio={1} frame={{ maxWidth: "infinity" }} />
          <VStack alignment="leading" spacing={3} padding={{ horizontal: 2 }}>
            <Text font="caption2">Brand name</Text>
            <Text font="subheadline" lineLimit={2}>
              A product with a longer title
            </Text>
            <Text font="caption">★★★★★ 4.5</Text>
            <Text font="headline">$00.00</Text>
          </VStack>
        </VStack>
      ))}
    </LazyVGrid>
  );
}
