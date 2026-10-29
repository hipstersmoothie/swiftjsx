// Feeds: a paged list of posts (VirtualList) with skeletons, errors and retry,
// pull to refresh and infinite scroll by cursor. Plus a screen for any feed
// generator (Discover, a trending topic, a pinned feed).
import type { ReactNode, Ref } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { Screen, VirtualList, VStack, ToolbarItem, Button, Image, ContentUnavailable, useEnvironment, type HostInstance, type SharedValue } from "swiftjsx";
import { getFeed } from "./api";
import { FeedItem } from "./PostCell";
import { useSession, useSettings } from "./session";
import { EndOfFeed, ErrorView, FeedSkeleton, Spinner, useTheme } from "./ui";
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
  /** Room above the first post, under a floating header. */
  contentTop?: number;
  /** Gets the scroll offset on the main thread every frame (for worklet styles). */
  scrollOffset?: SharedValue<{ x: number; y: number }>;
  onScrollPhaseChange?: (phase: "idle" | "tracking" | "interacting" | "decelerating" | "animating") => void;
  /** Pinned under the bar while `header` scrolls away (a profile's tabs). */
  stickyHeader?: ReactNode;
  listRef?: Ref<HostInstance>;
  /** Goes under the safe area (a header draws there instead). */
  ignoresTop?: boolean;
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

export function FeedList({ queryKey, fetchPage, header, empty, id = "feed", filter, onRefresh, contentTop = 0, scrollOffset, onScrollPhaseChange, stickyHeader, listRef, ignoresTop = false }: FeedListProps) {
  const { query, items: all } = useFeed(queryKey, fetchPage);
  const { window } = useEnvironment();
  const t = useTheme();
  const items = filter ? all.filter(filter) : all;
  const margins = contentTop ? { top: contentTop } : undefined;

  if (query.isError && !items.length && !header) {
    return (
      <VStack padding={{ top: contentTop }} frame={{ maxWidth: "infinity", maxHeight: "infinity" }} background={t.bg}>
        <ErrorView error={query.error} retry={() => query.refetch()} />
      </VStack>
    );
  }

  return (
    <VirtualList
      ref={listRef}
      data={query.isPending ? ([] as FeedViewPost[]) : items}
      keyExtractor={keyOf}
      estimatedItemHeight={Math.round(window.width * 0.75)}
      renderItem={(item) => <FeedItem item={item} />}
      header={header}
      stickyHeader={stickyHeader}
      footer={
        query.isPending ? (
          <FeedSkeleton count={header ? 3 : 7} />
        ) : query.isError && !items.length ? (
          <ErrorView error={query.error} retry={() => query.refetch()} />
        ) : query.hasNextPage ? (
          <Spinner />
        ) : items.length ? (
          <EndOfFeed />
        ) : (
          <ContentUnavailable systemImage={empty?.icon ?? "text.bubble"} title={empty?.title ?? "This feed is empty."} description={empty?.message} frame={{ minHeight: 280 }} />
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
      contentMargins={margins}
      scrollOffset={scrollOffset}
      onScrollPhaseChange={onScrollPhaseChange}
      ignoresSafeArea={ignoresTop ? "top" : undefined}
      frame={{ maxWidth: "infinity", maxHeight: "infinity" }}
      background={t.bg}
      accessibilityIdentifier={id}
    />
  );
}

/** A feed generator on its own screen. */
export function FeedScreen({ uri, title }: { uri: string; title: string }) {
  const signedIn = useSession((s) => s.session !== null);
  const pinned = useSettings((s) => s.pinnedFeeds.includes(uri));
  const togglePinned = useSettings((s) => s.togglePinned);
  const t = useTheme();
  return (
    <Screen title={title} titleDisplayMode="inline" toolbarBackground={t.bg}>
      {signedIn ? (
        <ToolbarItem placement="primaryAction">
          <Button onPress={() => togglePinned(uri)} accessibilityLabel={pinned ? "Unpin from Home" : "Pin to Home"}>
            <Image systemName={pinned ? "pin.fill" : "pin"} foregroundStyle={t.primary} />
          </Button>
        </ToolbarItem>
      ) : null}
      <VStack frame={{ maxWidth: "infinity", maxHeight: "infinity" }} background={t.bg}>
        <FeedList queryKey={["feed", uri]} fetchPage={(cursor, signal) => getFeed(uri, cursor, signal)} />
      </VStack>
    </Screen>
  );
}
