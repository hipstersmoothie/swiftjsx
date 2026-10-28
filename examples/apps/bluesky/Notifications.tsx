// Notifications (signed in): likes, reposts and follows grouped ("Alice and
// 3 others liked your post"), replies, mentions and quotes as full posts.
// Signed out: a sign-in prompt.
import { useInfiniteQuery } from "@tanstack/react-query";
import { Screen, VirtualList, VStack, HStack, Text, Image, Button, Spacer, ProgressView, useNavigation } from "swiftjsx";
import { getPosts, listNotifications } from "./api";
import { ago, displayName } from "./format";
import { PostCell } from "./PostCell";
import { ProfileScreen } from "./Profile";
import { ThreadScreen } from "./Thread";
import { useSession } from "./session";
import { useUI } from "./store";
import {
  Avatar, EmptyState, ErrorView, FeedSkeleton, PillButton, Separator, brand, likeColor, repostColor, screenBackground, subtle, useNow,
} from "./ui";
import type { Notification, PostView } from "./types";

type Group = {
  key: string;
  reason: Notification["reason"];
  authors: Notification["author"][];
  /** The post liked / reposted (yours), or the reply / mention / quote itself. */
  post?: PostView;
  indexedAt: string;
  isRead: boolean;
};

const GROUPED = new Set(["like", "repost", "follow", "like-via-repost", "repost-via-repost"]);
const AS_POST = new Set(["reply", "mention", "quote", "subscribed-post"]);

async function fetchPage(cursor: string | undefined, signal: AbortSignal) {
  const page = await listNotifications(cursor, signal);
  // The posts the notifications are about, 25 per request.
  const uris = [
    ...new Set(page.notifications.map((n) => (AS_POST.has(n.reason) ? n.uri : n.reasonSubject)).filter((u): u is string => !!u && u.includes("app.bsky.feed.post"))),
  ];
  const posts = new Map<string, PostView>();
  for (let i = 0; i < uris.length; i += 25) {
    const batch = await getPosts(uris.slice(i, i + 25), signal);
    batch.posts.forEach((p) => posts.set(p.uri, p));
  }
  return { ...page, posts };
}

function group(pages: Awaited<ReturnType<typeof fetchPage>>[]): Group[] {
  const groups: Group[] = [];
  const byKey = new Map<string, Group>();
  for (const page of pages) {
    for (const n of page.notifications) {
      const subject = AS_POST.has(n.reason) ? n.uri : n.reasonSubject;
      const post = subject ? page.posts.get(subject) : undefined;
      if (GROUPED.has(n.reason)) {
        const key = `${n.reason}:${n.reasonSubject ?? ""}`;
        const existing = byKey.get(key);
        if (existing) {
          if (!existing.authors.some((a) => a.did === n.author.did)) existing.authors.push(n.author);
          continue;
        }
        const g: Group = { key, reason: n.reason, authors: [n.author], post, indexedAt: n.indexedAt, isRead: n.isRead };
        byKey.set(key, g);
        groups.push(g);
      } else {
        groups.push({ key: n.uri, reason: n.reason, authors: [n.author], post, indexedAt: n.indexedAt, isRead: n.isRead });
      }
    }
  }
  return groups;
}

export function NotificationsScreen() {
  const signedIn = useSession((s) => s.session !== null);
  return (
    <Screen title="Notifications" titleDisplayMode="inline">
      {signedIn ? <NotificationList /> : <SignedOutPrompt />}
    </Screen>
  );
}

function SignedOutPrompt() {
  const openSignIn = useUI((s) => s.openSignIn);
  return (
    <VStack spacing={14} padding={32} frame={{ maxWidth: "infinity", maxHeight: "infinity" }} accessibilityIdentifier="notifications-signed-out">
      <Image systemName="bell.badge" font={{ size: 52, weight: "light" }} foregroundStyle={brand} symbolRenderingMode="hierarchical" />
      <Text font="title2" fontWeight="bold">Stay in the loop</Text>
      <Text font="subheadline" foregroundStyle={subtle} textAlignment="center">
        Sign in to see who liked, reposted and replied to your posts, and who followed you.
      </Text>
      <PillButton title="Sign in" onPress={() => openSignIn("see your notifications")} id="notifications-sign-in" />
    </VStack>
  );
}

