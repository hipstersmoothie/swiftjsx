// Sign in with a handle and an app password (Settings → Privacy and security
// → App passwords on bsky.app). Never your main password. Laid out like
// Bluesky's sign-in form: a big title, the hosting provider, fields with icons
// on gray, and Back / Next at the bottom.
import { useState, type ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  Sheet, Screen, Navigator, ScrollView, TextField, Button, Text, VStack, HStack, Image, ProgressView, Spacer,
  openURL, haptic,
} from "swiftjsx";
import { createSession, DEFAULT_PDS, XrpcError } from "./api";
import { useSession } from "./session";
import { toast, useUI } from "./store";
import { Butterfly, T, ty, useTheme } from "./ui";
import type { Session } from "./types";

export function SignInSheet() {
  const reason = useUI((s) => s.signIn);
  const close = useUI((s) => s.closeSignIn);
  return (
    <Sheet isPresented={reason !== null} onDismiss={close} detents={["large"]} dragIndicator="hidden">
      <Navigator>
        <SignInForm reason={reason ?? ""} onDone={close} />
      </Navigator>
    </Sheet>
  );
}

/** A session, or why it failed. A bare name gets ".bsky.social". */
async function signIn(identifier: string, password: string, service: string): Promise<Session | string> {
  const id = identifier.includes(".") || identifier.startsWith("did:") ? identifier : `${identifier}.bsky.social`;
  try {
    return await createSession(id, password, service.trim() || DEFAULT_PDS);
  } catch (e) {
    if (e instanceof XrpcError && e.status === 401) return "Wrong handle or app password.";
    return e instanceof Error ? e.message : String(e);
  }
}

