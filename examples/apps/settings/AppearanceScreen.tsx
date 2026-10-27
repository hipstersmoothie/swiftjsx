// Appearance: light / dark / automatic (applied to the whole app with
// `colorScheme`), an accent color (passed as `tint`), and a text size stepper
// with a live preview.
import { withAnimation, Screen, Form, Section, HStack, VStack, Text, Image, Button, Stepper, LazyVGrid, RoundedRectangle, Circle, Spacer } from "swiftjsx";
import { accentNames, accents, update, useAccent, useSettings, type Theme } from "./store";
import { ToggleRow } from "./ui";

export const textSizes = [
  { label: "Extra Small", body: 14 },
  { label: "Small", body: 15 },
  { label: "Medium", body: 16 },
  { label: "Large", body: 17 },
  { label: "Extra Large", body: 19 },
  { label: "XX Large", body: 21 },
  { label: "XXX Large", body: 23 },
  { label: "Accessibility", body: 28 },
];
const DEFAULT_TEXT_SIZE = 3;

export const themeLabels: Record<Theme, string> = { light: "Light", dark: "Dark", system: "Automatic" };

export function AppearanceScreen() {
  const appearance = useSettings((s) => s.appearance);
  const accent = useAccent();
  const size = textSizes[appearance.textSize] ?? textSizes[DEFAULT_TEXT_SIZE];

  const setTheme = (theme: Theme) =>
    withAnimation("smooth", () =>
      update((s) => {
        s.appearance.theme = theme;
      }),
    );

  const isDefault = appearance.theme === "system" && appearance.accent === "blue" && appearance.textSize === DEFAULT_TEXT_SIZE && !appearance.boldText;

  return (
    <Screen title="Appearance" titleDisplayMode="inline">
      <Form>
        <Section header="Theme">
          <HStack padding={{ vertical: 8 }}>
            {(["light", "dark", "system"] as Theme[]).map((theme) => (
              <ThemeTile key={theme} theme={theme} selected={appearance.theme === theme} onSelect={() => setTheme(theme)} />
            ))}
          </HStack>
        </Section>

        <Section header="Accent Color" footer={`${accent.label}. Used for switches, buttons, links and your avatar.`}>
          <LazyVGrid columns={accentNames.length} spacing={8} padding={{ vertical: 6 }}>
            {accentNames.map((name) => {
              const selected = name === appearance.accent;
              return (
                <Image
                  key={name}
                  systemName="checkmark"
                  font={{ size: 12, weight: "bold" }}
                  foregroundStyle={selected ? "white" : "clear"}
                  frame={{ width: 28, height: 28 }}
                  background={{ gradient: accents[name].gradient, start: "top", end: "bottom" }}
                  cornerRadius="capsule"
                  scale={selected ? 1.12 : 1}
                  animation="snappy"
                  onTapGesture={() =>
                    update((s) => {
                      s.appearance.accent = name;
                    })
                  }
                  accessibilityLabel={accents[name].label}
                  accessibilityTraits={selected ? ["button", "selected"] : "button"}
                  accessibilityIdentifier={`accent-${name}`}
                />
              );
            })}
          </LazyVGrid>
        </Section>

        <Section header="Text" footer="Sets the size of message text in this app.">
          <Stepper
            value={appearance.textSize}
            min={0}
            max={textSizes.length - 1}
            onChange={(i) =>
              update((s) => {
                s.appearance.textSize = i;
              })
            }
            tint={accent.color}
            accessibilityLabel="Text size"
            accessibilityValue={size.label}
          >
            <VStack alignment="leading" spacing={6}>
              <Text>Text Size</Text>
              <HStack spacing={4} accessibilityHidden>
                {textSizes.map((s, i) => (
                  <Circle
                    key={s.label}
                    fill={i <= appearance.textSize ? accent.color : "systemGray4"}
                    frame={{ width: 6 + i, height: 6 + i }}
                    animation="snappy"
                  />
                ))}
                <Text font="caption" foregroundStyle="secondaryLabel" padding={{ leading: 4 }}>{size.label}</Text>
              </HStack>
            </VStack>
          </Stepper>
          <ToggleRow
            title="Bold Text"
            value={appearance.boldText}
            onChange={(bold) =>
              update((s) => {
                s.appearance.boldText = bold;
              })
            }
          />
          <TextPreview body={size.body} bold={appearance.boldText} />
        </Section>

        <Section>
          <Button
            title="Reset Appearance"
            tint={accent.color}
            disabled={isDefault}
            onPress={() =>
              withAnimation("smooth", () =>
                update((s) => {
                  s.appearance = { theme: "system", accent: "blue", textSize: DEFAULT_TEXT_SIZE, boldText: false };
                }),
              )
            }
          />
        </Section>
      </Form>
    </Screen>
  );
}

