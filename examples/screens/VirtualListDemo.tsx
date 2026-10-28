import { useEffect, useRef, useState } from "react";
import { Screen, ToolbarItem, VirtualList, HStack, VStack, Text, Image, Button, Spacer, HostInstance, useNavigation, type Color } from "swiftjsx";

const colors: Color[] = ["red", "orange", "yellow", "green", "teal", "blue", "indigo", "purple", "pink"];
const icons = ["star.fill", "bolt.fill", "leaf.fill", "flame.fill", "drop.fill", "moon.fill", "sun.max.fill", "cloud.fill"];

type Item = { id: number; title: string; color: Color; icon: string };

export function VirtualListDemo() {
  const list = useRef<HostInstance>(null);
  const nav = useNavigation();
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
      <ToolbarItem placement="topBarLeading">
        <Button title="Thread" onPress={() => nav.push(<ThreadListDemo />)} />
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

type Row = { id: string; kind: "ancestor" | "focus" | "reply"; lines: number };

/**
 * A thread as a social app loads it: first just the post you tapped, then its
 * ancestors above it and replies below. `initialScrollIndex` keeps the
 * focused post at the top while the rows above arrive.
 */
function ThreadListDemo() {
  const [rows, setRows] = useState<Row[]>([{ id: "focus", kind: "focus", lines: 3 }]);
  useEffect(() => {
    const timer = setTimeout(() => {
      const ancestors: Row[] = Array.from({ length: 8 }, (_, i) => ({ id: `a${i}`, kind: "ancestor", lines: 1 + (i % 4) }));
      const replies: Row[] = Array.from({ length: 20 }, (_, i) => ({ id: `r${i}`, kind: "reply", lines: 1 + (i % 3) }));
      setRows([...ancestors, { id: "focus", kind: "focus", lines: 3 }, ...replies]);
    }, 500);
    return () => clearTimeout(timer);
  }, []);
  const focus = rows.findIndex((r) => r.kind === "focus");
  return (
    <Screen title="Thread" titleDisplayMode="inline">
      <VirtualList
        data={rows}
        keyExtractor={(row) => row.id}
        estimatedItemHeight={80}
        initialScrollIndex={focus}
        renderItem={(row) => (
          <VStack
            alignment="leading"
            spacing={4}
            padding={16}
            frame={{ maxWidth: "infinity", alignment: "leading" }}
            background={row.kind === "focus" ? "blue/15" : undefined}
            accessibilityElement="combine"
            accessibilityIdentifier={row.kind === "focus" ? "focused-row" : undefined}
          >
            <Text font={row.kind === "focus" ? "title3" : "headline"}>{row.kind === "focus" ? "The post you tapped" : row.kind === "ancestor" ? `Ancestor ${row.id.slice(1)}` : `Reply ${row.id.slice(1)}`}</Text>
            {Array.from({ length: row.lines }, (_, i) => (
              <Text key={i} foregroundStyle="secondary">A line of text in this post.</Text>
            ))}
          </VStack>
        )}
      />
    </Screen>
  );
}
