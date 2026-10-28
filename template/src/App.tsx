import { useState } from "react";
import { render, Navigator, Screen, List, Section, Button, Text, HStack, Image, withAnimation } from "swiftjsx";

function Home() {
  const [count, setCount] = useState(0);
  return (
    <Screen title="__NAME__">
      <List>
        <Section header="Hello" footer="Edit src/App.tsx with `npm run dev` running: the app updates as you save.">
          <HStack spacing={12}>
            <Image systemName="sparkles" foregroundStyle="orange" font="title2" />
            <Text font="headline">Welcome to SwiftJSX</Text>
          </HStack>
          <Button title={`Tapped ${count} times`} onPress={() => withAnimation("bouncy", () => setCount((c) => c + 1))} />
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
