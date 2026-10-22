import { useState } from "react";
import { Screen, ScrollView, LazyVGrid, VStack, Text, Image, Sheet } from "swiftjsx";

const photos = Array.from({ length: 60 }, (_, i) => i + 10);
const url = (id: number, size: number) => `https://picsum.photos/id/${id}/${size}/${size}`;

export function ImagesDemo() {
  const [open, setOpen] = useState<number | null>(null);
  const [loaded, setLoaded] = useState(0);

  return (
    <Screen title="Images">
      <ScrollView>
        <VStack alignment="leading" spacing={8}>
          <Text font="footnote" foregroundStyle="secondary" padding={{ horizontal: 16 }} accessibilityIdentifier="loaded-count">
            {loaded} of {photos.length} loaded · cached in memory, decoded off the main thread
          </Text>
          <LazyVGrid columns={3} spacing={4} padding={{ horizontal: 4 }}>
            {photos.map((id) => (
              <Image
                key={id}
                src={url(id, 300)}
                contentMode="fill"
                frame={{ height: 120 }}
                cornerRadius={6}
                onLoad={() => setLoaded((n) => n + 1)}
                onTapGesture={() => setOpen(id)}
                accessibilityLabel={`Photo ${id}`}
                accessibilityTraits={["image", "button"]}
              />
            ))}
          </LazyVGrid>
        </VStack>
      </ScrollView>

      <Sheet isPresented={open != null} onDismiss={() => setOpen(null)} detents={["medium", "large"]}>
        {open != null && <Image src={url(open, 1200)} contentMode="fit" padding={16} accessibilityLabel={`Photo ${open}, large`} />}
      </Sheet>
    </Screen>
  );
}
