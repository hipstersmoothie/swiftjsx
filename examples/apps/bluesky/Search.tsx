// Search: trending topics, suggested feeds and accounts while the field is
// empty; people as you type (typeahead), all matching people on submit, and
// posts (signed in: the public AppView refuses post search).
import { useEffect, useState } from "react";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import {
  Screen, ScrollView, VirtualList, VStack, HStack, Text, Image, Button, Spacer, ProgressView, LazyVStack, useNavigation,
} from "swiftjsx";
import { getSuggestions, getSuggestedFeeds, getTrendingTopics, searchActors, searchActorsTypeahead, searchPosts } from "./api";
import { compact, displayName } from "./format";
import { ProfileScreen } from "./Profile";
import { ActorRow } from "./ActorList";
import { FeedScreen } from "./FeedScreen";
import { PostCell } from "./PostCell";
import { useSession } from "./session";
import { useUI } from "./store";
import { Avatar, EmptyState, ErrorView, FeedSkeleton, PillButton, Separator, brand, cardBackground, screenBackground, subtle } from "./ui";
import type { GeneratorView, PostView, ProfileView, TrendingTopic } from "./types";

function useDebounced<T>(value: T, ms: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), ms);
    return () => clearTimeout(timer);
  }, [value, ms]);
  return debounced;
}

type Scope = "people" | "posts";

export function SearchScreen() {
  const signedIn = useSession((s) => s.session !== null);
  const [text, setText] = useState("");
  const [submitted, setSubmitted] = useState<string | null>(null);
  const [scope, setScope] = useState<Scope>("people");
  const q = text.trim();
  const typed = useDebounced(q, 220);
  const showFull = submitted !== null && submitted === q;

  return (
    <Screen
      title="Search"
      searchText={text}
      onSearchTextChange={(t) => {
        setText(t);
        if (t.trim() !== submitted) setSubmitted(null);
      }}
      onSearchSubmit={(t) => setSubmitted(t.trim())}
      searchPrompt={signedIn ? "Search people and posts" : "Search for people"}
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
        <Typeahead query={typed} pending={typed !== q} onSearchAll={() => setSubmitted(q)} />
      )}
    </Screen>
  );
}

// MARK: Explore (empty field)

function Explore() {
  const trending = useQuery({ queryKey: ["trending"], queryFn: ({ signal }) => getTrendingTopics(signal) });
  const feeds = useQuery({ queryKey: ["suggested-feeds"], queryFn: ({ signal }) => getSuggestedFeeds(undefined, signal) });
  const people = useQuery({ queryKey: ["suggested-people"], queryFn: ({ signal }) => getSuggestions(signal) });
  return (
    <ScrollView
      onRefresh={() => Promise.all([trending.refetch(), feeds.refetch(), people.refetch()])}
      frame={{ maxWidth: "infinity", maxHeight: "infinity" }}
      background={screenBackground}
      accessibilityIdentifier="explore"
    >
      <VStack alignment="leading" spacing={0}>
        <SectionTitle icon="chart.line.uptrend.xyaxis" title="Trending" />
        {trending.isPending ? (
          <ProgressView frame={{ maxWidth: "infinity", height: 80 }} />
        ) : trending.isError ? (
          <ErrorView error={trending.error} retry={() => trending.refetch()} />
        ) : (
          // Two staggered rows of chips that scroll sideways together.
          <ScrollView axis="horizontal" showsIndicators={false} contentMargins={{ horizontal: 16 }}>
            <VStack alignment="leading" spacing={8}>
              {[0, 1].map((row) => (
                <HStack key={row} spacing={8}>
                  {trending.data.topics.map((topic, i) => (i % 2 === row ? <TopicChip key={topic.link} topic={topic} rank={i + 1} /> : null))}
                </HStack>
              ))}
            </VStack>
          </ScrollView>
        )}
        {people.data?.actors.length ? (
          <VStack alignment="leading" spacing={0}>
            <SectionTitle icon="person.2" title="Suggested accounts" />
            <ScrollView axis="horizontal" showsIndicators={false} spacing={10} contentMargins={{ horizontal: 16 }}>
              {people.data.actors.map((actor) => (
                <PersonCard key={actor.did} actor={actor} />
              ))}
            </ScrollView>
          </VStack>
        ) : null}
        <SectionTitle icon="number" title="Discover new feeds" />
        {feeds.isPending ? (
          <FeedSkeleton count={3} />
        ) : feeds.isError ? (
          <ErrorView error={feeds.error} retry={() => feeds.refetch()} />
        ) : (
          <LazyVStack spacing={0}>
            {feeds.data.feeds.map((feed) => (
              <FeedRow key={feed.uri} feed={feed} />
            ))}
          </LazyVStack>
        )}
      </VStack>
    </ScrollView>
  );
}

