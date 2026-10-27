// Storage: a usage bar of colored segments with a legend, a breakdown, and
// "Clear Cache" behind a confirmation.
import { useRef, useState } from "react";
import {
  withAnimation, Screen, List, Section, HStack, VStack, Text, Button, ProgressView, Spacer, LazyVGrid, Circle, Rectangle,
  ConfirmationDialog, type Color, type HostInstance,
} from "swiftjsx";
import { clearCache, update, useAccent, useSettings } from "./store";
import { IconTile, ToggleRow } from "./ui";

export const CAPACITY = 128e9;

type Category = { id: string; label: string; icon: string; color: Color; bytes: number };

const fixed: Category[] = [
  { id: "apps", label: "Apps", icon: "square.grid.2x2.fill", color: "blue", bytes: 23.4e9 },
  { id: "photos", label: "Photos", icon: "photo.fill", color: "orange", bytes: 31.8e9 },
  { id: "messages", label: "Messages", icon: "message.fill", color: "green", bytes: 6.2e9 },
  { id: "system", label: "System Data", icon: "gearshape.fill", color: "gray", bytes: 12.1e9 },
];

export function useCategories(): Category[] {
  const cacheBytes = useSettings((s) => s.storage.cacheBytes);
  return [
    ...fixed.slice(0, 3),
    { id: "cache", label: "Cache", icon: "archivebox.fill", color: "yellow", bytes: cacheBytes },
    fixed[3],
  ];
}

/** "23.4 GB", "512 MB", "Zero KB" — decimal units, like iOS. */
export function formatBytes(bytes: number): string {
  if (bytes < 1e3) return "Zero KB";
  const units = ["KB", "MB", "GB", "TB"];
  let value = bytes / 1e3;
  let unit = 0;
  while (value >= 1000 && unit < units.length - 1) {
    value /= 1000;
    unit += 1;
  }
  return `${value >= 100 ? Math.round(value) : value.toFixed(1)} ${units[unit]}`;
}

export const usedBytes = (categories: Category[]) => categories.reduce((sum, c) => sum + c.bytes, 0);

