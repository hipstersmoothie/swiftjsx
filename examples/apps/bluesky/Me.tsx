// The Profile tab: your profile when signed in; signed out, a sign-in card
// and the settings. Settings: color mode, dark theme (dim or dark), video
// autoplay, about, account.
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Screen, ScrollView, VStack, HStack, Text, Image, Button, Toggle, Spacer, ToolbarItem, Rectangle, useNavigation, openURL, toast,
} from "swiftjsx";
import { deleteSession, getProfile } from "./api";
import { displayName } from "./format";
import { PROFILE_BAR, ProfileBody } from "./Profile";
import { useSession, useSettings } from "./session";
import { useUI } from "./store";
import { BRAND } from "./theme";
import { Avatar, Butterfly, PillButton, Segmented, T, ty, useTheme } from "./ui";

export function useMyProfile() {
  const did = useSession((s) => s.session?.did ?? null);
  return useQuery({ queryKey: ["profile", did], enabled: !!did, queryFn: ({ signal }) => getProfile(did!, signal) });
}

export function MeScreen() {
  const did = useSession((s) => s.session?.did ?? null);
  const nav = useNavigation();
  const me = useMyProfile();
  if (!did) return <SettingsScreen root />;
  return (
    <Screen {...PROFILE_BAR}>
      <ToolbarItem placement="primaryAction">
        <Button onPress={() => nav.push(<SettingsScreen />)} accessibilityLabel="Settings">
          <Image systemName="gearshape" />
        </Button>
      </ToolbarItem>
      <ProfileBody actor={did} profile={me.data} loading={me.isPending} />
    </Screen>
  );
}

export function SettingsScreen({ root = false }: { root?: boolean }) {
  const session = useSession((s) => s.session);
  const setSession = useSession((s) => s.setSession);
  const appearance = useSettings((s) => s.appearance);
  const setAppearance = useSettings((s) => s.setAppearance);
  const darkTheme = useSettings((s) => s.darkTheme);
  const setDarkTheme = useSettings((s) => s.setDarkTheme);
  const autoplay = useSettings((s) => s.autoplayVideos);
  const setAutoplay = useSettings((s) => s.setAutoplay);
  const openSignIn = useUI((s) => s.openSignIn);
  const client = useQueryClient();
  const me = useMyProfile();
  const t = useTheme();

  const signOut = async () => {
    if (session) await deleteSession(session);
    setSession(null);
    client.clear();
    toast("Signed out", { systemImage: "rectangle.portrait.and.arrow.right", tint: BRAND });
  };

  return (
    <Screen title="Settings" titleDisplayMode="inline" toolbarBackground={t.bg}>
      <ScrollView frame={{ maxWidth: "infinity", maxHeight: "infinity" }} background={t.bg} accessibilityIdentifier="settings">
        <VStack alignment="leading" spacing={0}>
          {session ? (
            <VStack spacing={6} padding={{ vertical: 24 }} frame={{ maxWidth: "infinity" }}>
              <Avatar uri={me.data?.avatar} size={80} full />
              <Text font={ty(T.xxl, "bold")} foregroundStyle={t.text} padding={{ top: 6 }}>{me.data ? displayName(me.data) : session.handle}</Text>
              <Text font={ty(T.md)} foregroundStyle={t.textMedium}>@{session.handle}</Text>
            </VStack>
          ) : (
            // Our own, not ContentUnavailable: the butterfly and two of Bluesky's buttons.
            <VStack spacing={10} padding={{ horizontal: 24, vertical: 28 }} frame={{ maxWidth: "infinity" }} accessibilityIdentifier="sign-in-card">
              <Butterfly size={40} />
              <Text font={ty(T.xxl, "bold")} foregroundStyle={t.text} textAlignment="center" padding={{ top: 4 }}>You're browsing signed out</Text>
              <Text font={ty(T.md)} foregroundStyle={t.textMedium} textAlignment="center" lineSpacing={2}>
                Sign in for your Following feed and notifications, and to post, like, repost and follow.
              </Text>
              <HStack spacing={8} padding={{ top: 8 }}>
                <PillButton title="Sign in" onPress={() => openSignIn("")} id="profile-sign-in" />
                <PillButton title="Create account" variant="secondary" onPress={() => openURL("https://bsky.app", { inApp: true })} />
              </HStack>
            </VStack>
          )}
          <Divider />
          <SectionTitle icon="paintpalette" title="Appearance" />
          <Row label="Color mode">
            <Segmented
              id="color-mode"
              value={appearance}
              onChange={setAppearance}
              options={[
                { value: "system", label: "System" },
                { value: "light", label: "Light" },
                { value: "dark", label: "Dark" },
              ]}
            />
          </Row>
          <Row label="Dark theme">
            <Segmented
              id="dark-theme"
              value={darkTheme}
              onChange={setDarkTheme}
              options={[
                { value: "dim", label: "Dim" },
                { value: "dark", label: "Dark" },
              ]}
            />
          </Row>
          <HStack padding={{ horizontal: 20, vertical: 12 }}>
            <Text font={ty(T.md)} foregroundStyle={t.text} lineLimit={1} layoutPriority={1}>Autoplay videos and GIFs</Text>
            <Spacer />
            <Toggle value={autoplay} onChange={setAutoplay} tint={t.primary} fixedSize accessibilityLabel="Autoplay videos and GIFs" />
          </HStack>
          <Divider />
          <SectionTitle icon="info.circle" title="About" />
          <LinkRow label="Terms of Service" onPress={() => openURL("https://bsky.social/about/support/tos", { inApp: true })} />
          <LinkRow label="Privacy Policy" onPress={() => openURL("https://bsky.social/about/support/privacy-policy", { inApp: true })} />
          <HStack padding={{ horizontal: 20, vertical: 12 }}>
            <Text font={ty(T.md)} foregroundStyle={t.text}>Server</Text>
            <Spacer />
            <Text font={ty(T.md)} foregroundStyle={t.textMedium}>{session ? session.service.replace("https://", "") : "public.api.bsky.app"}</Text>
          </HStack>
          {session ? (
            <VStack alignment="leading" spacing={8}>
              <Divider />
              <Button onPress={signOut} pressedOpacity={0.6}>
                <HStack spacing={10} padding={{ horizontal: 20, vertical: 12 }} frame={{ maxWidth: "infinity", alignment: "leading" }}>
                  <Image systemName="rectangle.portrait.and.arrow.right" font={{ size: 18 }} foregroundStyle={t.negative} />
                  <Text font={ty(T.md, "semibold")} foregroundStyle={t.negative}>Sign out</Text>
                </HStack>
              </Button>
              <Text font={ty(T.xs)} foregroundStyle={t.textMedium} padding={{ horizontal: 20 }}>
                Your session is kept in localStorage on this device (not the keychain).
              </Text>
            </VStack>
          ) : null}
          <VStack frame={{ height: 120 }} />
        </VStack>
      </ScrollView>
    </Screen>
  );
}

