import { useState } from "react";
import { Screen, TabView, Tab, VStack, HStack, Text, Button, Image, Spacer, type Color } from "swiftjsx";

const pages: { color: Color; icon: string; title: string }[] = [
  { color: "blue", icon: "sparkles", title: "Welcome" },
  { color: "purple", icon: "hand.draw", title: "Swipe" },
  { color: "orange", icon: "checkmark.seal", title: "Done" },
];

export function TabsDemo() {
  const [tab, setTab] = useState("inbox");
  const [unread, setUnread] = useState(3);
  const [page, setPage] = useState("0");

  return (
    <Screen title="Tabs" titleDisplayMode="inline">
      {/* Controlled: the Settings tab switches tabs by setting state. */}
      <TabView selection={tab} onSelectionChange={setTab}>
        <Tab value="inbox" title="Inbox" systemImage="tray" badge={unread}>
          <VStack spacing={16} padding={24}>
            <Image systemName={unread ? "tray.full" : "tray"} font="largeTitle" foregroundStyle="accent" />
            <Text font="title2" fontWeight="semibold" accessibilityIdentifier="unread">
              {unread ? `${unread} unread` : "All caught up"}
            </Text>
            <HStack spacing={12}>
              <Button title="Read one" buttonStyle="borderedProminent" disabled={!unread} onPress={() => setUnread((n) => n - 1)} />
              <Button title="New message" buttonStyle="bordered" onPress={() => setUnread((n) => n + 1)} />
            </HStack>
            <Text font="footnote" foregroundStyle="secondary">The tab's badge is the unread count.</Text>
            <Spacer />
          </VStack>
        </Tab>

        <Tab value="pager" title="Pager" systemImage="rectangle.on.rectangle">
          <VStack spacing={12} padding={{ vertical: 24 }}>
            {/* tabViewStyle="page": a swipeable pager, also a TabView. */}
            <TabView tabViewStyle="page" selection={page} onSelectionChange={setPage} frame={{ height: 280 }}>
              {pages.map((p) => (
                <Tab key={p.title}>
                  <VStack padding={{ horizontal: 24, bottom: 40 }}>
                    <VStack spacing={12} frame={{ maxWidth: "infinity", maxHeight: "infinity" }} background={p.color} cornerRadius={24}>
                      <Image systemName={p.icon} font="largeTitle" foregroundStyle="white" />
                      <Text font="title" fontWeight="bold" foregroundStyle="white">{p.title}</Text>
                    </VStack>
                  </VStack>
                </Tab>
              ))}
            </TabView>
            <Text foregroundStyle="secondary" accessibilityIdentifier="page">Page {Number(page) + 1} of {pages.length}</Text>
            <Spacer />
          </VStack>
        </Tab>

        <Tab value="settings" title="Settings" systemImage="gear">
          <VStack spacing={16} padding={24}>
            <Text>Tabs are controlled like inputs: `selection` + `onSelectionChange`.</Text>
            <Button title="Go to Inbox" buttonStyle="borderedProminent" onPress={() => setTab("inbox")} />
            <Spacer />
          </VStack>
        </Tab>
      </TabView>
    </Screen>
  );
}
