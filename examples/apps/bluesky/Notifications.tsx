// Notifications (signed in): likes, reposts and follows grouped ("Alice and
// 3 others liked your post"), replies, mentions and quotes as full posts.
// Signed out: a sign-in prompt.
import { useInfiniteQuery } from "@tanstack/react-query";
import { Screen, VirtualList, VStack, HStack, Text, Image, Button, Spacer, ContentUnavailable, useNavigation, useNow, format, type Color } from "swiftjsx";
import { getPosts, listNotifications } from "./api";
import { displayName } from "./format";
import { PostCell } from "./PostCell";
import { ProfileScreen } from "./Profile";
import { ThreadScreen } from "./Thread";
import { useSession } from "./session";
import { useUI } from "./store";
import { Avatar, ErrorView, FeedSkeleton, PillButton, Separator, Spinner, T, ty, useTheme, type Palette } from "./ui";
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
  const t = useTheme();
  return (
    <Screen title="Notifications" titleDisplayMode="inline" toolbarBackground={t.bg}>
      {signedIn ? <NotificationList /> : <SignedOutPrompt />}
    </Screen>
  );
}

/** Kept our own (not ContentUnavailable): Bluesky's sign-in prompt, its bell on a brand-tinted tile. */
function SignedOutPrompt() {
  const openSignIn = useUI((s) => s.openSignIn);
  const t = useTheme();
  return (
    <VStack spacing={12} padding={32} frame={{ maxWidth: "infinity", maxHeight: "infinity" }} background={t.bg} accessibilityIdentifier="notifications-signed-out">
      <Image systemName="bell.fill" font={{ size: 30 }} foregroundStyle={t.primary} frame={{ width: 72, height: 72 }} background={t.primarySubtle} cornerRadius="capsule" />
      <Text font={ty(T.xxl, "bold")} foregroundStyle={t.text} padding={{ top: 6 }}>Never miss a thing</Text>
      <Text font={ty(T.md)} foregroundStyle={t.textMedium} textAlignment="center" lineSpacing={2}>
        Sign in to see who liked, reposted, quoted and replied to your posts, and who followed you.
      </Text>
      <VStack padding={{ top: 6 }}>
        <PillButton title="Sign in" onPress={() => openSignIn("see your notifications")} id="notifications-sign-in" />
      </VStack>
    </VStack>
  );
}

function NotificationList() {
  const did = useSession((s) => s.session?.did);
  const t = useTheme();
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
      footer={query.hasNextPage ? <Spinner height={64} /> : groups.length ? null : <ContentUnavailable systemImage="bell" title="No notifications yet!" frame={{ minHeight: 280 }} />}
      onEndReached={() => {
        if (query.hasNextPage && !query.isFetchingNextPage) query.fetchNextPage();
      }}
      onRefresh={() => query.refetch()}
      frame={{ maxWidth: "infinity", maxHeight: "infinity" }}
      background={t.bg}
    />
  );
}

function meta(reason: Notification["reason"], t: Palette): { icon: string; color: Color; verb: string } {
  switch (reason) {
    case "like":
      return { icon: "heart.fill", color: t.like, verb: "liked your post" };
    case "like-via-repost":
      return { icon: "heart.fill", color: t.like, verb: "liked your repost" };
    case "repost":
      return { icon: "arrow.2.squarepath", color: t.repost, verb: "reposted your post" };
    case "repost-via-repost":
      return { icon: "arrow.2.squarepath", color: t.repost, verb: "reposted your repost" };
    case "follow":
      return { icon: "person.fill.badge.plus", color: t.primary, verb: "followed you" };
    case "starterpack-joined":
      return { icon: "person.3.fill", color: t.primary, verb: "signed up with your starter pack" };
    case "verified":
      return { icon: "checkmark.seal.fill", color: t.primary, verb: "verified your account" };
    default:
      return { icon: "bell.fill", color: t.primary, verb: reason };
  }
}

function NotificationRow({ group: g }: { group: Group }) {
  const nav = useNavigation();
  const now = useNow();
  const t = useTheme();
  if (AS_POST.has(g.reason) && g.post) return <PostCell post={g.post} />;
  const m = meta(g.reason, t);
  const first = g.authors[0];
  const others = g.authors.length - 1;
  const open = () =>
    g.post ? nav.push(<ThreadScreen uri={g.post.uri} initial={g.post} />) : nav.push(<ProfileScreen actor={first.did} initial={first} />);
  return (
    <VStack spacing={0}>
      <Button pressedOpacity={0.7} onPress={open} accessibilityIdentifier="notification-row">
        <HStack alignment="top" spacing={10} padding={{ horizontal: 16, top: 12, bottom: 14 }} background={g.isRead ? t.bg : t.primarySubtle} contentShape="rectangle">
          <HStack frame={{ width: 42, alignment: "trailing" }}>
            <Image systemName={m.icon} font={{ size: 26 }} foregroundStyle={m.color} />
          </HStack>
          <VStack alignment="leading" spacing={8}>
            <HStack spacing={4}>
              {g.authors.slice(0, 6).map((a) => (
                <Avatar key={a.did} uri={a.avatar} size={30} />
              ))}
              {g.authors.length > 6 ? <Text font={ty(T.sm, "semibold")} foregroundStyle={t.textMedium} padding={{ leading: 2 }}>+{g.authors.length - 6}</Text> : null}
              <Spacer />
            </HStack>
            <Text font={ty(T.md)} foregroundStyle={t.text} lineSpacing={2}>
              <Text fontWeight="bold">{displayName(first)}</Text>
              {others > 0 ? <Text fontWeight="bold">{` and ${format.count(others, { one: "# other", other: "# others" })}`}</Text> : null}
              <Text>{` ${m.verb}`}</Text>
              <Text foregroundStyle={t.textMedium}>{` · ${format.relativeTime(Date.parse(g.indexedAt), { now })}`}</Text>
            </Text>
            {g.post?.record.text ? <Text font={ty(T.md)} foregroundStyle={t.textMedium} lineLimit={3} lineSpacing={2}>{g.post.record.text}</Text> : null}
          </VStack>
        </HStack>
      </Button>
      <Separator />
    </VStack>
  );
}
