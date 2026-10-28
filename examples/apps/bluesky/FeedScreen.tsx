// Feeds: a paged list of posts (VirtualList) with skeletons, errors and retry,
// pull to refresh and infinite scroll by cursor. Plus a screen for any feed
// generator (Discover, a trending topic, a pinned feed).
import type { ReactNode } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { Screen, VirtualList, VStack, ProgressView, ToolbarItem, Button, Image, useEnvironment } from "swiftjsx";
import { getFeed } from "./api";
import { FeedItem } from "./PostCell";
import { useSession, useSettings } from "./session";
import { EmptyState, EndOfFeed, ErrorView, FeedSkeleton, screenBackground, brand } from "./ui";
import type { FeedPage, FeedViewPost } from "./types";

type FeedListProps = {
  queryKey: readonly unknown[];
  fetchPage: (cursor: string | undefined, signal: AbortSignal) => Promise<FeedPage>;
  /** Scrolls with the posts (a profile header). */
  header?: ReactNode;
  empty?: { icon: string; title: string; message?: string };
  id?: string;
  /** Keep only some posts (e.g. a profile's Media tab). */
  filter?: (item: FeedViewPost) => boolean;
  /** Also on pull to refresh (a profile reloads its header). */
  onRefresh?: () => void;
};

const keyOf = (item: FeedViewPost) =>
  item.reason?.$type === "app.bsky.feed.defs#reasonRepost" ? `${item.post.uri}:${item.reason.by.did}` : item.post.uri;

export function useFeed(queryKey: readonly unknown[], fetchPage: FeedListProps["fetchPage"]) {
  const query = useInfiniteQuery({
    queryKey,
    queryFn: ({ pageParam, signal }) => fetchPage(pageParam, signal),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last) => (last.cursor && last.feed.length ? last.cursor : undefined),
  });
  // Pages overlap as new posts arrive: keep the first of each.
  const seen = new Set<string>();
  const items: FeedViewPost[] = [];
  for (const page of query.data?.pages ?? []) {
    for (const item of page.feed) {
      const key = keyOf(item);
      if (seen.has(key)) continue;
      seen.add(key);
      items.push(item);
    }
  }
  return { query, items };
}

export function FeedList({ queryKey, fetchPage, header, empty, id = "feed", filter, onRefresh }: FeedListProps) {
  const { query, items: all } = useFeed(queryKey, fetchPage);
  const { window } = useEnvironment();
  const items = filter ? all.filter(filter) : all;

  if (query.isPending) {
    return (
      <VirtualList
        data={[] as FeedViewPost[]}
        renderItem={() => null}
        header={header}
        footer={<FeedSkeleton count={header ? 3 : 7} />}
        frame={{ maxWidth: "infinity", maxHeight: "infinity" }}
        background={screenBackground}
      />
    );
  }
  if (query.isError && !items.length) {
    return header ? (
      <VirtualList data={[] as FeedViewPost[]} renderItem={() => null} header={header} footer={<ErrorView error={query.error} retry={() => query.refetch()} />} frame={{ maxWidth: "infinity", maxHeight: "infinity" }} />
    ) : (
      <ErrorView error={query.error} retry={() => query.refetch()} />
    );
  }

  return (
    <VirtualList
      data={items}
      keyExtractor={keyOf}
      estimatedItemHeight={Math.round(window.width * 0.75)}
      renderItem={(item) => <FeedItem item={item} />}
      header={header}
      footer={
        query.hasNextPage ? (
          <ProgressView frame={{ maxWidth: "infinity", height: 72 }} />
        ) : items.length ? (
          <EndOfFeed />
        ) : (
          <EmptyState icon={empty?.icon ?? "text.bubble"} title={empty?.title ?? "No posts yet"} message={empty?.message} />
        )
      }
      onEndReached={() => {
        if (query.hasNextPage && !query.isFetchingNextPage) query.fetchNextPage();
      }}
      onEndReachedThreshold={6}
      onRefresh={() => {
        onRefresh?.();
        return query.refetch();
      }}
      frame={{ maxWidth: "infinity", maxHeight: "infinity" }}
      background={screenBackground}
      accessibilityIdentifier={id}
    />
  );
}

/** A feed generator on its own screen. */
export function FeedScreen({ uri, title }: { uri: string; title: string }) {
  const signedIn = useSession((s) => s.session !== null);
  const pinned = useSettings((s) => s.pinnedFeeds.includes(uri));
  const togglePinned = useSettings((s) => s.togglePinned);
  return (
    <Screen title={title} titleDisplayMode="inline">
      {signedIn ? (
        <ToolbarItem placement="primaryAction">
          <Button onPress={() => togglePinned(uri)} accessibilityLabel={pinned ? "Unpin from Home" : "Pin to Home"}>
            <Image systemName={pinned ? "pin.fill" : "pin"} foregroundStyle={brand} />
          </Button>
        </ToolbarItem>
      ) : null}
      <VStack frame={{ maxWidth: "infinity", maxHeight: "infinity" }}>
        <FeedList queryKey={["feed", uri]} fetchPage={(cursor, signal) => getFeed(uri, cursor, signal)} />
      </VStack>
    </Screen>
  );
}
