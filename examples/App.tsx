import type { ReactElement } from "react";
import { render, Navigator, useNavigation, Screen, List, Section, Button, HStack, VStack, Text, Image } from "swiftjsx";
import { HooksDemo } from "./screens/Hooks";
import { NavigationDemo } from "./screens/Navigation";
import { VirtualListDemo } from "./screens/VirtualListDemo";
import { RefsDemo } from "./screens/Refs";
import { GridDemo } from "./screens/Grid";
import { NativeDemo } from "./screens/NativeDemo";

type Demo = { title: string; subtitle: string; icon: string; color: any; screen: () => ReactElement };

const demos: Demo[] = [
  { title: "Hooks", subtitle: "useState, useReducer, useEffect, custom hooks", icon: "atom", color: "blue", screen: () => <HooksDemo /> },
  { title: "Navigation & sheets", subtitle: "push/pop, toolbar, sheet, alert, dialog", icon: "rectangle.stack", color: "purple", screen: () => <NavigationDemo depth={1} /> },
  { title: "Virtual list", subtitle: "100,000 rows, ~30 rendered", icon: "list.bullet.rectangle", color: "orange", screen: () => <VirtualListDemo /> },
  { title: "Refs", subtitle: "focus(), scrollTo(), measure()", icon: "scope", color: "pink", screen: () => <RefsDemo /> },
  { title: "Lazy grid", subtitle: "LazyVGrid with adaptive columns", icon: "square.grid.3x3", color: "green", screen: () => <GridDemo /> },
  { title: "Native", subtitle: "Objective-C APIs from JS, onMain()", icon: "cpu", color: "indigo", screen: () => <NativeDemo /> },
];

function Home() {
  const nav = useNavigation();
  return (
    <Screen title="SwiftJSX">
      <List>
        <Section header="Demos" footer="Edit examples/ with `npm run dev` running: changes apply instantly and keep state.">
          {demos.map((demo) => (
            <Button key={demo.title} buttonStyle="plain" onPress={() => nav.push(demo.screen())}>
              <HStack spacing={14} padding={{ vertical: 4 }}>
                <Image systemName={demo.icon} foregroundStyle="white" frame={{ width: 32, height: 32 }} background={demo.color} cornerRadius={8} />
                <VStack alignment="leading" spacing={2}>
                  <Text font="headline">{demo.title}</Text>
                  <Text font="caption" foregroundStyle="secondary">{demo.subtitle}</Text>
                </VStack>
              </HStack>
            </Button>
          ))}
        </Section>
      </List>
    </Screen>
  );
}

render(
  <Navigator>
    <Home />
  </Navigator>,
);
