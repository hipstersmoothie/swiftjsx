// A profile, laid out like Bluesky's: the banner runs under the (transparent)
// navigation bar and stretches when you pull down; the avatar (with a ring)
// overlaps it; Follow / Edit profile; name, handle, counts, bio, "Followed by
// …". The tab bar (Posts, Replies, Media, Videos, Likes for yourself, Feeds and
// Lists when there are any) is the list's sticky header, pinned under the bar.
// Once the banner reaches the bar it stays there as the bar's background,
// blurred, and the name and post count fade in over it. All of it follows the
// list's scroll offset on the main thread.
import { useState, type ReactNode } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Screen, VirtualList, ScrollView, VStack, HStack, ZStack, Text, Image, Button, Spacer, Rectangle, Menu, Overlay, Label, ShareLink, ToolbarItem,
  useNavigation, useSharedValue, useAnimatedStyle, useEnvironment, openURL, type SharedValue,
} from "swiftjsx";
import {
  getActorFeeds, getActorLikes, getAuthorFeed, getFollowers, getFollows, getLists, getProfile, profileWebURL, type AuthorFilter,
} from "./api";
import { compact, displayName, joinedDate } from "./format";
import { FeedList, useFeed } from "./FeedScreen";
import { RichText } from "./PostText";
import { ActorListScreen } from "./ActorList";
import { ThreadScreen } from "./Thread";
import { FeedRow } from "./Search";
import { toast, useInteractions, useIsFollowing, useUI } from "./store";
import { useMyDid } from "./session";
import { Verified } from "./PostCell";
import { Avatar, EmptyState, ErrorView, PillButton, Spinner, T, ty, useTheme, useSafeTop, useWindowWidth } from "./ui";
import type { FeedViewPost, ProfileViewBasic, ProfileViewDetailed } from "./types";

type Tab = "posts" | "replies" | "media" | "videos" | "likes" | "feeds" | "lists";
type TabSpec = { value: Tab; label: string };
type Scroll = SharedValue<{ x: number; y: number }>;

const FILTERS: Partial<Record<Tab, AuthorFilter>> = {
  posts: "posts_and_author_threads",
  replies: "posts_with_replies",
  media: "posts_with_media",
  videos: "posts_with_video",
};

function tabsFor(profile: ProfileViewDetailed | undefined, self: boolean): TabSpec[] {
  const tabs: TabSpec[] = [
    { value: "posts", label: "Posts" },
    { value: "replies", label: "Replies" },
    { value: "media", label: "Media" },
    { value: "videos", label: "Videos" },
  ];
  if (self) tabs.push({ value: "likes", label: "Likes" });
  if (profile?.associated?.feedgens) tabs.push({ value: "feeds", label: "Feeds" });
  if (profile?.associated?.lists) tabs.push({ value: "lists", label: "Lists" });
  return tabs;
}

/**
 * The navigation bar over a profile: no background or scroll edge effect (the
 * banner is its background), and light items on it.
 */
export const PROFILE_BAR = { title: "", titleDisplayMode: "inline", toolbarBackground: "hidden", toolbarColorScheme: "dark", scrollEdgeEffect: "hidden" } as const;

export function ProfileScreen({ actor, initial }: { actor: string; initial?: ProfileViewBasic }) {
  const query = useQuery({ queryKey: ["profile", actor], queryFn: ({ signal }) => getProfile(actor, signal) });
  const profile: ProfileViewDetailed | undefined = query.data ?? initial;
  return (
    <Screen {...PROFILE_BAR}>
      {profile ? (
        <ToolbarItem placement="primaryAction">
          <ProfileMenu profile={profile} />
        </ToolbarItem>
      ) : null}
      {query.isError && !profile ? (
        <ErrorView error={query.error} retry={() => query.refetch()} />
      ) : (
        <ProfileBody actor={actor} profile={profile} loading={query.isPending} />
      )}
    </Screen>
  );
}

