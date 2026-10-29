// The cart: lines with quantity controls (swipe to remove or save for
// later), a free-shipping meter, promo codes, the totals and Checkout.
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  withAnimation,
  haptic,
  useNavigation,
  Screen,
  ToolbarItem,
  List,
  Section,
  SectionFooter,
  VStack,
  HStack,
  Text,
  Image,
  Button,
  Spacer,
  TextField,
  ProgressView,
  SwipeActions,
  SafeAreaInset,
  ConfirmationDialog,
  Label,
  ContentUnavailable,
} from "swiftjsx";
import { format } from "date-fns";
import { productQuery } from "./api";
import { money, plural } from "./format";
import { checkPromo, FREE_SHIPPING_OVER, promoHint, totals } from "./pricing";
import { MAX_PER_LINE, useShop, type CartLine, type Order } from "./store";
import { CheckoutScreen } from "./CheckoutScreen";
import { ACCENT, SummaryRow, useRouter } from "./ui";

export function CartScreen() {
  const nav = useNavigation();
  const router = useRouter();
  const lines = useShop((s) => s.lines);
  const promo = useShop((s) => s.promo);
  const orders = useShop((s) => s.orders);
  const remove = useShop((s) => s.remove);
  const [confirmingClear, setConfirmingClear] = useState(false);
  const t = totals(lines, promo);

  if (!lines.length) {
    return (
      <Screen title="Cart">
        <List listStyle="insetGrouped">
          <Section>
            <ContentUnavailable systemImage="bag" title="Your cart is empty" description="Find something you love. It’ll be here when you’re ready.">
              <Button
                title="Continue Shopping"
                buttonStyle="borderedProminent"
                tint={ACCENT}
                onPress={() => router.setTab("home")}
                accessibilityIdentifier="continue-shopping"
              />
            </ContentUnavailable>
          </Section>
          {orders.length ? (
            <Section header="Recent orders">
              {orders.slice(0, 5).map((order) => (
                <OrderRow key={order.id} order={order} />
              ))}
            </Section>
          ) : null}
        </List>
      </Screen>
    );
  }

  return (
    <Screen title="Cart">
      <ToolbarItem placement="primaryAction">
        <Button title="Clear" tint="red" onPress={() => setConfirmingClear(true)} accessibilityIdentifier="clear-cart">
          <ConfirmationDialog isPresented={confirmingClear} onDismiss={() => setConfirmingClear(false)} title="Remove everything from your cart?">
            <Button
              title={`Remove ${plural(t.count, "Item")}`}
              role="destructive"
              onPress={() => withAnimation("snappy", () => remove(lines.map((l) => l.key)))}
            />
            <Button title="Cancel" role="cancel" onPress={() => {}} />
          </ConfirmationDialog>
        </Button>
      </ToolbarItem>

      <List listStyle="insetGrouped">
        <Section
          header={plural(t.count, "item")}
          onDelete={(indices) => {
            haptic("light");
            withAnimation("snappy", () => remove(indices.map((i) => lines[i].key)));
          }}
        >
          {lines.map((line) => (
            <LineRow key={line.key} line={line} />
          ))}
        </Section>

        <Section>
          <ShippingMeter toGo={t.toFreeShipping} subtotal={t.subtotal} freeByPromo={t.shipping === 0 && t.toFreeShipping > 0} />
        </Section>

        <PromoSection subtotal={t.subtotal} code={promo} applied={t.promo} problem={t.promoProblem} />

        <Section header="Summary">
          <SummaryRow title="Subtotal" value={money(t.subtotal)} />
          {t.savings > 0 ? <SummaryRow title="You save" value={`−${money(t.savings)}`} color="green" /> : null}
          {t.promo ? <SummaryRow title={`Promo (${t.promo.code})`} value={`−${money(t.promoDiscount)}`} color="green" /> : null}
          <SummaryRow title="Shipping" value={t.shipping === 0 ? "Free" : money(t.shipping)} color={t.shipping === 0 ? "green" : undefined} />
          <SummaryRow title="Estimated tax" value={money(t.tax)} />
          <SummaryRow title="Total" value={money(t.total)} emphasis identifier="cart-total" />
          <SectionFooter>
            <Text font="caption" foregroundStyle="secondaryLabel">
              Tax is estimated; the final amount is calculated at checkout.
            </Text>
          </SectionFooter>
        </Section>
      </List>

      <SafeAreaInset edge="bottom">
        <HStack spacing={14} padding={{ horizontal: 20, top: 12, bottom: 8 }} background="bar">
          <VStack alignment="leading" spacing={1}>
            <Text font="caption" foregroundStyle="secondaryLabel">
              Total
            </Text>
            <Text font={{ size: 20, weight: "bold", design: "rounded" }} monospacedDigit contentTransition="numericText" animation="snappy">
              {money(t.total)}
            </Text>
          </VStack>
          <Spacer />
          <Button
            onPress={() => nav.push(<CheckoutScreen />)}
            pressedScale={0.96}
            accessibilityIdentifier="checkout-button"
            accessibilityLabel={`Checkout, ${money(t.total)}`}
          >
            <HStack spacing={8} padding={{ horizontal: 26, vertical: 14 }} background={ACCENT} cornerRadius="capsule">
              <Image systemName="lock.fill" font="footnote" foregroundStyle="white" />
              <Text font="headline" foregroundStyle="white">
                Checkout
              </Text>
            </HStack>
          </Button>
        </HStack>
      </SafeAreaInset>
    </Screen>
  );
}

