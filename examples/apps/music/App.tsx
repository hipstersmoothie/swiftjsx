// A music player: iTunes Search previews played with AVPlayer through the
// native backend (AVAudioSession, lock-screen Now Playing and remote
// commands), a queue, a mini player and a Now Playing screen tinted by the
// artwork (Core Image). Liked songs and recent searches persist with zustand.
// Without the native backend everything still works, silently.
import { useEffect, useRef, useState, type ReactElement, type ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TabView, Tab, Navigator, VStack, Sheet, type Navigation } from "swiftjsx";
import { shutdownPlayer, usePlayer } from "./player";
import { RouterContext, type Router, type TabId } from "./router";
import { SearchScreen } from "./SearchScreen";
import { LibraryScreen } from "./LibraryScreen";
import { QueueScreen } from "./QueueScreen";
import { AlbumScreen } from "./AlbumScreen";
import { ArtistScreen } from "./ArtistScreen";
import { MiniPlayer } from "./MiniPlayer";
import { NowPlaying } from "./NowPlaying";

const queryClient = new QueryClient({ defaultOptions: { queries: { retry: 1 } } });

export function MusicApp() {
  return (
    <QueryClientProvider client={queryClient}>
      <Shell />
    </QueryClientProvider>
  );
}

function Shell() {
  const [tab, setTab] = useState<TabId>("search");
  const [nowPlayingOpen, setNowPlayingOpen] = useState(false);
  const hasTrack = usePlayer((s) => s.index >= 0);
  const upNext = usePlayer((s) => (s.index < 0 ? 0 : s.queue.length - s.index - 1));
  const navs = useRef<Partial<Record<TabId, Navigation>>>({});

  // The gallery closes the app by unmounting it: stop the music and release
  // AVPlayer, the remote command targets and the audio session.
  useEffect(() => shutdownPlayer, []);

  const push = (screen: ReactElement) => {
    setNowPlayingOpen(false);
    navs.current[tab]?.push(screen);
  };
  const router: Router = {
    openAlbum: (id) => push(<AlbumScreen id={id} />),
    openArtist: (id, name) => push(<ArtistScreen id={id} name={name} />),
    openNowPlaying: () => setNowPlayingOpen(true),
    register: (t, nav) => {
      if (nav) navs.current[t] = nav;
      else delete navs.current[t];
    },
  };

  const open = () => setNowPlayingOpen(true);
  const withMiniPlayer = (children: ReactNode) => (
    <VStack spacing={0}>
      {children}
      <MiniPlayer onOpen={open} />
    </VStack>
  );

  return (
    <RouterContext.Provider value={router}>
      <VStack spacing={0} frame={{ maxWidth: "infinity", maxHeight: "infinity" }}>
        <TabView selection={tab} onSelectionChange={(value) => setTab(value as TabId)}>
          <Tab value="search" title="Search" systemImage="magnifyingglass" role="search">
            {withMiniPlayer(
              <Navigator>
                <SearchScreen />
              </Navigator>,
            )}
          </Tab>
          <Tab value="library" title="Library" systemImage="square.stack.fill">
            {withMiniPlayer(
              <Navigator>
                <LibraryScreen />
              </Navigator>,
            )}
          </Tab>
          <Tab value="queue" title="Up Next" systemImage="list.bullet" badge={upNext}>
            {withMiniPlayer(
              <Navigator>
                <QueueScreen />
              </Navigator>,
            )}
          </Tab>
        </TabView>
        <Sheet isPresented={nowPlayingOpen && hasTrack} onDismiss={() => setNowPlayingOpen(false)} fullScreen>
          <NowPlaying onClose={() => setNowPlayingOpen(false)} />
        </Sheet>
      </VStack>
    </RouterContext.Provider>
  );
}