function ProfileMenu({ profile }: { profile: ProfileViewDetailed }) {
  return (
    // White over the banner, like the back button (the bar's items are light).
    <Menu systemImage="ellipsis" tint="white" accessibilityLabel="Profile options">
      <ShareLink url={profileWebURL(profile.handle)}>
        <Label title="Share" systemImage="square.and.arrow.up" />
      </ShareLink>
      <Button onPress={() => navigator.clipboard.writeText(profileWebURL(profile.handle)).then(() => toast("Copied to clipboard", "link"))}>
        <Label title="Copy link to profile" systemImage="link" />
      </Button>
      <Button onPress={() => navigator.clipboard.writeText(profile.did).then(() => toast("Copied to clipboard", "number"))}>
        <Label title="Copy DID" systemImage="number" />
      </Button>
      <Button onPress={() => openURL(profileWebURL(profile.handle), { inApp: true })}>
        <Label title="Open in browser" systemImage="safari" />
      </Button>
    </Menu>
  );
}

/** The header and the selected tab's content (also the signed-in Profile tab). */
export function ProfileBody({ actor, profile, loading }: { actor: string; profile: ProfileViewDetailed | undefined; loading: boolean }) {
  const t = useTheme();
  const me = useMyDid();
  const { safeAreaInsets } = useEnvironment();
  const [tab, setTab] = useState<Tab>("posts");
  const client = useQueryClient();
  // The navigation bar's bottom (this view's top inset): where the tabs pin and the banner collapses.
  const safe = useSafeTop(safeAreaInsets.top + 54);
  const inset = safe.top;
  const scroll = useSharedValue({ x: 0, y: 0 });
  const tabs = tabsFor(profile, !!me && me === profile?.did);
  const bannerHeight = Math.max(150, inset + 70);
  const refreshProfile = () => client.invalidateQueries({ queryKey: ["profile", actor] });

  const header = <ProfileHeader profile={profile} loading={loading} bannerHeight={bannerHeight} inset={inset} scroll={scroll} />;
  const strip = <TabStrip tabs={tabs} tab={tab} onChange={setTab} />;

  return (
    <ZStack alignment="top" frame={{ maxWidth: "infinity", maxHeight: "infinity" }} background={t.bg} onSafeAreaChange={safe.onSafeAreaChange}>
      <TabContent key={tab} tab={tab} actor={actor} header={header} strip={strip} onRefresh={refreshProfile} scroll={scroll} />
      <CollapsedBar profile={profile} inset={inset} bannerHeight={bannerHeight} scroll={scroll} />
    </ZStack>
  );
}

/**
 * The bar once the banner has scrolled up to it: the banner's bottom strip
 * (exactly where the real one was, so the hand-off doesn't show), blurred in
 * as you keep scrolling, then the name and post count.
 */
function CollapsedBar({ profile, inset, bannerHeight, scroll }: { profile: ProfileViewDetailed | undefined; inset: number; bannerHeight: number; scroll: Scroll }) {
  const t = useTheme();
  const width = useWindowWidth();
  const collapseAt = bannerHeight - inset;
  // The name in the header is about this far below the banner.
  const titleAt = collapseAt + 64;
  const bar = useAnimatedStyle(() => ({ opacity: scroll.get().y >= collapseAt ? 1 : 0 }));
  const blur = useAnimatedStyle(() => ({ opacity: Math.max(0, Math.min(1, (scroll.get().y - collapseAt) / 60)) }));
  const title = useAnimatedStyle(() => {
    const p = Math.max(0, Math.min(1, (scroll.get().y - titleAt) / 24));
    return { opacity: p, offset: { x: 0, y: 10 * (1 - p) } };
  });
  return (
    <VStack spacing={0} frame={{ maxWidth: "infinity", maxHeight: "infinity", alignment: "top" }} ignoresSafeArea="top" allowsHitTesting={false} accessibilityHidden>
      <ZStack alignment="bottom" frame={{ width, height: inset, alignment: "bottom" }} cornerRadius={0.01} opacity={0} animatedStyle={bar}>
        {profile?.banner ? (
          <Image src={profile.banner} contentMode="fill" frame={{ width, height: bannerHeight }} background={t.bg50} />
        ) : (
          <Rectangle fill={t.primary} frame={{ width, height: bannerHeight }} />
        )}
        {/* No blur modifier: a dark material over the banner blurs it. */}
        <Rectangle fill="ultraThinMaterial" colorScheme="dark" frame={{ maxWidth: "infinity", maxHeight: "infinity" }} opacity={0} animatedStyle={blur} />
        <Rectangle fill="black/25" frame={{ maxWidth: "infinity", maxHeight: "infinity" }} opacity={0} animatedStyle={blur} />
        {profile ? (
          <VStack spacing={1} padding={{ horizontal: 80, bottom: 7 }} frame={{ height: 44 }} opacity={0} animatedStyle={title}>
            <Text font={ty(T.md, "bold")} foregroundStyle="white" lineLimit={1}>{displayName(profile)}</Text>
            {profile.postsCount !== undefined ? (
              <Text font={ty(T.xs, "medium")} foregroundStyle="white/80" lineLimit={1}>{compact(profile.postsCount)} {profile.postsCount === 1 ? "post" : "posts"}</Text>
            ) : null}
          </VStack>
        ) : null}
      </ZStack>
    </VStack>
  );
}

