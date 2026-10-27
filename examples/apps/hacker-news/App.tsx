// A Hacker News reader: fetch + TanStack Query, tabs, infinite lists, pull to
// refresh, nested comments, links, and saved stories in localStorage.
import { QueryClient, QueryClientProvider, useInfiniteQuery } from "@tanstack/react-query";
import {
  TabView, Tab, Navigator, useNavigation, Screen, VirtualList, VStack, HStack, Text, Image, Button, ProgressView, Spacer,
} from "swiftjsx";
import { feeds, fetchFeed, ago, domain, type Feed, type Story } from "./api";
import { useSaved } from "./saved";
import { StoryScreen } from "./StoryScreen";

const queryClient = new QueryClient({ defaultOptions: { queries: { staleTime: 60_000 } } });

export function HackerNewsApp() {
  const savedCount = useSaved((s) => s.stories.length);
  return (
    <QueryClientProvider client={queryClient}>
      <TabView>
        {feeds.map((feed) => (
          <Tab key={feed.id} value={feed.id} title={feed.title} systemImage={feed.icon}>
            <Navigator>
              <FeedScreen feed={feed} />
            </Navigator>
          </Tab>
        ))}
        <Tab value="saved" title="Saved" systemImage="bookmark" badge={savedCount}>
          <Navigator>
            <SavedScreen />
          </Navigator>
        </Tab>
      </TabView>
    </QueryClientProvider>
  );
}

function FeedScreen({ feed }: { feed: Feed }) {
  const query = useInfiniteQuery({
    queryKey: ["feed", feed.id],
    queryFn: ({ pageParam, signal }) => fetchFeed(feed, pageParam, signal),
    initialPageParam: 0,
    getNextPageParam: (last) => (last.page + 1 < last.pages ? last.page + 1 : undefined),
  });
  // Pages can overlap as new stories arrive; keep the first of each.
  const seen = new Set<string>();
  const stories = (query.data?.pages ?? []).flatMap((p) => p.stories).filter((s) => !seen.has(s.id) && seen.add(s.id));

  return (
    <Screen title={feed.title === "Top" ? "Hacker News" : feed.title} titleDisplayMode="inline">
      {query.isPending ? (
        <ProgressView frame={{ maxWidth: "infinity", maxHeight: "infinity" }} />
      ) : query.isError ? (
        <ErrorView message={query.error.message} retry={() => query.refetch()} />
      ) : (
        <VirtualList
          data={stories}
          keyExtractor={(s) => s.id}
          listStyle="list"
          estimatedItemHeight={76}
          renderItem={(story, i) => <StoryRow story={story} rank={i + 1} />}
          onEndReached={() => query.hasNextPage && !query.isFetchingNextPage && query.fetchNextPage()}
          onRefresh={() => query.refetch()}
        />
      )}
    </Screen>
  );
}

function SavedScreen() {
  const stories = useSaved((s) => s.stories);
  return (
    <Screen title="Saved" titleDisplayMode="inline">
      {stories.length ? (
        <VirtualList data={stories} keyExtractor={(s) => s.id} listStyle="list" estimatedItemHeight={76} renderItem={(story) => <StoryRow story={story} />} />
      ) : (
        <VStack spacing={8} frame={{ maxWidth: "infinity", maxHeight: "infinity" }}>
          <Image systemName="bookmark" font="largeTitle" foregroundStyle="secondary" />
          <Text foregroundStyle="secondary">Stories you save show up here.</Text>
        </VStack>
      )}
    </Screen>
  );
}

function StoryRow({ story, rank }: { story: Story; rank?: number }) {
  const nav = useNavigation();
  const site = domain(story.url);
  return (
    <Button buttonStyle="plain" onPress={() => nav.push(<StoryScreen story={story} />)}>
      <HStack alignment="top" spacing={12} padding={{ vertical: 4 }}>
        {rank ? <Text font="callout" monospacedDigit foregroundStyle="secondary" frame={{ width: 28, alignment: "trailing" }}>{rank}</Text> : null}
        <VStack alignment="leading" spacing={4}>
          <Text font="body" fontWeight="medium" lineLimit={3}>{story.title}</Text>
          <HStack spacing={4}>
            {site ? <Text font="caption" foregroundStyle="accent" lineLimit={1}>{site}</Text> : null}
            <Text font="caption" foregroundStyle="secondary" lineLimit={1}>
              {site ? "· " : ""}▲ {story.points} · {story.comments} comments · {ago(story.createdAt)}
            </Text>
          </HStack>
        </VStack>
        <Spacer />
      </HStack>
    </Button>
  );
}

function ErrorView({ message, retry }: { message: string; retry(): void }) {
  return (
    <VStack spacing={12} padding={24} frame={{ maxWidth: "infinity", maxHeight: "infinity" }}>
      <Image systemName="wifi.exclamationmark" font="largeTitle" foregroundStyle="secondary" />
      <Text textAlignment="center" foregroundStyle="secondary">{message}</Text>
      <Button title="Try again" buttonStyle="bordered" onPress={retry} />
    </VStack>
  );
}
