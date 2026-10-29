// Explore and search. With the field empty, Bluesky's Explore: trending
// topics as pills, suggested accounts with Follow buttons, and feeds to
// discover. As you type, people (typeahead); on submit, all matching people,
// and posts (signed in: the public AppView refuses post search).
import { useState } from "react";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import {
  Screen, ScrollView, VirtualList, VStack, HStack, Text, Image, Button, Spacer, LazyVStack, Flow, Rectangle, ContentUnavailable,
  useNavigation, useNow, useDebouncedValue, format,
} from "swiftjsx";
import {
  getPopularFeeds, getProfiles, getSuggestions, getTrendingTopics, getTrends, searchActors, searchActorsTypeahead, searchPosts,
} from "./api";
import { ActorRow } from "./ActorList";
import { FeedScreen } from "./FeedScreen";
import { PostCell } from "./PostCell";
import { useSession, useSettings } from "./session";
import { useUI } from "./store";
import {
  Avatar, ErrorView, FeedSkeleton, PillButton, ProfileRowSkeleton, Separator, Shimmer, Spinner, T, ty, useTheme,
} from "./ui";
import type { GeneratorView, PostView, ProfileView, Trend } from "./types";

type Scope = "people" | "posts";

export function SearchScreen() {
  const signedIn = useSession((s) => s.session !== null);
  const t = useTheme();
  const [text, setText] = useState("");
  const [submitted, setSubmitted] = useState<string | null>(null);
  const [scope, setScope] = useState<Scope>("people");
  const q = text.trim();
  const [typed, typing] = useDebouncedValue(q, 220);
  const showFull = submitted !== null && submitted === q;

  return (
    <Screen
      title="Explore"
      titleDisplayMode="inline"
      toolbarBackground={t.bg}
      searchText={text}
      onSearchTextChange={(value) => {
        setText(value);
        if (value.trim() !== submitted) setSubmitted(null);
      }}
      onSearchSubmit={(value) => setSubmitted(value.trim())}
      searchPrompt="Search for posts, users, or feeds"
      searchPlacement="navigationBar"
      searchScopes={signedIn ? [{ value: "people", label: "People" }, { value: "posts", label: "Posts" }] : undefined}
      searchScope={scope}
      onSearchScopeChange={(s) => setScope(s === "posts" ? "posts" : "people")}
    >
      {!q ? (
        <Explore />
      ) : scope === "posts" && signedIn ? (
        <PostResults query={q} />
      ) : showFull ? (
        <PeopleResults query={q} />
      ) : (
        <Typeahead query={typed} pending={typing} onSearchAll={() => setSubmitted(q)} />
      )}
    </Screen>
  );
}

// MARK: Explore (empty field)

/** Suggested accounts: the AppView's suggestions, or (signed out, when it has none) the people posting about what's trending. */
async function suggestedAccounts(trends: Trend[] | undefined, signal: AbortSignal): Promise<ProfileView[]> {
  const { actors } = await getSuggestions(signal).catch(() => ({ actors: [] as ProfileView[] }));
  if (actors.length) return actors;
  const dids = [...new Set((trends ?? []).flatMap((tr) => tr.actors.map((a) => a.did)))].slice(0, 8);
  if (!dids.length) return [];
  const { profiles } = await getProfiles(dids, signal);
  return profiles.filter((p) => p.description);
}