function TabContent({ tab, actor, header, strip, onRefresh, scroll }: { tab: Tab; actor: string; header: ReactNode; strip: ReactNode; onRefresh(): void; scroll: Scroll }) {
  const filter = FILTERS[tab];
  if (tab === "media" || tab === "videos") return <MediaGrid actor={actor} video={tab === "videos"} header={header} strip={strip} onRefresh={onRefresh} scroll={scroll} />;
  if (tab === "feeds" || tab === "lists") return <GeneratorList actor={actor} kind={tab} header={header} strip={strip} scroll={scroll} />;
  return (
    <FeedList
      id="profile-feed"
      queryKey={tab === "likes" ? ["likes-of", actor] : ["author", actor, filter]}
      fetchPage={(cursor, signal) => (tab === "likes" ? getActorLikes(actor, cursor, signal) : getAuthorFeed(actor, filter ?? "posts_and_author_threads", cursor, signal))}
      header={header}
      stickyHeader={strip}
      scrollOffset={scroll}
      onRefresh={onRefresh}
      empty={
        tab === "replies"
          ? { icon: "bubble.left.and.bubble.right", title: "No replies yet" }
          : tab === "likes"
            ? { icon: "heart", title: "No likes yet" }
            : { icon: "text.bubble", title: "No posts yet" }
      }
    />
  );
}

// MARK: Header

