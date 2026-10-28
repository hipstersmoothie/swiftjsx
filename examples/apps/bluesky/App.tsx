// A Bluesky client on the public AppView: Discover, threads, profiles,
// search, trending topics and feeds, all signed out. Sign in with an app
// password for the Following timeline, notifications, posting, likes,
// reposts and follows (optimistic).
import { QueryClient, QueryClientProvider, useQuery } from "@tanstack/react-query";
import { TabView, Tab, Navigator, Overlay, hot } from "swiftjsx";
import { getUnreadCount } from "./api";
import { HomeScreen } from "./Home";
import { SearchScreen } from "./Search";
import { NotificationsScreen } from "./Notifications";
import { MeScreen } from "./Me";
import { ImageViewer } from "./ImageViewer";
import { ComposeSheet } from "./Compose";
import { SignInSheet } from "./SignIn";
import { useSession, useSettings } from "./session";
import { ToastView, brand } from "./ui";

const queryClient: QueryClient = (hot.data.blueskyQueries ??= new QueryClient({
  defaultOptions: { queries: { staleTime: 60_000, retry: 1 } },
}));

export function BlueskyApp() {
  return (
    <QueryClientProvider client={queryClient}>
      <Tabs />
    </QueryClientProvider>
  );
}

function Tabs() {
  const signedIn = useSession((s) => s.session !== null);
  const appearance = useSettings((s) => s.appearance);
  const unread = useQuery({
    queryKey: ["unread"],
    enabled: signedIn,
    queryFn: ({ signal }) => getUnreadCount(signal),
    refetchInterval: 60_000,
  });

  return (
    <TabView tint={brand} preferredColorScheme={appearance === "system" ? undefined : appearance}>
      <Tab value="home" title="Home" systemImage="house" accessibilityIdentifier="tab-home">
        <Navigator>
          <HomeScreen />
        </Navigator>
      </Tab>
      <Tab value="search" title="Search" systemImage="magnifyingglass" accessibilityIdentifier="tab-search">
        <Navigator>
          <SearchScreen />
        </Navigator>
      </Tab>
      <Tab value="notifications" title="Notifications" systemImage="bell" badge={signedIn ? (unread.data?.count ?? 0) : 0} accessibilityIdentifier="tab-notifications">
        <Navigator>
          <NotificationsScreen />
        </Navigator>
      </Tab>
      <Tab value="profile" title="Profile" systemImage="person.crop.circle" accessibilityIdentifier="tab-profile">
        <Navigator>
          <MeScreen />
        </Navigator>
      </Tab>
      {/* Presented from the root so any screen can open them (they're in the UI store). */}
      <ImageViewer />
      <ComposeSheet />
      <SignInSheet />
      <Overlay alignment="bottom">
        <ToastView />
      </Overlay>
    </TabView>
  );
}
