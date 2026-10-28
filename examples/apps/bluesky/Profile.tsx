// A profile: banner, overlapping avatar, name and handle, bio with links,
// counts (followers / following open lists), and Posts / Replies / Media
// tabs (Media is a grid). Pull to refresh reloads the profile and the tab.
import { useState, type ReactNode } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Screen, VirtualList, VStack, HStack, ZStack, Text, Image, Button, Spacer, Rectangle, Capsule, Menu, Overlay, Label, ShareLink, ToolbarItem, ProgressView,
  useNavigation, openURL,
} from "swiftjsx";
import { getAuthorFeed, getFollowers, getFollows, getProfile, profileWebURL, type AuthorFilter } from "./api";
import { compact, displayName, joinedDate } from "./format";
import { FeedList, useFeed } from "./FeedScreen";
import { RichText } from "./PostText";
import { ActorListScreen } from "./ActorList";
import { ThreadScreen } from "./Thread";
import { toast, useInteractions, useIsFollowing } from "./store";
import { useMyDid } from "./session";
import { Avatar, EmptyState, ErrorView, PillButton, brand, cardBackground, hairline, screenBackground, subtle, useWindowWidth } from "./ui";
import type { FeedViewPost, ProfileViewBasic, ProfileViewDetailed } from "./types";

type Tab = "posts" | "replies" | "media";
const TABS: { value: Tab; label: string; filter: AuthorFilter }[] = [
  { value: "posts", label: "Posts", filter: "posts_and_author_threads" },
  { value: "replies", label: "Replies", filter: "posts_with_replies" },
  { value: "media", label: "Media", filter: "posts_with_media" },
];