function ProfileHeader({ profile, loading, bannerHeight, inset, scroll }: { profile: ProfileViewDetailed | undefined; loading: boolean; bannerHeight: number; inset: number; scroll: Scroll }) {
  const nav = useNavigation();
  const t = useTheme();
  const width = useWindowWidth();
  const me = useMyDid();
  const following = useIsFollowing(profile);
  const toggleFollow = useInteractions((s) => s.toggleFollow);
  const openImages = useUI((s) => s.openImages);
  const AV = 90;
  const self = !!me && me === profile?.did;
  // Pulled down past the top: the banner grows to fill the gap, anchored at its bottom.
  const stretch = useAnimatedStyle(() => {
    const y = scroll.get().y;
    return { scale: y < 0 ? (bannerHeight - y) / bannerHeight : 1 };
  });
  const known = profile?.viewer?.knownFollowers;

  return (
    <VStack spacing={0} alignment="leading" accessibilityIdentifier="profile-header" accessibilityElement="contain">
      {/* The banner's top `inset` points sit under the navigation bar, above the content's start. */}
      <ZStack alignment="bottom" frame={{ width, height: bannerHeight - inset, alignment: "bottom" }} zIndex={0}>
        {profile?.banner ? (
          <Image src={profile.banner} contentMode="fill" frame={{ width, height: bannerHeight }} background={t.bg50} transformAnchor="bottom" animatedStyle={stretch} accessibilityHidden />
        ) : (
          <Rectangle fill={profile || !loading ? t.primary : t.bg50} frame={{ width, height: bannerHeight }} transformAnchor="bottom" animatedStyle={stretch} />
        )}
      </ZStack>
      <HStack alignment="top" padding={{ horizontal: 16, top: 12 }} frame={{ height: 52, alignment: "top" }} zIndex={1}>
        <Button
          onPress={() => profile?.avatar && openImages([{ thumb: profile.avatar, fullsize: profile.avatar, alt: "", aspectRatio: { width: 1, height: 1 } }], 0)}
          pressedOpacity={0.85}
          accessibilityLabel={profile ? `${displayName(profile)}'s avatar` : "Avatar"}
          offset={{ y: -(AV / 2) - 12 - 4 }}
        >
          <VStack padding={3} background={t.bg} cornerRadius="capsule">
            <Avatar uri={profile?.avatar} size={AV} full />
          </VStack>
        </Button>
        <Spacer />
        <HStack spacing={6}>
          {profile && self ? <PillButton title="Edit Profile" variant="secondary" small onPress={() => openURL("https://bsky.app/profile/" + profile.handle, { inApp: true })} /> : null}
          {profile && !self ? (
            <PillButton
              title={following ? "Following" : "Follow"}
              systemImage={following ? "checkmark" : "plus"}
              variant={following ? "secondary" : "primary"}
              small
              onPress={() => toggleFollow(profile)}
              id="follow-button"
            />
          ) : null}
        </HStack>
      </HStack>
      <VStack alignment="leading" spacing={0} padding={{ horizontal: 16, top: 6, bottom: 14 }}>
        <HStack spacing={5}>
          <Text font={ty(28, "bold")} foregroundStyle={t.text} lineLimit={2} redacted={!profile} accessibilityTraits="header">
            {profile ? displayName(profile) : "Loading profile"}
          </Text>
          {profile?.verification?.verifiedStatus === "valid" ? <Verified size={20} /> : null}
        </HStack>
        <HStack spacing={6} padding={{ top: 3 }}>
          {profile?.viewer?.followedBy ? (
            <Text font={ty(T.xs, "semibold")} foregroundStyle={t.textMedium} padding={{ horizontal: 6, vertical: 2.5 }} background={t.bg50} cornerRadius={5}>
              Follows you
            </Text>
          ) : null}
          <Text font={ty(T.md)} foregroundStyle={t.textMedium} redacted={!profile}>@{profile?.handle ?? "handle.bsky.social"}</Text>
        </HStack>
        {profile ? (
          <HStack spacing={14} padding={{ top: 12 }}>
            <Count
              n={profile.followersCount}
              label={profile.followersCount === 1 ? "follower" : "followers"}
              id="followers-count"
              onPress={() => nav.push(<ActorListScreen title="Followers" queryKey={["followers", profile.did]} fetchPage={(c, s) => getFollowers(profile.did, c, s)} />)}
            />
            <Count
              n={profile.followsCount}
              label="following"
              onPress={() => nav.push(<ActorListScreen title="Following" queryKey={["follows", profile.did]} fetchPage={(c, s) => getFollows(profile.did, c, s)} />)}
            />
            <Count n={profile.postsCount} label={profile.postsCount === 1 ? "post" : "posts"} />
          </HStack>
        ) : loading ? (
          <Spinner height={40} />
        ) : null}
        {profile?.description ? (
          <VStack padding={{ top: 12 }}>
            <RichText text={profile.description.trim()} detectFacets size={T.md} id="profile-bio" />
          </VStack>
        ) : null}
        {known && known.count > 0 ? <KnownFollowers known={known} /> : null}
        {profile?.createdAt && !profile.description ? (
          <HStack spacing={5} padding={{ top: 10 }}>
            <Image systemName="calendar" font={{ size: 12 }} foregroundStyle={t.textMedium} />
            <Text font={ty(T.sm)} foregroundStyle={t.textMedium}>Joined {joinedDate(profile.createdAt)}</Text>
          </HStack>
        ) : null}
      </VStack>
    </VStack>
  );
}

/** "Followed by Alice, Bob and 12 others you follow", with their avatars. */
function KnownFollowers({ known }: { known: { count: number; followers: ProfileViewBasic[] } }) {
  const t = useTheme();
  const names = known.followers.slice(0, 2).map(displayName);
  const others = known.count - names.length;
  const text = others > 0 ? `${names.join(", ")} and ${others} ${others === 1 ? "other" : "others"} you follow` : names.join(" and ");
  return (
    <HStack spacing={8} padding={{ top: 12 }}>
      <HStack spacing={-6}>
        {known.followers.slice(0, 3).map((f) => (
          <VStack key={f.did} padding={1.5} background={t.bg} cornerRadius="capsule">
            <Avatar uri={f.avatar} size={20} />
          </VStack>
        ))}
      </HStack>
      <Text font={ty(13)} foregroundStyle={t.textMedium} lineLimit={2}>Followed by {text}</Text>
    </HStack>
  );
}

