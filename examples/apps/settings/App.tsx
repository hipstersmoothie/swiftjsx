// A Settings / profile app in the style of iOS Settings: a profile header that
// opens an editor (validation, async username check, unsaved-changes guard),
// and grouped sections for notifications, appearance (theme + accent applied
// app-wide), privacy, storage and about. Persisted with zustand + localStorage.
import { useState, type ReactElement } from "react";
import {
  Navigator, useNavigation, withAnimation, Screen, List, Section, HStack, VStack, Text, Image, Button, Spacer,
  ConfirmationDialog, ContentUnavailable, type Color,
} from "swiftjsx";
import { signIn, signOut, useAccent, useColorScheme, useSettings } from "./store";
import { pronounsLabel } from "./profile";
import { Chevron, NavRow, ProfileAvatar } from "./ui";
import { ProfileEditorSheet } from "./ProfileEditor";
import { NotificationsScreen, notificationsSummary } from "./NotificationsScreen";
import { AppearanceScreen, themeLabels } from "./AppearanceScreen";
import { PrivacyScreen } from "./PrivacyScreen";
import { StorageScreen, CAPACITY, formatBytes, useCategories, usedBytes } from "./StorageScreen";
import { AboutScreen, APP_VERSION } from "./AboutScreen";

export function SettingsApp() {
  // The theme applies to the whole stack, pushed screens included.
  const scheme = useColorScheme();
  return (
    <Navigator colorScheme={scheme}>
      <RootScreen />
    </Navigator>
  );
}

type Destination = "notifications" | "appearance" | "privacy" | "storage" | "about";

const screens: Record<Destination, () => ReactElement> = {
  notifications: () => <NotificationsScreen />,
  appearance: () => <AppearanceScreen />,
  privacy: () => <PrivacyScreen />,
  storage: () => <StorageScreen />,
  about: () => <AboutScreen />,
};

const sections: Record<Destination, { title: string; icon: string; color: Color }> = {
  notifications: { title: "Notifications", icon: "bell.badge.fill", color: "red" },
  appearance: { title: "Appearance", icon: "paintbrush.fill", color: "blue" },
  privacy: { title: "Privacy & Security", icon: "hand.raised.fill", color: "blue" },
  storage: { title: "Storage", icon: "externaldrive.fill", color: "gray" },
  about: { title: "About", icon: "info.circle.fill", color: "gray" },
};

/** What search finds: settings inside the screens, not just the screens. */
const searchIndex: { title: string; keywords: string; in: Destination | "profile" }[] = [
  { title: "Notifications", keywords: "alerts banners", in: "notifications" },
  { title: "Show Previews", keywords: "lock screen banner", in: "notifications" },
  { title: "Sound", keywords: "tone chime alert", in: "notifications" },
  { title: "Quiet Hours", keywords: "do not disturb silence night sleep", in: "notifications" },
  { title: "Weekly Digest", keywords: "email newsletter", in: "notifications" },
  { title: "Appearance", keywords: "theme", in: "appearance" },
  { title: "Dark Mode", keywords: "light theme automatic night", in: "appearance" },
  { title: "Accent Color", keywords: "tint highlight", in: "appearance" },
  { title: "Text Size", keywords: "font bigger smaller bold larger", in: "appearance" },
  { title: "Privacy & Security", keywords: "permissions", in: "privacy" },
  { title: "Location Services", keywords: "gps maps", in: "privacy" },
  { title: "Camera", keywords: "photos microphone contacts calendars bluetooth", in: "privacy" },
  { title: "Tracking", keywords: "ads analytics personalized", in: "privacy" },
  { title: "Storage", keywords: "space disk", in: "storage" },
  { title: "Clear Cache", keywords: "free up space delete", in: "storage" },
  { title: "Offload Unused Apps", keywords: "space", in: "storage" },
  { title: "About", keywords: "version build", in: "about" },
  { title: "Contact Support", keywords: "help email", in: "about" },
  { title: "Acknowledgements", keywords: "licenses open source", in: "about" },
  { title: "Edit Profile", keywords: "name username email phone bio birthday pronouns website account", in: "profile" },
];

