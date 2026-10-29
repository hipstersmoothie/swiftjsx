// A post in a feed: "Reposted by" / "Reply to" context, avatar, name,
// handle and time on one line, rich text, embeds (labeled media behind a
// warning), and the action row (reply, repost or quote, an animated like,
// share, more). Thread lines connect posts in a reply chain.
import { useState } from "react";
import {
  VStack, HStack, ZStack, Text, Image, Button, Menu, MenuLabel, Label, Divider, Spacer, Background, Overlay, Rectangle, ShareLink, Canvas,
  useNavigation, useSharedValue, useAnimatedStyle, withSequence, withTiming, withSpring, openURL, toast, useNow, format,
} from "swiftjsx";
import { postWebURL } from "./api";
import { displayName } from "./format";
import { RichText } from "./PostText";
import { Embed, ContentHider, mediaWarning } from "./Embeds";
import { ThreadScreen } from "./Thread";
import { ProfileScreen } from "./Profile";
import { useSession } from "./session";
import { usePostState, useInteractions, useUI } from "./store";
import { BRAND } from "./theme";
import { AVATAR, Avatar, GUTTER, H_PADDING, T, ty, useContentWidth, useTheme } from "./ui";
import type { Color } from "swiftjsx";
import type { FeedViewPost, PostView, ProfileViewBasic } from "./types";

type CellProps = {
  post: PostView;
  /** "Reposted by …" above the post. */
  repostedBy?: ProfileViewBasic;
  /** "Reply to …" under the name, when the parent isn't shown above. */
  replyingTo?: ProfileViewBasic;
  /** Thread lines: from the post above into this avatar, and from this avatar down to the next post. */
  lineAbove?: boolean;
  lineBelow?: boolean;
  /** Pinned on a profile. */
  pinned?: boolean;
  /** Left indent (nested replies). */
  indent?: number;
  hideSeparator?: boolean;
};

/** A feed item: the parent (when the post is a reply) above the post itself, joined by a thread line. */
export function FeedItem({ item }: { item: FeedViewPost }) {
  const parent = item.reply?.parent;
  const repost = item.reason?.$type === "app.bsky.feed.defs#reasonRepost" ? item.reason.by : undefined;
  const pinned = item.reason?.$type === "app.bsky.feed.defs#reasonPin";
  // Show the parent above when it's a real post and this isn't a repost of a reply.
  const showParent = !!parent && "author" in parent && !("notFound" in parent) && !repost && "record" in parent;
  return (
    <VStack spacing={0} alignment="leading" accessibilityIdentifier="feed-item" accessibilityElement="contain">
      {showParent && parent && "record" in parent ? <PostCell post={parent} lineBelow hideSeparator /> : null}
      <PostCell
        post={item.post}
        repostedBy={repost}
        pinned={pinned}
        lineAbove={showParent}
        replyingTo={!showParent && parent && "author" in parent && "handle" in parent.author ? parent.author : undefined}
      />
    </VStack>
  );
}

/** Bluesky's verified badge. */
export function Verified({ size = 13 }: { size?: number }) {
  const t = useTheme();
  return <Image systemName="checkmark.seal.fill" font={{ size }} foregroundStyle={t.primary} accessibilityLabel="Verified" />;
}

