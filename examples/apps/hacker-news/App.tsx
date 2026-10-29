// A Hacker News reader: fetch + TanStack Query, tabs, infinite lists, pull to
// refresh, nested comments, links, and saved stories in localStorage.
import { QueryClient, QueryClientProvider, useInfiniteQuery } from "@tanstack/react-query";
import {
  TabView, Tab, Navigator, useNavigation, Screen, VirtualList, VStack, HStack, Text, Button, ProgressView, Spacer, SwipeActions, Label,
  ContentUnavailable,
} from "swiftjsx";
import { feeds, fetchFeed, domain, comments, type Feed, type Story } from "./api";
import { useSaved, useIsSaved } from "./saved";
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
        <ContentUnavailable systemImage="wifi.exclamationmark" title="Couldn’t Load Stories" description={query.error.message}>
          <Button title="Try Again" buttonStyle="bordered" onPress={() => query.refetch()} />
        </ContentUnavailable>
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
        <ContentUnavailable systemImage="bookmark" title="No Saved Stories" description="Stories you save show up here." />
      )}
    </Screen>
  );
}

function StoryRow({ story, rank }: { story: Story; rank?: number }) {
  const nav = useNavigation();
  const site = domain(story.url);
  const saved = useIsSaved(story.id);
  const toggleSaved = useSaved((s) => s.toggle);
  return (
    <Button buttonStyle="plain" onPress={() => nav.push(<StoryScreen story={story} />)}>
      <HStack alignment="top" spacing={12} padding={{ vertical: 4 }}>
        {rank ? <Text font="callout" monospacedDigit foregroundStyle="secondary" frame={{ width: 28, alignment: "trailing" }}>{rank}</Text> : null}
        <VStack alignment="leading" spacing={4}>
          <Text font="body" fontWeight="medium" lineLimit={3}>{story.title}</Text>
          <HStack spacing={4}>
            {site ? <Text font="caption" foregroundStyle="accent" lineLimit={1}>{site}</Text> : null}
            <Text font="caption" foregroundStyle="secondary" lineLimit={1}>
              {site ? "· " : ""}▲ {story.points} · {comments(story.comments)} · <Text date={story.createdAt} dateStyle="ago" />
            </Text>
          </HStack>
        </VStack>
        <Spacer />
      </HStack>
      {/* UIKit swipe actions in the list-style VirtualList. */}
      <SwipeActions edge="trailing" allowsFullSwipe>
        <Button tint="orange" onPress={() => toggleSaved(story)}>
          <Label title={saved ? "Unsave" : "Save"} systemImage={saved ? "bookmark.slash" : "bookmark"} />
        </Button>
      </SwipeActions>
    </Button>
  );
}
