// Bluesky's side drawer: your avatar, name, handle and counts (or a sign-in
// prompt), the main destinations, the theme, and the help links. It slides
// in over everything (a Portal), opened from the header's avatar or a swipe
// from the leading edge; drag it back or tap outside to close. Its position
// is a shared value, so it follows the finger on the main thread.
import { useEffect, useState } from "react";
import {
  Portal, ZStack, VStack, HStack, Text, Image, Button, Spacer, Rectangle, ScrollView,
  useEnvironment, useAnimatedStyle, withSpring, runOnJS, openURL, haptic,
} from "swiftjsx";
import { compact, displayName } from "./format";
import { drawerProgress } from "./Home";
import { useMyProfile, SettingsScreen } from "./Me";
import { tabNav } from "./App";
import { useSession, useSettings } from "./session";
import { useUI, type TabName } from "./store";
import { Avatar, Butterfly, PillButton, T, ty, useTheme } from "./ui";

export const DRAWER_WIDTH = 300;
const WIDTH = DRAWER_WIDTH;
const SPRING = { duration: 0.35, bounce: 0 } as const;
/** Bluesky's overlay over the app while the drawer is out: a faint blue tint in light and dark, near black in dim. */
const SCRIM = { light: "#003975/10", dim: "#0A0D10/80", dark: "#0152A8/10" } as const;

export function Drawer() {
  const open = useUI((s) => s.drawerOpen);
  const peek = useUI((s) => s.drawerPeek);
  const setOpen = useUI((s) => s.setDrawerOpen);
  const { safeAreaInsets } = useEnvironment();
  const t = useTheme();
  const backdrop = useAnimatedStyle(() => ({ opacity: drawerProgress.get() }));
  const panel = useAnimatedStyle(() => ({ offset: { x: (drawerProgress.get() - 1) * (WIDTH + 20), y: 0 } }));
  // Still sliding out after it closed.
  const [closing, setClosing] = useState(false);

  useEffect(() => {
    drawerProgress.set(withSpring(open ? 1 : 0, SPRING));
    if (open) return;
    setClosing(true);
    const timer = setTimeout(() => setClosing(false), 400);
    return () => clearTimeout(timer);
  }, [open]);

  // Mounted only while it shows (nothing to lay out or update while closed).
  if (!open && !peek && !closing) return null;
  return (
    <Portal interactive fullScreen alignment="topLeading">
      <ZStack alignment="topLeading" frame={{ maxWidth: "infinity", maxHeight: "infinity" }}>
        <Rectangle fill={SCRIM[t.name]} frame={{ maxWidth: "infinity", maxHeight: "infinity" }} opacity={0} animatedStyle={backdrop} allowsHitTesting={false} accessibilityHidden />
        {open ? (
          <VStack
            frame={{ maxWidth: "infinity", maxHeight: "infinity" }}
            contentShape="rectangle"
            onTapGesture={() => setOpen(false)}
            accessibilityLabel="Close drawer"
            accessibilityIdentifier="drawer-backdrop"
          />
        ) : null}
        <VStack
          spacing={0}
          frame={{ width: WIDTH, maxHeight: "infinity", alignment: "topLeading" }}
          padding={{ top: safeAreaInsets.top, bottom: safeAreaInsets.bottom }}
          background={t.bg}
          border={{ color: t.border, width: 0.5 }}
          shadow={{ radius: 20, x: 4, color: "black/15" }}
          offset={{ x: -(WIDTH + 20) }}
          animatedStyle={panel}
          dragAxis="horizontal"
          onDrag={(e) => {
            "worklet";
            drawerProgress.set(Math.max(0, Math.min(1, 1 + e.translation.x / WIDTH)));
          }}
          onDragEnd={(e) => {
            "worklet";
            const close = e.translation.x < -WIDTH / 3 || e.velocity.x < -600;
            drawerProgress.set(withSpring(close ? 0 : 1, SPRING));
            if (close) runOnJS(setOpen)(false);
          }}
          accessibilityHidden={!open}
          accessibilityIdentifier="drawer"
          accessibilityElement="contain"
        >
          <DrawerContent />
        </VStack>
      </ZStack>
    </Portal>
  );
}

