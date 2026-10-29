// One post: author header, a paging photo carousel (double tap to like, with a
// heart burst on the main thread), actions with counts, the caption with
// "more", and the comment link.
import { useState } from "react";
import {
  useNavigation, VStack, HStack, ZStack, ScrollView, Text, Image, Button, Menu, Label, Divider, Spacer, Screen, Pager, PageIndicator,
  ConfirmationDialog, useSharedValue, useAnimatedStyle, withSpring, withTiming, withDelay, withSequence, runOnJS, haptic, withAnimation,
  toast, format,
} from "swiftjsx";
import { ME, others, photoURL, user as getUser, type Post } from "./data";
import { compact, longDate } from "./format";
import { useIsFollowing, useIsLiked, useIsSaved, useMyCommentCount, useSocial, useUI } from "./store";
import { ProfileScreen } from "./Profile";
import { Avatar, RichText, Verified, useRing, useWidth, brandBlue } from "./ui";

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
        <Button onPress={() => toast(toggleSave(post) ? "Saved" : "Removed from saved", { systemImage: "bookmark" })}>
          <Label title={saved ? "Remove from saved" : "Save"} systemImage={saved ? "bookmark.slash" : "bookmark"} />
        </Button>
        <Button onPress={() => copyLink(post).then(() => toast("Link copied", { systemImage: "link" }))}>
          <Label title="Copy link" systemImage="link" />
        </Button>
        <Divider />
        <Button
          onPress={() => {
            toggleFollow(post.author);
            toast(following ? `Unfollowed ${post.author}` : `Following ${post.author}`, { systemImage: following ? "person.badge.minus" : "person.badge.plus" });
          }}
        >
          <Label title={following ? "Unfollow" : "Follow"} systemImage={following ? "person.badge.minus" : "person.badge.plus"} />
        </Button>
        {onHide ? (
          <Button onPress={() => withAnimation("snappy", () => onHide(post))}>
            <Label title="Not interested" systemImage="eye.slash" />
          </Button>
        ) : null}
        <Button role="destructive" onPress={() => toast("Thanks for letting us know", { systemImage: "flag" })}>
          <Label title="Report" systemImage="exclamationmark.bubble" />
        </Button>
      </Menu>
    </HStack>
  );
}

const copyLink = (post: Post) => navigator.clipboard.writeText(`https://social.example/p/${post.id}`);

// MARK: Carousel

