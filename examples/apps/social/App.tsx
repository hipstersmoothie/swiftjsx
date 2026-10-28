// An Instagram-style social feed: stories with a full-screen auto-advancing
// viewer, a feed of paging photo carousels (double tap to like, with a heart
// burst on the main thread), comments in a sheet with an input bar docked
// above the keyboard, profiles with photo grids, and explore. Likes, saves,
// follows, watched stories and your comments persist (zustand + localStorage).
import { useState } from "react";
import { TabView, Tab, Navigator, Overlay } from "swiftjsx";
import { ME, makeStories } from "./data";
import { FeedScreen } from "./Feed";
import { ExploreScreen } from "./Explore";
import { ProfileScreen } from "./Profile";
import { StoryViewer } from "./Stories";
import { CommentsSheet } from "./Comments";
import { StoriesContext, ToastView, WidthContext } from "./ui";

export function SocialApp() {
  const [width, setWidth] = useState(393);
  const [stories] = useState(() => makeStories(Date.now()));

  return (
    <StoriesContext.Provider value={stories}>
      <WidthContext.Provider value={width}>
        <TabView
          tint="primary"
          onLayout={(size) => setWidth((w) => (Math.abs(w - size.width) < 0.5 ? w : size.width))}
        >
          <Tab value="home" title="Home" systemImage="house">
            <Navigator>
              <FeedScreen />
            </Navigator>
          </Tab>
          <Tab value="explore" title="Explore" systemImage="magnifyingglass">
            <Navigator>
              <ExploreScreen />
            </Navigator>
          </Tab>
          <Tab value="profile" title="Profile" systemImage="person.crop.circle">
            <Navigator>
              <ProfileScreen userId={ME} />
            </Navigator>
          </Tab>
          {/* Presented from the root so any screen can open them (they're in the UI store). */}
          <StoryViewer />
          <CommentsSheet />
          <Overlay alignment="bottom">
            <ToastView />
          </Overlay>
        </TabView>
      </WidthContext.Provider>
    </StoriesContext.Provider>
  );
}
