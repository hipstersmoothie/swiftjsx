// Product detail: an image pager, price and discount, stars, stock, variants
// (made-up sizes and colors), a quantity stepper, and an "Add to Cart" bar
// with a fly-to-cart animation, a bounce and a haptic.
import { useRef, useState, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  withAnimation,
  haptic,
  Screen,
  ToolbarItem,
  ScrollView,
  SafeAreaInset,
  Overlay,
  VStack,
  HStack,
  ZStack,
  Text,
  Image,
  Button,
  Spacer,
  Divider,
  Stepper,
  Flow,
  Circle,
  Label,
  Chip,
  Pager,
  toast,
  type HostInstance,
  type Frame,
} from "swiftjsx";
import { hasDiscount, productQuery, relatedQuery, salePrice, stockLevel, type Product, type Review } from "./api";
import { money, plural, titleCase, toCents, variantSurcharge, variantsFor } from "./format";
import { MAX_PER_LINE, useShop } from "./store";
import { formatDistanceToNow } from "date-fns";
import { ACCENT, CartButton, DiscountBadge, HeartButton, PriceTag, ProductCard, RatingStars, StockBadge } from "./ui";

const FLYER = 88;

type Flight = { from: { x: number; y: number }; to: { x: number; y: number }; launched: boolean; image: string };

