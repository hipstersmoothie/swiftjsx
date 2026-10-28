// A shop on DummyJSON: browse categories and deals, search, product pages
// with variants and a fly-to-cart animation, a wishlist, a cart with promo
// codes, a validated checkout form and an order confirmation with confetti.
// The cart, wishlist and orders persist (zustand + localStorage).
import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TabView, Tab, Navigator, Sheet, VStack } from "swiftjsx";
import { useCartCount, useShop, type Order } from "./store";
import { HomeScreen } from "./HomeScreen";
import { SearchScreen } from "./SearchScreen";
import { WishlistScreen } from "./WishlistScreen";
import { CartScreen } from "./CartScreen";
import { ConfirmationScreen } from "./ConfirmationScreen";
import { ACCENT, RouterContext, type ShopRouter, type TabId } from "./ui";

// The catalog barely changes: keep things for five minutes.
const queryClient = new QueryClient({ defaultOptions: { queries: { staleTime: 5 * 60_000, retry: 1 } } });

export function ShopApp() {
  return (
    <QueryClientProvider client={queryClient}>
      <Shell />
    </QueryClientProvider>
  );
}

function Shell() {
  const [tab, setTab] = useState<TabId>("home");
  const [confirmation, setConfirmation] = useState<Order | null>(null);
  const cartCount = useCartCount();
  const wishlistCount = useShop((s) => s.wishlist.length);

  const router: ShopRouter = { tab, setTab, showConfirmation: setConfirmation };

  return (
    <RouterContext.Provider value={router}>
      {/* A host element for the sheet to attach to. */}
      <VStack spacing={0} frame={{ maxWidth: "infinity", maxHeight: "infinity" }}>
        <TabView selection={tab} onSelectionChange={(value) => setTab(value as TabId)} tint={ACCENT}>
          <Tab value="home" title="Shop" systemImage="bag">
            <Navigator>
              <HomeScreen />
            </Navigator>
          </Tab>
          <Tab value="wishlist" title="Wishlist" systemImage="heart" badge={wishlistCount}>
            <Navigator>
              <WishlistScreen />
            </Navigator>
          </Tab>
          <Tab value="cart" title="Cart" systemImage="cart" badge={cartCount}>
            <Navigator>
              <CartScreen />
            </Navigator>
          </Tab>
          <Tab value="search" title="Search" systemImage="magnifyingglass" role="search">
            <Navigator>
              <SearchScreen />
            </Navigator>
          </Tab>
        </TabView>
        <Sheet item={confirmation} onDismiss={() => setConfirmation(null)} fullScreen>
          {(order) => (
            <ConfirmationScreen
              order={order}
              onDone={() => {
                setConfirmation(null);
                setTab("home");
              }}
            />
          )}
        </Sheet>
      </VStack>
    </RouterContext.Provider>
  );
}