function Count({ n, label, onPress, id }: { n: number | undefined; label: string; onPress?: () => void; id?: string }) {
  const t = useTheme();
  const text = (
    <Text font={ty(T.md)} foregroundStyle={t.textMedium}>
      <Text fontWeight="bold" foregroundStyle={t.text}>{compact(n ?? 0)}</Text>
      <Text> {label}</Text>
    </Text>
  );
  return onPress ? (
    <Button pressedOpacity={0.6} onPress={onPress} accessibilityIdentifier={id}>
      {text}
    </Button>
  ) : (
    text
  );
}

// MARK: Tabs

function TabStrip({ tabs, tab, onChange }: { tabs: TabSpec[]; tab: Tab; onChange(tab: Tab): void }) {
  const t = useTheme();
  const items = tabs.map((s) => {
    const selected = s.value === tab;
    return (
      <Button
        key={s.value}
        pressedOpacity={0.6}
        onPress={() => onChange(s.value)}
        frame={tabs.length <= 5 ? { maxWidth: "infinity" } : undefined}
        accessibilityIdentifier={`profile-tab-${s.value}`}
        accessibilityTraits={selected ? ["button", "selected"] : "button"}
      >
        <VStack spacing={0} padding={{ horizontal: 12 }} frame={{ height: 44 }} contentShape="rectangle">
          <Spacer />
          <Text font={ty(T.md, "semibold")} foregroundStyle={selected ? t.text : t.textMedium} lineLimit={1} fixedSize>{s.label}</Text>
          <Spacer />
          <HStack frame={{ height: 3 }}>
            <Text font={ty(T.md, "semibold")} foregroundStyle="clear" lineLimit={1} fixedSize frame={{ height: 3 }} background={selected ? t.primary : "clear"} cornerRadius="capsule" accessibilityHidden>
              {s.label}
            </Text>
          </HStack>
        </VStack>
      </Button>
    );
  });
  return (
    <VStack spacing={0} background={t.bg}>
      {tabs.length <= 5 ? (
        <HStack spacing={0} padding={{ horizontal: 4 }}>{items}</HStack>
      ) : (
        <ScrollView axis="horizontal" showsIndicators={false} contentMargins={{ horizontal: 4 }} spacing={0}>
          {items}
        </ScrollView>
      )}
      <Rectangle fill={t.border} frame={{ maxWidth: "infinity", height: 0.5 }} />
    </VStack>
  );
}

// MARK: Media

type MediaCell = { key: string; item: FeedViewPost; thumb: string; video: boolean; count: number };

function mediaOf(item: FeedViewPost): MediaCell | null {
  let embed = item.post.embed;
  if (embed?.$type === "app.bsky.embed.recordWithMedia#view") embed = embed.media;
  if (embed?.$type === "app.bsky.embed.images#view" && embed.images.length) {
    return { key: item.post.uri, item, thumb: embed.images[0].thumb, video: false, count: embed.images.length };
  }
  if (embed?.$type === "app.bsky.embed.video#view" && embed.thumbnail) {
    return { key: item.post.uri, item, thumb: embed.thumbnail, video: true, count: 1 };
  }
  return null;
}

