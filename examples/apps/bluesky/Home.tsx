// Home: Discover signed out; signed in, Following, Discover and your pinned
// feeds in a strip of tabs, with the compose button.
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Screen, ScrollView, VStack, HStack, Text, Image, Button, Capsule, Rectangle, ToolbarItem, Overlay } from "swiftjsx";
import { DISCOVER, getFeed, getFeedGenerators, getPreferredFeeds, getTimeline } from "./api";
import { FeedList } from "./FeedScreen";
import { useSession, useSettings } from "./session";
import { useUI } from "./store";
import { brand, hairline, subtle } from "./ui";

type FeedTab = { id: string; title: string; uri: string | null };

export function HomeScreen() {
  const signedIn = useSession((s) => s.session !== null);
  const did = useSession((s) => s.session?.did ?? null);
  const localPins = useSettings((s) => s.pinnedFeeds);
  const openCompose = useUI((s) => s.openCompose);
  const openSignIn = useUI((s) => s.openSignIn);
  const [selected, setSelected] = useState("following");

  // Signed in: the account's pinned feeds (from its preferences) plus any pinned here.
  const pinnedQuery = useQuery({
    queryKey: ["pinned-feeds", did, localPins],
    enabled: signedIn,
    queryFn: async ({ signal }) => {
      const remote = await getPreferredFeeds(signal).catch(() => [] as string[]);
      const uris = [...new Set([...remote, ...localPins])].filter((u) => u !== DISCOVER);
      if (!uris.length) return [];
      const { feeds } = await getFeedGenerators(uris, signal);
      return feeds.map((f) => ({ id: f.uri, title: f.displayName, uri: f.uri }));
    },
  });

  const tabs: FeedTab[] = signedIn
    ? [{ id: "following", title: "Following", uri: null }, { id: DISCOVER, title: "Discover", uri: DISCOVER }, ...(pinnedQuery.data ?? [])]
    : [{ id: DISCOVER, title: "Discover", uri: DISCOVER }];
  const current = tabs.find((t) => t.id === selected) ?? tabs[0];

  return (
    <Screen title={signedIn ? "Home" : "Discover"} titleDisplayMode="inline">
      <ToolbarItem placement="principal">
        <HStack spacing={6} accessibilityElement="combine" accessibilityLabel="Bluesky" accessibilityTraits="header">
          <Image systemName="cloud.fill" font="title3" foregroundStyle={brand} />
          <Text font={{ size: 19, weight: "heavy", design: "rounded" }} foregroundStyle={brand}>Bluesky</Text>
        </HStack>
      </ToolbarItem>
      {!signedIn ? (
        <ToolbarItem placement="primaryAction">
          <Button onPress={() => openSignIn("")} accessibilityIdentifier="toolbar-sign-in">
            <Text fontWeight="semibold" foregroundStyle={brand}>Sign in</Text>
          </Button>
        </ToolbarItem>
      ) : null}
      <VStack spacing={0} frame={{ maxWidth: "infinity", maxHeight: "infinity" }}>
        {tabs.length > 1 ? <FeedTabs tabs={tabs} selected={current.id} onSelect={setSelected} /> : null}
        <FeedList
          key={current.id}
          id="home-feed"
          queryKey={["home", current.id, did]}
          fetchPage={(cursor, signal) => (current.uri ? getFeed(current.uri, cursor, signal) : getTimeline(cursor, signal))}
          empty={current.uri ? undefined : { icon: "person.2", title: "Your timeline is empty", message: "Follow some people and their posts show up here." }}
        />
        {signedIn ? (
          <Overlay alignment="bottomTrailing">
            <Button onPress={() => openCompose()} pressedScale={0.92} accessibilityLabel="New post" accessibilityIdentifier="compose-button" padding={18}>
              <Image systemName="square.and.pencil" font="title2" fontWeight="semibold" foregroundStyle="white" frame={{ width: 58, height: 58 }} background={brand} cornerRadius="capsule" shadow={{ radius: 10, y: 4, color: "black/25" }} />
            </Button>
          </Overlay>
        ) : null}
      </VStack>
    </Screen>
  );
}

function FeedTabs({ tabs, selected, onSelect }: { tabs: FeedTab[]; selected: string; onSelect(id: string): void }) {
  return (
    <VStack spacing={0}>
      <ScrollView axis="horizontal" showsIndicators={false} spacing={18} contentMargins={{ horizontal: 16 }}>
        {tabs.map((tab) => {
          const on = tab.id === selected;
          return (
            <Button key={tab.id} buttonStyle="plain" onPress={() => onSelect(tab.id)} accessibilityTraits={on ? ["button", "selected"] : "button"}>
              <VStack spacing={8} padding={{ top: 8 }}>
                <Text font="subheadline" fontWeight={on ? "bold" : "medium"} foregroundStyle={on ? "label" : subtle}>{tab.title}</Text>
                <Capsule fill={on ? brand : "clear"} frame={{ height: 3 }} />
              </VStack>
            </Button>
          );
        })}
      </ScrollView>
      <Rectangle fill={hairline} frame={{ maxWidth: "infinity", height: 0.5 }} />
    </VStack>
  );
}
