// Home: the stories row and an endless feed of posts (VirtualList), with
// pull to refresh for new posts and infinite loading. Plus the Liked screen.
import { useState } from "react";
import { useNavigation, Screen, ToolbarItem, VirtualList, VStack, Text, Image, Button, ProgressView } from "swiftjsx";
import { feedPost, freshPost, type Post } from "./data";
import { PostView } from "./Post";
import { StoriesRow } from "./Stories";
import { useSocial } from "./store";
import { storyRing, useWidth } from "./ui";

const PAGE = 10;
/** The feed ends here ("You're all caught up"). */
const MAX_POSTS = 200;

export function FeedScreen() {
  const width = useWidth();
  const nav = useNavigation();
  const [epoch] = useState(() => Date.now());
  const [count, setCount] = useState(PAGE);
  const [fresh, setFresh] = useState<Post[]>([]);
  const [hidden, setHidden] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const likedCount = useSocial((s) => Object.keys(s.likes).length);

  const posts = [...fresh, ...Array.from({ length: count }, (_, n) => feedPost(n, epoch))].filter((p) => !hidden.includes(p.id));
  const more = count < MAX_POSTS;

  const loadMore = () => {
    if (loading || !more) return;
    setLoading(true);
    // A pretend network round trip.
    setTimeout(() => {
      setCount((c) => Math.min(MAX_POSTS, c + PAGE));
      setLoading(false);
    }, 700);
  };
  const refresh = () =>
    new Promise<void>((resolve) =>
      setTimeout(() => {
        const now = Date.now();
        setFresh((f) => [freshPost(f.length + 1, now), freshPost(f.length, now), ...f]);
        resolve();
      }, 900),
    );

  return (
    <Screen title="Home" titleDisplayMode="inline">
      <ToolbarItem placement="principal">
        <Text font={{ name: "SnellRoundhand-Black", size: 30, relativeTo: "title" }} accessibilityTraits="header">Socialgram</Text>
      </ToolbarItem>
      <ToolbarItem placement="primaryAction">
        <Button onPress={() => nav.push(<LikedScreen />)} accessibilityLabel="Posts you've liked" accessibilityIdentifier="liked-posts">
          <Image systemName={likedCount ? "heart.fill" : "heart"} foregroundStyle={likedCount ? "red" : "label"} />
        </Button>
      </ToolbarItem>
      <VirtualList
        data={posts}
        keyExtractor={(post) => post.id}
        estimatedItemHeight={width + 190}
        header={<StoriesRow />}
        footer={<Footer loading={more} />}
        renderItem={(post) => <PostView post={post} onHide={(hide) => setHidden((h) => [...h, hide.id])} />}
        onEndReached={loadMore}
        onEndReachedThreshold={3}
        onRefresh={refresh}
        frame={{ maxWidth: "infinity", maxHeight: "infinity" }}
        accessibilityIdentifier="feed"
      />
    </Screen>
  );
}

function Footer({ loading }: { loading: boolean }) {
  return loading ? (
    <ProgressView frame={{ maxWidth: "infinity", height: 80 }} />
  ) : (
    <VStack spacing={8} padding={{ vertical: 36 }} frame={{ maxWidth: "infinity" }}>
      <Image systemName="checkmark" font="title2" fontWeight="semibold" foregroundStyle="white" frame={{ width: 54, height: 54 }} background={storyRing} cornerRadius={27} />
      <Text font="headline">You're all caught up</Text>
      <Text font="footnote" foregroundStyle="secondary">You've seen all new posts.</Text>
    </VStack>
  );
}

function LikedScreen() {
  const likes = useSocial((s) => s.likes);
  const width = useWidth();
  // Most recently liked first.
  const posts = Object.values(likes).reverse();
  return (
    <Screen title="Liked" titleDisplayMode="inline">
      {posts.length ? (
        <VirtualList data={posts} keyExtractor={(p) => p.id} estimatedItemHeight={width + 190} renderItem={(post) => <PostView post={post} />} />
      ) : (
        <VStack spacing={12} padding={32} frame={{ maxWidth: "infinity", maxHeight: "infinity" }}>
          <Image systemName="heart" font={{ size: 40, weight: "light" }} frame={{ width: 84, height: 84 }} border={{ color: "label", width: 2 }} cornerRadius="capsule" />
          <Text font="title3" fontWeight="bold">No likes yet</Text>
          <Text font="subheadline" foregroundStyle="secondary" textAlignment="center">Double tap a photo, or tap the heart, and it shows up here.</Text>
        </VStack>
      )}
    </Screen>
  );
}
