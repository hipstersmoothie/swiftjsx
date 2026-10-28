import { render, Navigator, createNavigationRef, Text } from "swiftjsx";

// A push before the Navigator mounts (a notification tap at launch) is replayed.
const navRef = createNavigationRef();
navRef.push(<Text>pushed before mount</Text>);

render(
  <Navigator navigationRef={navRef}>
    <Text>root</Text>
  </Navigator>,
);
