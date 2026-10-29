// Explore: an endless photo grid (pull for a new mix), and a search for people.
import { useState } from "react";
import { useNavigation, Screen, ScrollView, LazyVStack, HStack, VStack, Text, Button, Spacer, ContentUnavailable } from "swiftjsx";
import { explorePost, others, user as getUser } from "./data";
import { compact } from "./format";
import { PostGrid, ProfileScreen } from "./Profile";
import { useSocial } from "./store";
import { Avatar, Verified, useRing } from "./ui";

const PAGE = 45;

export function ExploreScreen() {
  const [search, setSearch] = useState("");
  const [epoch, setEpoch] = useState(() => Date.now());
  const [mix, setMix] = useState(0);
  const [shown, setShown] = useState(PAGE);
  const term = search.trim().toLowerCase().replace(/^@/, "");
  const posts = Array.from({ length: shown }, (_, n) => explorePost(n + mix * 1000, epoch));

  return (
    <Screen title="Explore" titleDisplayMode="inline" searchText={search} onSearchTextChange={setSearch} searchPrompt="Search people" searchPlacement="navigationBar">
      {term ? (
        <People term={term} />
      ) : (
        <PostGrid
          posts={posts}
          onEndReached={() => setShown((n) => n + PAGE)}
          onRefresh={() =>
            new Promise((resolve) =>
              setTimeout(() => {
                setMix((m) => m + 1);
                setEpoch(Date.now());
                setShown(PAGE);
                resolve(undefined);
              }, 700),
            )
          }
        />
      )}
    </Screen>
  );
}

function People({ term }: { term: string }) {
  const matches = others.filter((id) => id.includes(term) || getUser(id).name.toLowerCase().includes(term));
  if (!matches.length) return <ContentUnavailable search={term} />;
  return (
    <ScrollView>
      <LazyVStack spacing={0} alignment="leading" padding={{ vertical: 8 }}>
        {matches.map((id) => (
          <PersonRow key={id} id={id} />
        ))}
      </LazyVStack>
    </ScrollView>
  );
}

function PersonRow({ id }: { id: string }) {
  const nav = useNavigation();
  const u = getUser(id);
  const seen = useSocial((s) => s.seen);
  const ring = useRing(id, seen);
  return (
    <Button buttonStyle="plain" pressedBackground="systemFill" onPress={() => nav.push(<ProfileScreen userId={id} />)} accessibilityIdentifier="person">
      <HStack spacing={12} padding={{ horizontal: 16, vertical: 8 }} contentShape="rectangle">
        <Avatar user={id} size={48} ring={ring} />
        <VStack alignment="leading" spacing={2}>
          <HStack spacing={4}>
            <Text font="subheadline" fontWeight="semibold">{u.id}</Text>
            {u.verified ? <Verified /> : null}
          </HStack>
          <Text font="subheadline" foregroundStyle="secondary" lineLimit={1}>{u.name} · {compact(u.followers)} followers</Text>
        </VStack>
        <Spacer />
      </HStack>
    </Button>
  );
}