export function ProductScreen({ product: initial }: { product: Product }) {
  // The grid's copy is complete; this refreshes it in the background.
  const { data: product = initial } = useQuery({ ...productQuery(initial.id), initialData: initial, staleTime: 60_000 });
  const add = useShop((s) => s.add);
  const inCart = useShop((s) => s.lines.filter((l) => l.productId === initial.id).reduce((n, l) => n + l.quantity, 0));

  const variants = variantsFor(product);
  const [size, setSize] = useState<string | null>(null);
  const [color, setColor] = useState(variants.colors[0]?.name ?? null);
  const [quantity, setQuantity] = useState(1);
  const [page, setPage] = useState(0);
  const [sizeMissing, setSizeMissing] = useState(false);
  const [shakes, setShakes] = useState(0);
  const [added, setAdded] = useState(0);
  const [flight, setFlight] = useState<Flight | null>(null);
  const [expanded, setExpanded] = useState(false);

  const root = useRef<HostInstance>(null);
  const gallery = useRef<HostInstance>(null);
  const cartIcon = useRef<HostInstance>(null);

  const stock = stockLevel(product.stock);
  const maxQuantity = Math.max(1, Math.min(MAX_PER_LINE, product.stock));
  const unit = salePrice(product) + variantSurcharge(size ?? undefined);
  const needsSize = variants.sizes.length > 0 && size === null;
  const images = product.images.length ? product.images : [product.thumbnail];

  const landed = () => {
    setAdded((n) => n + 1);
    haptic("success");
    toast("Added to Cart", { systemImage: "checkmark.circle.fill", tint: "green" });
  };

  const flyToCart = async () => {
    const [frame, from, to] = await Promise.all([root.current?.measure(), gallery.current?.measure(), cartIcon.current?.measure()]);
    if (!frame || !from) return landed();
    // The toolbar icon, or (if it can't be measured) the top-trailing corner.
    const target = to && to.width > 0 ? center(to) : { x: frame.x + frame.width - 28, y: frame.y - 22 };
    const start = center(from);
    setFlight({
      image: images[page] ?? product.thumbnail,
      from: { x: start.x - frame.x - FLYER / 2, y: start.y - frame.y - FLYER / 2 },
      to: { x: target.x - frame.x - FLYER / 2, y: target.y - frame.y - FLYER / 2 },
      launched: false,
    });
  };
  // Once the thumbnail is up at the start, it flies; it lands when the animation ends.
  const launch = () =>
    withAnimation(
      { type: "easeIn", duration: 0.55 },
      () => setFlight((f) => (f ? { ...f, launched: true } : f)),
      () => {
        setFlight(null);
        landed();
      },
    );

  const addToCart = () => {
    if (needsSize) {
      haptic("error");
      setSizeMissing(true);
      setShakes((n) => n + 1);
      return;
    }
    haptic("medium");
    add(product, { quantity, size: size ?? undefined, color: color ?? undefined });
    void flyToCart();
  };

  return (
    <Screen title={product.title} titleDisplayMode="inline">
      <ToolbarItem placement="primaryAction">
        <CartButton buttonRef={cartIcon} bounce={added} />
      </ToolbarItem>

      <VStack ref={root} spacing={0} frame={{ maxWidth: "infinity", maxHeight: "infinity" }}>
        <ScrollView>
          <VStack alignment="leading" spacing={18} padding={{ bottom: 24 }}>
            <ZStack alignment="bottom" ref={gallery}>
              <Pager
                onPageChange={setPage}
                // The dots would vanish on these light photo backgrounds: "1 / 3" on a dark pill.
                indicator="counter"
                indicatorAlignment="bottomTrailing"
                frame={{ height: 340 }}
                background={{ light: "#f4f4f6", dark: "#1f1f23" }}
              >
                {images.map((src, i) => (
                  <Image
                    key={src}
                    src={src}
                    contentMode="fit"
                    padding={{ horizontal: 24, top: 16, bottom: 44 }}
                    frame={{ maxWidth: "infinity", height: 340 }}
                    accessibilityLabel={`${product.title}, photo ${i + 1} of ${images.length}`}
                    onDoubleTap={() => {
                      if (!useShop.getState().wishlist.some((p) => p.id === product.id)) {
                        haptic("success");
                        useShop.getState().toggleWishlist(product);
                      }
                    }}
                  />
                ))}
              </Pager>
              <Overlay alignment="topTrailing" padding={14}>
                <HeartButton product={product} size={18} />
              </Overlay>
              {hasDiscount(product) ? (
                <Overlay alignment="topLeading" padding={14}>
                  <DiscountBadge percent={product.discountPercentage} large />
                </Overlay>
              ) : null}
            </ZStack>

            <VStack alignment="leading" spacing={8} padding={{ horizontal: 20 }}>
              <HStack>
                <Text font="footnote" fontWeight="semibold" foregroundStyle={ACCENT} textCase="uppercase" kerning={0.6}>
                  {product.brand ?? titleCase(product.category)}
                </Text>
                <Spacer />
                <StockBadge stock={product.stock} />
              </HStack>
              <Text font="title2" fontWeight="bold" accessibilityIdentifier="product-title" accessibilityTraits="header">
                {product.title}
              </Text>
              <RatingStars rating={product.rating} size={14} count={product.reviews.length} />
              <HStack alignment="firstTextBaseline" spacing={10} padding={{ top: 4 }}>
                <PriceTag product={product} size="large" />
                {hasDiscount(product) ? (
                  <Text font="subheadline" fontWeight="semibold" foregroundStyle="green">
                    Save {money(toCents(product.price) - salePrice(product))}
                  </Text>
                ) : null}
              </HStack>
            </VStack>

            {variants.colors.length ? (
              <Block title="Color" value={color ?? undefined}>
                <HStack spacing={14}>
                  {variants.colors.map((c) => (
                    <Button
                      key={c.name}
                      buttonStyle="plain"
                      onPress={() => {
                        haptic("selection");
                        withAnimation("snappy", () => setColor(c.name));
                      }}
                      accessibilityLabel={c.name}
                      accessibilityTraits={color === c.name ? ["button", "selected"] : "button"}
                    >
                      <Circle fill={c.swatch} frame={{ width: 34, height: 34 }} padding={4} shadow={{ radius: 1, y: 1, color: "#00000033" }}>
                        <Overlay>
                          <Circle stroke={color === c.name ? ACCENT : "clear"} lineWidth={2.5} frame={{ width: 42, height: 42 }} />
                        </Overlay>
                      </Circle>
                    </Button>
                  ))}
                </HStack>
              </Block>
            ) : null}

            {variants.sizes.length ? (
              <Block
                title={variants.sizeLabel}
                value={size ?? undefined}
                error={sizeMissing && needsSize ? `Choose a ${variants.sizeLabel.toLowerCase()}` : undefined}
              >
                <Flow
                  spacing={8}
                  keyframes={{ trigger: shakes, steps: [{ x: -10, duration: 0.06 }, { x: 10, duration: 0.06 }, { x: -6, duration: 0.06 }, { x: 6, duration: 0.06 }, { x: 0 }] }}
                >
                  {variants.sizes.map((s) => (
                    <Chip
                      key={s}
                      label={variantSurcharge(s) ? `${s} · +${money(variantSurcharge(s))}` : s}
                      selected={size === s}
                      tint={ACCENT}
                      pressedScale={0.94}
                      animation="snappy"
                      accessibilityIdentifier="size-chip"
                      onPress={() => {
                        haptic("selection");
                        setSize(s);
                      }}
                    />
                  ))}
                </Flow>
              </Block>
            ) : null}

            <VStack padding={{ horizontal: 20 }}>
              <Stepper
                value={quantity}
                onChange={(q) => {
                  haptic("selection");
                  setQuantity(q);
                }}
                min={1}
                max={maxQuantity}
                disabled={!stock.available}
                accessibilityIdentifier="quantity-stepper"
              >
                <HStack spacing={6}>
                  <Text font="headline">Quantity</Text>
                  <Text font="headline" foregroundStyle={ACCENT} monospacedDigit contentTransition="numericText" animation="snappy">
                    {quantity}
                  </Text>
                  {inCart ? (
                    <Text font="caption" foregroundStyle="secondaryLabel">
                      · {inCart} in cart
                    </Text>
                  ) : null}
                </HStack>
              </Stepper>
            </VStack>

            <Divider padding={{ horizontal: 20 }} />

            <VStack alignment="leading" spacing={8} padding={{ horizontal: 20 }}>
              <Text font="headline">About this item</Text>
              <Text font="callout" foregroundStyle="secondaryLabel" lineLimit={expanded ? undefined : 3} animation="smooth">
                {product.description}
              </Text>
              {product.description.length > 140 ? (
                <Button
                  title={expanded ? "Show less" : "Read more"}
                  font="footnote"
                  fontWeight="semibold"
                  tint={ACCENT}
                  onPress={() => withAnimation("smooth", () => setExpanded((e) => !e))}
                />
              ) : null}
            </VStack>

            <VStack alignment="leading" spacing={10} padding={{ horizontal: 20 }}>
              {product.shippingInformation ? <InfoRow icon="shippingbox" text={product.shippingInformation} /> : null}
              {product.warrantyInformation ? <InfoRow icon="checkmark.shield" text={product.warrantyInformation} /> : null}
              {product.returnPolicy ? <InfoRow icon="arrow.uturn.left" text={product.returnPolicy} /> : null}
            </VStack>

            {product.reviews.length ? <Reviews reviews={product.reviews} rating={product.rating} /> : null}

            <Related product={product} />
          </VStack>

          <SafeAreaInset edge="bottom">
            <AddBar total={unit * quantity} quantity={quantity} available={stock.available} needsSize={needsSize} added={added} onAdd={addToCart} />
          </SafeAreaInset>
        </ScrollView>

        {/* The fly-to-cart thumbnail: above the scroll view, which would clip it. */}
        <Overlay alignment="topLeading" allowsHitTesting={false}>
          {flight ? (
            <Image
              src={flight.image}
              contentMode="fit"
              frame={{ width: FLYER, height: FLYER }}
              padding={6}
              background="systemBackground"
              cornerRadius={FLYER / 2}
              shadow={{ radius: 10, y: 4, color: "#00000040" }}
              offset={flight.launched ? flight.to : flight.from}
              scale={flight.launched ? 0.18 : 1}
              opacity={flight.launched ? 0.4 : 1}
              onAppear={launch}
              accessibilityHidden
            />
          ) : null}
        </Overlay>
      </VStack>
    </Screen>
  );
}

