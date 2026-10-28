// A post in a feed: "Reposted by" / "Replying to" context, avatar, name,
// handle and time, rich text, embeds, and the action row (reply, repost or
// quote, an animated like, share, more). Thread lines connect posts in a
// reply chain.
import {
  VStack, HStack, Text, Image, Button, Menu, MenuLabel, Label, Divider, Spacer, Background, Rectangle, ShareLink,
  useNavigation, useSharedValue, useAnimatedStyle, withSequence, withTiming, withSpring, openURL, type ColorValue,
} from "swiftjsx";
import { postWebURL } from "./api";
import { ago, agoSpoken, compact, displayName } from "./format";
import { RichText } from "./PostText";
import { Embed } from "./Embeds";
import { ThreadScreen } from "./Thread";
import { ProfileScreen } from "./Profile";
import { toast, usePostState, useInteractions, useUI } from "./store";
import { AVATAR, Avatar, GUTTER, H_PADDING, hairline, likeColor, repostColor, subtle, useContentWidth, useNow } from "./ui";
import type { FeedViewPost, PostView, ProfileViewBasic } from "./types";

type CellProps = {
  post: PostView;
  /** "Reposted by …" above the post. */
  repostedBy?: ProfileViewBasic;
  /** "Replying to …" under the name, when the parent isn't shown above. */
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

export function PostCell({ post, repostedBy, replyingTo, lineAbove = false, lineBelow = false, pinned = false, indent = 0, hideSeparator = false }: CellProps) {
  const nav = useNavigation();
  const now = useNow();
  const width = useContentWidth(indent);
  const author = post.author;
  const openThread = () => nav.push(<ThreadScreen uri={post.uri} initial={post} />);
  const openProfile = () => nav.push(<ProfileScreen actor={author.did} initial={author} />);

  return (
    <VStack
      spacing={0}
      alignment="leading"
      padding={{ leading: indent }}
      contentShape="rectangle"
      onTapGesture={openThread}
      accessibilityIdentifier="post"
      accessibilityElement="contain"
    >
      {repostedBy || pinned ? (
        <HStack spacing={6} padding={{ leading: H_PADDING + AVATAR - 14, top: 10 }}>
          <Image systemName={pinned ? "pin.fill" : "arrow.2.squarepath"} font="caption" fontWeight="semibold" foregroundStyle={subtle} frame={{ width: 14 }} />
          {repostedBy ? (
            <Text font="footnote" fontWeight="semibold" foregroundStyle={subtle} lineLimit={1} onTapGesture={() => nav.push(<ProfileScreen actor={repostedBy.did} initial={repostedBy} />)}>
              Reposted by {displayName(repostedBy)}
            </Text>
          ) : (
            <Text font="footnote" fontWeight="semibold" foregroundStyle={subtle}>Pinned</Text>
          )}
        </HStack>
      ) : null}
      <HStack alignment="top" spacing={GUTTER} padding={{ horizontal: H_PADDING, top: lineAbove || repostedBy || pinned ? 4 : 12, bottom: lineBelow ? 0 : 10 }}>
        <VStack spacing={4} frame={{ width: AVATAR }}>
          <Button onPress={openProfile} accessibilityLabel={`${displayName(author)}'s profile`} pressedOpacity={0.7}>
            <Avatar uri={author.avatar} size={AVATAR} />
          </Button>
        </VStack>
        <VStack alignment="leading" spacing={4} frame={{ maxWidth: "infinity", alignment: "leading" }}>
          <HStack spacing={4} accessibilityElement="combine" accessibilityLabel={`${displayName(author)}, @${author.handle}, ${agoSpoken(post.indexedAt, now)}`}>
            <Text font="subheadline" fontWeight="bold" lineLimit={1} layoutPriority={1}>{displayName(author)}</Text>
            {author.verification?.verifiedStatus === "valid" ? <Image systemName="checkmark.seal.fill" font="caption" foregroundStyle="blue" /> : null}
            <Text font="subheadline" foregroundStyle={subtle} lineLimit={1}>@{author.handle}</Text>
            <Text font="subheadline" foregroundStyle={subtle} fixedSize>· {ago(post.record.createdAt ?? post.indexedAt, now)}</Text>
            <Spacer minLength={0} />
          </HStack>
          {replyingTo ? (
            <HStack spacing={4}>
              <Image systemName="arrowshape.turn.up.left.fill" font="caption2" foregroundStyle={subtle} />
              <Text font="footnote" foregroundStyle={subtle} lineLimit={1}>Replying to {displayName(replyingTo)}</Text>
            </HStack>
          ) : null}
          <RichText text={post.record.text} facets={post.record.facets} font="body" />
          {post.embed ? (
            <VStack padding={{ top: 4 }}>
              <Embed embed={post.embed} width={width} />
            </VStack>
          ) : null}
          <ActionBar post={post} />
        </VStack>
        {/* Thread lines run in the avatar column, behind it (sized to this row). */}
        <Background alignment="topLeading">
          {lineAbove ? <Rectangle fill={hairline} frame={{ width: 2, height: 4 }} padding={{ leading: H_PADDING + AVATAR / 2 - 1 }} /> : null}
          {lineBelow ? (
            <VStack padding={{ leading: H_PADDING + AVATAR / 2 - 1, top: (lineAbove || repostedBy || pinned ? 4 : 12) + AVATAR + 4 }} frame={{ maxHeight: "infinity", alignment: "top" }}>
              <Rectangle fill={hairline} frame={{ width: 2, maxHeight: "infinity" }} />
            </VStack>
          ) : null}
        </Background>
      </HStack>
      {hideSeparator || lineBelow ? null : <Rectangle fill={hairline} frame={{ maxWidth: "infinity", height: 0.5 }} />}
    </VStack>
  );
}

// MARK: Actions

/** Reply, repost (menu: repost / quote), like, share, more. `large` for the focused post in a thread. */
export function ActionBar({ post, large = false }: { post: PostView; large?: boolean }) {
  const state = usePostState(post);
  const toggleLike = useInteractions((s) => s.toggleLike);
  const toggleRepost = useInteractions((s) => s.toggleRepost);
  const openCompose = useUI((s) => s.openCompose);
  const nav = useNavigation();
  const url = postWebURL(post.uri, post.author.handle);
  const font = large ? "body" : "subheadline";
  const icon = large ? "title3" : "subheadline";

  // The heart pops on the main thread (a worklet animation started from JS).
  const heart = useSharedValue(1);
  const heartStyle = useAnimatedStyle(() => ({ scale: heart.get() }));
  const like = () => {
    if (!state.liked) heart.set(withSequence(withTiming(1.35, { duration: 0.1 }), withSpring(1, { duration: 0.35, bounce: 0.55 })));
    toggleLike(post);
  };

  const count = (n: number) => (large ? null : <Text font="footnote" foregroundStyle={subtle} monospacedDigit animation="snappy">{n ? compact(n) : ""}</Text>);

  return (
    <HStack spacing={0} padding={{ top: large ? 8 : 4 }} frame={{ maxWidth: "infinity" }}>
      <Button
        onPress={() => openCompose({ replyTo: post })}
        buttonStyle="plain"
        accessibilityLabel={`Reply (${post.replyCount ?? 0} replies)`}
        accessibilityIdentifier="reply-button"
        frame={{ maxWidth: "infinity", alignment: "leading" }}
      >
        <HStack spacing={5} padding={{ vertical: 4 }}>
          <Image systemName="bubble.left" font={icon} foregroundStyle={subtle} />
          {count(post.replyCount ?? 0)}
        </HStack>
      </Button>
      <Menu
        tint={state.reposted ? repostColor : subtle}
        accessibilityLabel={state.reposted ? `Undo repost (${state.repostCount} reposts)` : `Repost or quote (${state.repostCount} reposts)`}
        accessibilityIdentifier="repost-button"
        frame={{ maxWidth: "infinity", alignment: "leading" }}
      >
        <MenuLabelContent icon="arrow.2.squarepath" font={icon} color={state.reposted ? repostColor : subtle} count={large ? null : state.repostCount} bold={state.reposted} />
        <Button onPress={() => toggleRepost(post)}>
          <Label title={state.reposted ? "Undo repost" : "Repost"} systemImage="arrow.2.squarepath" />
        </Button>
        <Button onPress={() => openCompose({ quote: post })}>
          <Label title="Quote post" systemImage="quote.opening" />
        </Button>
      </Menu>
      <Button
        onPress={like}
        buttonStyle="plain"
        accessibilityLabel={state.liked ? `Unlike (${state.likeCount} likes)` : `Like (${state.likeCount} likes)`}
        accessibilityIdentifier="like-button"
        frame={{ maxWidth: "infinity", alignment: "leading" }}
      >
        <HStack spacing={5} padding={{ vertical: 4 }}>
          <Image systemName={state.liked ? "heart.fill" : "heart"} font={icon} foregroundStyle={state.liked ? likeColor : subtle} animatedStyle={heartStyle} />
          {large ? null : (
            <Text font="footnote" foregroundStyle={state.liked ? likeColor : subtle} monospacedDigit animation="snappy">
              {state.likeCount ? compact(state.likeCount) : ""}
            </Text>
          )}
        </HStack>
      </Button>
      <ShareLink url={url} accessibilityLabel="Share" frame={{ maxWidth: large ? "infinity" : undefined, alignment: "leading" }}>
        <Image systemName="square.and.arrow.up" font={icon} foregroundStyle={subtle} padding={{ vertical: 4, trailing: large ? 0 : 18 }} />
      </ShareLink>
      <Menu accessibilityLabel="More options" accessibilityIdentifier="more-button" tint={subtle}>
        <MenuLabelContent icon="ellipsis" font={icon} color={subtle} count={null} />
        <Button onPress={() => navigator.clipboard.writeText(post.record.text).then(() => toast("Copied to clipboard", "doc.on.doc"))}>
          <Label title="Copy post text" systemImage="doc.on.doc" />
        </Button>
        <Button onPress={() => navigator.clipboard.writeText(url).then(() => toast("Link copied", "link"))}>
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

function MenuLabelContent({ icon, font, color, count, bold = false }: { icon: string; font: "title3" | "subheadline"; color: ColorValue; count: number | null; bold?: boolean }) {
  return (
    <MenuLabel>
      <HStack spacing={5} padding={{ vertical: 4 }}>
        <Image systemName={icon} font={font} fontWeight={bold ? "semibold" : "regular"} foregroundStyle={color} />
        {count !== null ? <Text font="footnote" foregroundStyle={color} monospacedDigit>{count ? compact(count) : ""}</Text> : null}
      </HStack>
    </MenuLabel>
  );
}

