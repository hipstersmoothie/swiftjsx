import { useState } from "react";
import {
  NavigationSplitView, Screen, ToolbarItem, List, Button, Label, VStack, Text, Image, Spacer, Sheet, type Color,
} from "swiftjsx";

const planets: { id: string; name: string; color: Color; facts: string }[] = [
  { id: "mercury", name: "Mercury", color: "gray", facts: "Smallest planet; a year lasts 88 days." },
  { id: "venus", name: "Venus", color: "orange", facts: "Hottest planet, under thick clouds of sulfuric acid." },
  { id: "earth", name: "Earth", color: "blue", facts: "The only planet known to have life." },
  { id: "mars", name: "Mars", color: "red", facts: "Home of Olympus Mons, the tallest volcano known." },
  { id: "jupiter", name: "Jupiter", color: "brown", facts: "Its Great Red Spot is a storm bigger than Earth." },
];

export function SplitViewDemo() {
  const [open, setOpen] = useState(false);
  return (
    <Screen title="Split view">
      <VStack alignment="leading" spacing={14} padding={20}>
        <Text>
          NavigationSplitView shows side-by-side columns on iPad and Mac, and collapses into a stack on iPhone.
        </Text>
        <Button title="Open split view" buttonStyle="borderedProminent" onPress={() => setOpen(true)} />
        <Spacer />
      </VStack>
      {/* Full screen: a split view is a whole-window container, not a pushed screen. */}
      <Sheet isPresented={open} onDismiss={() => setOpen(false)} fullScreen>
        <Planets onClose={() => setOpen(false)} />
      </Sheet>
    </Screen>
  );
}

function Planets({ onClose }: { onClose: () => void }) {
  const [selected, setSelected] = useState<string | null>(null);
  const planet = planets.find((p) => p.id === selected);

  return (
    <NavigationSplitView
      sidebar={
        <Screen title="Planets">
          <ToolbarItem placement="cancellationAction">
            <Button title="Close" onPress={onClose} />
          </ToolbarItem>
          {/* List selection: tagged rows; iPad highlights the selected one. */}
          <List selection={selected} onSelectionChange={setSelected}>
            {planets.map((p) => (
              <Label key={p.id} tag={p.id} title={p.name} systemImage="circle.fill" foregroundStyle={p.color} />
            ))}
          </List>
        </Screen>
      }
      detail={
        planet ? (
          <Screen title={planet.name}>
            <VStack spacing={20} padding={32}>
              <Image systemName="circle.fill" font="largeTitle" foregroundStyle={planet.color} scale={1.8} padding={20} />
              <Text font="title3" accessibilityIdentifier="planet-facts">{planet.facts}</Text>
              <Spacer />
            </VStack>
          </Screen>
        ) : (
          <Text foregroundStyle="secondary">Pick a planet</Text>
        )
      }
      // On iPhone: show the detail once something is picked; the back button
      // reports "sidebar", which clears the selection.
      preferredCompactColumn={planet ? "detail" : "sidebar"}
      onPreferredCompactColumnChange={(column) => column === "sidebar" && setSelected(null)}
    />
  );
}