const center = (f: Frame) => ({ x: f.x + f.width / 2, y: f.y + f.height / 2 });

function AddBar({
  total,
  quantity,
  available,
  needsSize,
  added,
  onAdd,
}: {
  total: number;
  quantity: number;
  available: boolean;
  needsSize: boolean;
  added: number;
  onAdd(): void;
}) {
  return (
    <HStack spacing={14} padding={{ horizontal: 20, top: 12, bottom: 8 }} background="bar">
      <VStack alignment="leading" spacing={1}>
        <Text font="caption" foregroundStyle="secondaryLabel">
          {quantity > 1 ? `Total for ${quantity}` : "Total"}
        </Text>
        <Text font={{ size: 20, weight: "bold", design: "rounded" }} monospacedDigit contentTransition="numericText" animation="snappy">
          {money(total)}
        </Text>
      </VStack>
      <Spacer />
      <Button
        onPress={onAdd}
        disabled={!available}
        pressedScale={0.95}
        accessibilityIdentifier="add-to-cart"
        accessibilityLabel={!available ? "Out of stock" : needsSize ? "Add to cart, choose a size first" : "Add to cart"}
      >
        <HStack
          spacing={8}
          padding={{ horizontal: 22, vertical: 14 }}
          background={!available ? "systemGray3" : { gradient: ["#5e5ce6", "#7d3cff"], start: "leading", end: "trailing" }}
          cornerRadius="capsule"
          shadow={available ? { radius: 8, y: 4, color: "#5e5ce655" } : undefined}
          keyframes={{ trigger: added, steps: [{ scale: 1.06, duration: 0.12 }, { scale: 1 }] }}
        >
          <Image
            systemName="bag.badge.plus"
            fontWeight="semibold"
            foregroundStyle="white"
            symbolEffect={{ type: "bounce", value: added }}
          />
          <Text font="headline" foregroundStyle="white">
            {!available ? "Sold Out" : "Add to Cart"}
          </Text>
        </HStack>
      </Button>
    </HStack>
  );
}

