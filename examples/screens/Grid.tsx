import { useState } from "react";
import { Screen, ScrollView, LazyVGrid, VStack, Image, Text, type Color } from "swiftjsx";

const symbols = [
  "sun.max", "moon", "cloud.rain", "snowflake", "wind", "tornado", "bolt", "flame", "drop", "leaf",
  "tree", "mountain.2", "globe.americas", "airplane", "car", "bicycle", "tram", "ferry", "house", "building.2",
  "camera", "music.note", "headphones", "gamecontroller", "paintbrush", "hammer", "wrench", "scissors", "book", "graduationcap",
];
const palette: Color[] = ["blue", "purple", "pink", "orange", "green", "teal", "indigo", "red"];

export function GridDemo() {
  const [selected, setSelected] = useState<string | null>(null);
  return (
    <Screen title={selected ?? "Lazy grid"}>
      <ScrollView>
        <LazyVGrid columns={{ minimum: 90 }} spacing={12} padding={16}>
          {symbols.map((name, i) => (
            <VStack
              key={name}
              spacing={8}
              padding={12}
              frame={{ maxWidth: "infinity" }}
              background={selected === name ? palette[i % palette.length] : "#8881"}
              cornerRadius={14}
              animation="spring"
              onTapGesture={() => setSelected((s) => (s === name ? null : name))}
            >
              <Image systemName={name} font="title" foregroundStyle={selected === name ? "white" : palette[i % palette.length]} />
              <Text font="caption2" foregroundStyle={selected === name ? "white" : "secondary"}>{name}</Text>
            </VStack>
          ))}
        </LazyVGrid>
      </ScrollView>
    </Screen>
  );
}
