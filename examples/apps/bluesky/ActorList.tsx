// People: a row (avatar, name, handle, bio, Follow), and a paged screen of
// them (followers, following, likes, reposts).
import { useInfiniteQuery } from "@tanstack/react-query";
import { Screen, VirtualList, VStack, HStack, Text, Button, Spacer, useNavigation } from "swiftjsx";
import type { ActorPage } from "./api";
import { displayName } from "./format";
import { ProfileScreen } from "./Profile";
import { Verified } from "./PostCell";
import { useInteractions, useIsFollowing } from "./store";
import { useMyDid } from "./session";
import { Avatar, EmptyState, ErrorView, PillButton, ProfileRowSkeleton, Separator, Spinner, T, ty, useTheme } from "./ui";
import type { ProfileView } from "./types";

export function ActorRow({ actor, showBio = true }: { actor: ProfileView; showBio?: boolean }) {
  const nav = useNavigation();
  const me = useMyDid();
  const t = useTheme();
  const following = useIsFollowing(actor);
  const toggleFollow = useInteractions((s) => s.toggleFollow);
  return (
    <VStack spacing={0}>
      <Button pressedOpacity={0.7} onPress={() => nav.push(<ProfileScreen actor={actor.did} initial={actor} />)} accessibilityIdentifier="actor-row">
        <VStack alignment="leading" spacing={8} padding={{ horizontal: 16, vertical: 12 }} frame={{ maxWidth: "infinity", alignment: "leading" }} contentShape="rectangle">
          <HStack spacing={12}>
            <Avatar uri={actor.avatar} size={42} />
            <VStack alignment="leading" spacing={1}>
              <HStack spacing={3}>
                <Text font={ty(T.md, "bold")} foregroundStyle={t.text} lineLimit={1}>{displayName(actor)}</Text>
                {actor.verification?.verifiedStatus === "valid" ? <Verified /> : null}
              </HStack>
              <HStack spacing={6}>
                {actor.viewer?.followedBy ? (
                  <Text font={ty(11, "semibold")} foregroundStyle={t.textMedium} padding={{ horizontal: 5, vertical: 2 }} background={t.bg50} cornerRadius={4}>
                    Follows you
                  </Text>
                ) : null}
                <Text font={ty(T.sm)} foregroundStyle={t.textMedium} lineLimit={1}>@{actor.handle}</Text>
              </HStack>
            </VStack>
            <Spacer minLength={4} />
            {me !== actor.did ? (
              <PillButton title={following ? "Following" : "Follow"} systemImage={following ? "checkmark" : "plus"} variant={following ? "secondary" : "primary"} small onPress={() => toggleFollow(actor)} />
            ) : null}
          </HStack>
          {showBio && actor.description ? (
            <Text font={ty(T.sm)} foregroundStyle={t.text} lineLimit={2} lineSpacing={1}>{actor.description.replace(/\s+/g, " ")}</Text>
          ) : null}
        </VStack>
      </Button>
      <Separator />
    </VStack>
  );
}

type ActorListProps = {
  title: string;
  queryKey: readonly unknown[];
  fetchPage: (cursor: string | undefined, signal: AbortSignal) => Promise<ActorPage>;
};

export function ActorListScreen({ title, queryKey, fetchPage }: ActorListProps) {
  const t = useTheme();
  const query = useInfiniteQuery({
    queryKey,
    queryFn: ({ pageParam, signal }) => fetchPage(pageParam, signal),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last) => (last.cursor && last.actors.length ? last.cursor : undefined),
  });
  const seen = new Set<string>();
  const actors = (query.data?.pages ?? []).flatMap((p) => p.actors).filter((a) => !seen.has(a.did) && !!seen.add(a.did));

  return (
    <Screen title={title} titleDisplayMode="inline" toolbarBackground={t.bg}>
      {query.isPending ? (
        <VStack frame={{ maxWidth: "infinity", maxHeight: "infinity" }} background={t.bg}>
          <ProfileRowSkeleton />
        </VStack>
      ) : query.isError ? (
        <ErrorView error={query.error} retry={() => query.refetch()} />
      ) : (
        <VirtualList
          data={actors}
          keyExtractor={(a) => a.did}
          estimatedItemHeight={88}
          renderItem={(actor) => <ActorRow actor={actor} />}
          footer={query.hasNextPage ? <Spinner height={64} /> : actors.length ? null : <EmptyState icon="person.2" title="Nobody here yet" />}
          onEndReached={() => {
            if (query.hasNextPage && !query.isFetchingNextPage) query.fetchNextPage();
          }}
          onRefresh={() => query.refetch()}
          frame={{ maxWidth: "infinity", maxHeight: "infinity" }}
          background={t.bg}
          accessibilityIdentifier="actor-list"
        />
      )}
    </Screen>
  );
}