/** A tiny phone screen drawn in light, dark, or half of each. */
function ThemeTile({ theme, selected, onSelect }: { theme: Theme; selected: boolean; onSelect(): void }) {
  const accent = useAccent();
  return (
    <Button
      buttonStyle="plain"
      onPress={onSelect}
      frame={{ maxWidth: "infinity" }}
      accessibilityLabel={themeLabels[theme]}
      accessibilityTraits={selected ? ["button", "selected"] : "button"}
      accessibilityIdentifier={`theme-${theme}`}
    >
      <VStack spacing={8}>
        <HStack
          spacing={0}
          cornerRadius={12}
          border={{ color: selected ? accent.color : "separator", width: selected ? 2.5 : 1 }}
          animation="snappy"
        >
          {theme === "system" ? (
            <>
              <MiniScreen scheme="light" width={36} />
              <MiniScreen scheme="dark" width={36} />
            </>
          ) : (
            <MiniScreen scheme={theme} width={72} />
          )}
        </HStack>
        <Text font="subheadline" foregroundStyle="label">{themeLabels[theme]}</Text>
        <Image
          systemName={selected ? "checkmark.circle.fill" : "circle"}
          font="title3"
          foregroundStyle={selected ? accent.color : "tertiaryLabel"}
          animation="snappy"
        />
      </VStack>
    </Button>
  );
}

/** Semantic colors under a forced `colorScheme`, so each half draws its own mode. */
function MiniScreen({ scheme, width }: { scheme: "light" | "dark"; width: number }) {
  const accent = useAccent();
  return (
    <VStack
      alignment="leading"
      spacing={5}
      padding={{ top: 14, horizontal: 6 }}
      frame={{ width, height: 128, alignment: "top" }}
      background="systemGroupedBackground"
      colorScheme={scheme}
    >
      <RoundedRectangle cornerRadius={3} fill="label" frame={{ width: width * 0.5, height: 6 }} />
      {[0, 1, 2].map((i) => (
        <HStack key={i} spacing={4} padding={4} frame={{ maxWidth: "infinity", alignment: "leading" }} background="secondarySystemGroupedBackground" cornerRadius={5}>
          <RoundedRectangle cornerRadius={2} fill={i === 0 ? accent.color : "systemGray3"} frame={{ width: 8, height: 8 }} />
          <RoundedRectangle cornerRadius={2} fill="systemGray4" frame={{ height: 4 }} />
        </HStack>
      ))}
      <Spacer />
    </VStack>
  );
}

function TextPreview({ body, bold }: { body: number; bold: boolean }) {
  return (
    <VStack alignment="leading" spacing={6} padding={{ vertical: 6 }} animation="snappy" accessibilityLabel="Text size preview">
      <Text font={{ size: body + 3, weight: bold ? "heavy" : "bold" }}>Weekend ride</Text>
      <Text font={{ size: body, weight: bold ? "semibold" : "regular" }}>
        Meet at the bakery at 8. Bring a jacket — it’ll be windy up on the ridge.
      </Text>
      <Text font={{ size: Math.max(11, body - 4), weight: bold ? "semibold" : "regular" }} foregroundStyle="secondaryLabel">
        Sam Chen · 9:41 AM
      </Text>
    </VStack>
  );
}