function DrawerContent() {
  const signedIn = useSession((s) => s.session !== null);
  const handle = useSession((s) => s.session?.handle ?? "");
  const me = useMyProfile();
  const tab = useUI((s) => s.tab);
  const setTab = useUI((s) => s.setTab);
  const openSignIn = useUI((s) => s.openSignIn);
  const setOpen = useUI((s) => s.setDrawerOpen);
  const t = useTheme();

  const go = (name: TabName) => {
    haptic("selection");
    if (name === tab) tabNav[name].popToRoot();
    setTab(name);
  };
  const settings = () => {
    setTab("profile");
    // Signed out, the Profile tab is the settings already.
    if (signedIn) tabNav.profile.push(<SettingsScreen />);
  };

  return (
    <ScrollView frame={{ maxWidth: "infinity", maxHeight: "infinity" }} showsIndicators={false}>
      <VStack alignment="leading" spacing={0} padding={{ horizontal: 20, top: 16, bottom: 24 }}>
        {signedIn ? (
          <Button onPress={() => go("profile")} pressedOpacity={0.7} accessibilityIdentifier="drawer-profile">
            <VStack alignment="leading" spacing={4}>
              <Avatar uri={me.data?.avatar} size={52} full />
              <Text font={ty(T.xl, "bold")} foregroundStyle={t.text} lineLimit={1} padding={{ top: 8 }}>{me.data ? displayName(me.data) : handle}</Text>
              <Text font={ty(T.md)} foregroundStyle={t.textMedium} lineLimit={1}>@{handle}</Text>
              <Text font={ty(T.md)} foregroundStyle={t.textMedium} padding={{ top: 6 }}>
                <Text fontWeight="semibold" foregroundStyle={t.text}>{compact(me.data?.followersCount ?? 0)}</Text>
                <Text>{" followers · "}</Text>
                <Text fontWeight="semibold" foregroundStyle={t.text}>{compact(me.data?.followsCount ?? 0)}</Text>
                <Text>{" following"}</Text>
              </Text>
            </VStack>
          </Button>
        ) : (
          <VStack alignment="leading" spacing={10}>
            <Butterfly size={28} />
            <Text font={ty(T.xxl, "bold")} foregroundStyle={t.text}>Join the conversation</Text>
            <HStack spacing={8} padding={{ top: 4 }}>
              <PillButton title="Create account" small onPress={() => openURL("https://bsky.app", { inApp: true })} />
              <PillButton title="Sign in" small variant="secondary" onPress={() => { setOpen(false); openSignIn(""); }} />
            </HStack>
          </VStack>
        )}
        <VStack padding={{ vertical: 20 }}>
          <Rectangle fill={t.border} frame={{ maxWidth: "infinity", height: 0.5 }} />
        </VStack>
        <MenuItem icon="magnifyingglass" label="Search" active={tab === "search"} onPress={() => go("search")} />
        <MenuItem icon="house" activeIcon="house.fill" label="Home" active={tab === "home"} onPress={() => go("home")} />
        {signedIn ? <MenuItem icon="bell" activeIcon="bell.fill" label="Notifications" active={tab === "notifications"} onPress={() => go("notifications")} /> : null}
        <MenuItem icon="number" label="Feeds" onPress={() => go("search")} />
        {signedIn ? <MenuItem icon="person.crop.circle" activeIcon="person.crop.circle.fill" label="Profile" active={tab === "profile"} onPress={() => go("profile")} /> : null}
        <MenuItem icon="gearshape" label="Settings" onPress={settings} />
        <VStack padding={{ vertical: 20 }}>
          <Rectangle fill={t.border} frame={{ maxWidth: "infinity", height: 0.5 }} />
        </VStack>
        <ThemeSwitch />
        <HStack spacing={8} padding={{ top: 24 }}>
          <PillButton title="Feedback" systemImage="text.bubble" small variant="outline" onPress={() => openURL("https://blueskyweb.zendesk.com/hc/en-us/requests/new", { inApp: true })} />
          <PillButton title="Help" small variant="outline" onPress={() => openURL("https://blueskyweb.zendesk.com/hc/en-us", { inApp: true })} />
        </HStack>
        <HStack spacing={14} padding={{ top: 20 }}>
          <Button onPress={() => openURL("https://bsky.social/about/support/tos", { inApp: true })} pressedOpacity={0.6}>
            <Text font={ty(T.sm)} foregroundStyle={t.primary}>Terms of Service</Text>
          </Button>
          <Button onPress={() => openURL("https://bsky.social/about/support/privacy-policy", { inApp: true })} pressedOpacity={0.6}>
            <Text font={ty(T.sm)} foregroundStyle={t.primary}>Privacy Policy</Text>
          </Button>
        </HStack>
      </VStack>
    </ScrollView>
  );
}

