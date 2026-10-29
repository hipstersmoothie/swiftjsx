import { useState } from "react";
import {
  Screen, ScrollView, VStack, HStack, Text, Button, Image, Overlay, ContentUnavailable,
  Avatar, IconTile, Chip, Badge, ProgressRing, PageIndicator, Pager,
  toast, format, useNow, useDebouncedValue, usePersistentState, TextField,
} from "swiftjsx";

const SLIDES = [
  { title: "Swipe", color: "indigo", icon: "hand.draw" },
  { title: "Pages", color: "teal", icon: "rectangle.stack" },
  { title: "Auto-advance", color: "orange", icon: "timer" },
] as const;

export function KitDemo() {
  const now = useNow("second");
  const [filter, setFilter] = useState("All");
  const [progress, setProgress] = usePersistentState("kit-demo-progress", 0.35);
  const [query, setQuery] = useState("");
  const [settled, pending] = useDebouncedValue(query, 400);
  const [page, setPage] = useState(0);
  const started = now - (now % 3_600_000);

  return (
    <Screen title="App kit" titleDisplayMode="inline">
      <ScrollView>
        <VStack alignment="leading" spacing={22} padding={20}>
          <Text font="headline">Avatars and tiles</Text>
          <HStack spacing={14}>
            <Avatar name="Ada Lovelace" size={52} />
            <Avatar name="Grace Hopper" size={52} ring={{ gradient: ["yellow", "orange", "pink", "purple"], type: "angular" }} />
            <Avatar name="Alan Turing" size={52} shape="roundedSquare" badge={<Badge value={3} />} />
            <IconTile systemImage="bell.fill" color="red" size={44} />
            <IconTile systemImage="wifi" color="blue" size={44} shape="circle" />
          </HStack>

          <Text font="headline">Chips and badges</Text>
          <HStack spacing={8}>
            {["All", "Unread", "Starred"].map((label) => (
              <Chip key={label} label={label} selected={filter === label} onPress={() => setFilter(label)} accessibilityIdentifier={`chip-${label}`} />
            ))}
            <Image systemName="cart" font="title2">
              <Overlay alignment="topTrailing">
                <Badge value={120} offset={{ x: 10, y: -8 }} />
              </Overlay>
            </Image>
          </HStack>

          <Text font="headline">Progress ring</Text>
          <HStack spacing={18}>
            <ProgressRing value={progress} lineWidth={10} color={{ gradient: ["mint", "teal"], type: "angular" }} frame={{ width: 72, height: 72 }} animation="smooth">
              <Text font={{ size: 15, weight: "semibold", design: "rounded" }} monospacedDigit>{format.percent(progress)}</Text>
            </ProgressRing>
            <Button title="+10%" buttonStyle="bordered" onPress={() => setProgress((p) => (p >= 1 ? 0 : Math.min(1, p + 0.1)))} accessibilityIdentifier="ring-more" />
          </HStack>

          <Text font="headline">Pager</Text>
          <Pager page={page} onPageChange={setPage} autoAdvance={3} indicator="capsule" frame={{ height: 150 }} cornerRadius={16} accessibilityIdentifier="pager">
            {SLIDES.map((s) => (
              <VStack key={s.title} spacing={8} frame={{ maxWidth: "infinity", maxHeight: "infinity" }} background={s.color}>
                <Image systemName={s.icon} font="largeTitle" foregroundStyle="white" />
                <Text font="title3" fontWeight="bold" foregroundStyle="white">{s.title}</Text>
              </VStack>
            ))}
          </Pager>
          <HStack spacing={14}>
            <PageIndicator count={4} page={1} style="dots" tint="accent" inactive="secondary" />
            <PageIndicator count={4} page={1} style="counter" />
            <PageIndicator count={4} page={1} style="segments" progress={0.6} tint="accent" inactive="secondary" frame={{ width: 120 }} />
          </HStack>

          <Text font="headline">Dates that keep themselves current</Text>
          <VStack alignment="leading" spacing={4}>
            <Text>Started <Text date={started} dateStyle="ago" fontWeight="semibold" /></Text>
            <Text monospacedDigit>Running for <Text date={started} dateStyle="timer" fontWeight="semibold" /></Text>
            <Text foregroundStyle="secondary">{`${format.relativeDay(now)} · ${format.duration(3909, "long")} · ${format.bytes(1_500_000)} · ${format.compact(12_400)}`}</Text>
          </VStack>

          <Text font="headline">Debounced search</Text>
          <TextField placeholder="Type…" value={query} onChange={setQuery} textFieldStyle="roundedBorder" accessibilityIdentifier="kit-search" />
          <Text foregroundStyle="secondary" accessibilityIdentifier="kit-debounced">{pending ? "Waiting…" : `Searching for “${settled}”`}</Text>

          <Text font="headline">Toasts</Text>
          <HStack spacing={10}>
            <Button title="Saved" buttonStyle="bordered" onPress={() => toast("Saved to Favorites", { systemImage: "heart.fill", tint: "pink", haptic: "success" })} accessibilityIdentifier="toast-saved" />
            <Button
              title="With undo"
              buttonStyle="bordered"
              onPress={() => toast("Message deleted", { systemImage: "trash", action: { title: "Undo", onPress: () => toast("Restored") } })}
            />
          </HStack>

          <Text font="headline">Empty states</Text>
          <ContentUnavailable systemImage="tray" title="No Messages" description="Messages you receive appear here." frame={{ height: 220 }}>
            <Button title="Compose" buttonStyle="borderedProminent" onPress={() => toast("Compose")} />
          </ContentUnavailable>
          <ContentUnavailable search="unicorns" frame={{ height: 200 }} />
        </VStack>
      </ScrollView>
    </Screen>
  );
}