export function PostCell({ post, repostedBy, replyingTo, lineAbove = false, lineBelow = false, pinned = false, indent = 0, hideSeparator = false }: CellProps) {
  const nav = useNavigation();
  const now = useNow();
  const t = useTheme();
  const width = useContentWidth(indent);
  const author = post.author;
  const openThread = () => nav.push(<ThreadScreen uri={post.uri} initial={post} />);
  const openProfile = () => nav.push(<ProfileScreen actor={author.did} initial={author} />);
  const hasReason = !!repostedBy || pinned;
  const top = lineAbove ? 0 : hasReason ? 6 : 12;
  const warning = mediaWarning(post);

  return (
    <VStack
      spacing={0}
      alignment="leading"
      padding={{ leading: indent }}
      background={t.bg}
      contentShape="rectangle"
      onTapGesture={openThread}
      accessibilityIdentifier="post"
      accessibilityElement="contain"
    >
      {hasReason ? (
        <HStack spacing={GUTTER} padding={{ leading: H_PADDING, top: 10 }}>
          <Image systemName={pinned ? "pin.fill" : "arrow.2.squarepath"} font={{ size: 12, weight: "semibold" }} foregroundStyle={t.textMedium} frame={{ width: AVATAR, alignment: "trailing" }} />
          {repostedBy ? (
            <Text font={ty(13, "medium")} foregroundStyle={t.textMedium} lineLimit={1} onTapGesture={() => nav.push(<ProfileScreen actor={repostedBy.did} initial={repostedBy} />)}>
              Reposted by {displayName(repostedBy)}
            </Text>
          ) : (
            <Text font={ty(13, "medium")} foregroundStyle={t.textMedium}>Pinned</Text>
          )}
        </HStack>
      ) : null}
      <HStack alignment="top" spacing={GUTTER} padding={{ horizontal: H_PADDING, top: lineAbove ? 8 : top, bottom: lineBelow ? 2 : 4 }}>
        <Button onPress={openProfile} accessibilityLabel={`${displayName(author)}'s profile`} pressedOpacity={0.7}>
          <Avatar uri={author.avatar} size={AVATAR} />
        </Button>
        <VStack alignment="leading" spacing={0} frame={{ maxWidth: "infinity", alignment: "leading" }}>
          <HStack spacing={0} padding={{ bottom: 2 }} accessibilityElement="combine" accessibilityLabel={`${displayName(author)}, @${author.handle}, ${format.relativeTime(Date.parse(post.indexedAt), { now, style: "long" })}`}>
            <Text font={ty(T.md, "bold")} foregroundStyle={t.text} lineLimit={1} layoutPriority={1}>{displayName(author)}</Text>
            {author.verification?.verifiedStatus === "valid" ? (
              <HStack padding={{ leading: 3 }}>
                <Verified />
              </HStack>
            ) : null}
            <Text font={ty(T.md)} foregroundStyle={t.textMedium} lineLimit={1} padding={{ leading: 4 }}>@{author.handle}</Text>
            <Text font={ty(T.md)} foregroundStyle={t.textMedium} fixedSize padding={{ leading: 4 }}>{`· ${format.relativeTime(Date.parse(post.record.createdAt ?? post.indexedAt), { now })}`}</Text>
            <Spacer minLength={0} />
          </HStack>
          {replyingTo ? (
            <HStack spacing={4} padding={{ bottom: 2 }}>
              <Image systemName="arrowshape.turn.up.left.fill" font={{ size: 10 }} foregroundStyle={t.textMedium} />
              <Text font={ty(13)} foregroundStyle={t.textMedium} lineLimit={1}>
                Reply to <Text fontWeight="medium">{displayName(replyingTo)}</Text>
              </Text>
            </HStack>
          ) : null}
          <RichText text={post.record.text} facets={post.record.facets} size={T.post} />
          {post.embed ? (
            <VStack padding={{ top: 8 }}>
              {warning ? (
                <ContentHider warning={warning} width={width}>
                  <Embed embed={post.embed} width={width} />
                </ContentHider>
              ) : (
                <Embed embed={post.embed} width={width} />
              )}
            </VStack>
          ) : null}
          <ActionBar post={post} />
        </VStack>
        {/* Thread lines run in the avatar column, behind it (sized to this row). */}
        <Background alignment="topLeading">
          {lineAbove ? <Rectangle fill={t.bg100} frame={{ width: 2, height: 6 }} padding={{ leading: H_PADDING + AVATAR / 2 - 1 }} /> : null}
          {lineBelow ? (
            <VStack padding={{ leading: H_PADDING + AVATAR / 2 - 1, top: (lineAbove ? 8 : top) + AVATAR + 4 }} frame={{ maxHeight: "infinity", alignment: "top" }}>
              <Rectangle fill={t.bg100} frame={{ width: 2, maxHeight: "infinity" }} />
            </VStack>
          ) : null}
        </Background>
      </HStack>
      {hideSeparator || lineBelow ? null : <Rectangle fill={t.border} frame={{ maxWidth: "infinity", height: 0.5 }} />}
    </VStack>
  );
}

