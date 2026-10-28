// Sign in with a handle and an app password (Settings → Privacy and security
// → App passwords on bsky.app). Never your main password.
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  Sheet, Screen, Navigator, Form, Section, TextField, Button, Text, VStack, HStack, Image, ProgressView, ToolbarItem, SectionFooter,
  openURL, haptic,
} from "swiftjsx";
import { createSession, DEFAULT_PDS, XrpcError } from "./api";
import { useSession } from "./session";
import { toast, useUI } from "./store";
import { brand, likeColor, subtle } from "./ui";
import type { Session } from "./types";

export function SignInSheet() {
  const reason = useUI((s) => s.signIn);
  const close = useUI((s) => s.closeSignIn);
  return (
    <Sheet isPresented={reason !== null} onDismiss={close} detents={["large"]}>
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
  const setSession = useSession((s) => s.setSession);
  const client = useQueryClient();
  const [handle, setHandle] = useState("");
  const [password, setPassword] = useState("");
  const [service, setService] = useState(DEFAULT_PDS);
  const [field, setField] = useState<"handle" | "password" | null>("handle");
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

  return (
    <Screen title="Sign in" titleDisplayMode="inline">
      <ToolbarItem placement="cancellationAction">
        <Button title="Cancel" onPress={onDone} />
      </ToolbarItem>
      <ToolbarItem placement="confirmationAction">
        {busy ? <ProgressView /> : <Button title="Next" onPress={submit} disabled={!ready} accessibilityIdentifier="sign-in-submit" />}
      </ToolbarItem>
      <Form>
        <Section>
          <VStack spacing={10} padding={{ vertical: 8 }} frame={{ maxWidth: "infinity" }}>
            <Image systemName="cloud.fill" font={{ size: 46 }} foregroundStyle={brand} />
            <Text font="title2" fontWeight="bold">Sign in to Bluesky</Text>
            <Text font="subheadline" foregroundStyle={subtle} textAlignment="center">
              {reason ? `Sign in to ${reason}.` : "See your timeline and notifications, and post, like and follow."}
            </Text>
          </VStack>
        </Section>
        <Section header="Account">
          <TextField
            value={handle}
            onChange={setHandle}
            placeholder="Handle (alice.bsky.social)"
            textContentType="username"
            autocapitalize="none"
            autocorrect={false}
            keyboardType="email"
            submitLabel="next"
            focused={field === "handle"}
            onFocus={() => setField("handle")}
            onSubmit={() => setField("password")}
            textFieldStyle="plain"
            accessibilityIdentifier="sign-in-handle"
          />
          <TextField
            value={password}
            onChange={setPassword}
            placeholder="App password"
            secure
            textContentType="password"
            submitLabel="go"
            focused={field === "password"}
            onFocus={() => setField("password")}
            onSubmit={submit}
            textFieldStyle="plain"
            accessibilityIdentifier="sign-in-password"
          />
          <SectionFooter>
            <Text font="footnote" foregroundStyle={subtle}>
              Use an app password, not your account password. Make one on bsky.app under Settings → Privacy and security → App passwords.
            </Text>
          </SectionFooter>
        </Section>
        {error ? (
          <Section>
            <HStack spacing={8}>
              <Image systemName="exclamationmark.triangle.fill" foregroundStyle={likeColor} />
              <Text font="subheadline" foregroundStyle={likeColor} accessibilityIdentifier="sign-in-error">{error}</Text>
            </HStack>
          </Section>
        ) : null}
        <Section header="Hosting provider" footer="bsky.social unless your account lives on another PDS.">
          <TextField value={service} onChange={setService} placeholder={DEFAULT_PDS} keyboardType="url" autocapitalize="none" autocorrect={false} textFieldStyle="plain" />
        </Section>
        <Section>
          <Button onPress={() => openURL("https://bsky.app/settings/app-passwords", { inApp: true })}>
            <HStack spacing={8}>
              <Image systemName="key" foregroundStyle={brand} />
              <Text foregroundStyle={brand}>Create an app password</Text>
            </HStack>
          </Button>
        </Section>
      </Form>
    </Screen>
  );
}