function RootScreen() {
  const nav = useNavigation();
  const accent = useAccent();
  const signedIn = useSettings((s) => s.signedIn);
  const profile = useSettings((s) => s.profile);
  const notifications = useSettings((s) => s.notifications);
  const theme = useSettings((s) => s.appearance.theme);
  const categories = useCategories();
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState(false);
  const [confirmingSignOut, setConfirmingSignOut] = useState(false);

  const openEditor = () => setEditing(true);
  const go = (to: Destination | "profile") => (to === "profile" ? openEditor() : nav.push(screens[to]()));

  const values: Record<Destination, string> = {
    notifications: notificationsSummary(notifications),
    appearance: themeLabels[theme],
    privacy: "",
    storage: `${formatBytes(CAPACITY - usedBytes(categories))} free`,
    about: APP_VERSION,
  };

  const row = (to: Destination) => (
    <NavRow key={to} {...sections[to]} value={values[to]} onPress={() => go(to)} identifier={`${to}-row`} />
  );

  const query = search.trim().toLowerCase();
  const results = query
    ? searchIndex.filter((e) => (e.in !== "profile" || signedIn) && `${e.title} ${e.keywords}`.toLowerCase().includes(query))
    : [];

  return (
    <Screen title="Settings" searchText={search} onSearchTextChange={setSearch} searchPrompt="Search">
      {query ? (
        <List>
          <Section header={results.length ? "Results" : undefined}>
            {results.length ? (
              results.map((e) => (
                <NavRow
                  key={e.title}
                  title={e.title}
                  value={e.in === "profile" ? "Profile" : sections[e.in].title}
                  icon={e.in === "profile" ? "person.fill" : sections[e.in].icon}
                  color={e.in === "profile" ? accent.color : sections[e.in].color}
                  onPress={() => go(e.in)}
                />
              ))
            ) : (
              <ContentUnavailable search={search.trim()} />
            )}
          </Section>
        </List>
      ) : (
        <List>
          <Section>
            {signedIn ? (
              <Button
                onPress={openEditor}
                accessibilityIdentifier="profile-row"
                accessibilityLabel={profile.name || "Profile"}
                accessibilityValue={profile.email}
                accessibilityHint="Edits your profile"
              >
                <HStack spacing={14} padding={{ vertical: 4 }}>
                  <ProfileAvatar name={profile.name} size={60} />
                  <VStack alignment="leading" spacing={3}>
                    <Text font="title3" fontWeight="semibold" foregroundStyle="label" lineLimit={1}>{profile.name || "Add Your Name"}</Text>
                    <Text font="subheadline" foregroundStyle="secondaryLabel" lineLimit={1}>{profile.email}</Text>
                    <Text font="caption" foregroundStyle="secondaryLabel" lineLimit={1}>
                      @{profile.username}{pronounsLabel(profile) ? ` · ${pronounsLabel(profile)}` : ""}
                    </Text>
                  </VStack>
                  <Spacer />
                  <Chevron />
                </HStack>
              </Button>
            ) : (
              <SignedOut onSignIn={() => withAnimation("smooth", signIn)} />
            )}
          </Section>

          <Section>{(["notifications", "appearance", "privacy", "storage"] as const).map(row)}</Section>
          <Section>{row("about")}</Section>

          {signedIn ? (
            <Section footer={`Signed in as ${profile.email}.`}>
              <Button role="destructive" onPress={() => setConfirmingSignOut(true)} accessibilityIdentifier="sign-out">
                <Text frame={{ maxWidth: "infinity" }}>Sign Out</Text>
                <ConfirmationDialog
                  isPresented={confirmingSignOut}
                  onDismiss={() => setConfirmingSignOut(false)}
                  title="Sign out?"
                  message="Your settings stay on this device. You’ll need to sign in again to edit your profile."
                >
                  <Button title="Sign Out" role="destructive" onPress={() => withAnimation("smooth", signOut)} />
                  <Button title="Cancel" role="cancel" onPress={() => {}} />
                </ConfirmationDialog>
              </Button>
            </Section>
          ) : null}
        </List>
      )}

      <ProfileEditorSheet isPresented={editing} onClose={() => setEditing(false)} />
    </Screen>
  );
}

function SignedOut({ onSignIn }: { onSignIn(): void }) {
  const accent = useAccent();
  return (
    <VStack spacing={10} padding={{ vertical: 12 }} frame={{ maxWidth: "infinity" }}>
      <Image systemName="person.crop.circle.fill" font={{ size: 56 }} foregroundStyle="systemGray3" />
      <Text font="headline">Sign in to your account</Text>
      <Text font="subheadline" foregroundStyle="secondaryLabel" textAlignment="center">
        Set up your profile and keep your settings in sync.
      </Text>
      <Button title="Sign In" buttonStyle="borderedProminent" tint={accent.color} onPress={onSignIn} accessibilityIdentifier="sign-in" />
    </VStack>
  );
}
