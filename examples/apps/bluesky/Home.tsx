// Home: Bluesky's header (menu, butterfly, feeds) over a strip of feed tabs
// with a sliding underline, and a pager of feeds you can swipe between. No
// navigation bar: the header is ours. It follows the finger away while you
// drag the feed down and snaps shown or hidden when you let go (Bluesky's
// "minimal shell"), all on the main thread from the list's scroll offset. A
// "New posts" pill appears when the feed has moved on, and the compose button
// floats bottom right when signed in.
import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Screen, ScrollView, ZStack, VStack, HStack, Text, Image, Button, Rectangle, Overlay, Spacer,
  useEnvironment, useSharedValue, useAnimatedStyle, useAnimatedReaction, withSpring, runOnJS, haptic, hot, makeMutable,
  type HostInstance, type SharedValue,
} from "swiftjsx";
import { DISCOVER, getFeed, getFeedGenerators, getPreferredFeeds, getTimeline } from "./api";
import { FeedList } from "./FeedScreen";
import { useSession, useSettings } from "./session";
import { useUI } from "./store";
import { useMyProfile } from "./Me";
import { Avatar, Butterfly, T, ty, useTheme, useSafeTop } from "./ui";
import type { FeedPage, ProfileViewBasic } from "./types";

type FeedTab = { id: string; title: string; uri: string | null };
type Offset = SharedValue<{ x: number; y: number }>;

/** Public feeds shown as tabs while signed out (a signed-in account has its own pins). */
const PUBLIC_TABS: FeedTab[] = [
  { id: DISCOVER, title: "Discover", uri: DISCOVER },
  { id: "video", title: "Video", uri: "at://did:plc:z72i7hdynmk6r22z27h6tvur/app.bsky.feed.generator/thevids" },
  { id: "science", title: "Science", uri: "at://did:plc:jfhpnnst6flqway4eaeqzj2a/app.bsky.feed.generator/for-science" },
  { id: "news", title: "News", uri: "at://did:plc:kkf4naxqmweop7dv4l2iqqf5/app.bsky.feed.generator/news-2-0" },
  { id: "classic", title: "What's Hot Classic", uri: "at://did:plc:z72i7hdynmk6r22z27h6tvur/app.bsky.feed.generator/hot-classic" },
];

/** The drawer's openness (0–1), shared by the edge swipe here and the drawer at the app's root. */
export const drawerProgress: ReturnType<typeof makeMutable<number>> = (hot.data.blueskyDrawer ??= makeMutable(0));

const HEADER_ROW = 44;
const TAB_STRIP = 44;
const HEADER = HEADER_ROW + TAB_STRIP;
const SNAP = { duration: 0.3, bounce: 0 } as const;

