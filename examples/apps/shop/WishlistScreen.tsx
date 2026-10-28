// The wishlist: swipe to remove, "Move to Cart" for products without
// variants to choose (the rest open the product page).
import {
  useNavigation,
  withAnimation,
  haptic,
  Screen,
  ToolbarItem,
  List,
  Section,
  HStack,
  VStack,
  Text,
  Image,
  Button,
  Spacer,
  SwipeActions,
  EditButton,
} from "swiftjsx";
import { stockLevel, type Product } from "./api";
import { plural, variantsFor } from "./format";
import { useShop } from "./store";
import { ProductScreen } from "./ProductScreen";
import { ACCENT, CartButton, EmptyState, PriceTag, RatingStars, useRouter } from "./ui";

export function WishlistScreen() {
  const wishlist = useShop((s) => s.wishlist);
  const remove = useShop((s) => s.removeFromWishlist);
  const router = useRouter();

  return (
    <Screen title="Wishlist">
      <ToolbarItem placement="primaryAction">
        <CartButton />
      </ToolbarItem>
      {wishlist.length ? (
        <ToolbarItem placement="topBarLeading">
          <EditButton />
        </ToolbarItem>
      ) : null}
      {wishlist.length ? (
        <List listStyle="insetGrouped">
          <Section
            footer={`${plural(wishlist.length, "item")} saved. Swipe left to remove.`}
            onDelete={(indices) => withAnimation("snappy", () => remove(indices.map((i) => wishlist[i].id)))}
          >
            {wishlist.map((product) => (
              <WishlistRow key={product.id} product={product} />
            ))}
          </Section>
        </List>
      ) : (
        <EmptyState icon="heart" title="Your wishlist is empty" message="Tap the heart on anything you like and it’ll wait for you here.">
          <Button title="Start Browsing" buttonStyle="borderedProminent" tint={ACCENT} onPress={() => router.setTab("home")} />
        </EmptyState>
      )}
    </Screen>
  );
}

function WishlistRow({ product }: { product: Product }) {
  const nav = useNavigation();
  const add = useShop((s) => s.add);
  const remove = useShop((s) => s.removeFromWishlist);
  const stock = stockLevel(product.stock);
  // Sizes have to be picked on the product page.
  const quickAdd = variantsFor(product).sizes.length === 0;
  const open = () => nav.push(<ProductScreen product={product} />);

  return (
    <HStack spacing={12} padding={{ vertical: 4 }}>
      <Button buttonStyle="plain" onPress={open} accessibilityIdentifier="wishlist-item" accessibilityLabel={product.title}>
        <HStack spacing={12}>
          <Image
            src={product.thumbnail}
            contentMode="fit"
            frame={{ width: 72, height: 72 }}
            padding={4}
            background={{ light: "#f4f4f6", dark: "#1f1f23" }}
            cornerRadius={12}
          />
          <VStack alignment="leading" spacing={4}>
            <Text font="subheadline" fontWeight="medium" lineLimit={2}>
              {product.title}
            </Text>
            <RatingStars rating={product.rating} size={10} />
            <PriceTag product={product} />
          </VStack>
          <Spacer />
        </HStack>
      </Button>
      <Button
        buttonStyle="bordered"
        tint={ACCENT}
        disabled={!stock.available}
        font="footnote"
        accessibilityLabel={quickAdd ? `Move ${product.title} to cart` : `Choose options for ${product.title}`}
        onPress={() => {
          if (!quickAdd) return open();
          haptic("success");
          add(product, { quantity: 1, color: variantsFor(product).colors[0]?.name });
          withAnimation("snappy", () => remove([product.id]));
        }}
      >
        <Image systemName={quickAdd ? "bag.badge.plus" : "slider.horizontal.3"} />
      </Button>
      <SwipeActions edge="leading">
        <Button tint={ACCENT} onPress={open}>
          <Image systemName="eye" />
        </Button>
      </SwipeActions>
    </HStack>
  );
}
