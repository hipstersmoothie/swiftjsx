// A Bluesky client on the public AppView: Discover and other public feeds,
// threads, profiles, explore and search, all signed out. Sign in with an app
// password for the Following timeline, notifications, posting, likes,
// reposts and follows (optimistic). Light, dim and dark themes, on Inter.
import { useEffect, useState } from "react";
import { QueryClient, QueryClientProvider, useQuery } from "@tanstack/react-query";
import { TabView, Tab, Navigator, Overlay, VStack, hot, createNavigationRef, type NavigationRef } from "swiftjsx";
import { getUnreadCount } from "./api";
import { HomeScreen } from "./Home";
import { SearchScreen } from "./Search";
import { NotificationsScreen } from "./Notifications";
import { MeScreen } from "./Me";
import { ImageViewer } from "./ImageViewer";
import { ComposeSheet } from "./Compose";
import { SignInSheet } from "./SignIn";
import { Drawer } from "./Drawer";
import { useSession, useSettings } from "./session";
import { useUI, type TabName } from "./store";
import { fontsReady, loadInter, useTheme } from "./theme";
import { Butterfly, ToastView } from "./ui";

const queryClient: QueryClient = (hot.data.blueskyQueries ??= new QueryClient({
  defaultOptions: { queries: { staleTime: 60_000, retry: 1 } },
}));

/** Each tab's stack, so the drawer (outside them) can push onto one. */
export const tabNav: Record<TabName, NavigationRef> = (hot.data.blueskyTabNav ??= {
  home: createNavigationRef(),
  search: createNavigationRef(),
  notifications: createNavigationRef(),
  profile: createNavigationRef(),
});

export function BlueskyApp() {
  // Inter first (or the system font after a moment), behind the splash.
  const [ready, setReady] = useState(fontsReady());
  useEffect(() => {
    if (!ready) loadInter().then(() => setReady(true));
  }, [ready]);
  return <QueryClientProvider client={queryClient}>{ready ? <Tabs /> : <Splash />}</QueryClientProvider>;
}

/** The launch screen: the butterfly on the theme's background. */
function Splash() {
  const t = useTheme();
  const appearance = useSettings((s) => s.appearance);
  return (
    <VStack frame={{ maxWidth: "infinity", maxHeight: "infinity" }} background={t.bg} ignoresSafeArea preferredColorScheme={appearance === "system" ? undefined : t.scheme} accessibilityIdentifier="splash">
      <Butterfly size={64} />
    </VStack>
  );
}

function Tabs() {
  const signedIn = useSession((s) => s.session !== null);
  const appearance = useSettings((s) => s.appearance);
  const tab = useUI((s) => s.tab);
  const setTab = useUI((s) => s.setTab);
  const t = useTheme();
  const unread = useQuery({
    queryKey: ["unread"],
    enabled: signedIn,
    queryFn: ({ signal }) => getUnreadCount(signal),
    refetchInterval: 60_000,
  });

  return (
    <TabView
      selection={tab}
      onSelectionChange={(value) => setTab(value as TabName)}
      // Bluesky's bar: icons only, the selected one filled in the text color.
      tint={t.text}
      background={t.bg}
      preferredColorScheme={appearance === "system" ? undefined : t.scheme}
    >
      <Tab value="home" systemImage="house" accessibilityLabel="Home" accessibilityIdentifier="tab-home">
        <Navigator navigationRef={tabNav.home}>
          <HomeScreen />
        </Navigator>
      </Tab>
      <Tab value="search" systemImage="magnifyingglass" accessibilityLabel="Search" accessibilityIdentifier="tab-search">
        <Navigator navigationRef={tabNav.search}>
          <SearchScreen />
        </Navigator>
      </Tab>
      <Tab value="notifications" systemImage="bell" badge={signedIn ? (unread.data?.count ?? 0) : 0} accessibilityLabel="Notifications" accessibilityIdentifier="tab-notifications">
        <Navigator navigationRef={tabNav.notifications}>
          <NotificationsScreen />
        </Navigator>
      </Tab>
      <Tab value="profile" systemImage="person.crop.circle" accessibilityLabel="Profile" accessibilityIdentifier="tab-profile">
        <Navigator navigationRef={tabNav.profile}>
          <MeScreen />
        </Navigator>
      </Tab>
      {/* Presented from the root so any screen can open them (they're in the UI store). */}
      <ComposeSheet />
      <SignInSheet />
      {/* Portals only mount inside an attachment (a TabView's children are its tabs). */}
      <Overlay>
        <Drawer />
        <ImageViewer />
      </Overlay>
      <Overlay alignment="bottom">
        <ToastView />
      </Overlay>
    </TabView>
  );
}
