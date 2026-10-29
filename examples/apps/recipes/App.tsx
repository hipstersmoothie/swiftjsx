// Recipes: TheMealDB through TanStack Query + zod. Browse categories and
// cuisines, search, a recipe page with a servings scaler and checklists, and
// a hands-free cooking mode on the native backend: the screen stays awake
// (UIApplication), steps are read aloud (AVSpeechSynthesizer), and kitchen
// timers ring through local notifications (UNUserNotificationCenter) even in
// the background. Favorites and a merged shopping list persist with zustand.
// Everything still works without the native backend, minus those three.
import { useEffect, useState, type ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TabView, Tab, Navigator, VStack, SafeAreaInset } from "swiftjsx";
import { useRecipes, BASE_SERVINGS } from "./store";
import { aggregate } from "./quantity";
import { TimerAlarm, useTimerPermission, useTimers } from "./timers";
import { stopSpeaking } from "./services";
import { BrowseScreen } from "./BrowseScreen";
import { SearchScreen } from "./SearchScreen";
import { FavoritesScreen } from "./FavoritesScreen";
import { ShoppingListScreen } from "./ShoppingListScreen";
import { TimerBar } from "./TimerBar";
import { ACCENT } from "./ui";

const queryClient = new QueryClient({ defaultOptions: { queries: { retry: 1 } } });

export function RecipesApp() {
  return (
    <QueryClientProvider client={queryClient}>
      <Shell />
    </QueryClientProvider>
  );
}

type TabId = "browse" | "search" | "favorites" | "list";

function Shell() {
  const [tab, setTab] = useState<TabId>("browse");
  const list = useRecipes((s) => s.list);
  const checked = useRecipes((s) => s.checked);
  const favoritesCount = useRecipes((s) => s.favorites.length);
  const doneTimers = useTimers((s) => s.timers.filter((t) => t.state === "done").length);
  const timerRunning = useTimerPermission();

  // The gallery closes the app by unmounting it: stop talking. (Timers keep
  // their pending notifications and are still here next time.)
  useEffect(
    () => () => {
      void stopSpeaking();
    },
    [],
  );

  const toBuy = aggregate(list.map((r) => ({ recipeId: r.id, recipeName: r.name, factor: r.servings / BASE_SERVINGS, ingredients: r.ingredients })))
    .filter((item) => !checked[item.key]).length;

  return (
    <>
      {timerRunning ? <TimerAlarm /> : null}
      <TabView selection={tab} onSelectionChange={(value) => setTab(value as TabId)} tint={ACCENT}>
        <Tab value="browse" title="Browse" systemImage="square.grid.2x2.fill" badge={doneTimers ? "!" : 0}>
          <WithTimers>
            <BrowseScreen />
          </WithTimers>
        </Tab>
        <Tab value="search" title="Search" systemImage="magnifyingglass" role="search">
          <WithTimers>
            <SearchScreen />
          </WithTimers>
        </Tab>
        <Tab value="favorites" title="Favorites" systemImage="heart.fill" badge={favoritesCount}>
          <WithTimers>
            <FavoritesScreen />
          </WithTimers>
        </Tab>
        <Tab value="list" title="Shopping List" systemImage="cart.fill" badge={toBuy}>
          <WithTimers>
            <ShoppingListScreen />
          </WithTimers>
        </Tab>
      </TabView>
    </>
  );
}

/** A tab's navigation stack, with the running timers docked under it. */
function WithTimers({ children }: { children: ReactNode }) {
  return (
    <VStack spacing={0} frame={{ maxWidth: "infinity", maxHeight: "infinity" }}>
      <Navigator>{children}</Navigator>
      {/* Always mounted (see TimerBar): it's empty when no timers are running. */}
      <SafeAreaInset edge="bottom" spacing={0}>
        <TimerBar />
      </SafeAreaInset>
    </VStack>
  );
}