export function HomeScreen() {
  const signedIn = useSession((s) => s.session !== null);
  const did = useSession((s) => s.session?.did ?? null);
  const localPins = useSettings((s) => s.pinnedFeeds);
  const openCompose = useUI((s) => s.openCompose);
  const t = useTheme();
  const { window } = useEnvironment();
  const [page, setPage] = useState(0);
  const pager = useRef<HostInstance>(null);
  const lists = useRef<(HostInstance | null)[]>([]);

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
    : PUBLIC_TABS;
  const current = Math.min(page, tabs.length - 1);

  // The minimal shell: 0 shown, 1 tucked away (and faded, like Bluesky's).
  const shell = useSharedValue(0);
  const headerStyle = useAnimatedStyle(() => {
    const m = shell.get();
    return { offset: { x: 0, y: -HEADER * m }, opacity: (1 - m) * (1 - m) };
  });
  const showHeader = () => shell.set(withSpring(0, SNAP));

  // The pager's offset: the underline follows it while you swipe between feeds.
  const pagerOffset = useSharedValue({ x: 0, y: 0 });
  const select = (index: number) => {
    if (index === current) {
      // Tapping the current tab scrolls its feed to the top.
      lists.current[index]?.scrollTo("top");
      showHeader();
      return;
    }
    haptic("selection");
    pager.current?.scrollTo(index);
  };
  const onPage = (index: number) => {
    setPage(index);
    showHeader();
  };

  // The status bar above our header (none inside a sheet): our own top inset, with no navigation bar.
  const safe = useSafeTop();
  const topInset = safe.top;

  return (
    <Screen title="Home" navigationBar="hidden">
      {/* Measures the safe area (this one doesn't ignore it); the content draws under the status bar. */}
      <VStack spacing={0} frame={{ maxWidth: "infinity", maxHeight: "infinity" }} onSafeAreaChange={safe.onSafeAreaChange}>
        <ZStack alignment="top" frame={{ maxWidth: "infinity", maxHeight: "infinity" }} background={t.bg} ignoresSafeArea="top">
          <ScrollView
            ref={pager}
            axis="horizontal"
            paging
            spacing={0}
            showsIndicators={false}
            onScrollIndexChange={onPage}
            scrollOffset={pagerOffset}
            frame={{ maxWidth: "infinity", maxHeight: "infinity" }}
            ignoresSafeArea="top"
            accessibilityIdentifier="feed-pager"
          >
            {tabs.map((tab, i) => (
              <VStack key={tab.id} frame={{ width: window.width, maxHeight: "infinity" }} background={t.bg}>
                {/* Every page is mounted (pages added later didn't draw inside the pager). */}
                <FeedPage
                  tab={tab}
                  did={did}
                  contentTop={topInset + HEADER}
                  shell={shell}
                  listRef={(node) => {
                    lists.current[i] = node;
                  }}
                  active={i === current}
                  onShowHeader={showHeader}
                />
              </VStack>
            ))}
          </ScrollView>
          {/* The header: the status bar's band stays; the rows slide up under it. */}
          <VStack spacing={0} padding={{ top: topInset }} animatedStyle={headerStyle} background={t.bg} accessibilityIdentifier="home-header" accessibilityElement="contain">
            <HeaderRow />
            <FeedTabs tabs={tabs} selected={current} pager={pagerOffset} pageWidth={window.width} onSelect={select} />
          </VStack>
          <Rectangle fill={t.bg} frame={{ maxWidth: "infinity", height: topInset }} allowsHitTesting={false} />
          {/* Swipe in from the leading edge for the drawer (on the first feed, like Bluesky). */}
          {current === 0 ? <EdgeSwipe /> : null}
          {signedIn ? (
            <Overlay alignment="bottomTrailing">
              <Button onPress={() => openCompose()} pressedScale={0.9} accessibilityLabel="New post" accessibilityIdentifier="compose-button" padding={{ trailing: 18, bottom: 18 }}>
                <Image systemName="square.and.pencil" font={{ size: 22, weight: "semibold" }} foregroundStyle="white" frame={{ width: 58, height: 58 }} background={t.primary} cornerRadius="capsule" shadow={{ radius: 10, y: 4, color: "black/25" }} />
              </Button>
            </Overlay>
          ) : null}
        </ZStack>
      </VStack>
    </Screen>
  );
}

// MARK: Header

function HeaderRow() {
  const signedIn = useSession((s) => s.session !== null);
  const me = useMyProfile();
  const setDrawerOpen = useUI((s) => s.setDrawerOpen);
  const openSignIn = useUI((s) => s.openSignIn);
  const setTab = useUI((s) => s.setTab);
  const t = useTheme();
  const openDrawer = () => {
    haptic("light");
    drawerProgress.set(withSpring(1, { duration: 0.35, bounce: 0 }));
    setDrawerOpen(true);
  };
  return (
    <HStack spacing={0} padding={{ horizontal: 12 }} frame={{ height: HEADER_ROW }}>
      <Button onPress={openDrawer} pressedOpacity={0.6} accessibilityLabel="Open drawer menu" accessibilityIdentifier="open-drawer" frame={{ width: 64, alignment: "leading" }}>
        {signedIn ? (
          <Avatar uri={me.data?.avatar} size={30} />
        ) : (
          <Image systemName="line.3.horizontal" font={{ size: 21, weight: "medium" }} foregroundStyle={t.textMedium} frame={{ width: 34, height: 34 }} contentShape="rectangle" />
        )}
      </Button>
      <Spacer />
      <Butterfly size={24} />
      <Spacer />
      <HStack frame={{ width: 64, alignment: "trailing" }}>
        {signedIn ? (
          <Button onPress={() => setTab("search")} pressedOpacity={0.6} accessibilityLabel="Feeds">
            <Image systemName="number" font={{ size: 19, weight: "semibold" }} foregroundStyle={t.textMedium} frame={{ width: 34, height: 34 }} />
          </Button>
        ) : (
          <Button onPress={() => openSignIn("")} pressedOpacity={0.7} accessibilityLabel="Sign in" accessibilityIdentifier="toolbar-sign-in">
            <Text font={ty(T.sm, "semibold")} foregroundStyle="white" padding={{ horizontal: 12, vertical: 6 }} background={t.primary} cornerRadius="capsule" lineLimit={1} fixedSize>Sign in</Text>
          </Button>
        )}
      </HStack>
    </HStack>
  );
}

