// "Go to Album" from anywhere, including the Now Playing sheet, which is
// outside every <Navigator>: each tab's root registers its navigation here,
// and the app pushes onto whichever tab is showing.
import { createContext, useContext, useEffect } from "react";
import { useNavigation, type Navigation } from "swiftjsx";

export type TabId = "search" | "library" | "queue";

export type Router = {
  openAlbum(id: number): void;
  openArtist(id: number, name: string): void;
  openNowPlaying(): void;
  register(tab: TabId, nav: Navigation | null): void;
};

export const RouterContext = createContext<Router | null>(null);

export function useRouter(): Router {
  const router = useContext(RouterContext);
  if (!router) throw new Error("useRouter() must be used inside <MusicApp>");
  return router;
}

/** Render inside a tab's root screen. */
export function RegisterNavigation({ tab }: { tab: TabId }) {
  const nav = useNavigation();
  const router = useRouter();
  useEffect(() => {
    router.register(tab, nav);
    return () => router.register(tab, null);
  }, [router, tab, nav]);
  return null;
}
