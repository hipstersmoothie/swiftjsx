// A profile: avatar (with story ring), stats, bio, follow button, and a
// 3-column photo grid (VirtualList `columns`), plus Saved on your own.
import { useState, type ReactNode } from "react";
import {
  useNavigation, Screen, ToolbarItem, VirtualList, VStack, HStack, ZStack, Text, Image, Button, Menu, Label, Rectangle,
  Spacer, openURL,
} from "swiftjsx";
import { ME, photoURL, postCount, profilePost, user as getUser, type Post } from "./data";
import { compact } from "./format";
import { PostScreen } from "./Post";
import { useIsFollowing, useSocial, useUI } from "./store";
import { Avatar, RichText, Verified, brandBlue, linkColor, useRing, useWidth } from "./ui";

const PAGE = 30;
/** Points between grid cells. */
const GAP = 1.5;

export function ProfileScreen({ userId }: { userId: string }) {
  const u = getUser(userId);
  const isMe = userId === ME;
  const [epoch] = useState(() => Date.now());
  const [tab, setTab] = useState<"posts" | "saved">("posts");
  const total = postCount(userId);
  const [shown, setShown] = useState(Math.min(PAGE, total));
  const saves = useSocial((s) => s.saves);
  const toast = useUI((s) => s.showToast);

  const posts =
    tab === "saved" ? Object.values(saves) : Array.from({ length: shown }, (_, n) => profilePost(userId, n, epoch));

  return (
    <Screen title={userId} titleDisplayMode="inline">
      <ToolbarItem placement="primaryAction">
        <Menu systemImage="ellipsis" tint="primary" accessibilityLabel="Profile options">
          <Button onPress={() => navigator.clipboard.writeText(`https://social.example/${userId}`).then(() => toast("Profile link copied", "link"))}>
            <Label title="Copy profile URL" systemImage="link" />
          </Button>
          {isMe ? null : (
            <Button role="destructive" onPress={() => toast(`Muted ${userId}`, "speaker.slash")}>
              <Label title="Mute" systemImage="speaker.slash" />
            </Button>
          )}
        </Menu>
      </ToolbarItem>
      {/* VirtualList has no header slot (and a grid would put a header in one cell), so the header sits above the grid and doesn't scroll away. */}
      <VStack spacing={0} frame={{ maxWidth: "infinity", maxHeight: "infinity", alignment: "top" }}>
        <ProfileHeader userId={userId} total={total} />
        {isMe ? (
          <GridTabs<"posts" | "saved">
            tab={tab}
            onChange={setTab}
            tabs={[
              { value: "posts", icon: "square.grid.3x3", label: "Posts" },
              { value: "saved", icon: "bookmark", label: "Saved" },
            ]}
          />
        ) : (
          <GridTabs tab="posts" onChange={() => {}} tabs={[{ value: "posts", icon: "square.grid.3x3", label: "Posts" }]} />
        )}
        <PostGrid
          // A fresh list per tab, starting at the top.
          key={tab}
          posts={posts}
          onEndReached={tab === "posts" && shown < total ? () => setShown((n) => Math.min(total, n + PAGE)) : undefined}
          empty={
            tab === "saved" ? (
              <Empty icon="bookmark" title="Save what you want to see again" message="Tap the bookmark on any post. Only you can see what you've saved." />
            ) : (
              <Empty icon="camera" title="No posts yet" message={`When ${u.name} shares photos, you'll see them here.`} />
            )
          }
        />
      </VStack>
    </Screen>
  );
}

function ProfileHeader({ userId, total }: { userId: string; total: number }) {
  const u = getUser(userId);
  const isMe = userId === ME;
  const following = useIsFollowing(userId);
  const toggleFollow = useSocial((s) => s.toggleFollow);
  const seen = useSocial((s) => s.seen);
  const ring = useRing(userId, seen);
  const openStories = useUI((s) => s.openStories);
  const toast = useUI((s) => s.showToast);
  // The seed data has you following everyone you see; unfollowing takes one off.
  const followers = isMe ? u.followers : u.followers - (following ? 0 : 1);

  return (
    <VStack alignment="leading" spacing={12} padding={{ horizontal: 16, top: 8, bottom: 14 }}>
      <HStack spacing={18}>
        <Button
          buttonStyle="plain"
          pressedScale={0.94}
          disabled={ring === "none"}
          onPress={() => openStories([userId], 0)}
          accessibilityLabel={ring === "none" ? `${userId}'s photo` : `${userId}'s story`}
          accessibilityIdentifier={ring === "none" ? undefined : "story"}
        >
          <Avatar user={userId} size={86} ring={ring} />
        </Button>
        <HStack spacing={0} frame={{ maxWidth: "infinity" }}>
          <Stat value={total} label="posts" />
          <Stat value={followers} label="followers" />
          <Stat value={u.following} label="following" />
        </HStack>
      </HStack>
      <VStack alignment="leading" spacing={3}>
        <HStack spacing={4}>
          <Text font="subheadline" fontWeight="semibold">{u.name}</Text>
          {u.verified ? <Verified size="footnote" /> : null}
        </HStack>
        <RichText text={u.bio} font="subheadline" />
        {u.link ? (
          <Button buttonStyle="plain" onPress={() => openURL(`https://${u.link}`, { inApp: true })}>
            <Text font="subheadline" fontWeight="semibold" foregroundStyle={linkColor}>
              <Image systemName="link" /> {u.link}
            </Text>
          </Button>
        ) : null}
      </VStack>
      <HStack spacing={6}>
        {isMe ? (
          <>
            <ProfileButton title="Edit profile" onPress={() => toast("Editing isn't in this demo", "pencil")} />
            <ProfileButton title="Share profile" onPress={() => navigator.clipboard.writeText(`https://social.example/${userId}`).then(() => toast("Profile link copied", "link"))} />
          </>
        ) : (
          <>
            <ProfileButton
              title={following ? "Following" : "Follow"}
              icon={following ? "chevron.down" : undefined}
              primary={!following}
              onPress={() => toggleFollow(userId)}
              identifier="follow-button"
            />
            <ProfileButton title="Message" onPress={() => toast("Messages aren't in this demo", "paperplane")} />
          </>
        )}
      </HStack>
    </VStack>
  );
}