function Block({ title, value, error, children }: { title: string; value?: string; error?: string; children: ReactNode }) {
  return (
    <VStack alignment="leading" spacing={10} padding={{ horizontal: 20 }} animation="snappy">
      <HStack spacing={6}>
        <Text font="headline">{title}</Text>
        {value ? (
          <Text font="subheadline" foregroundStyle="secondaryLabel">
            {value}
          </Text>
        ) : null}
        <Spacer />
        {error ? <Label title={error} systemImage="exclamationmark.circle.fill" font="footnote" foregroundStyle="red" transition="opacity" /> : null}
      </HStack>
      {children}
    </VStack>
  );
}

function InfoRow({ icon, text }: { icon: string; text: string }) {
  return (
    <HStack spacing={12} accessibilityElement="combine">
      <Image systemName={icon} font="body" foregroundStyle={ACCENT} frame={{ width: 26 }} />
      <Text font="subheadline">{text}</Text>
      <Spacer />
    </HStack>
  );
}

function Reviews({ reviews, rating }: { reviews: Review[]; rating: number }) {
  return (
    <VStack alignment="leading" spacing={12} padding={{ horizontal: 20 }}>
      <HStack alignment="firstTextBaseline">
        <Text font="headline">Reviews</Text>
        <Spacer />
        <Text font="subheadline" foregroundStyle="secondaryLabel">
          {rating.toFixed(1)} · {plural(reviews.length, "review")}
        </Text>
      </HStack>
      {reviews.map((review, i) => (
        <VStack
          key={i}
          alignment="leading"
          spacing={6}
          padding={14}
          frame={{ maxWidth: "infinity", alignment: "leading" }}
          background="secondarySystemBackground"
          cornerRadius={14}
          accessibilityElement="combine"
        >
          <HStack>
            <RatingStars rating={review.rating} size={11} />
            <Spacer />
            <Text font="caption" foregroundStyle="tertiaryLabel">
              {timeAgo(review.date)}
            </Text>
          </HStack>
          <Text font="subheadline">{review.comment}</Text>
          <Text font="caption" foregroundStyle="secondaryLabel">
            {review.reviewerName}
          </Text>
        </VStack>
      ))}
    </VStack>
  );
}

const timeAgo = (iso: string) => {
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? "" : formatDistanceToNow(date, { addSuffix: true });
};

/** More from the same category, in a horizontal row. */
function Related({ product }: { product: Product }) {
  const { data } = useQuery(relatedQuery(product.category));
  const others = (data ?? []).filter((p) => p.id !== product.id).slice(0, 8);
  if (!others.length) return null;
  return (
    <VStack alignment="leading" spacing={10}>
      <Text font="headline" padding={{ horizontal: 20 }}>
        More in {titleCase(product.category)}
      </Text>
      <ScrollView axis="horizontal" showsIndicators={false} spacing={14} contentMargins={{ horizontal: 20 }}>
        {others.map((p) => (
          <ProductCard key={p.id} product={p} width={150} />
        ))}
      </ScrollView>
    </VStack>
  );
}