function SignInForm({ reason, onDone }: { reason: string; onDone(): void }) {
  const t = useTheme();
  const setSession = useSession((s) => s.setSession);
  const client = useQueryClient();
  const [handle, setHandle] = useState("");
  const [password, setPassword] = useState("");
  const [service, setService] = useState(DEFAULT_PDS);
  const [field, setField] = useState<"handle" | "password" | "service" | null>("handle");
  const [editingService, setEditingService] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const identifier = handle.trim().replace(/^@/, "");
  const ready = identifier.length > 2 && password.length > 0 && !busy;

  const submit = async () => {
    if (!ready) return;
    setBusy(true);
    setError(null);
    const result = await signIn(identifier, password, service);
    if (typeof result === "string") {
      haptic("error");
      setError(result);
      setBusy(false);
      return;
    }
    setSession(result);
    client.clear();
    haptic("success");
    toast(`Signed in as @${result.handle}`, "person.crop.circle.badge.checkmark");
    onDone();
  };

  const host = service.trim().replace(/^https?:\/\//, "").replace(/\/$/, "");
  const provider = !host || `https://${host}` === DEFAULT_PDS ? "Bluesky Social" : host;

  return (
    <Screen title="Sign in" navigationBar="hidden">
      <VStack spacing={0} frame={{ maxWidth: "infinity", maxHeight: "infinity" }} background={t.bg}>
        <ScrollView frame={{ maxWidth: "infinity", maxHeight: "infinity" }}>
          <VStack alignment="leading" spacing={0} padding={{ horizontal: 24, top: 28, bottom: 24 }}>
            <Butterfly size={30} />
            <Text font={ty(T.xxxl + 4, "heavy")} foregroundStyle={t.text} padding={{ top: 18 }} accessibilityTraits="header">Sign in</Text>
            <Text font={ty(T.md)} foregroundStyle={t.textMedium} lineSpacing={2} padding={{ top: 6 }}>
              {reason ? `Sign in to ${reason}.` : "See your timeline and notifications, and post, like and follow."}
            </Text>

            <FieldLabel>Hosting provider</FieldLabel>
            {editingService ? (
              <Field icon="globe" focused={field === "service"}>
                <TextField
                  value={service}
                  onChange={setService}
                  placeholder={DEFAULT_PDS}
                  keyboardType="url"
                  autocapitalize="none"
                  autocorrect={false}
                  textFieldStyle="plain"
                  font={ty(T.md)}
                  focused={field === "service"}
                  onFocus={() => setField("service")}
                  onSubmit={() => {
                    setEditingService(false);
                    setField("handle");
                  }}
                  submitLabel="done"
                />
              </Field>
            ) : (
              <Button onPress={() => { setEditingService(true); setField("service"); }} pressedOpacity={0.7} accessibilityLabel={`Hosting provider: ${provider}. Change`}>
                <Field icon="globe">
                  <Text font={ty(T.md, "medium")} foregroundStyle={t.text} lineLimit={1}>{provider}</Text>
                  <Spacer />
                  <Image systemName="pencil" font={{ size: 14, weight: "semibold" }} foregroundStyle={t.textMedium} frame={{ width: 26, height: 26 }} background={t.bg100} cornerRadius="capsule" />
                </Field>
              </Button>
            )}

            <FieldLabel>Account</FieldLabel>
            <VStack spacing={8}>
              <Field icon="at" focused={field === "handle"}>
                <TextField
                  value={handle}
                  onChange={setHandle}
                  placeholder="Username or email address"
                  textContentType="username"
                  autocapitalize="none"
                  autocorrect={false}
                  keyboardType="email"
                  submitLabel="next"
                  font={ty(T.md)}
                  focused={field === "handle"}
                  onFocus={() => setField("handle")}
                  onSubmit={() => setField("password")}
                  textFieldStyle="plain"
                  accessibilityIdentifier="sign-in-handle"
                />
              </Field>
              <Field icon="lock" focused={field === "password"}>
                <TextField
                  value={password}
                  onChange={setPassword}
                  placeholder="App password"
                  secure
                  textContentType="password"
                  submitLabel="go"
                  font={ty(T.md)}
                  focused={field === "password"}
                  onFocus={() => setField("password")}
                  onSubmit={submit}
                  textFieldStyle="plain"
                  accessibilityIdentifier="sign-in-password"
                />
                <Button onPress={() => openURL("https://bsky.app/settings/app-passwords", { inApp: true })} pressedOpacity={0.6}>
                  <Text font={ty(T.sm, "semibold")} foregroundStyle={t.textMedium} padding={{ horizontal: 10, vertical: 5 }} background={t.bg100} cornerRadius={6}>Create</Text>
                </Button>
              </Field>
            </VStack>
            <Text font={ty(T.sm)} foregroundStyle={t.textMedium} lineSpacing={2} padding={{ top: 10 }}>
              Use an app password, not your account password. Make one on bsky.app under Settings → Privacy and security → App passwords.
            </Text>

            {error ? (
              <VStack padding={{ top: 16 }}>
                <HStack alignment="top" spacing={10} padding={12} frame={{ maxWidth: "infinity", alignment: "leading" }} background={t.bg50} cornerRadius={10} border={{ color: t.negative, width: 1 }}>
                  <Image systemName="exclamationmark.triangle.fill" font={{ size: 15 }} foregroundStyle={t.negative} />
                  <Text font={ty(T.sm, "medium")} foregroundStyle={t.text} accessibilityIdentifier="sign-in-error">{error}</Text>
                </HStack>
              </VStack>
            ) : null}
          </VStack>
        </ScrollView>
        {/* Back and Next, like Bluesky's form footer. */}
        <HStack padding={{ horizontal: 24, top: 10, bottom: 16 }}>
          <Button onPress={onDone} pressedOpacity={0.7} accessibilityLabel="Back" accessibilityIdentifier="sign-in-cancel">
            <Text font={ty(T.md, "semibold")} foregroundStyle={t.text} padding={{ horizontal: 18, vertical: 11 }} background={t.bg50} cornerRadius="capsule">Back</Text>
          </Button>
          <Spacer />
          {busy ? (
            <ProgressView tint={t.textMedium} frame={{ width: 78, height: 42 }} />
          ) : (
            <Button onPress={submit} disabled={!ready} pressedOpacity={0.8} accessibilityLabel="Next" accessibilityIdentifier="sign-in-submit">
              <Text font={ty(T.md, "semibold")} foregroundStyle="white" padding={{ horizontal: 22, vertical: 11 }} background={t.primary} cornerRadius="capsule" opacity={ready ? 1 : 0.5}>Next</Text>
            </Button>
          )}
        </HStack>
      </VStack>
    </Screen>
  );
}

function FieldLabel({ children }: { children: string }) {
  const t = useTheme();
  return <Text font={ty(T.sm, "medium")} foregroundStyle={t.textMedium} padding={{ top: 22, bottom: 8 }}>{children}</Text>;
}

/** Bluesky's text field: an icon and the input on a gray rounded box, outlined in blue while focused. */
function Field({ icon, focused = false, children }: { icon: string; focused?: boolean; children: ReactNode }) {
  const t = useTheme();
  return (
    <HStack spacing={10} padding={{ leading: 14, trailing: 8 }} frame={{ maxWidth: "infinity", minHeight: 50 }} background={t.bg50} cornerRadius={10} border={{ color: focused ? t.primary : "clear", width: 1.5 }} contentShape="rectangle">
      <Image systemName={icon} font={{ size: 16, weight: "medium" }} foregroundStyle={focused ? t.primary : t.textLow} frame={{ width: 20 }} />
      {children}
    </HStack>
  );
}