function PersonCard({ actor }: { actor: ProfileView }) {
  const nav = useNavigation();
  return (
    <Button onPress={() => nav.push(<ProfileScreen actor={actor.did} initial={actor} />)} pressedScale={0.96} accessibilityLabel={`${displayName(actor)}, @${actor.handle}`} accessibilityIdentifier="suggested-person">
      <VStack spacing={6} padding={14} frame={{ width: 150, height: 196, alignment: "top" }} background={cardBackground} cornerRadius={16}>
        <Avatar uri={actor.avatar} size={64} />
        <Text font="subheadline" fontWeight="bold" lineLimit={1}>{displayName(actor)}</Text>
        <Text font="caption" foregroundStyle={subtle} lineLimit={1}>@{actor.handle}</Text>
        {actor.description ? <Text font="caption" lineLimit={3} textAlignment="center">{actor.description.replace(/\s+/g, " ")}</Text> : null}
      </VStack>
    </Button>
  );
}

function SectionTitle({ icon, title }: { icon: string; title: string }) {
  return (
    <HStack spacing={8} padding={{ horizontal: 16, top: 20, bottom: 12 }}>
      <Image systemName={icon} font="headline" foregroundStyle={brand} />
      <Text font="title3" fontWeight="bold" accessibilityTraits="header">{title}</Text>
    </HStack>
  );
}

