// A thread: the ancestors (joined by a thread line), the focused post (large,
// with the full timestamp and stats), then the replies as a tree, indented
// by depth with guide lines. Opens scrolled to the focused post.

import { useQuery } from "@tanstack/react-query";
import {
  Screen, VirtualList, VStack, HStack, Text, Image, Button, Spacer, Rectangle, Background, SafeAreaInset, useNavigation,
} from "swiftjsx";
import { getPostThread, getLikes, getRepostedBy } from "./api";
import { compact, counted, displayName, fullTimestamp } from "./format";
import { ActionBar, PostCell, Verified } from "./PostCell";
import { RichText } from "./PostText";
import { ContentHider, Embed, mediaWarning } from "./Embeds";
import { ProfileScreen } from "./Profile";
import { ActorListScreen } from "./ActorList";
import { usePostState, useUI, useIsFollowing, useInteractions } from "./store";
import { useMyDid, useSession } from "./session";
import { useMyProfile } from "./Me";
import { Avatar, EmptyState, ErrorView, FeedSkeleton, H_PADDING, PillButton, T, ty, useTheme, useWindowWidth } from "./ui";
import type { PostView, ThreadNode } from "./types";

type Row =
  | { kind: "ancestor"; post: PostView; first: boolean }
  | { kind: "focus"; post: PostView; hasParent: boolean }
  | { kind: "reply"; post: PostView; depth: number; hasChildren: boolean; key: string }
  | { kind: "missing"; key: string; text: string; depth: number }
  | { kind: "more"; key: string; post: PostView; depth: number };

const MAX_DEPTH = 5;
const INDENT = 18;

function isPost(node: ThreadNode | undefined): node is Extract<ThreadNode, { $type: "app.bsky.feed.defs#threadViewPost" }> {
  return !!node && "post" in node;
}

/** The thread as rows: ancestors (root first), the focused post, then replies depth first. */
function flatten(thread: ThreadNode): Row[] {
  if (!isPost(thread)) return [{ kind: "missing", key: "focus", text: "blocked" in thread ? "This post is blocked." : "This post has been deleted.", depth: 0 }];
  const ancestors: Row[] = [];
  let parent = thread.parent;
  while (parent) {
    if (isPost(parent)) {
      ancestors.unshift({ kind: "ancestor", post: parent.post, first: false });
      parent = parent.parent;
    } else {
      ancestors.unshift({ kind: "missing", key: parent.uri, text: "blocked" in parent ? "Blocked post" : "Deleted post", depth: 0 });
      break;
    }
  }
  if (ancestors[0]?.kind === "ancestor") ancestors[0] = { ...ancestors[0], first: true };
  const rows: Row[] = [...ancestors, { kind: "focus", post: thread.post, hasParent: ancestors.length > 0 }];

  const walk = (nodes: ThreadNode[] | undefined, depth: number) => {
    for (const node of sortReplies(nodes ?? [], thread.post.author.did)) {
      if (!isPost(node)) continue;
      const children = (node.replies ?? []).filter(isPost);
      rows.push({ kind: "reply", post: node.post, depth, hasChildren: children.length > 0, key: node.post.uri });
      if (depth + 1 >= MAX_DEPTH && (node.post.replyCount ?? 0) > 0) {
        rows.push({ kind: "more", key: `${node.post.uri}:more`, post: node.post, depth: depth + 1 });
      } else {
        walk(children, depth + 1);
      }
    }
  };
  walk(thread.replies, 0);
  return rows;
}

/** The author's own replies first, then by likes. */
function sortReplies(nodes: ThreadNode[], op: string): ThreadNode[] {
  return [...nodes].sort((a, b) => {
    if (!isPost(a) || !isPost(b)) return 0;
    const aOp = a.post.author.did === op ? 1 : 0;
    const bOp = b.post.author.did === op ? 1 : 0;
    if (aOp !== bOp) return bOp - aOp;
    return (b.post.likeCount ?? 0) - (a.post.likeCount ?? 0);
  });
}

const rowKey = (row: Row) => (row.kind === "ancestor" || row.kind === "focus" ? row.post.uri : row.key);