// MARK: Actions

/** Reply, repost (menu: repost / quote), like, share, more. `large` for the focused post in a thread. */
export function ActionBar({ post, large = false }: { post: PostView; large?: boolean }) {
  const state = usePostState(post);
  const toggleRepost = useInteractions((s) => s.toggleRepost);
  const openCompose = useUI((s) => s.openCompose);
  const nav = useNavigation();
  const t = useTheme();
  const url = postWebURL(post.uri, post.author.handle);
  const size = large ? 22 : 18;
  const repostColor = state.reposted ? t.repost : t.textLow;

  return (
    <HStack spacing={0} padding={{ top: large ? 4 : 6, bottom: large ? 4 : 6 }} frame={{ maxWidth: "infinity" }} accessibilityIdentifier="action-bar" accessibilityElement="contain">
      <Button
        onPress={() => openCompose({ replyTo: post })}
        pressedOpacity={0.5}
        accessibilityLabel={`Reply (${post.replyCount ?? 0} replies)`}
        accessibilityIdentifier="reply-button"
        frame={{ maxWidth: "infinity", alignment: "leading" }}
      >
        <HStack spacing={5} padding={{ vertical: 3, trailing: 8 }} contentShape="rectangle">
          <Image systemName="bubble.left" font={{ size }} foregroundStyle={t.textLow} />
          {large ? null : <Count n={post.replyCount ?? 0} color={t.textLow} />}
        </HStack>
      </Button>
      <Menu
        tint={repostColor}
        accessibilityLabel={state.reposted ? `Undo repost (${state.repostCount} reposts)` : `Repost or quote (${state.repostCount} reposts)`}
        accessibilityIdentifier="repost-button"
        frame={{ maxWidth: "infinity", alignment: "leading" }}
      >
        <MenuLabel>
          <HStack spacing={5} padding={{ vertical: 3, trailing: 8 }} contentShape="rectangle">
            <Image systemName="arrow.2.squarepath" font={{ size, weight: state.reposted ? "semibold" : "regular" }} foregroundStyle={repostColor} />
            {large ? null : <Count n={state.repostCount} color={repostColor} />}
          </HStack>
        </MenuLabel>
        <Button onPress={() => toggleRepost(post)}>
          <Label title={state.reposted ? "Undo repost" : "Repost"} systemImage="arrow.2.squarepath" />
        </Button>
        <Button onPress={() => openCompose({ quote: post })}>
          <Label title="Quote post" systemImage="quote.opening" />
        </Button>
      </Menu>
      <LikeButton post={post} size={size} showCount={!large} />
      <ShareLink url={url} accessibilityLabel="Share" frame={large ? { maxWidth: "infinity", alignment: "leading" } : { width: 40, alignment: "center" }}>
        <Image systemName="square.and.arrow.up" font={{ size: size - 1 }} foregroundStyle={t.textLow} padding={{ vertical: 3, horizontal: 6 }} offset={{ y: -1 }} />
      </ShareLink>
      <Menu accessibilityLabel="Open post options menu" accessibilityIdentifier="more-button" tint={t.textLow} frame={{ width: large ? 44 : 40, alignment: "trailing" }}>
        <MenuLabel>
          <Image systemName="ellipsis" font={{ size: size - 2, weight: "semibold" }} foregroundStyle={t.textLow} padding={{ vertical: 9, leading: 12 }} contentShape="rectangle" />
        </MenuLabel>
        <Button onPress={() => navigator.clipboard.writeText(post.record.text).then(() => toast("Copied to clipboard", { systemImage: "doc.on.doc", tint: BRAND }))}>
          <Label title="Copy post text" systemImage="doc.on.doc" />
        </Button>
        <Button onPress={() => navigator.clipboard.writeText(url).then(() => toast("Copied to clipboard", { systemImage: "link", tint: BRAND }))}>
          <Label title="Copy link to post" systemImage="link" />
        </Button>
        <Button onPress={() => openURL(url, { inApp: true })}>
          <Label title="Open in browser" systemImage="safari" />
        </Button>
        <Divider />
        <Button onPress={() => nav.push(<ProfileScreen actor={post.author.did} initial={post.author} />)}>
          <Label title={`View @${post.author.handle}`} systemImage="person.crop.circle" />
        </Button>
      </Menu>
    </HStack>
  );
}

