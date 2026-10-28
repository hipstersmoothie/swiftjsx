// The Profile tab: your profile when signed in; signed out, a sign-in card
// and the settings. Settings: appearance, video autoplay, account.
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Screen, Form, Section, VStack, HStack, Text, Image, Button, Toggle, Picker, ToolbarItem, LabeledContent, useNavigation, openURL,
} from "swiftjsx";
import { deleteSession, getProfile } from "./api";
import { displayName } from "./format";
import { ProfileBody } from "./Profile";
import { useSession, useSettings } from "./session";
import { toast, useUI } from "./store";
import { Avatar, PillButton, brand, subtle } from "./ui";

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
    <Screen title={me.data ? displayName(me.data) : "Profile"} titleDisplayMode="inline" toolbarBackground="hidden">
      <ToolbarItem placement="primaryAction">
        <Button onPress={() => nav.push(<SettingsScreen />)} accessibilityLabel="Settings">
          <Image systemName="gearshape" foregroundStyle={brand} />
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
  const autoplay = useSettings((s) => s.autoplayVideos);
  const setAutoplay = useSettings((s) => s.setAutoplay);
  const openSignIn = useUI((s) => s.openSignIn);
  const client = useQueryClient();
  const me = useMyProfile();

  const signOut = async () => {
    if (session) await deleteSession(session);
    setSession(null);
    client.clear();
    toast("Signed out", "rectangle.portrait.and.arrow.right");
  };

  return (
    <Screen title={root ? "Profile" : "Settings"} titleDisplayMode={root ? "large" : "inline"}>
      <Form>
        <Section>
          {session ? (
            <HStack spacing={12} padding={{ vertical: 4 }}>
              <Avatar uri={me.data?.avatar} size={48} />
              <VStack alignment="leading" spacing={2}>
                <Text font="headline">{me.data ? displayName(me.data) : session.handle}</Text>
                <Text font="subheadline" foregroundStyle={subtle}>@{session.handle}</Text>
              </VStack>
            </HStack>
          ) : (
            <VStack spacing={10} padding={{ vertical: 12 }} frame={{ maxWidth: "infinity" }} accessibilityIdentifier="sign-in-card">
              <Image systemName="cloud.fill" font={{ size: 44 }} foregroundStyle={brand} />
              <Text font="title3" fontWeight="bold">You're browsing signed out</Text>
              <Text font="subheadline" foregroundStyle={subtle} textAlignment="center">
                Sign in for your Following timeline, notifications, and to post, like, repost and follow.
              </Text>
              <PillButton title="Sign in" onPress={() => openSignIn("")} id="profile-sign-in" />
            </VStack>
          )}
        </Section>
        <Section header="Appearance">
          <Picker
            label="Theme"
            value={appearance}
            onChange={setAppearance}
            pickerStyle="segmented"
            options={[
              { value: "system", label: "System" },
              { value: "light", label: "Light" },
              { value: "dark", label: "Dark" },
            ]}
          />
          <Toggle label="Autoplay videos" value={autoplay} onChange={setAutoplay} tint={brand} />
        </Section>
        <Section header="About">
          <LabeledContent label="Server">
            <Text foregroundStyle={subtle}>{session ? session.service.replace("https://", "") : "public.api.bsky.app"}</Text>
          </LabeledContent>
          <Button onPress={() => openURL("https://bsky.social/about/support/tos", { inApp: true })}>
            <Text foregroundStyle={brand}>Terms of Service</Text>
          </Button>
          <Button onPress={() => openURL("https://bsky.social/about/support/privacy-policy", { inApp: true })}>
            <Text foregroundStyle={brand}>Privacy Policy</Text>
          </Button>
        </Section>
        {session ? (
          <Section footer="Your session is kept in localStorage on this device (not the keychain).">
            <Button role="destructive" title="Sign out" onPress={signOut} />
          </Section>
        ) : null}
      </Form>
    </Screen>
  );
}
