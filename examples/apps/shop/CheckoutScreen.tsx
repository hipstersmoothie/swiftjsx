// Checkout: contact and shipping address (AutoFill content types, keyboard
// types, Next to move between fields), a delivery date, card fields with
// input masks and Luhn validation (zod), the order summary and Place Order.
import { useEffect, useRef, useState, type ComponentProps, type ReactNode, type RefObject } from "react";
import {
  haptic,
  withAnimation,
  useNavigation,
  Screen,
  ToolbarItem,
  Form,
  Section,
  SectionFooter,
  SafeAreaInset,
  VStack,
  HStack,
  Text,
  Image,
  Button,
  Spacer,
  TextField,
  Picker,
  Toggle,
  DatePicker,
  ProgressView,
  Alert,
  type HostInstance,
} from "swiftjsx";
import { format } from "date-fns";
import {
  cardBrand,
  countries,
  earliestDelivery,
  formatCardNumber,
  formatExpiry,
  formatPhone,
  formatPostalCode,
  latestDelivery,
  maskedCard,
  regions,
  validateCheckout,
  type CheckoutForm,
  type Field,
} from "./checkout";
import { money, plural } from "./format";
import { totals } from "./pricing";
import { useShop } from "./store";
import { ACCENT, SummaryRow, useRouter } from "./ui";

/** The text fields, in the order Next visits them. */
const order = ["email", "phone", "name", "street", "apartment", "city", "postalCode", "cardNumber", "expiry", "cvc", "cardName"] as const;
type TextKey = (typeof order)[number];

const DECLINED_CARD = "4000000000000002";

function initialForm(): CheckoutForm {
  return {
    email: "",
    name: "",
    street: "",
    apartment: "",
    city: "",
    region: "CA",
    postalCode: "",
    country: "US",
    phone: "",
    deliveryDate: earliestDelivery("standard"),
    speed: "standard",
    cardNumber: "",
    expiry: "",
    cvc: "",
    cardName: "",
    saveCard: false,
  };
}