function Stat({ value, label }: { value: number; label: string }) {
  return (
    <VStack spacing={1} frame={{ maxWidth: "infinity" }} accessibilityElement="combine">
      <Text font="headline" contentTransition="numericText" animation="snappy">{compact(value)}</Text>
      <Text font="footnote">{label}</Text>
    </VStack>
  );
}

function ProfileButton({ title, icon, primary, onPress, identifier }: { title: string; icon?: string; primary?: boolean; onPress(): void; identifier?: string }) {
  return (
    <Button onPress={onPress} pressedOpacity={0.6} frame={{ maxWidth: "infinity" }} accessibilityIdentifier={identifier}>
      <HStack spacing={4} frame={{ maxWidth: "infinity", height: 34 }} background={primary ? brandBlue : "secondarySystemFill"} cornerRadius={9} animation="snappy">
        <Text font="subheadline" fontWeight="semibold" foregroundStyle={primary ? "white" : "label"}>{title}</Text>
        {icon ? <Image systemName={icon} font="caption" fontWeight="semibold" foregroundStyle="label" /> : null}
      </HStack>
    </Button>
  );
}

type GridTab<T extends string> = { value: T; icon: string; label: string };

function GridTabs<T extends string>({ tab, onChange, tabs }: { tab: T; onChange(tab: T): void; tabs: GridTab<T>[] }) {
  return (
    <HStack spacing={0}>
      {tabs.map((t) => (
        <Button key={t.value} buttonStyle="plain" onPress={() => onChange(t.value)} frame={{ maxWidth: "infinity" }} accessibilityLabel={t.label} accessibilityTraits={t.value === tab ? ["button", "selected"] : "button"}>
          <VStack spacing={10} padding={{ top: 6 }} contentShape="rectangle" frame={{ maxWidth: "infinity" }}>
            <Image systemName={t.icon} font="title3" foregroundStyle={t.value === tab ? "label" : "tertiaryLabel"} />
            <Rectangle fill={t.value === tab ? "label" : "separator"} frame={{ height: t.value === tab ? 1.5 : 0.5 }} animation="snappy" />
          </VStack>
        </Button>
      ))}
    </HStack>
  );
}

/** Three square columns of photos; tap one to open the post. */
export function PostGrid({ posts, onEndReached, empty, onRefresh }: { posts: Post[]; onEndReached?(): void; empty?: ReactNode; onRefresh?(): Promise<unknown> }) {
  const width = useWidth();
  const nav = useNavigation();
  const cell = (width - GAP * 2) / 3;
  if (!posts.length && empty) return <>{empty}</>;
  return (
    <VirtualList
      data={posts}
      columns={3}
      spacing={GAP}
      itemHeight={cell}
      keyExtractor={(p) => p.id}
      onEndReached={onEndReached}
      onEndReachedThreshold={12}
      onRefresh={onRefresh}
      frame={{ maxWidth: "infinity", maxHeight: "infinity" }}
      renderItem={(post) => (
        <Button buttonStyle="plain" pressedOpacity={0.7} onPress={() => nav.push(<PostScreen post={post} />)} accessibilityLabel={`Post by ${post.author}`} accessibilityIdentifier="grid-post">
          <ZStack frame={{ maxWidth: "infinity", height: cell }} background="secondarySystemBackground">
            <Image src={photoURL(post.photos[0], 300)} contentMode="fill" frame={{ maxWidth: "infinity", height: cell }} />
            {post.photos.length > 1 ? (
              <VStack frame={{ maxWidth: "infinity", maxHeight: "infinity", alignment: "topTrailing" }} padding={6}>
                <Image systemName="square.fill.on.square.fill" font="caption" foregroundStyle="white" shadow={{ radius: 2, color: "#00000066" }} />
              </VStack>
            ) : null}
          </ZStack>
        </Button>
      )}
    />
  );
}

function Empty({ icon, title, message }: { icon: string; title: string; message: string }) {
  return (
    <VStack spacing={10} padding={32} frame={{ maxWidth: "infinity" }}>
      <Spacer minLength={24} />
      <Image systemName={icon} font={{ size: 44, weight: "light" }} padding={18} border={{ color: "label", width: 2 }} cornerRadius="capsule" />
      <Text font="title3" fontWeight="bold" textAlignment="center">{title}</Text>
      <Text font="subheadline" foregroundStyle="secondary" textAlignment="center">{message}</Text>
    </VStack>
  );
}
