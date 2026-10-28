import { useState } from "react";
import { render, Navigator, useNavigation, createNavigationRef, Screen, Button, Text, Sheet, Alert } from "swiftjsx";

// Driven from outside the stack.
const navRef = createNavigationRef();

function Detail({ n }: { n: number }) {
  const [likes, setLikes] = useState(0);
  return (
    <Screen title={`Detail ${n}`}>
      <Button title={`like ${n}`} onPress={() => setLikes((l) => l + 1)} />
      <Text>likes {n}: {likes}</Text>
    </Screen>
  );
}

function Home() {
  const nav = useNavigation();
  const [sheet, setSheet] = useState(false);
  const [alert, setAlert] = useState(false);
  return (
    <Screen title="Home">
      <Button title="push" onPress={() => nav.push(<Detail n={nav.depth + 1} />)} />
      <Button title="open sheet" onPress={() => setSheet(true)} />
      <Button title="open alert" onPress={() => setAlert(true)} />
      <Button title="ref push" onPress={() => navRef.push(<Detail n={99} />)} />
      <Button title="replace" onPress={() => nav.replace(<Detail n={7} />)} />
      <Text>depth {nav.depth}</Text>
      <Sheet isPresented={sheet} onDismiss={() => setSheet(false)}>
        <Text>sheet body</Text>
      </Sheet>
      <Alert isPresented={alert} onDismiss={() => setAlert(false)} title="Sure?">
        <Button title="OK" onPress={() => {}} />
      </Alert>
    </Screen>
  );
}

render(
  <Navigator navigationRef={navRef}>
    <Home />
  </Navigator>,
);