export function CheckoutScreen() {
  const nav = useNavigation();
  const router = useRouter();
  const lines = useShop((s) => s.lines);
  const promo = useShop((s) => s.promo);
  const placeOrder = useShop((s) => s.placeOrder);

  const [form, setForm] = useState<CheckoutForm>(initialForm);
  const [touched, setTouched] = useState<readonly Field[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const [focused, setFocused] = useState<TextKey | null>(null);
  const [placing, setPlacing] = useState(false);
  const [declined, setDeclined] = useState(false);

  const refs: Record<TextKey, RefObject<HostInstance | null>> = {
    email: useRef<HostInstance>(null),
    phone: useRef<HostInstance>(null),
    name: useRef<HostInstance>(null),
    street: useRef<HostInstance>(null),
    apartment: useRef<HostInstance>(null),
    city: useRef<HostInstance>(null),
    postalCode: useRef<HostInstance>(null),
    cardNumber: useRef<HostInstance>(null),
    expiry: useRef<HostInstance>(null),
    cvc: useRef<HostInstance>(null),
    cardName: useRef<HostInstance>(null),
  };

  // Leaving mid-order (swipe back) cancels it.
  const alive = useRef(true);
  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);

  const t = totals(lines, promo, form.speed);
  const errors = validateCheckout(form);
  const errorFor = (field: Field) => (submitted || touched.includes(field) ? errors[field] : undefined);
  const brand = cardBrand(form.cardNumber.replace(/\D/g, ""));

  const set = <K extends Field>(field: K, value: CheckoutForm[K]) => setForm((f) => ({ ...f, [field]: value }));
  const touch = (field: Field) => setTouched((list) => (list.includes(field) ? list : [...list, field]));

  const move = (from: TextKey, step: 1 | -1) => {
    const next = order[order.indexOf(from) + step];
    if (next) refs[next].current?.focus();
    else refs[from].current?.blur();
  };

  const place = async () => {
    setSubmitted(true);
    const invalid = order.find((field) => errors[field]);
    if (Object.keys(errors).length) {
      haptic("error");
      // Focusing the first bad field scrolls the form to it.
      if (invalid) refs[invalid].current?.focus();
      return;
    }
    refs[focused ?? "email"].current?.blur();
    setPlacing(true);
    await new Promise((resolve) => setTimeout(resolve, 1400));
    if (!alive.current) return;
    setPlacing(false);
    if (form.cardNumber.replace(/\D/g, "") === DECLINED_CARD) {
      haptic("error");
      setDeclined(true);
      return;
    }
    const placed = placeOrder({ deliveryDate: form.deliveryDate.getTime(), shippingName: form.name.trim(), city: form.city.trim(), total: t.total });
    haptic("success");
    router.showConfirmation(placed);
    nav.popToRoot();
  };

  /** A text field wired into focus order, touched-tracking and the keyboard toolbar. */
  const input = (field: TextKey, props: Partial<ComponentProps<typeof TextField>> & { onChange(value: string): void }) => (
    <TextField
      ref={refs[field]}
      value={form[field]}
      textFieldStyle="plain"
      submitLabel={field === "cardName" ? "done" : "next"}
      onSubmit={() => move(field, 1)}
      onFocus={() => setFocused(field)}
      onBlur={() => {
        touch(field);
        setFocused((f) => (f === field ? null : f));
      }}
      disabled={placing}
      accessibilityIdentifier={`checkout-${field}`}
      {...props}
    />
  );

  return (
    <Screen title="Checkout" titleDisplayMode="inline">
      {/* Number pads have no return key: Previous / Next / Done above the keyboard. */}
      <ToolbarItem placement="keyboard">
        <Button
          onPress={() => focused && move(focused, -1)}
          disabled={!focused || order.indexOf(focused) === 0}
          accessibilityLabel="Previous field"
        >
          <Image systemName="chevron.up" />
        </Button>
        <Button
          onPress={() => focused && move(focused, 1)}
          disabled={!focused || order.indexOf(focused) === order.length - 1}
          accessibilityLabel="Next field"
        >
          <Image systemName="chevron.down" />
        </Button>
        <Spacer />
        <Button title="Done" fontWeight="semibold" onPress={() => focused && refs[focused].current?.blur()} />
      </ToolbarItem>

      <Form>
        <Section header="Contact">
          <Row label="Email" error={errorFor("email")}>
            {input("email", {
              placeholder: "you@example.com",
              keyboardType: "email",
              textContentType: "email",
              autocapitalize: "none",
              autocorrect: false,
              onChange: (v) => set("email", v.replace(/\s+/g, "")),
            })}
          </Row>
          <Row label="Phone" error={errorFor("phone")} optional>
            {input("phone", {
              placeholder: "(555) 555-0100",
              keyboardType: "phone",
              textContentType: "phone",
              onChange: (v) => set("phone", formatPhone(v)),
            })}
          </Row>
        </Section>

        <Section header="Shipping address">
          <Row label="Name" error={errorFor("name")}>
            {input("name", {
              placeholder: "Jane Appleseed",
              textContentType: "name",
              autocapitalize: "words",
              autocorrect: false,
              onChange: (v) => set("name", v),
            })}
          </Row>
          <Row label="Street" error={errorFor("street")}>
            {input("street", {
              placeholder: "1 Infinite Loop",
              textContentType: "streetAddress",
              autocapitalize: "words",
              onChange: (v) => set("street", v),
            })}
          </Row>
          <Row label="Apt / Suite" optional>
            {input("apartment", { placeholder: "Apt 4B", autocapitalize: "words", onChange: (v) => set("apartment", v) })}
          </Row>
          <Row label="City" error={errorFor("city")}>
            {input("city", { placeholder: "Cupertino", textContentType: "city", autocapitalize: "words", onChange: (v) => set("city", v) })}
          </Row>
          <Picker
            label={form.country === "CA" ? "Province" : "State"}
            pickerStyle="menu"
            tint={ACCENT}
            value={form.region}
            options={regions[form.country]}
            onChange={(v) => set("region", v)}
            disabled={placing}
          />
          <Row label={form.country === "CA" ? "Postal code" : "ZIP"} error={errorFor("postalCode")}>
            {input("postalCode", {
              placeholder: form.country === "CA" ? "K1A 0B1" : "95014",
              textContentType: "postalCode",
              // Canadian codes have letters.
              keyboardType: form.country === "CA" ? "asciiCapable" : "number",
              autocapitalize: "characters",
              autocorrect: false,
              onChange: (v) => set("postalCode", formatPostalCode(v, form.country)),
            })}
          </Row>
          <Picker
            label="Country"
            pickerStyle="menu"
            tint={ACCENT}
            value={form.country}
            options={countries}
            disabled={placing}
            onChange={(country) =>
              setForm((f) => ({
                ...f,
                country,
                region: regions[country]?.[0]?.value ?? "",
                postalCode: formatPostalCode(f.postalCode, country),
              }))
            }
          />
        </Section>

        <Section header="Delivery">
          <Picker
            pickerStyle="segmented"
            value={form.speed}
            options={[
              { value: "standard", label: t.subtotal >= 7500 || t.promo?.code === "FREESHIP" ? "Standard · Free" : "Standard · $6.99" },
              { value: "express", label: "Express · $14.99" },
            ]}
            onChange={(v) => {
              const speed = v === "express" ? "express" : "standard";
              haptic("selection");
              withAnimation("snappy", () =>
                setForm((f) => {
                  const earliest = earliestDelivery(speed);
                  return { ...f, speed, deliveryDate: f.deliveryDate < earliest ? earliest : f.deliveryDate };
                }),
              );
            }}
            disabled={placing}
            accessibilityIdentifier="shipping-speed"
          />
          <DatePicker
            label="Delivery date"
            value={form.deliveryDate}
            min={earliestDelivery(form.speed)}
            max={latestDelivery()}
            onChange={(date) => set("deliveryDate", date)}
            tint={ACCENT}
            disabled={placing}
            accessibilityIdentifier="delivery-date"
          />
          <HStack spacing={8} accessibilityElement="combine">
            <Image systemName="calendar.badge.clock" foregroundStyle={ACCENT} />
            <Text font="subheadline">Arrives {format(form.deliveryDate, "EEEE, MMMM d")}</Text>
          </HStack>
          {errorFor("deliveryDate") ? <ErrorText message={errorFor("deliveryDate") ?? ""} /> : null}
        </Section>

        <Section header="Payment">
          <Row label="Card" error={errorFor("cardNumber")}>
            {input("cardNumber", {
              placeholder: "1234 5678 9012 3456",
              keyboardType: "number",
              textContentType: "creditCardNumber",
              fontDesign: "monospaced",
              onChange: (v) => set("cardNumber", formatCardNumber(v)),
            })}
            <HStack spacing={4} animation="snappy">
              <Image systemName={brand.icon} foregroundStyle={brand.name === "Card" ? "tertiaryLabel" : ACCENT} />
              {brand.name !== "Card" ? (
                <Text font="caption" fontWeight="semibold" foregroundStyle={ACCENT} transition="opacity">
                  {brand.name}
                </Text>
              ) : null}
            </HStack>
          </Row>
          <HStack spacing={16}>
            <Row label="Expires" error={errorFor("expiry")} compact>
              {input("expiry", {
                placeholder: "MM/YY",
                keyboardType: "number",
                fontDesign: "monospaced",
                onChange: (v) => set("expiry", formatExpiry(v, form.expiry)),
              })}
            </Row>
            <Row label="CVC" error={errorFor("cvc")} compact>
              {input("cvc", {
                placeholder: brand.cvc === 4 ? "1234" : "123",
                keyboardType: "number",
                secure: true,
                onChange: (v) => set("cvc", v.replace(/\D/g, "").slice(0, brand.cvc)),
              })}
            </Row>
          </HStack>
          <Row label="Name on card" error={errorFor("cardName")}>
            {input("cardName", {
              placeholder: "JANE APPLESEED",
              textContentType: "name",
              autocapitalize: "characters",
              autocorrect: false,
              onChange: (v) => set("cardName", v),
            })}
          </Row>
          <Toggle label="Save card for next time" value={form.saveCard} onChange={(v) => set("saveCard", v)} tint={ACCENT} disabled={placing} />
          <SectionFooter>
            <Text font="caption" foregroundStyle="secondaryLabel">
              Test cards: 4242 4242 4242 4242 is accepted, 4000 0000 0000 0002 is declined. Any future date and any CVC.
            </Text>
          </SectionFooter>
        </Section>

        <Section header={`Order summary · ${plural(t.count, "item")}`}>
          {lines.map((line) => (
            <HStack key={line.key} spacing={8}>
              <Text font="subheadline" foregroundStyle="secondaryLabel" monospacedDigit>
                {line.quantity}×
              </Text>
              <Text font="subheadline" lineLimit={1}>
                {line.title}
              </Text>
              {line.size ? (
                <Text font="caption" foregroundStyle="secondaryLabel">
                  {line.size}
                </Text>
              ) : null}
              <Spacer />
              <Text font="subheadline" monospacedDigit>
                {money(line.unitPrice * line.quantity)}
              </Text>
            </HStack>
          ))}
          <SummaryRow title="Subtotal" value={money(t.subtotal)} />
          {t.promo ? <SummaryRow title={`Promo (${t.promo.code})`} value={`−${money(t.promoDiscount)}`} color="green" /> : null}
          <SummaryRow
            title={form.speed === "express" ? "Express shipping" : "Shipping"}
            value={t.shipping === 0 ? "Free" : money(t.shipping)}
            color={t.shipping === 0 ? "green" : undefined}
          />
          <SummaryRow title="Tax" value={money(t.tax)} />
          <SummaryRow title="Total" value={money(t.total)} emphasis identifier="checkout-total" />
        </Section>

        <Alert
          isPresented={declined}
          onDismiss={() => setDeclined(false)}
          title="Your card was declined"
          message={`The card ${maskedCard(form.cardNumber)} couldn't be charged. Try another card.`}
        >
          <Button
            title="Use Another Card"
            onPress={() => {
              setForm((f) => ({ ...f, cardNumber: "", expiry: "", cvc: "" }));
              setTimeout(() => refs.cardNumber.current?.focus(), 400);
            }}
          />
          <Button title="OK" role="cancel" onPress={() => {}} />
        </Alert>

        <SafeAreaInset edge="bottom">
          <VStack spacing={6} padding={{ horizontal: 20, top: 12, bottom: 8 }} background="bar">
            <Button
              onPress={place}
              disabled={placing || lines.length === 0}
              pressedScale={0.97}
              accessibilityIdentifier="place-order"
              accessibilityLabel={`Place order, ${money(t.total)}`}
            >
              <HStack
                spacing={10}
                padding={{ vertical: 15 }}
                frame={{ maxWidth: "infinity" }}
                background={placing ? "systemGray" : ACCENT}
                cornerRadius={16}
                animation="snappy"
              >
                {placing ? <ProgressView tint="white" /> : <Image systemName="lock.fill" foregroundStyle="white" />}
                <Text font="headline" foregroundStyle="white" monospacedDigit>
                  {placing ? "Placing order…" : `Place Order · ${money(t.total)}`}
                </Text>
              </HStack>
            </Button>
            {submitted && Object.keys(errors).length ? (
              <Text font="caption" foregroundStyle="red" transition="opacity" accessibilityIdentifier="checkout-errors">
                {plural(Object.keys(errors).length, "field needs", "fields need")} attention
              </Text>
            ) : null}
          </VStack>
        </SafeAreaInset>
      </Form>
    </Screen>
  );
}

