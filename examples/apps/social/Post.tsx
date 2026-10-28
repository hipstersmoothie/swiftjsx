// One post: author header, a paging photo carousel (double tap to like, with a
// heart burst on the main thread), actions with counts, the caption with
// "more", and the comment link.
import { useState } from "react";
import {
  useNavigation, VStack, HStack, ZStack, ScrollView, Text, Image, Button, Menu, Label, Divider, Spacer, Circle, Screen,
  ConfirmationDialog, useSharedValue, useAnimatedStyle, withSpring, withTiming, runOnJS, haptic, withAnimation,
} from "swiftjsx";
import { photoURL, user as getUser, type Post } from "./data";
import { ago, compact, isLong } from "./format";
import { useIsFollowing, useIsLiked, useIsSaved, useMyCommentCount, useSocial, useUI } from "./store";
import { ProfileScreen } from "./Profile";
import { Avatar, RichText, Verified, useNow, useRing, useWidth, brandBlue } from "./ui";

type PostProps = {
  post: Post;
  /** "Not interested": the feed drops the post. */
  onHide?: (post: Post) => void;
};

export function PostView({ post, onHide }: PostProps) {
  const [page, setPage] = useState(0);
  const like = useSocial((s) => s.like);
  return (
    <VStack spacing={0} alignment="leading" padding={{ bottom: 14 }} accessibilityIdentifier="post" accessibilityElement="contain">
      <PostHeader post={post} onHide={onHide} />
      <Carousel
        post={post}
        page={page}
        onPage={setPage}
        onDoubleTap={() => {
          like(post);
          haptic("light");
        }}
      />
      <Actions post={post} page={page} />
      <VStack alignment="leading" spacing={5} padding={{ horizontal: 14 }}>
        <LikedBy post={post} />
        <Caption post={post} />
        <CommentsLink post={post} />
        <Time post={post} />
      </VStack>
    </VStack>
  );
}

// MARK: Header

function PostHeader({ post, onHide }: PostProps) {
  const nav = useNavigation();
  const author = getUser(post.author);
  const following = useIsFollowing(post.author);
  const toggleFollow = useSocial((s) => s.toggleFollow);
  const saved = useIsSaved(post.id);
  const toggleSave = useSocial((s) => s.toggleSave);
  const seen = useSocial((s) => s.seen);
  const ring = useRing(post.author, seen);
  const toast = useUI((s) => s.showToast);
  const openProfile = () => nav.push(<ProfileScreen userId={post.author} />);

  return (
    <HStack spacing={10} padding={{ leading: 12, trailing: 4, vertical: 8 }}>
      <Button buttonStyle="plain" onPress={openProfile} accessibilityLabel={`${author.id}'s profile`}>
        <Avatar user={post.author} size={34} ring={ring} />
      </Button>
      <Button buttonStyle="plain" onPress={openProfile}>
        <VStack alignment="leading" spacing={1}>
          <HStack spacing={4}>
            <Text font="subheadline" fontWeight="semibold">{author.id}</Text>
            {author.verified ? <Verified /> : null}
          </HStack>
          {post.location ? <Text font="caption" lineLimit={1}>{post.location}</Text> : null}
        </VStack>
      </Button>
      <Spacer />
      <Menu systemImage="ellipsis" tint="primary" accessibilityLabel="More options" padding={10}>
        <Button onPress={() => toast(toggleSave(post) ? "Saved" : "Removed from saved", "bookmark")}>
          <Label title={saved ? "Remove from saved" : "Save"} systemImage={saved ? "bookmark.slash" : "bookmark"} />
        </Button>
        <Button onPress={() => copyLink(post).then(() => toast("Link copied", "link"))}>
          <Label title="Copy link" systemImage="link" />
        </Button>
        <Divider />
        <Button
          onPress={() => {
            toggleFollow(post.author);
            toast(following ? `Unfollowed ${post.author}` : `Following ${post.author}`, following ? "person.badge.minus" : "person.badge.plus");
          }}
        >
          <Label title={following ? "Unfollow" : "Follow"} systemImage={following ? "person.badge.minus" : "person.badge.plus"} />
        </Button>
        {onHide ? (
          <Button onPress={() => withAnimation("snappy", () => onHide(post))}>
            <Label title="Not interested" systemImage="eye.slash" />
          </Button>
        ) : null}
        <Button role="destructive" onPress={() => toast("Thanks for letting us know", "flag")}>
          <Label title="Report" systemImage="exclamationmark.bubble" />
        </Button>
      </Menu>
    </HStack>
  );
}

const copyLink = (post: Post) => navigator.clipboard.writeText(`https://social.example/p/${post.id}`);

// MARK: Carousel

/** How long the heart stays up after a double tap (ms). */
const HEART_HOLD = 650;

