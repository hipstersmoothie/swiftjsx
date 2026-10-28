// A thread: the ancestors (joined by a thread line), the focused post (large,
// with the full timestamp and stats), then the replies as a tree, indented
// by depth with guide lines. Opens scrolled to the focused post.
import { useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Screen, VirtualList, VStack, HStack, Text, Image, Button, Spacer, Rectangle, Background, ToolbarItem, useNavigation, type HostInstance,
} from "swiftjsx";
import { getPostThread, getLikes, getRepostedBy } from "./api";
import { compact, counted, displayName, fullTimestamp } from "./format";
import { ActionBar, PostCell } from "./PostCell";
import { RichText } from "./PostText";
import { Embed } from "./Embeds";
import { ProfileScreen } from "./Profile";
import { ActorListScreen } from "./ActorList";
import { usePostState, useUI, useIsFollowing, useInteractions } from "./store";
import { useMyDid } from "./session";
import { Avatar, EmptyState, ErrorView, FeedSkeleton, H_PADDING, PillButton, hairline, screenBackground, subtle, useWindowWidth, brand } from "./ui";
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
  const openCompose = useUI((s) => s.openCompose);
  const list = useRef<HostInstance>(null);
  // Scroll to the focused post once per load (a ref: changing it mustn't re-run the effect and cancel the timer).
  const scrolledTo = useRef<string | null>(null);

  const rows: Row[] = query.data ? flatten(query.data.thread) : initial ? [{ kind: "focus", post: initial, hasParent: false }] : [];
  const focusIndex = rows.findIndex((r) => r.kind === "focus");
  const focused = focusIndex >= 0 ? rows[focusIndex] : null;
  const focusPost = focused && focused.kind === "focus" ? focused.post : null;

  // Once the thread loads, jump to the focused post (ancestors are above it).
  const loadedKey = query.data ? uri : null;
  useEffect(() => {
    if (!loadedKey || scrolledTo.current === loadedKey || focusIndex <= 0) return;
    scrolledTo.current = loadedKey;
    // After the rows above have been committed and laid out.
    const timer = setTimeout(() => list.current?.scrollTo(focusIndex, { animated: false, anchor: "top" }), 50);
    return () => clearTimeout(timer);
  }, [loadedKey, focusIndex]);

  return (
    <Screen title="Post" titleDisplayMode="inline">
      {focusPost ? (
        <ToolbarItem placement="primaryAction">
          <Button onPress={() => openCompose({ replyTo: focusPost })} accessibilityLabel="Reply">
            <Image systemName="arrowshape.turn.up.left" foregroundStyle={brand} />
          </Button>
        </ToolbarItem>
      ) : null}
      {query.isError && !rows.length ? (
        <ErrorView error={query.error} retry={() => query.refetch()} />
      ) : (
        <VirtualList
          ref={list}
          data={rows}
          keyExtractor={rowKey}
          estimatedItemHeight={160}
          renderItem={(row) => <ThreadRow row={row} />}
          footer={
            query.isPending ? (
              <FeedSkeleton count={3} />
            ) : (
              <VStack padding={{ bottom: 240 }}>
                {rows.every((r) => r.kind !== "reply") ? <EmptyState icon="bubble.left.and.bubble.right" title="No replies yet" message="Be the first to reply." /> : null}
              </VStack>
            )
          }
          onRefresh={() => query.refetch()}
          frame={{ maxWidth: "infinity", maxHeight: "infinity" }}
          background={screenBackground}
          accessibilityIdentifier="thread"
        />
      )}
    </Screen>
  );
}

function ThreadRow({ row }: { row: Row }) {
  switch (row.kind) {
    case "ancestor":
      return <PostCell post={row.post} lineAbove={!row.first} lineBelow hideSeparator />;
    case "focus":
      return <FocusedPost post={row.post} hasParent={row.hasParent} />;
    case "reply":
      return <ReplyRow post={row.post} depth={row.depth} hasChildren={row.hasChildren} />;
    case "missing":
      return (
        <HStack spacing={8} padding={{ horizontal: H_PADDING, vertical: 14 }}>
          <Image systemName="trash" foregroundStyle={subtle} />
          <Text font="subheadline" foregroundStyle={subtle}>{row.text}</Text>
        </HStack>
      );
    case "more":
      return <MoreReplies post={row.post} depth={row.depth} />;
  }
}