function Row({
  label,
  error,
  optional,
  compact,
  children,
}: {
  label: string;
  error?: string;
  optional?: boolean;
  compact?: boolean;
  children: ReactNode;
}) {
  return (
    <VStack alignment="leading" spacing={compact ? 2 : 6} animation="snappy">
      {compact ? (
        <>
          <Text font="caption" foregroundStyle={error ? "red" : "secondaryLabel"}>
            {label}
          </Text>
          {children}
        </>
      ) : (
        <HStack spacing={12}>
          <Text frame={{ width: 96, alignment: "leading" }} foregroundStyle={error ? "red" : "label"} lineLimit={1} minimumScaleFactor={0.8}>
            {label}
          </Text>
          {children}
          {optional ? (
            <Text font="caption" foregroundStyle="tertiaryLabel">
              Optional
            </Text>
          ) : null}
        </HStack>
      )}
      {error ? <ErrorText message={error} /> : null}
    </VStack>
  );
}

function ErrorText({ message }: { message: string }) {
  return (
    <HStack spacing={4} transition="opacity" accessibilityElement="combine">
      <Image systemName="exclamationmark.circle.fill" font="caption" foregroundStyle="red" />
      <Text font="caption" foregroundStyle="red">
        {message}
      </Text>
      <Spacer />
    </HStack>
  );
}