export function ThreadScreen({ uri, initial }: { uri: string; initial?: PostView }) {
  const query = useQuery({ queryKey: ["thread", uri], queryFn: ({ signal }) => getPostThread(uri, signal) });
  const signedIn = useSession((s) => s.session !== null);
  const t = useTheme();

  const rows: Row[] = query.data ? flatten(query.data.thread) : initial ? [{ kind: "focus", post: initial, hasParent: false }] : [];
  const focusIndex = rows.findIndex((r) => r.kind === "focus");
  const focused = focusIndex >= 0 ? rows[focusIndex] : null;
  const focusPost = focused && focused.kind === "focus" ? focused.post : null;

  return (
    <Screen title="Post" titleDisplayMode="inline" toolbarBackground={t.bg}>
      {query.isError && !rows.length ? (
        <ErrorView error={query.error} retry={() => query.refetch()} />
      ) : (
        <VirtualList
          data={rows}
          keyExtractor={rowKey}
          estimatedItemHeight={160}
          // The focused post at the top; its ancestors load above it.
          initialScrollIndex={focusIndex > 0 ? focusIndex : undefined}
          renderItem={(row) => <ThreadRow row={row} />}
          footer={
            query.isPending ? (
              <FeedSkeleton count={3} />
            ) : (
              <VStack padding={{ bottom: 320 }} background={t.bg}>
                {rows.every((r) => r.kind !== "reply") ? <EmptyState icon="bubble.left.and.bubble.right" title="No replies yet" message="Be the first to reply." /> : null}
              </VStack>
            )
          }
          onRefresh={() => query.refetch()}
          frame={{ maxWidth: "infinity", maxHeight: "infinity" }}
          background={t.bg}
          accessibilityIdentifier="thread"
        >
          {signedIn && focusPost ? (
            <SafeAreaInset edge="bottom">
              <ReplyPrompt post={focusPost} />
            </SafeAreaInset>
          ) : null}
        </VirtualList>
      )}
    </Screen>
  );
}

/** "Write your reply": a tap opens the composer (signed in). */
function ReplyPrompt({ post }: { post: PostView }) {
  const openCompose = useUI((s) => s.openCompose);
  const me = useMyProfile();
  const t = useTheme();
  return (
    <VStack spacing={0} background={t.bg}>
      <Rectangle fill={t.border} frame={{ maxWidth: "infinity", height: 0.5 }} />
      <Button onPress={() => openCompose({ replyTo: post })} pressedOpacity={0.7} padding={{ horizontal: 12, vertical: 8 }} accessibilityIdentifier="reply-prompt">
        <HStack spacing={8} padding={{ horizontal: 10, vertical: 8 }} frame={{ maxWidth: "infinity", alignment: "leading" }} background={t.bg25} cornerRadius="capsule" border={{ color: t.border, width: 1 }}>
          <Avatar uri={me.data?.avatar} size={24} />
          <Text font={ty(T.md)} foregroundStyle={t.textLow}>Write your reply</Text>
        </HStack>
      </Button>
    </VStack>
  );
}

function ThreadRow({ row }: { row: Row }) {
  const t = useTheme();
  switch (row.kind) {
    case "ancestor":
      return <PostCell post={row.post} lineAbove={!row.first} lineBelow hideSeparator />;
    case "focus":
      return <FocusedPost post={row.post} hasParent={row.hasParent} />;
    case "reply":
      return <ReplyRow post={row.post} depth={row.depth} hasChildren={row.hasChildren} />;
    case "missing":
      return (
        <HStack spacing={8} padding={{ horizontal: H_PADDING, vertical: 14 }} frame={{ maxWidth: "infinity", alignment: "leading" }} background={t.bg}>
          <Image systemName="trash" font={{ size: 14 }} foregroundStyle={t.textMedium} />
          <Text font={ty(T.md)} foregroundStyle={t.textMedium}>{row.text}</Text>
        </HStack>
      );
    case "more":
      return <MoreReplies post={row.post} depth={row.depth} />;
  }
}

/** Depth guides: one line per level, left of the reply. */
function Guides({ depth }: { depth: number }) {
  const t = useTheme();
  return (
    <HStack spacing={0} frame={{ maxHeight: "infinity" }} padding={{ leading: H_PADDING + 10 }}>
      {Array.from({ length: depth }, (_, i) => (
        <HStack key={i} spacing={0} frame={{ width: INDENT, maxHeight: "infinity", alignment: "leading" }}>
          <Rectangle fill={t.bg100} frame={{ width: 2, maxHeight: "infinity" }} />
        </HStack>
      ))}
    </HStack>
  );
}

function ReplyRow({ post, depth, hasChildren }: { post: PostView; depth: number; hasChildren: boolean }) {
  const indent = depth * INDENT;
  return (
    <VStack spacing={0}>
      <PostCell post={post} indent={indent} hideSeparator={hasChildren} />
      {depth > 0 ? (
        <Background alignment="topLeading">
          <Guides depth={depth} />
        </Background>
      ) : null}
    </VStack>
  );
}

function MoreReplies({ post, depth }: { post: PostView; depth: number }) {
  const nav = useNavigation();
  const t = useTheme();
  return (
    <Button onPress={() => nav.push(<ThreadScreen uri={post.uri} initial={post} />)} pressedOpacity={0.6}>
      <HStack spacing={6} padding={{ leading: H_PADDING + depth * INDENT + 52, vertical: 12 }} frame={{ maxWidth: "infinity", alignment: "leading" }} background={t.bg}>
        <Text font={ty(T.md, "semibold")} foregroundStyle={t.primary}>Continue thread…</Text>
      </HStack>
      <Background alignment="topLeading">
        <Guides depth={depth} />
      </Background>
    </Button>
  );
}

