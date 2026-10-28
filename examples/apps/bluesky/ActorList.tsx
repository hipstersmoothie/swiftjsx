// People: a row (avatar, name, handle, bio, follow), and a paged screen of
// them (followers, following, likes, reposts).
import { useInfiniteQuery } from "@tanstack/react-query";
import { Screen, VirtualList, VStack, HStack, Text, Button, Spacer, ProgressView, useNavigation } from "swiftjsx";
import type { ActorPage } from "./api";
import { displayName } from "./format";
import { ProfileScreen } from "./Profile";
import { useInteractions, useIsFollowing } from "./store";
import { useMyDid } from "./session";
import { Avatar, EmptyState, ErrorView, FeedSkeleton, PillButton, Separator, screenBackground, subtle } from "./ui";
import type { ProfileView } from "./types";

export function ActorRow({ actor, showBio = true }: { actor: ProfileView; showBio?: boolean }) {
  const nav = useNavigation();
  const me = useMyDid();
  const following = useIsFollowing(actor);
  const toggleFollow = useInteractions((s) => s.toggleFollow);
  return (
    <VStack spacing={0}>
      <Button buttonStyle="plain" onPress={() => nav.push(<ProfileScreen actor={actor.did} initial={actor} />)} accessibilityIdentifier="actor-row">
        <HStack alignment="top" spacing={12} padding={{ horizontal: 16, vertical: 12 }} contentShape="rectangle">
          <Avatar uri={actor.avatar} size={44} />
          <VStack alignment="leading" spacing={2}>
            <Text font="subheadline" fontWeight="bold" lineLimit={1}>{displayName(actor)}</Text>
            <HStack spacing={6}>
              <Text font="subheadline" foregroundStyle={subtle} lineLimit={1}>@{actor.handle}</Text>
              {actor.viewer?.followedBy ? (
                <Text font="caption2" fontWeight="semibold" foregroundStyle={subtle} padding={{ horizontal: 5, vertical: 2 }} background="secondarySystemFill" cornerRadius={4}>
                  Follows you
                </Text>
              ) : null}
            </HStack>
            {showBio && actor.description ? (
              <Text font="footnote" lineLimit={2} padding={{ top: 3 }}>{actor.description.replace(/\s+/g, " ")}</Text>
            ) : null}
          </VStack>
          <Spacer minLength={4} />
          {me && me !== actor.did ? (
            <PillButton title={following ? "Following" : "Follow"} systemImage={following ? "checkmark" : "plus"} prominent={!following} small onPress={() => toggleFollow(actor)} />
          ) : null}
        </HStack>
      </Button>
      <Separator inset={72} />
    </VStack>
  );
}

type ActorListProps = {
  title: string;
  queryKey: readonly unknown[];
  fetchPage: (cursor: string | undefined, signal: AbortSignal) => Promise<ActorPage>;
};

export function ActorListScreen({ title, queryKey, fetchPage }: ActorListProps) {
  const query = useInfiniteQuery({
    queryKey,
    queryFn: ({ pageParam, signal }) => fetchPage(pageParam, signal),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last) => (last.cursor && last.actors.length ? last.cursor : undefined),
  });
  const seen = new Set<string>();
  const actors = (query.data?.pages ?? []).flatMap((p) => p.actors).filter((a) => !seen.has(a.did) && !!seen.add(a.did));

  return (
    <Screen title={title} titleDisplayMode="inline">
      {query.isPending ? (
        <FeedSkeleton count={8} />
      ) : query.isError ? (
        <ErrorView error={query.error} retry={() => query.refetch()} />
      ) : (
        <VirtualList
          data={actors}
          keyExtractor={(a) => a.did}
          estimatedItemHeight={88}
          renderItem={(actor) => <ActorRow actor={actor} />}
          footer={query.hasNextPage ? <ProgressView frame={{ maxWidth: "infinity", height: 64 }} /> : actors.length ? null : <EmptyState icon="person.2" title="Nobody here yet" />}
          onEndReached={() => {
            if (query.hasNextPage && !query.isFetchingNextPage) query.fetchNextPage();
          }}
          onRefresh={() => query.refetch()}
          frame={{ maxWidth: "infinity", maxHeight: "infinity" }}
          background={screenBackground}
          accessibilityIdentifier="actor-list"
        />
      )}
    </Screen>
  );
}