function MediaGrid({ actor, video, header, strip, onRefresh, scroll }: { actor: string; video: boolean; header: ReactNode; strip: ReactNode; onRefresh(): void; scroll: Scroll }) {
  const filter: AuthorFilter = video ? "posts_with_video" : "posts_with_media";
  const { query, items } = useFeed(["author", actor, filter], (cursor, signal) => getAuthorFeed(actor, filter, cursor, signal));
  const nav = useNavigation();
  const t = useTheme();
  const width = useWindowWidth();
  const side = Math.floor((width - 4) / 3);
  const cellHeight = video ? Math.round(side * 1.5) : side;
  const seen = new Set<string>();
  const cells: MediaCell[] = [];
  for (const item of items) {
    const cell = mediaOf(item);
    if (cell && cell.video === video && !seen.has(cell.key)) {
      seen.add(cell.key);
      cells.push(cell);
    }
  }
  // Rows of three in a one-column list: in a `columns` grid, a `stickyHeader` makes
  // `header` a grid cell (it lands in the first column).
  const rows: MediaCell[][] = [];
  for (let i = 0; i < cells.length; i += 3) rows.push(cells.slice(i, i + 3));
  const cellView = (cell: MediaCell) => (
    <Button key={cell.key} onPress={() => nav.push(<ThreadScreen uri={cell.item.post.uri} initial={cell.item.post} />)} pressedOpacity={0.8} accessibilityLabel={cell.video ? "Video post" : "Image post"} accessibilityIdentifier="media-cell">
      <Image src={cell.thumb} contentMode="fill" frame={{ width: side, height: cellHeight }} background={t.bg50}>
        {cell.video || cell.count > 1 ? (
          <Overlay alignment={cell.video ? "bottomLeading" : "topTrailing"}>
            <Image systemName={cell.video ? "play.fill" : "square.on.square"} font={{ size: 12, weight: "semibold" }} foregroundStyle="white" shadow={{ radius: 3, color: "black/50" }} padding={7} />
          </Overlay>
        ) : null}
      </Image>
    </Button>
  );
  return (
    <VirtualList
      data={rows}
      keyExtractor={(row) => row[0].key}
      spacing={2}
      itemHeight={cellHeight}
      header={header}
      stickyHeader={strip}
      footer={
        query.isPending || query.hasNextPage ? (
          <Spinner />
        ) : query.isError ? (
          <ErrorView error={query.error} retry={() => query.refetch()} />
        ) : cells.length ? null : (
          <EmptyState icon={video ? "play.rectangle" : "photo.on.rectangle"} title={video ? "No videos yet" : "No media yet"} />
        )
      }
      renderItem={(row) => (
        <HStack spacing={2} frame={{ maxWidth: "infinity", alignment: "leading" }}>
          {row.map(cellView)}
        </HStack>
      )}
      onEndReached={() => {
        if (query.hasNextPage && !query.isFetchingNextPage) query.fetchNextPage();
      }}
      onRefresh={async () => {
        onRefresh();
        await query.refetch();
      }}
      scrollOffset={scroll}
      frame={{ maxWidth: "infinity", maxHeight: "infinity" }}
      background={t.bg}
      accessibilityIdentifier="media-grid"
    />
  );
}

// MARK: Feeds and lists

function GeneratorList({ actor, kind, header, strip, scroll }: { actor: string; kind: "feeds" | "lists"; header: ReactNode; strip: ReactNode; scroll: Scroll }) {
  const t = useTheme();
  const feeds = useQuery({ queryKey: ["actor-feeds", actor], enabled: kind === "feeds", queryFn: ({ signal }) => getActorFeeds(actor, signal) });
  const lists = useQuery({ queryKey: ["actor-lists", actor], enabled: kind === "lists", queryFn: ({ signal }) => getLists(actor, signal) });
  const pending = kind === "feeds" ? feeds.isPending : lists.isPending;
  return (
    <VirtualList
      data={kind === "feeds" ? (feeds.data?.feeds ?? []) : []}
      keyExtractor={(f) => f.uri}
      estimatedItemHeight={96}
      renderItem={(feed) => <FeedRow feed={feed} />}
      header={header}
      stickyHeader={strip}
      footer={
        <VStack spacing={0}>
          {kind === "lists"
            ? (lists.data?.lists ?? []).map((list) => (
                <HStack key={list.uri} spacing={12} padding={{ horizontal: 16, vertical: 12 }} frame={{ maxWidth: "infinity", alignment: "leading" }}>
                  <Avatar uri={list.avatar} size={40} square />
                  <VStack alignment="leading" spacing={2}>
                    <Text font={ty(T.md, "bold")} foregroundStyle={t.text} lineLimit={1}>{list.name}</Text>
                    <Text font={ty(T.sm)} foregroundStyle={t.textMedium} lineLimit={1}>
                      {list.purpose.endsWith("modlist") ? "Moderation list" : "List"} by @{list.creator.handle}
                    </Text>
                  </VStack>
                </HStack>
              ))
            : null}
          {pending ? <Spinner /> : null}
        </VStack>
      }
      scrollOffset={scroll}
      frame={{ maxWidth: "infinity", maxHeight: "infinity" }}
      background={t.bg}
    />
  );
}