function Divider() {
  const t = useTheme();
  return <VStack padding={{ vertical: 8 }}>
          <Rectangle fill={t.border} frame={{ maxWidth: "infinity", height: 0.5 }} />
        </VStack>;
}

function SectionTitle({ icon, title }: { icon: string; title: string }) {
  const t = useTheme();
  return (
    <HStack spacing={10} padding={{ horizontal: 20, top: 12, bottom: 4 }}>
      <Image systemName={icon} font={{ size: 17, weight: "medium" }} foregroundStyle={t.textMedium} />
      <Text font={ty(T.lg, "bold")} foregroundStyle={t.text} accessibilityTraits="header">{title}</Text>
    </HStack>
  );
}

function Row({ label, children }: { label: string; children: import("react").ReactNode }) {
  const t = useTheme();
  return (
    <VStack alignment="leading" spacing={8} padding={{ horizontal: 20, vertical: 10 }}>
      <Text font={ty(T.sm, "semibold")} foregroundStyle={t.textMedium}>{label}</Text>
      {children}
    </VStack>
  );
}

function LinkRow({ label, onPress }: { label: string; onPress(): void }) {
  const t = useTheme();
  return (
    <Button onPress={onPress} pressedOpacity={0.6}>
      <HStack padding={{ horizontal: 20, vertical: 12 }} frame={{ maxWidth: "infinity" }} contentShape="rectangle">
        <Text font={ty(T.md)} foregroundStyle={t.text}>{label}</Text>
        <Spacer />
        <Image systemName="arrow.up.right" font={{ size: 13, weight: "semibold" }} foregroundStyle={t.textMedium} />
      </HStack>
    </Button>
  );
}
