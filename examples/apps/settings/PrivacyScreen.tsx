// Privacy & Security: permissions as navigation rows (with how many apps have
// access), a per-permission screen of apps, and tracking / analytics switches.
import { useNavigation, withAnimation, format, Screen, List, Section, VStack, Text, Image, IconTile } from "swiftjsx";
import type { Color } from "swiftjsx";
import { setAccess, update, useSettings, type Access, type State } from "./store";
import { ChoiceScreen, NavRow, ToggleRow, type Choice } from "./ui";

type AppInfo = { name: string; icon: string; color: Color };

const apps: Record<string, AppInfo> = {
  maps: { name: "Maps", icon: "map.fill", color: "green" },
  weather: { name: "Weather", icon: "cloud.sun.fill", color: "cyan" },
  trailhead: { name: "Trailhead", icon: "figure.hiking", color: "orange" },
  snapshots: { name: "Snapshots", icon: "camera.aperture", color: "pink" },
  chat: { name: "Chat", icon: "bubble.left.and.bubble.right.fill", color: "green" },
};

type Permission = { id: string; title: string; icon: string; color: Color; about: string };

export const permissions: Permission[] = [
  { id: "location", title: "Location Services", icon: "location.fill", color: "blue", about: "Apps that have asked to use your location." },
  { id: "contacts", title: "Contacts", icon: "person.crop.circle.fill", color: "gray", about: "Apps that have asked to see your contacts." },
  { id: "calendars", title: "Calendars", icon: "calendar", color: "red", about: "Apps that have asked to see or add events." },
  { id: "photos", title: "Photos", icon: "photo.on.rectangle", color: "orange", about: "Apps that have asked to see your photo library." },
  { id: "bluetooth", title: "Bluetooth", icon: "wave.3.right", color: "blue", about: "Apps that have asked to find and connect to accessories." },
  { id: "microphone", title: "Microphone", icon: "mic.fill", color: "orange", about: "Apps that have asked to use the microphone." },
  { id: "camera", title: "Camera", icon: "camera.fill", color: "gray", about: "Apps that have asked to use the camera." },
];

const locationChoices: Choice[] = [
  { value: "never", label: "Never" },
  { value: "ask", label: "Ask Next Time Or When I Share" },
  { value: "whileUsing", label: "While Using the App" },
  { value: "always", label: "Always" },
];

const accessLabel = (access: Access) =>
  access === "allowed" ? "On" : access === "never" ? "Off" : locationChoices.find((c) => c.value === access)?.label.replace(" the App", "") ?? access;

const isAllowed = (access: Access) => access === "allowed" || access === "whileUsing" || access === "always";

function permissionSummary(state: State["privacy"], id: string): string {
  if (id === "location" && !state.locationServices) return "Off";
  const entries = Object.values(state.access[id] ?? {});
  const allowed = entries.filter(isAllowed).length;
  if (!entries.length) return "None";
  return allowed ? format.count(allowed, { one: "# app", other: "# apps" }) : "None";
}

/** For the root screen's row. */
export const privacySummary = (privacy: State["privacy"]) => (privacy.allowTracking ? "Tracking On" : "");

export function PrivacyScreen() {
  const nav = useNavigation();
  const privacy = useSettings((s) => s.privacy);
  const set = (key: "allowTracking" | "analytics" | "personalizedAds", value: boolean) =>
    update((s) => {
      s.privacy[key] = value;
    });

  return (
    <Screen title="Privacy & Security" titleDisplayMode="inline">
      <List>
        <Section>
          <VStack spacing={8} padding={{ vertical: 8 }} frame={{ maxWidth: "infinity" }} accessibilityElement="combine">
            <IconTile systemImage="hand.raised.fill" color="blue" size={56} />
            <Text font="headline">Your data, your call</Text>
            <Text font="footnote" foregroundStyle="secondaryLabel" textAlignment="center">
              Choose which apps can use your location, contacts, photos and devices.
            </Text>
          </VStack>
        </Section>

        <Section header="Permissions">
          {permissions.map((p) => (
            <NavRow
              key={p.id}
              title={p.title}
              icon={p.icon}
              color={p.color}
              value={permissionSummary(privacy, p.id)}
              onPress={() => nav.push(<PermissionScreen permission={p} />)}
              identifier={`permission-${p.id}`}
            />
          ))}
        </Section>

        <Section header="Tracking" footer="Apps must ask before tracking your activity across other companies’ apps and websites.">
          <ToggleRow
            title="Allow Apps to Request to Track"
            icon="figure.walk.motion"
            color="indigo"
            value={privacy.allowTracking}
            onChange={(v) => set("allowTracking", v)}
          />
        </Section>

        <Section header="Analytics & Ads" footer="Analytics are anonymous and help us fix crashes. Personalized ads use your activity in this app only.">
          <ToggleRow title="Share Analytics" icon="chart.bar.fill" color="teal" value={privacy.analytics} onChange={(v) => set("analytics", v)} />
          <ToggleRow title="Personalized Ads" icon="megaphone.fill" color="pink" value={privacy.personalizedAds} onChange={(v) => set("personalizedAds", v)} />
        </Section>
      </List>
    </Screen>
  );
}

function PermissionScreen({ permission }: { permission: Permission }) {
  const nav = useNavigation();
  const access = useSettings((s) => s.privacy.access[permission.id]);
  const locationOn = useSettings((s) => s.privacy.locationServices);
  const isLocation = permission.id === "location";
  const appIds = Object.keys(access ?? {});
  const showApps = !isLocation || locationOn;

  return (
    <Screen title={permission.title} titleDisplayMode="inline">
      <List>
        {isLocation ? (
          <Section footer="Location Services uses GPS, Bluetooth and nearby Wi-Fi to find where you are. Turning it off stops every app from using your location.">
            <ToggleRow
              title="Location Services"
              value={locationOn}
              onChange={(on) =>
                withAnimation("snappy", () =>
                  update((s) => {
                    s.privacy.locationServices = on;
                  }),
                )
              }
            />
          </Section>
        ) : null}

        {showApps ? (
          <Section header={appIds.length ? "Apps" : undefined} footer={appIds.length ? permission.about : undefined}>
            {appIds.length ? (
              appIds.map((id) => {
                const app = apps[id] ?? { name: id, icon: "app.fill", color: "gray" };
                const value = access[id];
                return isLocation ? (
                  <NavRow
                    key={id}
                    title={app.name}
                    icon={app.icon}
                    color={app.color}
                    value={accessLabel(value)}
                    onPress={() =>
                      nav.push(
                        <ChoiceScreen
                          title={app.name}
                          header="Allow Location Access"
                          options={locationChoices}
                          select={(s) => s.privacy.access.location?.[id] ?? "ask"}
                          onSelect={(v) => setAccess("location", id, v as Access)}
                          footer={`${app.name} uses your location to show what’s around you.`}
                        />,
                      )
                    }
                  />
                ) : (
                  <ToggleRow
                    key={id}
                    title={app.name}
                    icon={app.icon}
                    color={app.color}
                    value={value === "allowed"}
                    onChange={(on) => setAccess(permission.id, id, on ? "allowed" : "never")}
                  />
                );
              })
            ) : (
              <VStack spacing={6} padding={{ vertical: 16 }} frame={{ maxWidth: "infinity" }}>
                <Image systemName={permission.icon} font="largeTitle" foregroundStyle="tertiaryLabel" />
                <Text foregroundStyle="secondaryLabel">No apps have asked for access.</Text>
              </VStack>
            )}
          </Section>
        ) : null}
      </List>
    </Screen>
  );
}