function Carousel({ post, page, onPage, onDoubleTap }: { post: Post; page: number; onPage(page: number): void; onDoubleTap(): void }) {
  const width = useWidth();
  // The heart burst runs on the main thread, so it pops in the same frame as
  // the second tap; the like itself goes through React. A second double tap
  // starts the sequence over, so the heart stays up.
  const heartScale = useSharedValue(0.3);
  const heartOpacity = useSharedValue(0);
  const heart = useAnimatedStyle(() => ({ scale: heartScale.get(), opacity: heartOpacity.get() }));

  const multiple = post.photos.length > 1;
  const photo = (i: number) => <Image key={i} src={photoURL(post.photos[i])} contentMode="fill" frame={{ width, height: width }} />;
  return (
    <ZStack
      frame={{ width, height: width }}
      background="secondarySystemBackground"
      onDoubleTap={() => {
        "worklet";
        heartScale.set(withSequence(
          withSpring(1, { duration: 0.35, bounce: 0.5 }),
          withDelay(0.3, withTiming(0.75, { duration: 0.18, easing: "easeIn" })),
          withTiming(0.3, { duration: 0 }),
        ));
        heartOpacity.set(withSequence(withTiming(1, { duration: 0.08 }), withDelay(0.57, withTiming(0, { duration: 0.18 }))));
        runOnJS(onDoubleTap)();
      }}
      accessibilityLabel={multiple ? `Photo ${page + 1} of ${post.photos.length} by ${post.author}` : `Photo by ${post.author}`}
      accessibilityHint="Double tap to like"
    >
      {multiple ? (
        <Pager page={page} onPageChange={onPage} indicator="counter" indicatorAlignment="topTrailing" frame={{ width, height: width }}>
          {post.photos.map((_, i) => photo(i))}
        </Pager>
      ) : (
        photo(0)
      )}
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
      {post.photos.length > 1 ? <PageIndicator count={post.photos.length} page={page} tint={brandBlue} inactive="systemGray3" /> : null}
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
      accessibilityValue={format.count(count, { one: "# like", other: "# likes" })}
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
  const shares = Math.round(post.likes * 0.03);
  return (
    <Button onPress={() => setOpen(true)} pressedScale={0.85} accessibilityLabel="Share">
      <HStack spacing={5}>
        <Image systemName="paperplane" font={{ size: 21 }} foregroundStyle="label" />
        {shares ? <Text font="subheadline" fontWeight="semibold" foregroundStyle="label">{compact(shares)}</Text> : null}
      </HStack>
      <ConfirmationDialog isPresented={open} onDismiss={() => setOpen(false)} title="Share post">
        <Button title="Copy link" onPress={() => copyLink(post).then(() => toast("Link copied", { systemImage: "link" }))} />
        {post.likedBy ? <Button title={`Send to ${post.likedBy}`} onPress={() => toast(`Sent to ${post.likedBy}`, { systemImage: "paperplane.fill" })} /> : null}
        <Button title="Add to your story" onPress={() => toast("Added to your story", { systemImage: "plus.circle" })} />
        <Button title="Cancel" role="cancel" onPress={() => setOpen(false)} />
      </ConfirmationDialog>
    </Button>
  );
}

function SaveButton({ post }: { post: Post }) {
  const saved = useIsSaved(post.id);
  const toggle = useSocial((s) => s.toggleSave);
  return (
    <Button
      onPress={() => {
        const now = toggle(post);
        haptic(now ? "success" : "light");
        toast(now ? "Saved to your collection" : "Removed from saved", { systemImage: now ? "bookmark.fill" : "bookmark" });
      }}
      pressedScale={0.85}
      accessibilityIdentifier="save-button"
      accessibilityLabel={saved ? "Remove from saved" : "Save"}
    >
      <Image systemName={saved ? "bookmark.fill" : "bookmark"} font={{ size: 22 }} foregroundStyle="label" symbolEffect={{ type: "bounce", value: saved }} />
    </Button>
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
  const nav = useNavigation();
  const [expanded, setExpanded] = useState(false);
  const [truncated, setTruncated] = useState(false);
  const collapsed = truncated && !expanded;
  return (
    <VStack
      alignment="leading"
      spacing={1}
      onTapGesture={collapsed ? () => withAnimation("snappy", () => setExpanded(true)) : undefined}
      accessibilityIdentifier="caption"
    >
      <RichText
        lead={post.author}
        text={post.caption}
        font="subheadline"
        lineLimit={expanded ? undefined : 2}
        onTruncationChange={setTruncated}
        onMention={(id) => {
          if (id === ME || others.includes(id)) nav.push(<ProfileScreen userId={id} />);
        }}
      />
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
          {format.count(count, { one: "View # comment", other: "View all # comments" })}
        </Text>
        {latest ? <RichText lead={latest.author} text={latest.text} font="subheadline" lineLimit={1} /> : null}
      </VStack>
    </Button>
  );
}

const WEEK = 7 * 86_400_000;

/** "2 hours ago" (kept current natively); older than a week, the date. */
function Time({ post }: { post: Post }) {
  return Date.now() - post.createdAt < WEEK ? (
    <Text font="caption" foregroundStyle="secondary" date={post.createdAt} dateStyle="ago" />
  ) : (
    <Text font="caption" foregroundStyle="secondary">{longDate(post.createdAt)}</Text>
  );
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