export function ProfileScreen({ actor, initial }: { actor: string; initial?: ProfileViewBasic }) {
  const query = useQuery({ queryKey: ["profile", actor], queryFn: ({ signal }) => getProfile(actor, signal) });
  const profile: ProfileViewDetailed | undefined = query.data ?? initial;
  const title = profile ? displayName(profile) : "Profile";
  return (
    <Screen title={title} titleDisplayMode="inline" toolbarBackground="hidden">
      {profile ? (
        <ToolbarItem placement="primaryAction">
          <Menu systemImage="ellipsis.circle" accessibilityLabel="Profile options" tint={brand}>
            <ShareLink url={profileWebURL(profile.handle)}>
              <Label title="Share profile" systemImage="square.and.arrow.up" />
            </ShareLink>
            <Button onPress={() => navigator.clipboard.writeText(profileWebURL(profile.handle)).then(() => toast("Link copied", "link"))}>
              <Label title="Copy link" systemImage="link" />
            </Button>
            <Button onPress={() => navigator.clipboard.writeText(profile.did).then(() => toast("DID copied", "number"))}>
              <Label title="Copy DID" systemImage="number" />
            </Button>
            <Button onPress={() => openURL(profileWebURL(profile.handle), { inApp: true })}>
              <Label title="Open in browser" systemImage="safari" />
            </Button>
          </Menu>
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

/** The header and the selected tab's feed (also the signed-in Profile tab). */
export function ProfileBody({ actor, profile, loading }: { actor: string; profile: ProfileViewDetailed | undefined; loading: boolean }) {
  const [tab, setTab] = useState<Tab>("posts");
  const client = useQueryClient();
  const filter = TABS.find((t) => t.value === tab)!.filter;
  const header = (
    <VStack spacing={0}>
      <ProfileHeader profile={profile} loading={loading} />
      <TabStrip tab={tab} onChange={setTab} />
    </VStack>
  );
  const queryKey = ["author", actor, filter];
  const refreshProfile = () => client.invalidateQueries({ queryKey: ["profile", actor] });

  if (tab === "media") return <MediaGrid key="media" actor={actor} header={header} onRefresh={refreshProfile} />;
  return (
    <FeedList
      key={tab}
      id="profile-feed"
      queryKey={queryKey}
      fetchPage={(cursor, signal) => getAuthorFeed(actor, filter, cursor, signal)}
      header={header}
      onRefresh={refreshProfile}
      empty={{ icon: tab === "replies" ? "bubble.left.and.bubble.right" : "text.bubble", title: tab === "replies" ? "No replies yet" : "No posts yet" }}
    />
  );
}

// MARK: Header

function ProfileHeader({ profile, loading }: { profile: ProfileViewDetailed | undefined; loading: boolean }) {
  const nav = useNavigation();
  const width = useWindowWidth();
  const me = useMyDid();
  const following = useIsFollowing(profile);
  const toggleFollow = useInteractions((s) => s.toggleFollow);
  const bannerHeight = Math.round(width / 3);
  const AV = 84;

  return (
    <VStack spacing={0} alignment="leading" accessibilityIdentifier="profile-header" accessibilityElement="contain">
      {profile?.banner ? (
        <Image src={profile.banner} contentMode="fill" frame={{ width, height: bannerHeight }} background={cardBackground} accessibilityHidden />
      ) : (
        <Rectangle fill={{ gradient: [brand, { light: "#7cc0ff", dark: "#0b4a8a" }], start: "topLeading", end: "bottomTrailing" }} frame={{ width, height: bannerHeight }} />
      )}
      <HStack alignment="top" padding={{ horizontal: 16 }} frame={{ height: 40 }}>
        <ZStack frame={{ width: AV + 6, height: AV + 6 }} background={screenBackground} cornerRadius="capsule" offset={{ y: -(AV / 2) - 3 }}>
          <Avatar uri={profile?.avatar} size={AV} label={profile ? `${displayName(profile)}'s avatar` : undefined} />
        </ZStack>
        <Spacer />
        <HStack spacing={8} padding={{ top: 8 }}>
          {profile && me && me !== profile.did ? (
            <PillButton
              title={following ? "Following" : "Follow"}
              systemImage={following ? "checkmark" : "plus"}
              prominent={!following}
              onPress={() => toggleFollow(profile)}
              id="follow-button"
            />
          ) : null}
        </HStack>
      </HStack>
      <VStack alignment="leading" spacing={6} padding={{ horizontal: 16, bottom: 12 }}>
        <Text font={{ size: 26, weight: "bold" }} lineLimit={2} redacted={!profile} accessibilityTraits="header">
          {profile ? displayName(profile) : "Loading profile"}
        </Text>
        <HStack spacing={6}>
          {profile?.viewer?.followedBy ? (
            <Text font="caption" fontWeight="semibold" foregroundStyle={subtle} padding={{ horizontal: 6, vertical: 2 }} background="secondarySystemFill" cornerRadius={4}>
              Follows you
            </Text>
          ) : null}
          <Text font="subheadline" foregroundStyle={subtle} redacted={!profile}>@{profile?.handle ?? "handle.bsky.social"}</Text>
        </HStack>
        {profile ? (
          <HStack spacing={14} padding={{ top: 4 }}>
            <Count
              n={profile.followersCount}
              label="followers"
              id="followers-count"
              onPress={() => nav.push(<ActorListScreen title="Followers" queryKey={["followers", profile.did]} fetchPage={(c, s) => getFollowers(profile.did, c, s)} />)}
            />
            <Count
              n={profile.followsCount}
              label="following"
              onPress={() => nav.push(<ActorListScreen title="Following" queryKey={["follows", profile.did]} fetchPage={(c, s) => getFollows(profile.did, c, s)} />)}
            />
            <Count n={profile.postsCount} label="posts" />
          </HStack>
        ) : loading ? (
          <ProgressView padding={{ top: 4 }} />
        ) : null}
        {profile?.description ? (
          <VStack padding={{ top: 6 }}>
            <RichText text={profile.description.trim()} detectFacets font="subheadline" id="profile-bio" />
          </VStack>
        ) : null}
        {profile?.createdAt ? (
          <HStack spacing={5} padding={{ top: 2 }}>
            <Image systemName="calendar" font="caption" foregroundStyle={subtle} />
            <Text font="footnote" foregroundStyle={subtle}>Joined {joinedDate(profile.createdAt)}</Text>
          </HStack>
        ) : null}
      </VStack>
    </VStack>
  );
}

function Count({ n, label, onPress, id }: { n: number | undefined; label: string; onPress?: () => void; id?: string }) {
  const text = (
    <Text font="subheadline">
      <Text fontWeight="bold">{compact(n ?? 0)}</Text>
      <Text foregroundStyle={subtle}> {label}</Text>
    </Text>
  );
  return onPress ? (
    <Button buttonStyle="plain" onPress={onPress} accessibilityIdentifier={id}>
      {text}
    </Button>
  ) : (
    text
  );
}

// MARK: Tabs

function TabStrip({ tab, onChange }: { tab: Tab; onChange(tab: Tab): void }) {
  return (
    <VStack spacing={0}>
      <HStack spacing={0}>
        {TABS.map((t) => {
          const selected = t.value === tab;
          return (
            <Button
              key={t.value}
              buttonStyle="plain"
              onPress={() => onChange(t.value)}
              frame={{ maxWidth: "infinity" }}
              accessibilityIdentifier={`profile-tab-${t.value}`}
              accessibilityTraits={selected ? ["button", "selected"] : "button"}
            >
              <VStack spacing={9} padding={{ top: 10 }} contentShape="rectangle">
                <Text font="subheadline" fontWeight={selected ? "bold" : "medium"} foregroundStyle={selected ? "label" : subtle}>{t.label}</Text>
                <Capsule fill={selected ? brand : "clear"} frame={{ width: 44, height: 3 }} animation="snappy" />
              </VStack>
            </Button>
          );
        })}
      </HStack>
      <Rectangle fill={hairline} frame={{ maxWidth: "infinity", height: 0.5 }} />
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

function MediaGrid({ actor, header, onRefresh }: { actor: string; header: ReactNode; onRefresh(): void }) {
  const { query, items } = useFeed(["author", actor, "posts_with_media"], (cursor, signal) => getAuthorFeed(actor, "posts_with_media", cursor, signal));
  const nav = useNavigation();
  const width = useWindowWidth();
  const side = Math.floor((width - 4) / 3);
  const seen = new Set<string>();
  const cells: MediaCell[] = [];
  for (const item of items) {
    const cell = mediaOf(item);
    if (cell && !seen.has(cell.key)) {
      seen.add(cell.key);
      cells.push(cell);
    }
  }
  return (
    <VirtualList
      data={cells}
      keyExtractor={(c) => c.key}
      columns={3}
      spacing={2}
      itemHeight={side}
      header={header}
      footer={
        query.isPending || query.hasNextPage ? (
          <ProgressView frame={{ maxWidth: "infinity", height: 72 }} />
        ) : query.isError ? (
          <ErrorView error={query.error} retry={() => query.refetch()} />
        ) : cells.length ? null : (
          <EmptyState icon="photo.on.rectangle" title="No media yet" />
        )
      }
      renderItem={(cell) => (
        <Button onPress={() => nav.push(<ThreadScreen uri={cell.item.post.uri} initial={cell.item.post} />)} pressedOpacity={0.8} accessibilityLabel={cell.video ? "Video post" : "Image post"} accessibilityIdentifier="media-cell">
          <Image src={cell.thumb} contentMode="fill" frame={{ width: side, height: side }} background={cardBackground}>
            {cell.video || cell.count > 1 ? (
              <Overlay alignment="topTrailing">
                <Image systemName={cell.video ? "play.fill" : "square.on.square"} font="caption" foregroundStyle="white" shadow={{ radius: 3, color: "black/50" }} padding={6} />
              </Overlay>
            ) : null}
          </Image>
        </Button>
      )}
      onEndReached={() => {
        if (query.hasNextPage && !query.isFetchingNextPage) query.fetchNextPage();
      }}
      onRefresh={async () => {
        onRefresh();
        await query.refetch();
      }}
      frame={{ maxWidth: "infinity", maxHeight: "infinity" }}
      background={screenBackground}
      accessibilityIdentifier="media-grid"
    />
  );
}