function NotificationList() {
  const did = useSession((s) => s.session?.did);
  const query = useInfiniteQuery({
    queryKey: ["notifications", did],
    queryFn: ({ pageParam, signal }) => fetchPage(pageParam, signal),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last) => (last.cursor && last.notifications.length ? last.cursor : undefined),
  });
  if (query.isPending) return <FeedSkeleton />;
  if (query.isError) return <ErrorView error={query.error} retry={() => query.refetch()} />;
  const groups = group(query.data.pages);
  return (
    <VirtualList
      data={groups}
      keyExtractor={(g) => g.key}
      estimatedItemHeight={110}
      renderItem={(g) => <NotificationRow group={g} />}
      footer={query.hasNextPage ? <ProgressView frame={{ maxWidth: "infinity", height: 64 }} /> : groups.length ? null : <EmptyState icon="bell" title="No notifications yet" />}
      onEndReached={() => {
        if (query.hasNextPage && !query.isFetchingNextPage) query.fetchNextPage();
      }}
      onRefresh={() => query.refetch()}
      frame={{ maxWidth: "infinity", maxHeight: "infinity" }}
      background={screenBackground}
    />
  );
}

const ICONS: Partial<Record<Notification["reason"], { icon: string; color: import("swiftjsx").ColorValue; verb: string }>> = {
  like: { icon: "heart.fill", color: likeColor, verb: "liked your post" },
  "like-via-repost": { icon: "heart.fill", color: likeColor, verb: "liked your repost" },
  repost: { icon: "arrow.2.squarepath", color: repostColor, verb: "reposted your post" },
  "repost-via-repost": { icon: "arrow.2.squarepath", color: repostColor, verb: "reposted your repost" },
  follow: { icon: "person.fill.badge.plus", color: brand, verb: "followed you" },
  "starterpack-joined": { icon: "person.3.fill", color: brand, verb: "signed up with your starter pack" },
  verified: { icon: "checkmark.seal.fill", color: brand, verb: "verified your account" },
};

function NotificationRow({ group: g }: { group: Group }) {
  const nav = useNavigation();
  const now = useNow();
  if (AS_POST.has(g.reason) && g.post) return <PostCell post={g.post} />;
  const meta = ICONS[g.reason] ?? { icon: "bell.fill", color: brand, verb: g.reason };
  const first = g.authors[0];
  const others = g.authors.length - 1;
  const open = () =>
    g.post ? nav.push(<ThreadScreen uri={g.post.uri} initial={g.post} />) : nav.push(<ProfileScreen actor={first.did} initial={first} />);
  return (
    <VStack spacing={0}>
      <Button buttonStyle="plain" onPress={open}>
        <HStack alignment="top" spacing={12} padding={{ horizontal: 14, vertical: 12 }} background={g.isRead ? "clear" : "blue/6"} contentShape="rectangle">
          <Image systemName={meta.icon} font="title3" foregroundStyle={meta.color} frame={{ width: 42, alignment: "trailing" }} />
          <VStack alignment="leading" spacing={8}>
            <HStack spacing={-6}>
              {g.authors.slice(0, 6).map((a) => (
                <VStack key={a.did} padding={1.5} background={screenBackground} cornerRadius="capsule">
                  <Avatar uri={a.avatar} size={30} />
                </VStack>
              ))}
              <Spacer />
            </HStack>
            <Text font="subheadline">
              <Text fontWeight="bold">{displayName(first)}</Text>
              {others > 0 ? <Text>{` and ${others} ${others === 1 ? "other" : "others"}`}</Text> : null}
              <Text>{` ${meta.verb}`}</Text>
              <Text foregroundStyle={subtle}>{` · ${ago(g.indexedAt, now)}`}</Text>
            </Text>
            {g.post?.record.text ? <Text font="subheadline" foregroundStyle={subtle} lineLimit={3}>{g.post.record.text}</Text> : null}
          </VStack>
        </HStack>
      </Button>
      <Separator />
    </VStack>
  );
}