/** Depth guides: one hairline per level, left of the reply. */
function Guides({ depth }: { depth: number }) {
  return (
    <HStack spacing={0} frame={{ maxHeight: "infinity" }} padding={{ leading: H_PADDING + 10 }}>
      {Array.from({ length: depth }, (_, i) => (
        <HStack key={i} spacing={0} frame={{ width: INDENT, maxHeight: "infinity", alignment: "leading" }}>
          <Rectangle fill={hairline} frame={{ width: 1.5, maxHeight: "infinity" }} />
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
  return (
    <Button onPress={() => nav.push(<ThreadScreen uri={post.uri} initial={post} />)} buttonStyle="plain">
      <HStack spacing={6} padding={{ leading: H_PADDING + depth * INDENT + 54, vertical: 10 }} frame={{ maxWidth: "infinity", alignment: "leading" }}>
        <Text font="subheadline" fontWeight="semibold" foregroundStyle={brand}>Continue thread</Text>
        <Image systemName="chevron.right" font="caption" fontWeight="semibold" foregroundStyle={brand} />
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
  const width = useWindowWidth() - H_PADDING * 2;
  const state = usePostState(post);
  const author = post.author;
  const me = useMyDid();
  const following = useIsFollowing(author);
  const toggleFollow = useInteractions((s) => s.toggleFollow);
  const openProfile = () => nav.push(<ProfileScreen actor={author.did} initial={author} />);
  const stats = [
    { n: state.repostCount, one: "repost", other: "reposts", open: () => nav.push(<ActorListScreen title="Reposted by" queryKey={["reposts", post.uri]} fetchPage={(c, s) => getRepostedBy(post.uri, c, s)} />) },
    { n: post.quoteCount ?? 0, one: "quote", other: "quotes", open: null },
    { n: state.likeCount, one: "like", other: "likes", open: () => nav.push(<ActorListScreen title="Liked by" queryKey={["likes", post.uri]} fetchPage={(c, s) => getLikes(post.uri, c, s)} />) },
  ].filter((s) => s.n > 0);

  return (
    <VStack alignment="leading" spacing={12} padding={{ horizontal: H_PADDING, top: hasParent ? 4 : 14, bottom: 6 }} accessibilityIdentifier="focused-post" accessibilityElement="contain">
      <HStack spacing={10}>
        <Button onPress={openProfile} pressedOpacity={0.7} accessibilityLabel={`${displayName(author)}'s profile`}>
          <HStack spacing={10}>
            <Avatar uri={author.avatar} size={46} />
            <VStack alignment="leading" spacing={1}>
              <Text font="headline" lineLimit={1}>{displayName(author)}</Text>
              <Text font="subheadline" foregroundStyle={subtle} lineLimit={1}>@{author.handle}</Text>
            </VStack>
          </HStack>
        </Button>
        <Spacer />
        {me && me !== author.did && !following ? <PillButton title="Follow" systemImage="plus" small onPress={() => toggleFollow(author)} /> : null}
      </HStack>
      <RichText text={post.record.text} facets={post.record.facets} font={{ size: 19 }} selectable id="focused-text" />
      {post.embed ? <Embed embed={post.embed} width={width} /> : null}
      <Text font="footnote" foregroundStyle={subtle}>{fullTimestamp(post.record.createdAt ?? post.indexedAt)}</Text>
      {stats.length ? (
        <VStack spacing={10} alignment="leading">
          <Rectangle fill={hairline} frame={{ maxWidth: "infinity", height: 0.5 }} />
          <HStack spacing={16}>
            {stats.map((s) => {
              const label = (
                <Text font="subheadline">
                  <Text fontWeight="bold">{compact(s.n)}</Text>
                  <Text foregroundStyle={subtle}> {counted(s.n, s.one, s.other).split(" ").slice(1).join(" ")}</Text>
                </Text>
              );
              return s.open ? (
                <Button key={s.one} onPress={s.open} buttonStyle="plain" accessibilityIdentifier={`stat-${s.other}`}>
                  {label}
                </Button>
              ) : (
                <VStack key={s.one}>{label}</VStack>
              );
            })}
          </HStack>
        </VStack>
      ) : null}
      <Rectangle fill={hairline} frame={{ maxWidth: "infinity", height: 0.5 }} />
      <ActionBar post={post} large />
      <Rectangle fill={hairline} frame={{ maxWidth: "infinity", height: 0.5 }} />
      {hasParent ? (
        <Background alignment="topLeading">
          <Rectangle fill={hairline} frame={{ width: 2, height: 6 }} padding={{ leading: 22 }} />
        </Background>
      ) : null}
    </VStack>
  );
}