function MenuItem({ icon, activeIcon, label, active = false, onPress }: { icon: string; activeIcon?: string; label: string; active?: boolean; onPress(): void }) {
  const t = useTheme();
  return (
    <Button onPress={onPress} pressedOpacity={0.6} accessibilityLabel={label} accessibilityIdentifier={`drawer-${label.toLowerCase()}`} accessibilityTraits={active ? ["button", "selected"] : "button"}>
      <HStack spacing={14} padding={{ vertical: 11 }} frame={{ maxWidth: "infinity", alignment: "leading" }} contentShape="rectangle">
        <Image systemName={active && activeIcon ? activeIcon : icon} font={{ size: 22, weight: active ? "semibold" : "regular" }} foregroundStyle={t.text} frame={{ width: 28 }} />
        <Text font={ty(T.xl, active ? "bold" : "regular")} foregroundStyle={t.text}>{label}</Text>
        <Spacer />
      </HStack>
    </Button>
  );
}

/** Light, dim or dark, right from the drawer (System lives in Settings). */
function ThemeSwitch() {
  const t = useTheme();
  const setAppearance = useSettings((s) => s.setAppearance);
  const setDarkTheme = useSettings((s) => s.setDarkTheme);
  const options = [
    { name: "light", icon: "sun.max", label: "Light" },
    { name: "dim", icon: "moon", label: "Dim" },
    { name: "dark", icon: "moon.stars", label: "Dark" },
  ] as const;
  return (
    <HStack spacing={0} padding={3} background={t.bg50} cornerRadius="capsule" accessibilityIdentifier="drawer-theme" accessibilityElement="contain">
      {options.map((o) => {
        const on = t.name === o.name;
        return (
          <Button
            key={o.name}
            onPress={() => {
              haptic("selection");
              if (o.name === "light") setAppearance("light");
              else {
                setDarkTheme(o.name);
                setAppearance("dark");
              }
            }}
            pressedOpacity={0.7}
            accessibilityLabel={`${o.label} theme`}
            accessibilityIdentifier={`drawer-theme-${o.name}`}
            accessibilityTraits={on ? ["button", "selected"] : "button"}
            frame={{ maxWidth: "infinity" }}
          >
            <HStack spacing={5} padding={{ vertical: 7 }} frame={{ maxWidth: "infinity" }} background={on ? t.bg : "clear"} cornerRadius="capsule" shadow={on ? { radius: 2, y: 1, color: "black/10" } : undefined}>
              <Image systemName={o.icon} font={{ size: 13, weight: "semibold" }} foregroundStyle={on ? t.text : t.textMedium} />
              <Text font={ty(13, "semibold")} foregroundStyle={on ? t.text : t.textMedium}>{o.label}</Text>
            </HStack>
          </Button>
        );
      })}
    </HStack>
  );
}