function LineRow({ line }: { line: CartLine }) {
  const setQuantity = useShop((s) => s.setQuantity);
  const saveForLater = useShop((s) => s.saveForLater);
  const client = useQueryClient();
  const limit = Math.min(MAX_PER_LINE, line.stock);
  const variant = [line.color, line.size].filter(Boolean).join(" · ");

  const change = (quantity: number) => {
    haptic(quantity <= 0 ? "medium" : "selection");
    withAnimation("snappy", () => setQuantity(line.key, quantity));
  };
  const save = async () => {
    const product = await client.fetchQuery(productQuery(line.productId)).catch(() => undefined);
    haptic("success");
    withAnimation("snappy", () => saveForLater(line.key, product));
  };

  return (
    <HStack spacing={12} padding={{ vertical: 4 }} accessibilityIdentifier="cart-line" accessibilityElement="contain">
      <Image
        src={line.thumbnail}
        contentMode="fit"
        frame={{ width: 72, height: 72 }}
        padding={4}
        background={{ light: "#f4f4f6", dark: "#1f1f23" }}
        cornerRadius={12}
        accessibilityHidden
      />
      <VStack alignment="leading" spacing={4}>
        <Text font="subheadline" fontWeight="medium" lineLimit={2}>
          {line.title}
        </Text>
        {variant ? (
          <Text font="caption" foregroundStyle="secondaryLabel">
            {variant}
          </Text>
        ) : null}
        <HStack spacing={6} alignment="firstTextBaseline">
          <Text font="subheadline" fontWeight="semibold" monospacedDigit contentTransition="numericText" animation="snappy">
            {money(line.unitPrice * line.quantity)}
          </Text>
          {line.listPrice > line.unitPrice ? (
            <Text font="caption" foregroundStyle="secondaryLabel" strikethrough monospacedDigit>
              {money(line.listPrice * line.quantity)}
            </Text>
          ) : null}
        </HStack>
        <HStack spacing={0} background="tertiarySystemFill" cornerRadius="capsule" padding={{ top: 2 }}>
          <Button
            buttonStyle="borderless"
            onPress={() => change(line.quantity - 1)}
            accessibilityLabel={line.quantity === 1 ? "Remove" : "Decrease quantity"}
            accessibilityIdentifier="decrease-quantity"
          >
            <Image
              systemName={line.quantity === 1 ? "trash" : "minus"}
              font="footnote"
              fontWeight="semibold"
              foregroundStyle={line.quantity === 1 ? "red" : "label"}
              frame={{ width: 34, height: 30 }}
              contentShape="rectangle"
            />
          </Button>
          <Text
            font="subheadline"
            fontWeight="semibold"
            monospacedDigit
            frame={{ minWidth: 24 }}
            contentTransition="numericText"
            animation="snappy"
            accessibilityIdentifier="line-quantity"
          >
            {line.quantity}
          </Text>
          <Button
            buttonStyle="borderless"
            disabled={line.quantity >= limit}
            onPress={() => change(line.quantity + 1)}
            accessibilityLabel="Increase quantity"
            accessibilityIdentifier="increase-quantity"
          >
            <Image
              systemName="plus"
              font="footnote"
              fontWeight="semibold"
              foregroundStyle="label"
              frame={{ width: 34, height: 30 }}
              contentShape="rectangle"
            />
          </Button>
        </HStack>
        {line.quantity >= limit ? (
          <Text font="caption2" foregroundStyle="orange">
            {line.stock <= MAX_PER_LINE ? `Only ${line.stock} in stock` : `Limit ${MAX_PER_LINE} per order`}
          </Text>
        ) : null}
      </VStack>
      <Spacer />
      <SwipeActions edge="leading">
        <Button tint={ACCENT} onPress={save}>
          <Label title="Save for Later" systemImage="heart" />
        </Button>
      </SwipeActions>
    </HStack>
  );
}

