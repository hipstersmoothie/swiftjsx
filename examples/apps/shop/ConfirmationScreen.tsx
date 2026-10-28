// Order placed: a checkmark that draws itself, confetti, and the summary.
import { useEffect, useState } from "react";
import {
  withAnimation,
  ScrollView,
  VStack,
  HStack,
  ZStack,
  Text,
  Image,
  Button,
  Spacer,
  Circle,
  RoundedRectangle,
  Capsule,
  Divider,
  type Color,
} from "swiftjsx";
import { format } from "date-fns";
import { money, plural } from "./format";
import type { Order } from "./store";
import { ACCENT } from "./ui";

const confettiColors: Color[] = ["#ff375f", "#ff9f0a", "#ffd60a", "#30d158", "#64d2ff", "#5e5ce6", "#bf5af2"];

type Piece = {
  id: number;
  shape: "circle" | "rect" | "capsule";
  color: Color;
  x: number;
  drift: number;
  size: number;
  spin: number;
  duration: number;
  delay: number;
};

function makeConfetti(count: number): Piece[] {
  return Array.from({ length: count }, (_, id) => ({
    id,
    shape: (["circle", "rect", "capsule"] as const)[id % 3],
    color: confettiColors[id % confettiColors.length],
    // -0.5…0.5 of the width
    x: Math.random() - 0.5,
    drift: (Math.random() - 0.5) * 120,
    size: 7 + Math.random() * 7,
    spin: (Math.random() - 0.5) * 900,
    duration: 2.2 + Math.random() * 1.6,
    delay: Math.random() * 0.5,
  }));
}

export function ConfirmationScreen({ order, onDone }: { order: Order; onDone(): void }) {
  const [pieces] = useState(() => makeConfetti(48));
  const [size, setSize] = useState({ width: 390, height: 844 });
  const [launched, setLaunched] = useState(false);
  const [drawn, setDrawn] = useState(false);
  const count = order.lines.reduce((n, l) => n + l.quantity, 0);

  useEffect(() => {
    // Once the full-screen cover has landed (and never in the mount commit,
    // where the change would land with the mount and not animate).
    const t1 = setTimeout(() => setLaunched(true), 350);
    const t2 = setTimeout(() => withAnimation({ type: "easeOut", duration: 0.7 }, () => setDrawn(true)), 450);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

  return (
    <ZStack
      alignment="top"
      frame={{ maxWidth: "infinity", maxHeight: "infinity" }}
      background={{ gradient: [`${ACCENT}/25` as Color, "systemBackground"], start: "top", end: "center" }}
      onLayout={setSize}
    >
      <ScrollView>
        <VStack spacing={22} padding={{ horizontal: 24, top: 72, bottom: 40 }}>
          <ZStack>
            <Circle fill={`${ACCENT}/12` as Color} frame={{ width: 128, height: 128 }} scale={drawn ? 1 : 0.6} animation="bouncy" />
            <Circle stroke="green" lineWidth={6} trim={[0, drawn ? 1 : 0]} rotation={-90} frame={{ width: 104, height: 104 }} />
            <Image
              systemName="checkmark"
              font={{ size: 46, weight: "bold" }}
              foregroundStyle="green"
              scale={drawn ? 1 : 0.2}
              opacity={drawn ? 1 : 0}
              animation={{ type: "bouncy", delay: 0.35 }}
              symbolEffect={{ type: "bounce", value: drawn }}
            />
          </ZStack>

          <VStack spacing={6}>
            <Text font={{ size: 30, weight: "bold", design: "rounded" }} textAlignment="center" accessibilityIdentifier="order-confirmed">
              Order placed!
            </Text>
            <Text font="callout" foregroundStyle="secondaryLabel" textAlignment="center">
              Thanks, {order.shippingName.split(" ")[0]}. We’ve sent a receipt to your email.
            </Text>
          </VStack>

          <VStack
            alignment="leading"
            spacing={14}
            padding={18}
            frame={{ maxWidth: "infinity", alignment: "leading" }}
            background="secondarySystemBackground"
            cornerRadius={20}
          >
            <HStack>
              <Text font="subheadline" foregroundStyle="secondaryLabel">
                Order
              </Text>
              <Spacer />
              <Text font="subheadline" fontWeight="semibold" fontDesign="monospaced" selectable accessibilityIdentifier="order-number">
                #{order.id}
              </Text>
            </HStack>
            <HStack spacing={10}>
              <Image systemName="shippingbox.fill" foregroundStyle={ACCENT} />
              <VStack alignment="leading" spacing={2}>
                <Text font="headline">Arrives {format(order.deliveryDate, "EEEE, MMMM d")}</Text>
                <Text font="caption" foregroundStyle="secondaryLabel">
                  To {order.shippingName} in {order.city}
                </Text>
              </VStack>
            </HStack>
            <Divider />
            {order.lines.map((line) => (
              <HStack key={line.key} spacing={10}>
                <Image src={line.thumbnail} contentMode="fit" frame={{ width: 40, height: 40 }} background="tertiarySystemFill" cornerRadius={8} />
                <Text font="subheadline" lineLimit={1}>
                  {line.title}
                </Text>
                <Spacer />
                <Text font="subheadline" foregroundStyle="secondaryLabel" monospacedDigit>
                  ×{line.quantity}
                </Text>
              </HStack>
            ))}
            <Divider />
            <HStack>
              <Text font="headline">{plural(count, "item")}</Text>
              <Spacer />
              <Text font={{ size: 20, weight: "bold", design: "rounded" }} monospacedDigit>
                {money(order.total)}
              </Text>
            </HStack>
          </VStack>

          <Button onPress={onDone} pressedScale={0.97} accessibilityIdentifier="continue-shopping">
            <Text
              font="headline"
              foregroundStyle="white"
              padding={{ vertical: 15 }}
              frame={{ maxWidth: "infinity" }}
              background={ACCENT}
              cornerRadius={16}
            >
              Continue Shopping
            </Text>
          </Button>
        </VStack>
      </ScrollView>

      {/* Confetti on top, ignoring touches. Each piece animates with its own duration and delay. */}
      <ZStack alignment="top" frame={{ maxWidth: "infinity", maxHeight: "infinity" }} allowsHitTesting={false} accessibilityHidden>
        {pieces.map((p) => (
          <ConfettiPiece key={p.id} piece={p} launched={launched} width={size.width} height={size.height} />
        ))}
      </ZStack>
    </ZStack>
  );
}

function ConfettiPiece({ piece, launched, width, height }: { piece: Piece; launched: boolean; width: number; height: number }) {
  const props = {
    fill: piece.color,
    frame:
      piece.shape === "rect"
        ? { width: piece.size, height: piece.size * 0.45 }
        : piece.shape === "capsule"
          ? { width: piece.size * 0.4, height: piece.size * 1.3 }
          : { width: piece.size * 0.7, height: piece.size * 0.7 },
    offset: { x: piece.x * width + (launched ? piece.drift : 0), y: launched ? height + 40 : -30 },
    rotation: launched ? piece.spin : 0,
    opacity: launched ? 0.9 : 1,
    animation: { type: "easeIn" as const, duration: piece.duration, delay: piece.delay },
  };
  if (piece.shape === "circle") return <Circle {...props} />;
  if (piece.shape === "capsule") return <Capsule {...props} />;
  return <RoundedRectangle cornerRadius={1.5} {...props} />;
}