function FeedTabs({ tabs, selected, pager, pageWidth, onSelect }: { tabs: FeedTab[]; selected: number; pager: Offset; pageWidth: number; onSelect(index: number): void }) {
  const t = useTheme();
  const strip = useRef<HostInstance>(null);
  // Each tab's width, to place the underline under it (and between two while swiping).
  const [widths, setWidths] = useState<number[]>([]);
  const PAD = 12;
  const MARGIN = 4;
  const lefts: number[] = [];
  let x = 0;
  for (let i = 0; i < tabs.length; i++) {
    lefts.push(x);
    x += widths[i] ?? 0;
  }
  const total = x;
  const ready = widths.length === tabs.length && widths.every((w) => w > 0);
  // Page progress from the pager's offset, on the main thread: the underline slides and stretches between two tabs.
  const underline = useAnimatedStyle(() => {
    const p = Math.max(0, Math.min(lefts.length - 1, pager.get().x / Math.max(1, pageWidth)));
    const i = Math.floor(p);
    const f = p - i;
    const j = Math.min(lefts.length - 1, i + 1);
    const w0 = (widths[i] ?? 0) - PAD * 2;
    const w1 = (widths[j] ?? 0) - PAD * 2;
    return {
      offset: { x: lefts[i] + PAD + (lefts[j] - lefts[i]) * f, y: 0 },
      frame: { width: Math.max(0, w0 + (w1 - w0) * f), height: 3 },
    };
  });
  // Keeps the selected tab in view (centered when the strip is wider than the screen).
  const target = ready ? Math.max(0, Math.min(total + MARGIN * 2 - pageWidth, lefts[selected] + widths[selected] / 2 - pageWidth / 2)) : 0;
  useEffect(() => {
    if (ready) strip.current?.scrollTo({ x: target });
  }, [ready, target]);
  return (
    <VStack spacing={0} frame={{ height: TAB_STRIP }}>
      <ScrollView ref={strip} axis="horizontal" showsIndicators={false} contentMargins={{ horizontal: MARGIN }} frame={{ maxHeight: "infinity" }}>
        <HStack spacing={0} frame={{ maxHeight: "infinity" }}>
          {tabs.map((tab, i) => {
            const on = i === selected;
            return (
              <Button
                key={tab.id}
                pressedOpacity={0.6}
                onPress={() => onSelect(i)}
                accessibilityLabel={tab.title}
                accessibilityTraits={on ? ["button", "selected"] : "button"}
                accessibilityIdentifier={`feed-tab-${i}`}
              >
                <VStack
                  padding={{ horizontal: PAD }}
                  frame={{ maxHeight: "infinity" }}
                  contentShape="rectangle"
                  onLayout={({ width }) =>
                    setWidths((prev) => {
                      if (prev[i] === width) return prev;
                      const next = [...prev];
                      next[i] = width;
                      return next;
                    })
                  }
                >
                  <Text font={ty(T.md, "semibold")} foregroundStyle={on ? t.text : t.textMedium} lineLimit={1} fixedSize animation="snappy">
                    {tab.title}
                  </Text>
                </VStack>
              </Button>
            );
          })}
          <Overlay alignment="bottomLeading">
            {ready ? <Rectangle fill={t.primary} cornerRadius="capsule" frame={{ width: 0, height: 3 }} animatedStyle={underline} allowsHitTesting={false} /> : null}
          </Overlay>
        </HStack>
      </ScrollView>
      <Rectangle fill={t.border} frame={{ maxWidth: "infinity", height: 0.5 }} />
    </VStack>
  );
}

// MARK: Pages

const NEW_POSTS_POLL = 30_000;