function Explore() {
  const t = useTheme();
  const trends = useQuery({ queryKey: ["trends"], queryFn: ({ signal }) => getTrends(signal) });
  const topics = useQuery({ queryKey: ["trending"], queryFn: ({ signal }) => getTrendingTopics(signal) });
  const feeds = useQuery({ queryKey: ["popular-feeds"], queryFn: ({ signal }) => getPopularFeeds(signal) });
  const people = useQuery({
    queryKey: ["suggested-people", trends.data ? "trends" : "none"],
    enabled: !trends.isPending,
    queryFn: ({ signal }) => suggestedAccounts(trends.data?.trends, signal),
  });
  // Rows for the top trends; pills for the other trending topics.
  const rows = (trends.data?.trends ?? []).slice(0, 5);
  const shown = new Set(rows.map((r) => r.link));
  const pills = (topics.data?.topics ?? []).filter((tp) => !shown.has(tp.link)).slice(0, 10);

  return (
    <ScrollView
      onRefresh={() => Promise.all([trends.refetch(), topics.refetch(), feeds.refetch(), people.refetch()])}
      frame={{ maxWidth: "infinity", maxHeight: "infinity" }}
      background={t.bg}
      accessibilityIdentifier="explore"
    >
      <VStack alignment="leading" spacing={0}>
        <SectionHeader icon="chart.line.uptrend.xyaxis" title="Trending" beta />
        {trends.isPending && topics.isPending ? (
          <PillSkeleton />
        ) : !rows.length && !pills.length ? (
          <Text font={ty(T.sm)} foregroundStyle={t.textMedium} padding={{ horizontal: 16, bottom: 8 }}>Nothing trending right now.</Text>
        ) : (
          <VStack alignment="leading" spacing={0}>
            {rows.map((trend, i) => (
              <TrendRow key={trend.link} trend={trend} rank={i + 1} />
            ))}
            {pills.length ? (
              <ScrollView axis="horizontal" showsIndicators={false} spacing={8} contentMargins={{ horizontal: 16 }} padding={{ top: 10, bottom: 4 }}>
                {pills.map((p, i) => (
                  <TopicPill key={p.link} title={p.displayName ?? p.topic} link={p.link} rank={rows.length + i + 1} />
                ))}
              </ScrollView>
            ) : null}
          </VStack>
        )}
        <SectionDivider />
        <SectionHeader icon="person.2" title="Suggested Accounts" />
        {people.isPending ? (
          <ProfileRowSkeleton count={3} />
        ) : people.data?.length ? (
          <VStack spacing={0}>
            {people.data.slice(0, 5).map((actor) => (
              <ActorRow key={actor.did} actor={actor} showBio />
            ))}
          </VStack>
        ) : (
          <Text font={ty(T.sm)} foregroundStyle={t.textMedium} padding={{ horizontal: 16, bottom: 8 }}>No suggestions right now.</Text>
        )}
        <SectionDivider />
        <SectionHeader icon="number" title="Discover New Feeds" />
        {feeds.isPending ? (
          <FeedSkeleton count={2} />
        ) : feeds.isError ? (
          <ErrorView error={feeds.error} retry={() => feeds.refetch()} />
        ) : (
          <LazyVStack spacing={0}>
            {feeds.data.feeds.map((feed) => (
              <FeedRow key={feed.uri} feed={feed} />
            ))}
          </LazyVStack>
        )}
        <VStack frame={{ height: 120 }} />
      </VStack>
    </ScrollView>
  );
}

function SectionHeader({ icon, title, beta = false }: { icon: string; title: string; beta?: boolean }) {
  const t = useTheme();
  return (
    <HStack spacing={8} padding={{ horizontal: 16, top: 18, bottom: 12 }} accessibilityElement="combine" accessibilityTraits="header">
      <Image systemName={icon} font={{ size: 18, weight: "semibold" }} foregroundStyle={t.primary} />
      <Text font={ty(T.xl, "bold")} foregroundStyle={t.text}>{title}</Text>
      {beta ? (
        <Text font={ty(11, "semibold")} foregroundStyle={t.primary} padding={{ horizontal: 6, vertical: 2 }} background={t.primarySubtle} cornerRadius={5}>BETA</Text>
      ) : null}
      <Spacer />
    </HStack>
  );
}

function SectionDivider() {
  const t = useTheme();
  return <VStack padding={{ top: 14 }}>
          <Rectangle fill={t.border} frame={{ maxWidth: "infinity", height: 0.5 }} />
        </VStack>;
}

function PillSkeleton() {
  const t = useTheme();
  const widths = [130, 90, 160, 110, 140, 80, 120];
  return (
    <VStack padding={{ horizontal: 16, bottom: 4 }}>
      <Flow spacing={8} lineSpacing={8}>
        {widths.map((w, i) => (
          <Rectangle key={i} fill={t.bg50} frame={{ width: w, height: 34 }} cornerRadius="capsule" />
        ))}
      </Flow>
      <Shimmer />
    </VStack>
  );
}

