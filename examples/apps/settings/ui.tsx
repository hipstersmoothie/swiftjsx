// Building blocks that make rows look like iOS Settings: navigation rows
// (chevron + value on the right), value rows, the profile avatar, and a
// generic "pick one" screen with checkmarks.
import type { ReactNode } from "react";
import { Screen, List, Section, HStack, VStack, Text, Image, Button, Spacer, Toggle, Avatar, IconTile, type Color } from "swiftjsx";
import { useAccent, useSettings, type State } from "./store";

export function Chevron() {
  return <Image systemName="chevron.right" font={{ size: 14, weight: "semibold" }} foregroundStyle="tertiaryLabel" accessibilityHidden />;
}

/**
 * A row that pushes a screen: icon, title, the current value in gray, and a
 * chevron. A Button so the whole row highlights and takes the tap.
 */
export function NavRow({
  title, icon, color, value, onPress, identifier,
}: {
  title: string;
  icon?: string;
  color?: Color;
  value?: string;
  onPress(): void;
  identifier?: string;
}) {
  return (
    <Button
      onPress={onPress}
      accessibilityLabel={title}
      accessibilityValue={value}
      accessibilityIdentifier={identifier}
      accessibilityTraits="button"
    >
      <HStack spacing={12}>
        {icon ? <IconTile systemImage={icon} color={color ?? "gray"} /> : null}
        <Text foregroundStyle="label">{title}</Text>
        <Spacer minLength={8} />
        {value ? <Text foregroundStyle="secondaryLabel" lineLimit={1}>{value}</Text> : null}
        <Chevron />
      </HStack>
    </Button>
  );
}

/** "Label ……… value", read-only (like LabeledContent). */
export function ValueRow({ title, value, icon, color }: { title: string; value: string; icon?: string; color?: Color }) {
  return (
    <HStack spacing={12} accessibilityElement="combine">
      {icon ? <IconTile systemImage={icon} color={color ?? "gray"} /> : null}
      <Text>{title}</Text>
      <Spacer minLength={8} />
      <Text foregroundStyle="secondaryLabel" lineLimit={1} textAlignment="trailing">{value}</Text>
    </HStack>
  );
}

/** A toggle whose label is an icon tile and a title, tinted with the accent color. */
export function ToggleRow({
  title, icon, color, value, onChange, subtitle, disabled,
}: {
  title: string;
  icon?: string;
  color?: Color;
  value: boolean;
  onChange(value: boolean): void;
  subtitle?: string;
  disabled?: boolean;
}) {
  const accent = useAccent();
  return (
    <Toggle value={value} onChange={onChange} tint={accent.color} disabled={disabled} accessibilityLabel={title}>
      <HStack spacing={12}>
        {icon ? <IconTile systemImage={icon} color={color ?? "gray"} /> : null}
        <VStack alignment="leading" spacing={2}>
          <Text>{title}</Text>
          {subtitle ? <Text font="caption" foregroundStyle="secondaryLabel">{subtitle}</Text> : null}
        </VStack>
      </HStack>
    </Toggle>
  );
}

/** A link-styled row: accent-colored title and an arrow (opens outside the app). */
export function LinkRow({ title, icon, onPress }: { title: string; icon: string; onPress(): void }) {
  const accent = useAccent();
  return (
    <Button onPress={onPress} tint={accent.color} accessibilityTraits="link">
      <HStack spacing={12}>
        <Image systemName={icon} foregroundStyle={accent.color} frame={{ width: 29 }} accessibilityHidden />
        <Text foregroundStyle={accent.color}>{title}</Text>
        <Spacer />
        <Image systemName="arrow.up.right" font="footnote" fontWeight="semibold" foregroundStyle="tertiaryLabel" accessibilityHidden />
      </HStack>
    </Button>
  );
}

/** The profile's initials ("?" without a name) on the accent gradient. */
export function ProfileAvatar({ name, size }: { name: string; size: number }) {
  const accent = useAccent();
  return (
    <Avatar
      name={name.trim() || "?"}
      size={size}
      color={{ gradient: accent.gradient, start: "top", end: "bottom" }}
      design="rounded"
      animation="snappy"
      accessibilityHidden
    />
  );
}

export type Choice = { value: string; label: string; detail?: string };

/**
 * A pushed "pick one" list with a checkmark, like a navigation-link Picker.
 *
 * It reads the value with `select` instead of taking `value`: a pushed
 * element's props are frozen at `nav.push()` time, so a `value` prop would
 * never show the new selection.
 */
export function ChoiceScreen({
  title, options, select, onSelect, header, footer, children,
}: {
  title: string;
  options: Choice[];
  select(state: State): string;
  onSelect(value: string): void;
  header?: string;
  footer?: string;
  children?: ReactNode;
}) {
  const value = useSettings(select);
  const accent = useAccent();
  return (
    <Screen title={title} titleDisplayMode="inline">
      <List>
        <Section header={header} footer={footer}>
          {options.map((option) => (
            <Button
              key={option.value}
              onPress={() => onSelect(option.value)}
              accessibilityLabel={option.label}
              accessibilityTraits={option.value === value ? ["button", "selected"] : "button"}
            >
              <HStack>
                <VStack alignment="leading" spacing={2}>
                  <Text foregroundStyle="label">{option.label}</Text>
                  {option.detail ? <Text font="caption" foregroundStyle="secondaryLabel">{option.detail}</Text> : null}
                </VStack>
                <Spacer />
                <Image
                  systemName="checkmark"
                  fontWeight="semibold"
                  foregroundStyle={accent.color}
                  opacity={option.value === value ? 1 : 0}
                  accessibilityHidden
                />
              </HStack>
            </Button>
          ))}
        </Section>
        {children}
      </List>
    </Screen>
  );
}