/** A trending topic's link is a feed on bsky.app ("/profile/did/feed/rkey"). */
function topicFeedURI(link: string): string | null {
  const m = link.match(/^\/profile\/([^/]+)\/feed\/([^/?#]+)/);
  return m ? `at://${m[1]}/app.bsky.feed.generator/${m[2]}` : null;
}

function TopicChip({ topic, rank }: { topic: TrendingTopic; rank: number }) {
  const nav = useNavigation();
  const uri = topicFeedURI(topic.link);
  const title = topic.displayName ?? topic.topic;
  return (
    <Button
      onPress={() => uri && nav.push(<FeedScreen uri={uri} title={title} />)}
      pressedScale={0.96}
      accessibilityLabel={`Trending ${rank}: ${title}`}
      accessibilityIdentifier="trending-topic"
    >
      <HStack spacing={6} padding={{ horizontal: 12, vertical: 8 }} background={cardBackground} cornerRadius="capsule">
        <Text font="footnote" fontWeight="bold" foregroundStyle={subtle} monospacedDigit>{rank}.</Text>
        <Text font="subheadline" fontWeight="medium" lineLimit={1}>{title}</Text>
      </HStack>
    </Button>
  );
}

function FeedRow({ feed }: { feed: GeneratorView }) {
  const nav = useNavigation();
  return (
    <VStack spacing={0}>
      <Button buttonStyle="plain" onPress={() => nav.push(<FeedScreen uri={feed.uri} title={feed.displayName} />)} accessibilityIdentifier="feed-row">
        <HStack alignment="top" spacing={12} padding={{ horizontal: 16, vertical: 12 }} contentShape="rectangle">
          <Avatar uri={feed.avatar} size={44} square />
          <VStack alignment="leading" spacing={2}>
            <Text font="subheadline" fontWeight="bold" lineLimit={1}>{feed.displayName}</Text>
            <Text font="footnote" foregroundStyle={subtle} lineLimit={1}>Feed by @{feed.creator.handle}</Text>
            {feed.description ? <Text font="footnote" lineLimit={2} padding={{ top: 3 }}>{feed.description}</Text> : null}
            {feed.likeCount ? (
              <Text font="caption" foregroundStyle={subtle} padding={{ top: 2 }}>Liked by {compact(feed.likeCount)} users</Text>
            ) : null}
          </VStack>
          <Spacer />
          <Image systemName="chevron.right" font="footnote" fontWeight="semibold" foregroundStyle={subtle} padding={{ top: 14 }} />
        </HStack>
      </Button>
      <Separator inset={72} />
    </VStack>
  );
}

// MARK: People

function Typeahead({ query, pending, onSearchAll }: { query: string; pending: boolean; onSearchAll(): void }) {
  const result = useQuery({
    queryKey: ["typeahead", query],
    queryFn: ({ signal }) => searchActorsTypeahead(query, signal),
    enabled: query.length > 0,
    placeholderData: (previous) => previous,
  });
  const actors = result.data?.actors ?? [];
  return (
    <ScrollView frame={{ maxWidth: "infinity", maxHeight: "infinity" }} background={screenBackground} accessibilityIdentifier="typeahead">
      <LazyVStack spacing={0}>
        {actors.map((actor) => (
          <ActorRow key={actor.did} actor={actor} showBio={false} />
        ))}
        {result.isFetching || pending ? <ProgressView padding={16} /> : null}
        {query ? (
          <Button buttonStyle="plain" onPress={onSearchAll} accessibilityIdentifier="search-all-people">
            <HStack spacing={10} padding={16} frame={{ maxWidth: "infinity", alignment: "leading" }} contentShape="rectangle">
              <Image systemName="magnifyingglass" foregroundStyle={brand} />
              <Text font="subheadline" foregroundStyle={brand}>Search all people for “{query}”</Text>
            </HStack>
          </Button>
        ) : null}
        {!actors.length && !result.isFetching && !pending && result.isSuccess ? <EmptyState icon="person.fill.questionmark" title="No one found" message="Try a handle or a name." /> : null}
      </LazyVStack>
    </ScrollView>
  );
}

function PeopleResults({ query }: { query: string }) {
  const result = useInfiniteQuery({
    queryKey: ["search-actors", query],
    queryFn: ({ pageParam, signal }) => searchActors(query, pageParam, signal),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last) => (last.cursor && last.actors.length ? last.cursor : undefined),
  });
  const seen = new Set<string>();
  const actors = (result.data?.pages ?? []).flatMap((p) => p.actors).filter((a) => !seen.has(a.did) && !!seen.add(a.did));
  if (result.isPending) return <FeedSkeleton count={6} />;
  if (result.isError) return <ErrorView error={result.error} retry={() => result.refetch()} />;
  return (
    <VirtualList
      data={actors}
      keyExtractor={(a) => a.did}
      estimatedItemHeight={88}
      renderItem={(actor) => <ActorRow actor={actor} />}
      footer={result.hasNextPage ? <ProgressView frame={{ maxWidth: "infinity", height: 64 }} /> : actors.length ? null : <EmptyState icon="person.fill.questionmark" title={`No results for “${query}”`} />}
      onEndReached={() => {
        if (result.hasNextPage && !result.isFetchingNextPage) result.fetchNextPage();
      }}
      frame={{ maxWidth: "infinity", maxHeight: "infinity" }}
      background={screenBackground}
      accessibilityIdentifier="people-results"
    />
  );
}

// MARK: Posts (signed in)

function PostResults({ query, sort = "top" }: { query: string; sort?: "top" | "latest" }) {
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
      footer={result.hasNextPage ? <ProgressView frame={{ maxWidth: "infinity", height: 64 }} /> : posts.length ? null : <EmptyState icon="text.magnifyingglass" title={`No posts for “${query}”`} />}
      onEndReached={() => {
        if (result.hasNextPage && !result.isFetchingNextPage) result.fetchNextPage();
      }}
      onRefresh={() => result.refetch()}
      frame={{ maxWidth: "infinity", maxHeight: "infinity" }}
      background={screenBackground}
    />
  );
}

/** Posts matching a query (a #hashtag), pushed. Signed out, a prompt instead. */
export function PostSearchScreen({ query }: { query: string }) {
  const signedIn = useSession((s) => s.session !== null);
  const openSignIn = useUI((s) => s.openSignIn);
  const [sort, setSort] = useState<"top" | "latest">("top");
  return (
    <Screen title={query} titleDisplayMode="inline">
      {signedIn ? (
        <VStack spacing={0} frame={{ maxWidth: "infinity", maxHeight: "infinity" }}>
          <HStack spacing={8} padding={{ horizontal: 16, vertical: 8 }}>
            <PillButton title="Top" small prominent={sort === "top"} onPress={() => setSort("top")} />
            <PillButton title="Latest" small prominent={sort === "latest"} onPress={() => setSort("latest")} />
            <Spacer />
          </HStack>
          <PostResults key={sort} query={query} sort={sort} />
        </VStack>
      ) : (
        <VStack spacing={12} padding={32} frame={{ maxWidth: "infinity", maxHeight: "infinity" }}>
          <EmptyState icon="number" title="Sign in to search posts" message="Bluesky only lets signed-in accounts search posts." />
          <PillButton title="Sign in" onPress={() => openSignIn("search posts")} />
        </VStack>
      )}
    </Screen>
  );
}

