import { useState, type ReactNode } from "react";
import {
  Screen, ScrollView, VStack, HStack, ZStack, Text, Image, Button, Spacer,
  Rectangle, RoundedRectangle, Circle, Capsule, Ellipse, withAnimation, type Color,
} from "swiftjsx";

const swatches: Color[] = ["systemBackground", "secondarySystemBackground", "systemGray4", "separator", "label", "secondaryLabel"];

export function StylesDemo() {
  const [progress, setProgress] = useState(0.65);
  const [dark, setDark] = useState(false);

  return (
    <Screen title="Shapes, colors & fonts">
      <ScrollView>
        <VStack alignment="leading" spacing={22} padding={20}>
          <Section title="Shapes">
            <HStack spacing={14}>
              <Circle fill="blue" frame={{ width: 56, height: 56 }} />
              <Capsule fill={{ gradient: ["pink", "orange"], start: "leading", end: "trailing" }} frame={{ width: 90, height: 40 }} />
              <RoundedRectangle cornerRadius={14} stroke="green" lineWidth={3} dash={[6, 4]} frame={{ width: 56, height: 56 }} />
              <Ellipse fill="purple/30" stroke="purple" lineWidth={2} frame={{ width: 70, height: 44 }} />
            </HStack>
            <HStack spacing={18}>
              {/* Progress ring: a full track and a trimmed stroke. */}
              <ZStack frame={{ width: 72, height: 72 }} onTapGesture={() => withAnimation("bouncy", () => setProgress((p) => (p >= 0.95 ? 0.1 : p + 0.2)))}>
                <Circle stroke="systemGray5" lineWidth={10} />
                <Circle stroke={{ gradient: ["mint", "teal", "blue"], type: "angular" }} lineWidth={10} trim={[0, progress]} rotation={-90} />
                <Text font={{ size: 17, weight: "semibold", design: "rounded" }} monospacedDigit animation="default">{Math.round(progress * 100)}%</Text>
              </ZStack>
              <VStack alignment="leading" spacing={6}>
                <Text font="headline">Tap the ring</Text>
                <Text font="caption" foregroundStyle="secondary">Circle with stroke, trim and an angular gradient.</Text>
              </VStack>
            </HStack>
            <HStack spacing={10}>
              <Text padding={{ horizontal: 12, vertical: 6 }} background="blue/15" foregroundStyle="blue" cornerRadius="capsule" font="caption" fontWeight="semibold">Capsule tag</Text>
              <Text padding={12} background="indigo" foregroundStyle="white" cornerRadius={{ topLeading: 18, topTrailing: 18, bottomLeading: 18, bottomTrailing: 4 }}>
                Bubble corners
              </Text>
              <Rectangle fill={{ gradient: ["yellow", "red"], type: "radial", endRadius: 30 }} frame={{ width: 44, height: 44 }} cornerRadius={10} />
            </HStack>
          </Section>

          <Section title="Colors">
            <HStack spacing={8}>
              {swatches.map((c) => (
                <RoundedRectangle key={c} cornerRadius={8} fill={c} stroke="separator" frame={{ width: 44, height: 44 }} />
              ))}
            </HStack>
            <HStack spacing={8}>
              {[100, 70, 40, 20, 8].map((p) => (
                <Circle key={p} fill={`orange/${p}`} frame={{ width: 34, height: 34 }} />
              ))}
              <Text font="caption" foregroundStyle="secondary">"orange/40"…</Text>
            </HStack>
            {/* Hierarchical styles follow the surrounding color. */}
            <VStack alignment="leading" spacing={4} padding={14} background={{ gradient: ["blue", "indigo"] }} foregroundStyle="white" cornerRadius={14}>
              <Text font="headline">On a colored card</Text>
              <Text foregroundStyle="secondary">secondary is dimmed white here</Text>
              <Text foregroundStyle="tertiary">tertiary, dimmer still</Text>
            </VStack>
            <HStack spacing={12} padding={14} background="secondarySystemBackground" cornerRadius={14} colorScheme={dark ? "dark" : "light"}>
              <Image systemName={dark ? "moon.fill" : "sun.max.fill"} foregroundStyle={{ light: "orange", dark: "yellow" }} />
              <Text>colorScheme="{dark ? "dark" : "light"}"</Text>
              <Spacer />
              <Button title="Switch" buttonStyle="bordered" onPress={() => setDark((d) => !d)} />
            </HStack>
          </Section>

          <Section title="Fonts">
            <Text font={{ size: 64, weight: "thin" }}>72°</Text>
            <Text font={{ size: 28, weight: "heavy", design: "rounded", width: "condensed" }}>Rounded, condensed</Text>
            <Text font={{ name: "Georgia", size: 20, relativeTo: "title3" }} italic>Georgia, scaled with Dynamic Type</Text>
            <Text font="caption" fontWeight="semibold" textCase="uppercase" kerning={1.5} foregroundStyle="secondary">Uppercase · kerning</Text>
            <Text font="title3">
              Styled <Text fontWeight="bold" foregroundStyle="pink">runs</Text>, <Text italic underline="blue">underlines</Text>, and inline{" "}
              <Image systemName="sparkles" foregroundStyle="yellow" /> symbols
            </Text>
            <Text font="largeTitle" fontWeight="bold" lineLimit={1} minimumScaleFactor={0.4} foregroundStyle={{ gradient: ["purple", "pink", "orange"], start: "leading", end: "trailing" }}>
              Gradient text that shrinks to fit one line
            </Text>
          </Section>
        </VStack>
      </ScrollView>
    </Screen>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <VStack alignment="leading" spacing={12}>
      <Text font="footnote" fontWeight="semibold" foregroundStyle="secondary" textCase="uppercase">{title}</Text>
      {children}
    </VStack>
  );
}