function Carousel({ post, page, onPage, onDoubleTap }: { post: Post; page: number; onPage(page: number): void; onDoubleTap(): void }) {
  const width = useWidth();
  // The heart burst runs on the main thread, so it pops in the same frame as
  // the second tap; the like itself goes through React.
  const heartScale = useSharedValue(0.3);
  const heartOpacity = useSharedValue(0);
  const heart = useAnimatedStyle(() => ({ scale: heartScale.get(), opacity: heartOpacity.get() }));
  // Which burst is showing, so a quick second double tap keeps the heart up.
  // (A shared value, not a ref: the worklet below captures `settle`, and the
  // React Compiler won't compile a component that hands a ref-reading
  // function to a call during render.)
  const burst = useSharedValue(0);

  // There's no withSequence or animation-completion callback, so the fade
  // out (and the reset) are timers on the JS thread.
  const settle = () => {
    const id = burst.get() + 1;
    burst.set(id);
    setTimeout(() => {
      if (burst.get() !== id) return;
      heartOpacity.set(withTiming(0, { duration: 0.18 }));
      heartScale.set(withTiming(0.75, { duration: 0.18, easing: "easeIn" }));
    }, HEART_HOLD);
    setTimeout(() => {
      if (burst.get() === id) heartScale.set(0.3);
    }, HEART_HOLD + 220);
    onDoubleTap();
  };

  const multiple = post.photos.length > 1;
  return (
    <ZStack
      frame={{ width, height: width }}
      background="secondarySystemBackground"
      onDoubleTap={() => {
        "worklet";
        heartScale.set(withSpring(1, { duration: 0.35, bounce: 0.5 }));
        heartOpacity.set(withTiming(1, { duration: 0.08 }));
        runOnJS(settle)();
      }}
      accessibilityLabel={multiple ? `Photo ${page + 1} of ${post.photos.length} by ${post.author}` : `Photo by ${post.author}`}
      accessibilityHint="Double tap to like"
    >
      {multiple ? (
        <ScrollView
          axis="horizontal"
          paging
          spacing={0}
          showsIndicators={false}
          frame={{ width, height: width }}
          onScrollIndexChange={onPage}
        >
          {post.photos.map((photo, i) => (
            <Image key={i} src={photoURL(photo)} contentMode="fill" frame={{ width, height: width }} />
          ))}
        </ScrollView>
      ) : (
        <Image src={photoURL(post.photos[0])} contentMode="fill" frame={{ width, height: width }} />
      )}
      {multiple ? (
        <VStack frame={{ maxWidth: "infinity", maxHeight: "infinity", alignment: "topTrailing" }} padding={12} allowsHitTesting={false}>
          <Text
            font="caption"
            fontWeight="semibold"
            monospacedDigit
            foregroundStyle="white"
            padding={{ horizontal: 9, vertical: 4 }}
            background="black/60"
            cornerRadius="capsule"
          >
            {page + 1}/{post.photos.length}
          </Text>
        </VStack>
      ) : null}
      <Image
        systemName="heart.fill"
        font={{ size: 96 }}
        foregroundStyle="white"
        shadow={{ radius: 18, color: "#00000059" }}
        animatedStyle={heart}
        allowsHitTesting={false}
        accessibilityHidden
      />
    </ZStack>
  );
}

// MARK: Actions

function Actions({ post, page }: { post: Post; page: number }) {
  return (
    <ZStack padding={{ horizontal: 12, top: 8, bottom: 6 }}>
      <HStack spacing={14}>
        <LikeButton post={post} />
        <CommentButton post={post} />
        <ShareButton post={post} />
        <Spacer />
        <SaveButton post={post} />
      </HStack>
      {post.photos.length > 1 ? <PageDots count={post.photos.length} page={page} /> : null}
    </ZStack>
  );
}

function LikeButton({ post }: { post: Post }) {
  const liked = useIsLiked(post.id);
  const toggle = useSocial((s) => s.toggleLike);
  const count = post.likes + (liked ? 1 : 0);
  return (
    <Button
      onPress={() => {
        if (toggle(post)) haptic("light");
      }}
      pressedScale={0.85}
      accessibilityIdentifier="like-button"
      accessibilityLabel={liked ? "Unlike" : "Like"}
      accessibilityValue={`${count.toLocaleString("en-US")} likes`}
      accessibilityTraits={liked ? ["button", "selected"] : "button"}
    >
      <HStack spacing={5}>
        <Image
          systemName={liked ? "heart.fill" : "heart"}
          font={{ size: 23 }}
          foregroundStyle={liked ? "red" : "label"}
          symbolEffect={{ type: "bounce", value: liked }}
        />
        <Text font="subheadline" fontWeight="semibold" foregroundStyle="label" contentTransition="numericText" animation="snappy">
          {compact(count)}
        </Text>
      </HStack>
    </Button>
  );
}

function CommentButton({ post }: { post: Post }) {
  const open = useUI((s) => s.openComments);
  const mine = useMyCommentCount(post.id);
  const count = post.comments + mine;
  return (
    <Button onPress={() => open(post)} pressedScale={0.85} accessibilityLabel="Comment" accessibilityValue={`${count} comments`}>
      <HStack spacing={5}>
        <Image systemName="bubble.right" font={{ size: 22 }} foregroundStyle="label" />
        {count ? <Text font="subheadline" fontWeight="semibold" foregroundStyle="label">{compact(count)}</Text> : null}
      </HStack>
    </Button>
  );
}