export function StorageScreen() {
  const accent = useAccent();
  const categories = useCategories();
  const cacheBytes = useSettings((s) => s.storage.cacheBytes);
  const offload = useSettings((s) => s.storage.offloadUnused);
  const [confirming, setConfirming] = useState(false);
  const [clearing, setClearing] = useState(false);
  const used = usedBytes(categories);

  const clear = () => {
    setClearing(true);
    // Pretend to delete files for a moment.
    setTimeout(() => {
      withAnimation("smooth", () => {
        clearCache();
        setClearing(false);
      });
    }, 1200);
  };

  return (
    <Screen title="Storage" titleDisplayMode="inline">
      <List>
        <Section header="iPhone">
          <VStack alignment="leading" spacing={12} padding={{ vertical: 6 }}>
            <HStack alignment="firstTextBaseline">
              <Text font="headline">{formatBytes(used)} used</Text>
              <Spacer />
              <Text font="subheadline" foregroundStyle="secondaryLabel">of {formatBytes(CAPACITY)}</Text>
            </HStack>
            <UsageBar categories={categories} capacity={CAPACITY} />
            <LazyVGrid columns={2} spacing={8}>
              {categories.map((c) => (
                <HStack key={c.id} spacing={6} frame={{ maxWidth: "infinity", alignment: "leading" }} accessibilityElement="combine">
                  <Circle fill={c.color} frame={{ width: 9, height: 9 }} />
                  <Text font="caption">{c.label}</Text>
                  <Text font="caption" foregroundStyle="secondaryLabel" monospacedDigit animation="smooth">{formatBytes(c.bytes)}</Text>
                </HStack>
              ))}
            </LazyVGrid>
          </VStack>
        </Section>

        <Section
          header="Cache"
          footer="Cached images and downloads load faster offline. Clearing them frees space; they’ll download again when needed."
        >
          <HStack spacing={12}>
            <IconTile icon="archivebox.fill" color="yellow" />
            <Text>Cached Data</Text>
            <Spacer />
            <Text foregroundStyle="secondaryLabel" monospacedDigit animation="smooth" accessibilityIdentifier="cache-size">{formatBytes(cacheBytes)}</Text>
          </HStack>
          <Button
            role="destructive"
            disabled={cacheBytes === 0 || clearing}
            onPress={() => setConfirming(true)}
            accessibilityIdentifier="clear-cache"
          >
            <HStack spacing={8}>
              <Text>{clearing ? "Clearing…" : "Clear Cache"}</Text>
              {clearing ? <ProgressView /> : null}
            </HStack>
            <ConfirmationDialog
              isPresented={confirming}
              onDismiss={() => setConfirming(false)}
              title="Clear Cache?"
              message={`This frees ${formatBytes(cacheBytes)}. You won’t lose any of your data.`}
            >
              <Button title={`Clear ${formatBytes(cacheBytes)}`} role="destructive" onPress={clear} />
              <Button title="Cancel" role="cancel" onPress={() => {}} />
            </ConfirmationDialog>
          </Button>
        </Section>

        <Section footer="Automatically remove apps you don’t use, keeping their documents and data.">
          <ToggleRow
            title="Offload Unused Apps"
            icon="icloud.and.arrow.down.fill"
            color="blue"
            value={offload}
            onChange={(on) =>
              update((s) => {
                s.storage.offloadUnused = on;
              })
            }
          />
        </Section>

        <Section header="Breakdown">
          {[...categories].sort((a, b) => b.bytes - a.bytes).map((c) => (
            <HStack key={c.id} spacing={12} accessibilityElement="combine">
              <IconTile icon={c.icon} color={c.color} />
              <VStack alignment="leading" spacing={4}>
                <Text>{c.label}</Text>
                <ProgressView value={c.bytes} total={used || 1} tint={c.color} frame={{ width: 120 }} animation="smooth" accessibilityHidden />
              </VStack>
              <Spacer />
              <Text foregroundStyle="secondaryLabel" monospacedDigit animation="smooth">{formatBytes(c.bytes)}</Text>
            </HStack>
          ))}
          <HStack spacing={12} accessibilityElement="combine">
            <IconTile icon="checkmark.circle.fill" color={accent.color} />
            <Text>Available</Text>
            <Spacer />
            <Text foregroundStyle="secondaryLabel" monospacedDigit animation="smooth">{formatBytes(CAPACITY - used)}</Text>
          </HStack>
        </Section>
      </List>
    </Screen>
  );
}

/**
 * Segments sized by share of `capacity`. There's no proportional layout
 * (GeometryReader), so it measures its own width once it's on screen and does
 * the math in points.
 */
function UsageBar({ categories, capacity }: { categories: Category[]; capacity: number }) {
  const bar = useRef<HostInstance>(null);
  const [width, setWidth] = useState(0);
  const GAP = 2;

  const measure = (attempt = 0) => {
    bar.current?.measure().then((frame) => {
      // The frame is zero until the first layout has happened; try again shortly.
      if (frame.width > 0) setWidth(frame.width);
      else if (attempt < 10) setTimeout(() => measure(attempt + 1), 50);
    });
  };

  const visible = categories.filter((c) => c.bytes > 0);
  const room = Math.max(0, width - GAP * visible.length);

  return (
    <HStack
      ref={bar}
      spacing={GAP}
      frame={{ maxWidth: "infinity", height: 22, alignment: "leading" }}
      background="tertiarySystemFill"
      cornerRadius={6}
      onAppear={() => measure()}
      accessibilityElement="ignore"
      accessibilityLabel="Storage used"
      accessibilityValue={visible.map((c) => `${c.label} ${formatBytes(c.bytes)}`).join(", ")}
    >
      {width > 0
        ? visible.map((c) => (
            <Rectangle
              key={c.id}
              fill={c.color}
              frame={{ width: Math.max(3, (room * c.bytes) / capacity) }}
              transition="opacity"
              animation="smooth"
            />
          ))
        : null}
    </HStack>
  );
}