// MARK: Focused post

function FocusedPost({ post, hasParent }: { post: PostView; hasParent: boolean }) {
  const nav = useNavigation();
  const t = useTheme();
  const width = useWindowWidth() - H_PADDING * 2;
  const state = usePostState(post);
  const author = post.author;
  const me = useMyDid();
  const following = useIsFollowing(author);
  const toggleFollow = useInteractions((s) => s.toggleFollow);
  const warning = mediaWarning(post);
  const openProfile = () => nav.push(<ProfileScreen actor={author.did} initial={author} />);
  const stats = [
    { n: state.repostCount, one: "repost", other: "reposts", open: () => nav.push(<ActorListScreen title="Reposted by" queryKey={["reposts", post.uri]} fetchPage={(c, s) => getRepostedBy(post.uri, c, s)} />) },
    { n: post.quoteCount ?? 0, one: "quote", other: "quotes", open: null },
    { n: state.likeCount, one: "like", other: "likes", open: () => nav.push(<ActorListScreen title="Liked by" queryKey={["likes", post.uri]} fetchPage={(c, s) => getLikes(post.uri, c, s)} />) },
  ].filter((s) => s.n > 0);

  return (
    <VStack alignment="leading" spacing={0} padding={{ horizontal: H_PADDING, top: hasParent ? 4 : 14 }} background={t.bg} accessibilityIdentifier="focused-post" accessibilityElement="contain">
      <HStack spacing={10}>
        <Button onPress={openProfile} pressedOpacity={0.7} accessibilityLabel={`${displayName(author)}'s profile`}>
          <HStack spacing={10}>
            <Avatar uri={author.avatar} size={42} />
            <VStack alignment="leading" spacing={1}>
              <HStack spacing={3}>
                <Text font={ty(T.md + 1, "bold")} foregroundStyle={t.text} lineLimit={1}>{displayName(author)}</Text>
                {author.verification?.verifiedStatus === "valid" ? <Verified size={14} /> : null}
              </HStack>
              <Text font={ty(T.md)} foregroundStyle={t.textMedium} lineLimit={1}>@{author.handle}</Text>
            </VStack>
          </HStack>
        </Button>
        <Spacer />
        {me && me !== author.did ? (
          <PillButton title={following ? "Following" : "Follow"} systemImage={following ? "checkmark" : "plus"} variant={following ? "secondary" : "primary"} small onPress={() => toggleFollow(author)} />
        ) : null}
      </HStack>
      <VStack alignment="leading" spacing={12} padding={{ top: 12 }}>
        <RichText text={post.record.text} facets={post.record.facets} size={T.focus} selectable id="focused-text" />
        {post.embed ? (
          warning ? (
            <ContentHider warning={warning} width={width}>
              <Embed embed={post.embed} width={width} />
            </ContentHider>
          ) : (
            <Embed embed={post.embed} width={width} />
          )
        ) : null}
        <Text font={ty(T.sm)} foregroundStyle={t.textMedium} padding={{ top: 2 }}>{fullTimestamp(post.record.createdAt ?? post.indexedAt)}</Text>
      </VStack>
      <VStack spacing={0} padding={{ top: 12 }}>
        {stats.length ? (
          <VStack spacing={0}>
            <Rectangle fill={t.border} frame={{ maxWidth: "infinity", height: 0.5 }} />
            <HStack spacing={18} padding={{ vertical: 12 }} frame={{ maxWidth: "infinity", alignment: "leading" }}>
              {stats.map((s) => {
                const label = (
                  <Text font={ty(T.md)} foregroundStyle={t.textMedium}>
                    <Text fontWeight="bold" foregroundStyle={t.text}>{compact(s.n)}</Text>
                    <Text> {counted(s.n, s.one, s.other).split(" ").slice(1).join(" ")}</Text>
                  </Text>
                );
                return s.open ? (
                  <Button key={s.one} onPress={s.open} pressedOpacity={0.6} accessibilityIdentifier={`stat-${s.other}`}>
                    {label}
                  </Button>
                ) : (
                  <VStack key={s.one}>{label}</VStack>
                );
              })}
            </HStack>
          </VStack>
        ) : null}
        <Rectangle fill={t.border} frame={{ maxWidth: "infinity", height: 0.5 }} />
        <ActionBar post={post} large />
      </VStack>
      <Rectangle fill={t.border} frame={{ height: 0.5 }} padding={{ horizontal: -H_PADDING }} />
      {hasParent ? (
        <Background alignment="topLeading">
          <Rectangle fill={t.bg100} frame={{ width: 2, height: 4 }} padding={{ leading: H_PADDING + 20 }} />
        </Background>
      ) : null}
    </VStack>
  );
}