function ShareButton({ post }: { post: Post }) {
  const [open, setOpen] = useState(false);
  const toast = useUI((s) => s.showToast);
  const shares = Math.round(post.likes * 0.03);
  return (
    <Button onPress={() => setOpen(true)} pressedScale={0.85} accessibilityLabel="Share">
      <HStack spacing={5}>
        <Image systemName="paperplane" font={{ size: 21 }} foregroundStyle="label" />
        {shares ? <Text font="subheadline" fontWeight="semibold" foregroundStyle="label">{compact(shares)}</Text> : null}
      </HStack>
      <ConfirmationDialog isPresented={open} onDismiss={() => setOpen(false)} title="Share post">
        <Button title="Copy link" onPress={() => copyLink(post).then(() => toast("Link copied", "link"))} />
        {post.likedBy ? <Button title={`Send to ${post.likedBy}`} onPress={() => toast(`Sent to ${post.likedBy}`, "paperplane.fill")} /> : null}
        <Button title="Add to your story" onPress={() => toast("Added to your story", "plus.circle")} />
        <Button title="Cancel" role="cancel" onPress={() => setOpen(false)} />
      </ConfirmationDialog>
    </Button>
  );
}

function SaveButton({ post }: { post: Post }) {
  const saved = useIsSaved(post.id);
  const toggle = useSocial((s) => s.toggleSave);
  const toast = useUI((s) => s.showToast);
  return (
    <Button
      onPress={() => {
        const now = toggle(post);
        haptic(now ? "success" : "light");
        toast(now ? "Saved to your collection" : "Removed from saved", now ? "bookmark.fill" : "bookmark");
      }}
      pressedScale={0.85}
      accessibilityIdentifier="save-button"
      accessibilityLabel={saved ? "Remove from saved" : "Save"}
    >
      <Image systemName={saved ? "bookmark.fill" : "bookmark"} font={{ size: 22 }} foregroundStyle="label" symbolEffect={{ type: "bounce", value: saved }} />
    </Button>
  );
}

/** Instagram's dots: the current one blue, far ones smaller. */
function PageDots({ count, page }: { count: number; page: number }) {
  return (
    <HStack spacing={4} animation="snappy" accessibilityHidden>
      {Array.from({ length: count }, (_, i) => (
        <Circle
          key={i}
          fill={i === page ? brandBlue : "systemGray3"}
          frame={{ width: 6, height: 6 }}
          scale={Math.abs(i - page) >= 3 ? 0.6 : 1}
        />
      ))}
    </HStack>
  );
}

// MARK: Text below

function LikedBy({ post }: { post: Post }) {
  if (!post.likedBy) return null;
  return (
    <HStack spacing={6}>
      <Avatar user={post.likedBy} size={18} />
      <Text font="footnote">
        Liked by <Text fontWeight="semibold">{post.likedBy}</Text> and <Text fontWeight="semibold">others</Text>
      </Text>
    </HStack>
  );
}

function Caption({ post }: { post: Post }) {
  const [expanded, setExpanded] = useState(false);
  // No way to ask whether Text truncated, so "more" is a length guess.
  const long = isLong(post.caption);
  const collapsed = long && !expanded;
  return (
    <VStack
      alignment="leading"
      spacing={1}
      onTapGesture={collapsed ? () => withAnimation("snappy", () => setExpanded(true)) : undefined}
      accessibilityIdentifier="caption"
    >
      <RichText lead={post.author} text={post.caption} font="subheadline" lineLimit={collapsed ? 2 : undefined} />
      {collapsed ? <Text font="subheadline" foregroundStyle="secondary">more</Text> : null}
    </VStack>
  );
}

function CommentsLink({ post }: { post: Post }) {
  const open = useUI((s) => s.openComments);
  const mine = useSocial((s) => s.comments[post.id]);
  const count = post.comments + (mine?.length ?? 0);
  const latest = mine?.[mine.length - 1];
  if (!count) return null;
  return (
    <Button buttonStyle="plain" onPress={() => open(post)}>
      <VStack alignment="leading" spacing={3}>
        <Text font="subheadline" foregroundStyle="secondary">
          {count === 1 ? "View 1 comment" : `View all ${count.toLocaleString("en-US")} comments`}
        </Text>
        {latest ? <RichText lead={latest.author} text={latest.text} font="subheadline" lineLimit={1} /> : null}
      </VStack>
    </Button>
  );
}

function Time({ post }: { post: Post }) {
  const now = useNow();
  return <Text font="caption" foregroundStyle="secondary">{ago(post.createdAt, now)}</Text>;
}

// MARK: Single post screen

export function PostScreen({ post }: { post: Post }) {
  return (
    <Screen title="Post" titleDisplayMode="inline">
      <ScrollView>
        <PostView post={post} />
      </ScrollView>
    </Screen>
  );
}