function ShippingMeter({ toGo, subtotal, freeByPromo }: { toGo: number; subtotal: number; freeByPromo: boolean }) {
  const free = toGo === 0 || freeByPromo;
  return (
    <VStack alignment="leading" spacing={8} padding={{ vertical: 4 }} accessibilityElement="combine">
      <HStack spacing={8}>
        <Image
          systemName={free ? "shippingbox.fill" : "shippingbox"}
          foregroundStyle={free ? "green" : ACCENT}
          symbolEffect={{ type: "bounce", value: free }}
        />
        <Text font="subheadline">
          {free ? (
            <Text fontWeight="semibold" foregroundStyle="green">
              You’ve unlocked free shipping
            </Text>
          ) : (
            <Text>
              Add <Text fontWeight="bold">{money(toGo)}</Text> more for free shipping
            </Text>
          )}
        </Text>
      </HStack>
      <ProgressView value={Math.min(subtotal, FREE_SHIPPING_OVER)} total={FREE_SHIPPING_OVER} tint={free ? "green" : ACCENT} animation="smooth" />
    </VStack>
  );
}

function PromoSection({
  subtotal,
  code: appliedCode,
  applied,
  problem,
}: {
  subtotal: number;
  code: string | null;
  applied: { code: string; label: string } | null;
  problem: string | null;
}) {
  const applyPromo = useShop((s) => s.applyPromo);
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);

  const apply = () => {
    const result = checkPromo(code, subtotal);
    if (!result.ok) {
      haptic("error");
      withAnimation("snappy", () => setError(result.error));
      return;
    }
    haptic("success");
    withAnimation("bouncy", () => {
      applyPromo(result.code);
      setCode("");
      setError(null);
    });
  };

  if (applied || problem) {
    return (
      <Section header="Promo code">
        <HStack spacing={10}>
          <Image systemName={problem ? "exclamationmark.triangle.fill" : "tag.fill"} foregroundStyle={problem ? "orange" : "green"} />
          <VStack alignment="leading" spacing={2}>
            <Text font="subheadline" fontWeight="semibold" fontDesign="monospaced" accessibilityIdentifier="applied-promo">
              {appliedCode}
            </Text>
            <Text font="caption" foregroundStyle={problem ? "orange" : "secondaryLabel"}>
              {problem ?? applied?.label}
            </Text>
          </VStack>
          <Spacer />
          <Button
            title="Remove"
            buttonStyle="borderless"
            tint="red"
            font="subheadline"
            onPress={() => withAnimation("snappy", () => applyPromo(null))}
          />
        </HStack>
      </Section>
    );
  }

  return (
    <Section header="Promo code" footer={error ? undefined : promoHint}>
      <HStack spacing={10}>
        <Image systemName="tag" foregroundStyle={error ? "red" : "secondaryLabel"} />
        <TextField
          value={code}
          onChange={(value) => {
            setCode(value.toUpperCase().replace(/\s+/g, ""));
            if (error) setError(null);
          }}
          placeholder="Enter code"
          autocapitalize="characters"
          autocorrect={false}
          submitLabel="done"
          onSubmit={apply}
          textFieldStyle="plain"
          fontDesign="monospaced"
          accessibilityIdentifier="promo-field"
        />
        <Button
          title="Apply"
          buttonStyle="borderless"
          tint={ACCENT}
          fontWeight="semibold"
          disabled={!code.trim()}
          onPress={apply}
          accessibilityIdentifier="apply-promo"
        />
      </HStack>
      {error ? (
        <HStack spacing={4} transition="opacity" accessibilityElement="combine">
          <Image systemName="exclamationmark.circle.fill" font="footnote" foregroundStyle="red" />
          <Text font="footnote" foregroundStyle="red" accessibilityIdentifier="promo-error">
            {error}
          </Text>
        </HStack>
      ) : null}
    </Section>
  );
}

function OrderRow({ order }: { order: Order }) {
  const count = order.lines.reduce((n, l) => n + l.quantity, 0);
  return (
    <HStack spacing={12} accessibilityElement="combine">
      <Image systemName="shippingbox.fill" foregroundStyle={ACCENT} frame={{ width: 28 }} />
      <VStack alignment="leading" spacing={2}>
        <Text font="subheadline" fontWeight="semibold">
          Order #{order.id}
        </Text>
        <Text font="caption" foregroundStyle="secondaryLabel">
          {plural(count, "item")} · arrives {format(order.deliveryDate, "EEE, MMM d")}
        </Text>
      </VStack>
      <Spacer />
      <Text font="subheadline" monospacedDigit>
        {money(order.total)}
      </Text>
    </HStack>
  );
}
