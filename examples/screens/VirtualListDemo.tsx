import { useRef, useState } from "react";
import { Screen, ToolbarItem, VirtualList, HStack, VStack, Text, Image, Button, Spacer, HostInstance, type Color } from "swiftjsx";

const colors: Color[] = ["red", "orange", "yellow", "green", "teal", "blue", "indigo", "purple", "pink"];
const icons = ["star.fill", "bolt.fill", "leaf.fill", "flame.fill", "drop.fill", "moon.fill", "sun.max.fill", "cloud.fill"];

type Item = { id: number; title: string; color: Color; icon: string };

export function VirtualListDemo() {
  const list = useRef<HostInstance>(null);
  // Built once: the React Compiler caches it (no inputs), no useMemo needed.
  const items: Item[] = Array.from({ length: 100_000 }, (_, i) => ({
    id: i,
    title: `Row ${i.toLocaleString()}`,
    color: colors[i % colors.length],
    icon: icons[(i * 7) % icons.length],
  }));
  const [starred, setStarred] = useState<ReadonlySet<number>>(new Set());

  const toggle = (id: number) =>
    setStarred((s) => {
      const next = new Set(s);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  return (
    <Screen title="100,000 rows">
      <ToolbarItem placement="primaryAction">
        <Button title="Jump to 50,000" onPress={() => list.current?.scrollTo(50_000, { anchor: "top" })} />
      </ToolbarItem>
      <VirtualList
        ref={list}
        data={items}
        keyExtractor={(item) => item.id}
        itemHeight={56}
        spacing={6}
        renderItem={(item) => (
          <VStack padding={{ horizontal: 16 }}>
            <HStack
              spacing={12}
              padding={{ horizontal: 12 }}
              frame={{ maxWidth: "infinity", maxHeight: "infinity" }}
              background="#8881"
              cornerRadius={12}
              onTapGesture={() => toggle(item.id)}
            >
              <Image systemName={item.icon} foregroundStyle="white" frame={{ width: 34, height: 34 }} background={item.color} cornerRadius={8} />
              <VStack alignment="leading" spacing={2}>
                <Text font="headline">{item.title}</Text>
                <Text font="caption" foregroundStyle="secondary">Only rendered while on screen</Text>
              </VStack>
              <Spacer />
              <Image systemName={starred.has(item.id) ? "star.fill" : "star"} foregroundStyle="yellow" />
            </HStack>
          </VStack>
        )}
      />
    </Screen>
  );
}