/** A trending topic's link is a feed on bsky.app ("/profile/did/feed/rkey"). */
function topicFeedURI(link: string): string | null {
  const m = link.match(/^\/profile\/([^/]+)\/feed\/([^/?#]+)/);
  return m ? `at://${m[1]}/app.bsky.feed.generator/${m[2]}` : null;
}

function TopicPill({ title, link, rank }: { title: string; link: string; rank: number }) {
  const nav = useNavigation();
  const t = useTheme();
  const uri = topicFeedURI(link);
  return (
    <Button onPress={() => uri && nav.push(<FeedScreen uri={uri} title={title} />)} pressedOpacity={0.6} accessibilityLabel={`Trending ${rank}: ${title}`} accessibilityIdentifier="trending-topic">
      <HStack spacing={5} padding={{ horizontal: 12, vertical: 8 }} background={t.bg25} cornerRadius="capsule" border={{ color: t.border, width: 1 }}>
        <Text font={ty(T.sm, "semibold")} foregroundStyle={t.textLow}>#</Text>
        <Text font={ty(T.sm, "semibold")} foregroundStyle={t.text} lineLimit={1}>{title}</Text>
      </HStack>
    </Button>
  );
}

/** Bluesky's trending row: rank, topic, "Hot" or its age, post count and category, and some of the people posting. */
function TrendRow({ trend, rank }: { trend: Trend; rank: number }) {
  const nav = useNavigation();
  const t = useTheme();
  const now = useNow();
  const uri = topicFeedURI(trend.link);
  const hot = trend.status === "hot";
  const meta = [`${format.compact(trend.postCount)} posts`, trend.category ? trend.category.charAt(0).toUpperCase() + trend.category.slice(1) : null].filter(Boolean).join(" · ");
  return (
    <Button onPress={() => uri && nav.push(<FeedScreen uri={uri} title={trend.displayName} />)} pressedOpacity={0.6} accessibilityLabel={`Trending ${rank}: ${trend.displayName}`} accessibilityIdentifier="trending-topic">
      <HStack spacing={10} padding={{ horizontal: 16, vertical: 9 }} frame={{ maxWidth: "infinity", alignment: "leading" }} contentShape="rectangle">
        <Text font={ty(T.md, "semibold")} foregroundStyle={t.textLow} monospacedDigit frame={{ width: 22, alignment: "leading" }}>{rank}.</Text>
        <VStack alignment="leading" spacing={3}>
          <Text font={ty(T.md, "semibold")} foregroundStyle={t.text} lineLimit={1}>{trend.displayName}</Text>
          <HStack spacing={6}>
            {hot ? (
              <HStack spacing={3} padding={{ horizontal: 6, vertical: 2 }} background={t.name === "light" ? "#FFE9E2" : "#FF6A3D/20"} cornerRadius={5}>
                <Image systemName="flame.fill" font={{ size: 10 }} foregroundStyle="#FF6A3D" />
                <Text font={ty(11, "bold")} foregroundStyle="#E8572B">Hot</Text>
              </HStack>
            ) : (
              <Text font={ty(T.xs, "medium")} foregroundStyle={t.textMedium}>{format.relativeTime(Date.parse(trend.startedAt), { now })} ago</Text>
            )}
            <Text font={ty(T.xs)} foregroundStyle={t.textMedium} lineLimit={1}>{meta}</Text>
          </HStack>
        </VStack>
        <Spacer minLength={6} />
        <HStack spacing={-7}>
          {trend.actors.slice(0, 3).map((a) => (
            <VStack key={a.did} padding={1.5} background={t.bg} cornerRadius="capsule">
              <Avatar uri={a.avatar} size={22} />
            </VStack>
          ))}
        </HStack>
      </HStack>
    </Button>
  );
}

/** A feed: its avatar, name, creator, description, likes, and Pin (signed in). */
export function FeedRow({ feed }: { feed: GeneratorView }) {
  const nav = useNavigation();
  const t = useTheme();
  const signedIn = useSession((s) => s.session !== null);
  const pinned = useSettings((s) => s.pinnedFeeds.includes(feed.uri));
  const togglePinned = useSettings((s) => s.togglePinned);
  const openSignIn = useUI((s) => s.openSignIn);
  return (
    <VStack spacing={0}>
      <Button pressedOpacity={0.7} onPress={() => nav.push(<FeedScreen uri={feed.uri} title={feed.displayName} />)} accessibilityIdentifier="feed-row">
        <VStack alignment="leading" spacing={8} padding={{ horizontal: 16, vertical: 14 }} frame={{ maxWidth: "infinity", alignment: "leading" }} contentShape="rectangle">
          <HStack spacing={12}>
            <Avatar uri={feed.avatar} size={40} square />
            <VStack alignment="leading" spacing={1}>
              <Text font={ty(T.md, "bold")} foregroundStyle={t.text} lineLimit={1}>{feed.displayName}</Text>
              <Text font={ty(T.sm)} foregroundStyle={t.textMedium} lineLimit={1}>Feed by @{feed.creator.handle}</Text>
            </VStack>
            <Spacer />
            <PillButton
              title={pinned ? "Pinned" : "Pin Feed"}
              systemImage={pinned ? "checkmark" : "pin"}
              variant={pinned ? "secondary" : "primary"}
              small
              onPress={() => (signedIn ? togglePinned(feed.uri) : openSignIn("pin feeds to your Home"))}
            />
          </HStack>
          {feed.description ? <Text font={ty(T.md)} foregroundStyle={t.text} lineLimit={3} lineSpacing={2}>{feed.description}</Text> : null}
          {feed.likeCount ? (
            <Text font={ty(T.sm, "medium")} foregroundStyle={t.textMedium}>Liked by {format.compact(feed.likeCount)} {format.count(feed.likeCount, { one: "user", other: "users" })}</Text>
          ) : null}
        </VStack>
      </Button>
      <Separator />
    </VStack>
  );
}

// MARK: People

function Typeahead({ query, pending, onSearchAll }: { query: string; pending: boolean; onSearchAll(): void }) {
  const t = useTheme();
  const result = useQuery({
    queryKey: ["typeahead", query],
    queryFn: ({ signal }) => searchActorsTypeahead(query, signal),
    enabled: query.length > 0,
    placeholderData: (previous) => previous,
  });
  const actors = result.data?.actors ?? [];
  return (
    <ScrollView frame={{ maxWidth: "infinity", maxHeight: "infinity" }} background={t.bg} accessibilityIdentifier="typeahead">
      <LazyVStack spacing={0}>
        {query ? (
          <Button pressedOpacity={0.6} onPress={onSearchAll} accessibilityIdentifier="search-all-people">
            <HStack spacing={12} padding={{ horizontal: 16, vertical: 14 }} frame={{ maxWidth: "infinity", alignment: "leading" }} contentShape="rectangle">
              <Image systemName="magnifyingglass" font={{ size: 16, weight: "semibold" }} foregroundStyle={t.textMedium} frame={{ width: 40 }} />
              <Text font={ty(T.md)} foregroundStyle={t.text} lineLimit={1}>
                Search for <Text fontWeight="bold">“{query}”</Text>
              </Text>
            </HStack>
          </Button>
        ) : null}
        <Separator />
        {actors.map((actor) => (
          <ActorRow key={actor.did} actor={actor} showBio={false} />
        ))}
        {result.isFetching || pending ? <Spinner height={56} /> : null}
        {!actors.length && !result.isFetching && !pending && result.isSuccess ? <ContentUnavailable search={query} frame={{ minHeight: 280 }} /> : null}
      </LazyVStack>
    </ScrollView>
  );
}

function PeopleResults({ query }: { query: string }) {
  const t = useTheme();
  const result = useInfiniteQuery({
    queryKey: ["search-actors", query],
    queryFn: ({ pageParam, signal }) => searchActors(query, pageParam, signal),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last) => (last.cursor && last.actors.length ? last.cursor : undefined),
  });
  const seen = new Set<string>();
  const actors = (result.data?.pages ?? []).flatMap((p) => p.actors).filter((a) => !seen.has(a.did) && !!seen.add(a.did));
  if (result.isPending) return <ProfileRowSkeleton />;
  if (result.isError) return <ErrorView error={result.error} retry={() => result.refetch()} />;
  return (
    <VirtualList
      data={actors}
      keyExtractor={(a) => a.did}
      estimatedItemHeight={88}
      renderItem={(actor) => <ActorRow actor={actor} />}
      footer={result.hasNextPage ? <Spinner height={64} /> : actors.length ? null : <ContentUnavailable search={query} frame={{ minHeight: 280 }} />}
      onEndReached={() => {
        if (result.hasNextPage && !result.isFetchingNextPage) result.fetchNextPage();
      }}
      frame={{ maxWidth: "infinity", maxHeight: "infinity" }}
      background={t.bg}
      accessibilityIdentifier="people-results"
    />
  );
}

// MARK: Posts (signed in)

function PostResults({ query, sort = "top" }: { query: string; sort?: "top" | "latest" }) {
  const t = useTheme();
  const result = useInfiniteQuery({
    queryKey: ["search-posts", query, sort],
    queryFn: ({ pageParam, signal }) => searchPosts(query, sort, pageParam, signal),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last) => (last.cursor && last.posts.length ? last.cursor : undefined),
  });
  const seen = new Set<string>();
  const posts: PostView[] = (result.data?.pages ?? []).flatMap((p) => p.posts).filter((p) => !seen.has(p.uri) && !!seen.add(p.uri));
  if (result.isPending) return <FeedSkeleton />;
  if (result.isError) return <ErrorView error={result.error} retry={() => result.refetch()} />;
  return (
    <VirtualList
      data={posts}
      keyExtractor={(p) => p.uri}
      estimatedItemHeight={240}
      renderItem={(post) => <PostCell post={post} />}
      footer={result.hasNextPage ? <Spinner height={64} /> : posts.length ? null : <ContentUnavailable search={query} frame={{ minHeight: 280 }} />}
      onEndReached={() => {
        if (result.hasNextPage && !result.isFetchingNextPage) result.fetchNextPage();
      }}
      onRefresh={() => result.refetch()}
      frame={{ maxWidth: "infinity", maxHeight: "infinity" }}
      background={t.bg}
    />
  );
}

/** Posts matching a query (a #hashtag), pushed: Top and Latest tabs. Signed out, a prompt instead. */
export function PostSearchScreen({ query }: { query: string }) {
  const signedIn = useSession((s) => s.session !== null);
  const openSignIn = useUI((s) => s.openSignIn);
  const t = useTheme();
  const [sort, setSort] = useState<"top" | "latest">("top");
  return (
    <Screen title={query} titleDisplayMode="inline" toolbarBackground={t.bg}>
      {signedIn ? (
        <VStack spacing={0} frame={{ maxWidth: "infinity", maxHeight: "infinity" }} background={t.bg}>
          <HStack spacing={0}>
            {(["top", "latest"] as const).map((s) => (
              <Button key={s} pressedOpacity={0.6} onPress={() => setSort(s)} frame={{ maxWidth: "infinity" }}>
                <VStack spacing={8} padding={{ top: 10 }}>
                  <Text font={ty(T.md, "semibold")} foregroundStyle={sort === s ? t.text : t.textMedium}>{s === "top" ? "Top" : "Latest"}</Text>
                  <Rectangle fill={sort === s ? t.primary : "clear"} frame={{ width: 40, height: 3 }} cornerRadius="capsule" />
                </VStack>
              </Button>
            ))}
          </HStack>
          <Separator />
          <PostResults key={sort} query={query} sort={sort} />
        </VStack>
      ) : (
        <ContentUnavailable
          systemImage="number"
          title="Sign in to search posts"
          description="Bluesky only lets signed-in accounts search posts."
          frame={{ maxWidth: "infinity", maxHeight: "infinity" }}
          background={t.bg}
        >
          <PillButton title="Sign in" onPress={() => openSignIn("search posts")} />
        </ContentUnavailable>
      )}
    </Screen>
  );
}