function FeedPage({
  tab, did, contentTop, shell, listRef, active, onShowHeader,
}: {
  tab: FeedTab;
  did: string | null;
  contentTop: number;
  shell: SharedValue<number>;
  listRef: (node: HostInstance | null) => void;
  active: boolean;
  onShowHeader(): void;
}) {
  const t = useTheme();
  const list = useRef<HostInstance>(null);
  const fetchPage = (cursor: string | undefined, signal: AbortSignal): Promise<FeedPage> =>
    tab.uri ? getFeed(tab.uri, cursor, signal) : getTimeline(cursor, signal);
  const queryKey = ["home", tab.id, did];
  // Polls the top of the feed; a different first post means there are new ones.
  const latest = useQuery({
    queryKey: ["home-latest", tab.id, did],
    enabled: active,
    refetchInterval: NEW_POSTS_POLL,
    refetchIntervalInBackground: false,
    queryFn: ({ signal }) => fetchPage(undefined, signal),
    staleTime: NEW_POSTS_POLL,
  });
  const [seenTop, setSeenTop] = useState<string | null>(null);
  const top = latest.data?.feed[0]?.post.uri ?? null;
  // The first poll is what's on screen; later ones that differ make the pill.
  if (top && seenTop === null) setSeenTop(top);
  const fresh = top && seenTop && top !== seenTop ? (latest.data?.feed ?? []).slice(0, 3).map((i) => i.post.author) : [];

  // The minimal shell, like Bluesky's MainScrollProvider: while the finger drags the
  // feed, the header follows it (a header's height of scroll hides it all); letting
  // go snaps it shown or hidden. Near the top it always shows. Only the visible page drives it.
  const scroll = useSharedValue({ x: 0, y: 0 });
  const dragging = useSharedValue(0);
  const dragStart = useSharedValue({ y: 0, mode: 0 });
  useAnimatedReaction(
    () => dragging.get(),
    (now, before) => {
      if (!active) return;
      if (now && !before) {
        dragStart.set({ y: scroll.get().y, mode: shell.get() });
      } else if (!now && before) {
        const m = shell.get();
        shell.set(withSpring(scroll.get().y < HEADER / 2 ? 0 : Math.round(m), SNAP));
      }
    },
  );
  useAnimatedReaction(
    () => scroll.get().y,
    (y) => {
      if (!active) return;
      if (dragging.get()) {
        const s = dragStart.get();
        shell.set(Math.max(0, Math.min(1, s.mode + (y - s.y) / HEADER)));
      } else if (y < HEADER / 2 && shell.get() > 0.001) {
        shell.set(withSpring(0, SNAP));
      }
    },
  );
  // The pill rides with the header.
  const pillStyle = useAnimatedStyle(() => ({ offset: { x: 0, y: -HEADER * shell.get() } }));

  return (
    <ZStack alignment="top" frame={{ maxWidth: "infinity", maxHeight: "infinity" }} background={t.bg}>
      <FeedList
        id="home-feed"
        queryKey={queryKey}
        fetchPage={fetchPage}
        contentTop={contentTop}
        scrollOffset={scroll}
        onScrollPhaseChange={(phase) => dragging.set(phase === "tracking" || phase === "interacting" ? 1 : 0)}
        ignoresTop
        listRef={(node) => {
          list.current = node;
          listRef(node);
        }}
        onRefresh={() => setSeenTop(top)}
        empty={tab.uri ? undefined : { icon: "person.2", title: "Your timeline is empty", message: "Follow some people and their posts show up here." }}
      />
      {fresh.length ? (
        <VStack animatedStyle={pillStyle}>
          <NewPostsPill
            authors={fresh}
            top={contentTop + 10}
            onPress={() => {
              setSeenTop(top);
              onShowHeader();
              list.current?.scrollTo("top");
              latest.refetch();
            }}
          />
        </VStack>
      ) : null}
    </ZStack>
  );
}

function NewPostsPill({ authors, top, onPress }: { authors: ProfileViewBasic[]; top: number; onPress(): void }) {
  const t = useTheme();
  return (
    <Button onPress={onPress} pressedScale={0.95} padding={{ top }} transition={{ type: "move", edge: "top" }} accessibilityIdentifier="new-posts">
      <HStack spacing={8} padding={{ leading: 6, trailing: 14, vertical: 6 }} background={t.primary} cornerRadius="capsule" shadow={{ radius: 8, y: 3, color: "black/20" }}>
        <HStack spacing={-8}>
          {authors.map((a) => (
            <VStack key={a.did} padding={1.5} background={t.primary} cornerRadius="capsule">
              <Avatar uri={a.avatar} size={22} />
            </VStack>
          ))}
        </HStack>
        <Text font={ty(T.sm, "semibold")} foregroundStyle="white">New posts</Text>
      </HStack>
    </Button>
  );
}

// MARK: Drawer edge swipe

const DRAWER_WIDTH = 300;

function EdgeSwipe() {
  const setDrawerOpen = useUI((s) => s.setDrawerOpen);
  const setDrawerPeek = useUI((s) => s.setDrawerPeek);
  return (
    <HStack spacing={0} frame={{ maxWidth: "infinity", maxHeight: "infinity" }}>
      <VStack
        frame={{ width: 18, maxHeight: "infinity" }}
        contentShape="rectangle"
        dragAxis="horizontal"
        // Mounts the drawer (it isn't while closed), which then follows the finger.
        onDragStart={() => setDrawerPeek(true)}
        onDrag={(e) => {
          "worklet";
          drawerProgress.set(Math.max(0, Math.min(1, e.translation.x / DRAWER_WIDTH)));
        }}
        onDragEnd={(e) => {
          "worklet";
          const open = e.translation.x > DRAWER_WIDTH / 3 || e.velocity.x > 600;
          if (open) {
            drawerProgress.set(withSpring(1, { duration: 0.35, bounce: 0 }));
            runOnJS(setDrawerOpen)(true);
          } else {
            drawerProgress.set(
              withSpring(0, { duration: 0.3, bounce: 0 }, () => {
                "worklet";
                runOnJS(setDrawerPeek)(false);
              }),
            );
          }
        }}
        accessibilityHidden
      />
      <Spacer />
    </HStack>
  );
}
