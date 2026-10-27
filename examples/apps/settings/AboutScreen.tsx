// About: version info, links (openURL: in-app Safari for web pages, the
// system for mailto:), and acknowledgements.
import { useNavigation, openURL, Screen, List, Section, VStack, Text } from "swiftjsx";
import { useAccent } from "./store";
import { IconTile, LinkRow, NavRow, ValueRow } from "./ui";

export const APP_VERSION = "2.4.1";
const BUILD = "812";

const packages = [
  { name: "react", license: "MIT", url: "https://www.npmjs.com/package/react" },
  { name: "zustand", license: "MIT", url: "https://www.npmjs.com/package/zustand" },
  { name: "immer", license: "MIT", url: "https://www.npmjs.com/package/immer" },
  { name: "zod", license: "MIT", url: "https://www.npmjs.com/package/zod" },
  { name: "date-fns", license: "MIT", url: "https://www.npmjs.com/package/date-fns" },
];

export function AboutScreen() {
  const nav = useNavigation();
  const accent = useAccent();
  const language = typeof navigator !== "undefined" ? navigator.language : "en-US";

  return (
    <Screen title="About" titleDisplayMode="inline">
      <List>
        <Section>
          <VStack spacing={8} padding={{ vertical: 12 }} frame={{ maxWidth: "infinity" }} accessibilityElement="combine">
            <IconTile icon="gearshape.2.fill" color={accent.color} size={72} />
            <Text font="title2" fontWeight="bold">Settings</Text>
            <Text font="subheadline" foregroundStyle="secondaryLabel">A SwiftJSX toy app</Text>
          </VStack>
        </Section>

        <Section>
          <ValueRow title="Version" value={`${APP_VERSION} (${BUILD})`} />
          <ValueRow title="Language" value={language} />
          <ValueRow title="Renderer" value="React → SwiftUI" />
        </Section>

        <Section header="Links">
          <LinkRow title="Website" icon="globe" onPress={() => openURL("https://github.com", { inApp: true })} />
          <LinkRow title="Privacy Policy" icon="hand.raised" onPress={() => openURL("https://www.apple.com/legal/privacy/", { inApp: true })} />
          <LinkRow title="Terms of Service" icon="doc.text" onPress={() => openURL("https://www.apple.com/legal/internet-services/", { inApp: true })} />
          <LinkRow
            title="Contact Support"
            icon="envelope"
            onPress={() => openURL(`mailto:support@example.com?subject=${encodeURIComponent(`Settings ${APP_VERSION} (${BUILD})`)}`)}
          />
        </Section>

        <Section>
          <NavRow title="Acknowledgements" onPress={() => nav.push(<Acknowledgements />)} />
        </Section>
      </List>
    </Screen>
  );
}

function Acknowledgements() {
  return (
    <Screen title="Acknowledgements" titleDisplayMode="inline">
      <List>
        <Section footer="Open-source packages this app is built with. Thank you!">
          {packages.map((p) => (
            <LinkRow key={p.name} title={`${p.name} · ${p.license}`} icon="shippingbox" onPress={() => openURL(p.url, { inApp: true })} />
          ))}
        </Section>
      </List>
    </Screen>
  );
}