function Count({ n, color, bold = false }: { n: number; color: Color; bold?: boolean }) {
  return (
    <Text font={ty(T.sm, bold ? "semibold" : "regular")} foregroundStyle={color} monospacedDigit animation="snappy" lineLimit={1}>
      {n ? format.compact(n) : ""}
    </Text>
  );
}

const BURST_DOTS = 7;

/**
 * Bluesky's like: the heart shrinks and springs back filled, a ring and a
 * ring of dots burst out of it (a Canvas worklet, mounted only while it
 * plays), and the count rolls to the new number.
 */
function LikeButton({ post, size, showCount }: { post: PostView; size: number; showCount: boolean }) {
  const state = usePostState(post);
  const toggleLike = useInteractions((s) => s.toggleLike);
  const signedIn = useSession((s) => s.session !== null);
  const t = useTheme();
  const [bursting, setBursting] = useState(0);
  const heart = useSharedValue(1);
  const burst = useSharedValue(0);
  const heartStyle = useAnimatedStyle(() => ({ scale: heart.get() }));
  const color = state.liked ? t.like : t.textLow;
  const pink = t.like;

  const like = () => {
    if (!signedIn) {
      // Asks to sign in instead.
    } else if (!state.liked) {
      heart.set(withSequence(withTiming(0.62, { duration: 0.09 }), withSpring(1, { duration: 0.45, bounce: 0.6 })));
      burst.set(0);
      burst.set(withTiming(1, { duration: 0.55, easing: "easeOut" }));
      const id = Date.now();
      setBursting(id);
      setTimeout(() => setBursting((b) => (b === id ? 0 : b)), 650);
    } else {
      heart.set(withSequence(withTiming(0.85, { duration: 0.06 }), withSpring(1, { duration: 0.25 })));
    }
    toggleLike(post);
  };

  return (
    <Button
      onPress={like}
      pressedOpacity={0.6}
      accessibilityLabel={state.liked ? `Unlike (${state.likeCount} likes)` : `Like (${state.likeCount} likes)`}
      accessibilityIdentifier="like-button"
      frame={{ maxWidth: "infinity", alignment: "leading" }}
    >
      <HStack spacing={5} padding={{ vertical: 3, trailing: 8 }} contentShape="rectangle">
        <ZStack>
          <Image systemName={state.liked ? "heart.fill" : "heart"} font={{ size }} foregroundStyle={color} animatedStyle={heartStyle} />
          {bursting ? (
            <Overlay>
              <Canvas
                frame={{ width: size * 3, height: size * 3 }}
                allowsHitTesting={false}
                draw={(ctx, { width, height }) => {
                  const p = burst.get();
                  if (p <= 0 || p >= 1) return;
                  const cx = width / 2;
                  const cy = height / 2;
                  const unit = width / 6;
                  // The ring grows and thins out…
                  ctx.globalAlpha = Math.max(0, 1 - p * 1.6);
                  ctx.strokeStyle = pink;
                  ctx.lineWidth = Math.max(0.5, unit * 0.9 * (1 - p));
                  ctx.beginPath();
                  ctx.circle(cx, cy, unit * (0.6 + 1.7 * p));
                  ctx.stroke();
                  // …and the dots fly out and shrink.
                  ctx.globalAlpha = 1;
                  for (let i = 0; i < BURST_DOTS; i++) {
                    const angle = (i / BURST_DOTS) * Math.PI * 2 - Math.PI / 2;
                    const r = unit * (1.1 + 1.7 * p);
                    ctx.fillStyle = i % 2 === 0 ? pink : "#FF9F43";
                    ctx.beginPath();
                    ctx.circle(cx + Math.cos(angle) * r, cy + Math.sin(angle) * r, Math.max(0, unit * 0.32 * (1 - p)));
                    ctx.fill();
                  }
                }}
              />
            </Overlay>
          ) : null}
        </ZStack>
        {showCount ? <Count n={state.likeCount} color={color} /> : null}
      </HStack>
    </Button>
  );
}
