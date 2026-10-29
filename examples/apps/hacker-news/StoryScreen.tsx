import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Screen, ToolbarItem, VirtualList, VStack, HStack, Text, Button, Image, ProgressView, Spacer, openURL,
} from "swiftjsx";
import { fetchItem, domain, htmlToText, comments, points, type Comment, type Story } from "./api";
import { useSaved, useIsSaved } from "./saved";

type Row = { kind: "header" } | { kind: "comment"; comment: Comment; depth: number; hidden: number };

export function StoryScreen({ story: initial }: { story: Story }) {
  const { data, isPending, error, refetch } = useQuery({
    queryKey: ["item", initial.id],
    queryFn: ({ signal }) => fetchItem(initial.id, signal),
  });
  const story = data?.story ?? initial;
  const [collapsed, setCollapsed] = useState<Set<number>>(new Set());
  const saved = useIsSaved(story.id);
  const toggleSaved = useSaved((s) => s.toggle);

  const rows: Row[] = [{ kind: "header" }];
  const walk = (comments: Comment[], depth: number) => {
    for (const comment of comments) {
      if (!comment.author) continue; // deleted
      const isCollapsed = collapsed.has(comment.id);
      rows.push({ kind: "comment", comment, depth, hidden: isCollapsed ? count(comment.children) : 0 });
      if (!isCollapsed) walk(comment.children, depth + 1);
    }
  };
  walk(data?.comments ?? [], 0);

  const toggle = (id: number) =>
    setCollapsed((c) => {
      const next = new Set(c);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  return (
    <Screen title={domain(story.url) ?? "Discussion"} titleDisplayMode="inline">
      <ToolbarItem placement="primaryAction">
        <Button onPress={() => toggleSaved(story)} accessibilityLabel={saved ? "Unsave" : "Save"}>
          <Image systemName={saved ? "bookmark.fill" : "bookmark"} />
        </Button>
      </ToolbarItem>
      <VirtualList
        data={rows}
        keyExtractor={(row) => (row.kind === "header" ? "header" : row.comment.id)}
        estimatedItemHeight={90}
        onRefresh={() => refetch()}
        renderItem={(row) =>
          row.kind === "header" ? (
            <Header story={story} loading={isPending} error={error} />
          ) : (
            <CommentRow comment={row.comment} depth={row.depth} hidden={row.hidden} onToggle={() => toggle(row.comment.id)} />
          )
        }
      />
    </Screen>
  );
}

function Header({ story, loading, error }: { story: Story; loading: boolean; error: Error | null }) {
  return (
    <VStack alignment="leading" spacing={10} padding={16}>
      <Text font="title3" fontWeight="semibold">{story.title}</Text>
      <Text font="footnote" foregroundStyle="secondary">
        {points(story.points)} · {story.author} · <Text date={story.createdAt} dateStyle="ago" /> · {comments(story.comments)}
      </Text>
      {story.text ? <Text font="callout">{htmlToText(story.text)}</Text> : null}
      {story.url ? (
        <HStack spacing={10}>
          <Button title="Read article" buttonStyle="borderedProminent" onPress={() => openURL(story.url!, { inApp: true })} />
          <Button buttonStyle="bordered" onPress={() => openURL(story.url!)} accessibilityLabel="Open in Safari">
            <Image systemName="safari" />
          </Button>
        </HStack>
      ) : null}
      {loading ? <ProgressView padding={{ top: 12 }} frame={{ maxWidth: "infinity" }} /> : null}
      {error ? <Text foregroundStyle="red">{error.message}</Text> : null}
    </VStack>
  );
}

function CommentRow({ comment, depth, hidden, onToggle }: { comment: Comment; depth: number; hidden: number; onToggle(): void }) {
  const colors = ["orange", "blue", "green", "purple", "pink", "teal"] as const;
  return (
    <HStack alignment="top" spacing={10} padding={{ leading: 16 + Math.min(depth, 6) * 12, trailing: 16, vertical: 8 }}>
      {depth > 0 ? <VStack frame={{ width: 2, maxHeight: "infinity" }} background={colors[(depth - 1) % colors.length]} cornerRadius={1} /> : null}
      <VStack alignment="leading" spacing={4} onTapGesture={onToggle} accessibilityHint="Tap to collapse or expand">
        <HStack spacing={6}>
          <Text font="footnote" fontWeight="semibold">{comment.author}</Text>
          <Text date={comment.createdAt} dateStyle="ago" font="footnote" foregroundStyle="secondary" />
          <Spacer />
          {hidden ? <Text font="caption" foregroundStyle="secondary">+{hidden}</Text> : null}
        </HStack>
        {hidden ? null : <Text font="callout">{htmlToText(comment.text)}</Text>}
      </VStack>
    </HStack>
  );
}

const count = (comments: Comment[]): number => comments.reduce((n, c) => n + 1 + count(c.children), 0);
