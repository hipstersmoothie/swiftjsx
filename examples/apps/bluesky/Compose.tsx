// The composer, laid out like Bluesky's: Cancel and a Post pill on top (no
// navigation bar), the parent post when replying, your avatar beside a large
// text field, the quoted post, and a toolbar over the keyboard (media buttons,
// the language, and a ring counting down the 300-character grapheme limit).
// Mentions, links and #tags are highlighted as you type and become facets.
import { useState } from "react";
import {
  Sheet, Screen, Navigator, ScrollView, VStack, HStack, Text, Image, Button, Spacer, Circle, TextField, ProgressView,
  ConfirmationDialog, haptic,
} from "swiftjsx";
import { createPost, resolveHandle } from "./api";
import { displayName } from "./format";
import { MAX_GRAPHEMES, detect, facetsFor, graphemeLength } from "./richtext";
import { toast, useUI, type ComposeTarget } from "./store";
import { useSession } from "./session";
import { useMyProfile } from "./Me";
import { Avatar, Separator, T, ty, useTheme } from "./ui";
import type { PostView, StrongRef } from "./types";

export function ComposeSheet() {
  const target = useUI((s) => s.compose);
  const close = useUI((s) => s.closeCompose);
  return (
    <Sheet isPresented={target !== undefined} onDismiss={close} detents={["large"]} dragIndicator="hidden">
      <Navigator>
        <Composer target={target ?? null} onClose={close} />
      </Navigator>
    </Sheet>
  );
}

const ref = (post: PostView): StrongRef => ({ uri: post.uri, cid: post.cid });

async function resolveDid(handle: string): Promise<string | null> {
  try {
    return (await resolveHandle(handle)).did;
  } catch {
    return null;
  }
}

/** Posts it (a reply or quote per `target`); null when it worked, else what went wrong. */
async function publish(text: string, target: ComposeTarget): Promise<string | null> {
  const replyTo = target?.replyTo;
  const quote = target?.quote;
  try {
    const facets = await facetsFor(text, resolveDid);
    const root = replyTo ? (replyTo.record.reply?.root ?? ref(replyTo)) : undefined;
    await createPost({
      text,
      facets: facets.length ? facets : undefined,
      langs: [(navigator.language || "en").split("-")[0]],
      reply: replyTo && root ? { root, parent: ref(replyTo) } : undefined,
      embed: quote ? { $type: "app.bsky.embed.record", record: ref(quote) } : undefined,
    });
    return null;
  } catch (error) {
    return error instanceof Error ? error.message : "Couldn't post";
  }
}

function Composer({ target, onClose }: { target: ComposeTarget; onClose(): void }) {
  const t = useTheme();
  const session = useSession((s) => s.session);
  const me = useMyProfile();
  const [text, setText] = useState("");
  const [posting, setPosting] = useState(false);
  const [confirmDiscard, setConfirmDiscard] = useState(false);
  const length = graphemeLength(text);
  const over = length > MAX_GRAPHEMES;
  const canPost = !!text.trim() && !over && !posting;
  const replyTo = target?.replyTo;
  const quote = target?.quote;

  const submit = async () => {
    if (!canPost) return;
    setPosting(true);
    const error = await publish(text, target);
    if (error === null) {
      haptic("success");
      toast(replyTo ? "Reply sent" : "Posted", "checkmark.circle.fill");
      onClose();
    } else {
      haptic("error");
      toast(error, "exclamationmark.triangle");
      setPosting(false);
    }
  };

  const cancel = () => (text.trim() ? setConfirmDiscard(true) : onClose());
  const unsupported = () => toast("Attachments aren't available in this example", "paperclip");

  return (
    <Screen title={replyTo ? "Reply" : quote ? "Quote" : "New post"} navigationBar="hidden" interactiveDismissDisabled={!!text.trim()}>
      <VStack spacing={0} frame={{ maxWidth: "infinity", maxHeight: "infinity" }} background={t.bg}>
        {/* Bluesky's top bar: Cancel, then the Post pill. */}
        <HStack padding={{ leading: 6, trailing: 12, top: 10, bottom: 8 }}>
          <Button onPress={cancel} pressedOpacity={0.6} accessibilityIdentifier="compose-cancel">
            <Text font={ty(T.md + 1)} foregroundStyle={t.primary} padding={{ horizontal: 10, vertical: 8 }}>Cancel</Text>
            <ConfirmationDialog isPresented={confirmDiscard} onDismiss={() => setConfirmDiscard(false)} title="Discard draft?">
              <Button role="destructive" title="Discard" onPress={onClose} />
            </ConfirmationDialog>
          </Button>
          <Spacer />
          {posting ? (
            <ProgressView tint={t.primary} frame={{ width: 64, height: 34 }} />
          ) : (
            <Button onPress={submit} disabled={!canPost} pressedScale={0.95} accessibilityLabel={replyTo ? "Reply" : "Post"} accessibilityIdentifier="post-button">
              <Text font={ty(T.md, "bold")} foregroundStyle="white" padding={{ horizontal: 16, vertical: 8 }} background={t.primary} cornerRadius="capsule" opacity={canPost ? 1 : 0.5}>
                {replyTo ? "Reply" : "Post"}
              </Text>
            </Button>
          )}
        </HStack>
        <ScrollView frame={{ maxWidth: "infinity", maxHeight: "infinity" }}>
          <VStack alignment="leading" spacing={0}>
            {replyTo ? <ParentPreview post={replyTo} /> : null}
            <HStack alignment="top" spacing={10} padding={{ horizontal: 16, top: replyTo ? 14 : 6 }}>
              <Avatar uri={me.data?.avatar} size={42} label={session ? `@${session.handle}` : undefined} />
              <VStack alignment="leading" spacing={8} padding={{ top: 8 }}>
                <TextField
                  value={text}
                  onChange={setText}
                  placeholder={replyTo ? "Write your reply" : "What's up?"}
                  axis="vertical"
                  minLines={4}
                  textFieldStyle="plain"
                  autoFocus
                  font={ty(T.xl)}
                  tint={t.primary}
                  accessibilityIdentifier="compose-text"
                />
                <Highlights text={text} />
              </VStack>
            </HStack>
            {quote ? (
              <VStack padding={{ leading: 16 + 42 + 10, trailing: 16, top: 12 }}>
                <QuotePreview post={quote} />
              </VStack>
            ) : null}
          </VStack>
        </ScrollView>
        {/* Over the keyboard: media buttons, the language, and the counter. */}
        <Separator />
        <HStack spacing={4} padding={{ horizontal: 10, vertical: 6 }}>
          {[
            { icon: "photo", label: "Add images" },
            { icon: "camera", label: "Camera" },
            { icon: "film", label: "Add video" },
            { icon: "face.smiling", label: "Emoji" },
          ].map((b) => (
            <Button key={b.icon} onPress={unsupported} pressedOpacity={0.5} accessibilityLabel={b.label}>
              <Image systemName={b.icon} font={{ size: 20 }} foregroundStyle={t.primary} frame={{ width: 38, height: 38 }} contentShape="rectangle" />
            </Button>
          ))}
          <Spacer />
          <Text font={ty(T.sm, "semibold")} foregroundStyle={t.primary} padding={{ trailing: 8 }}>English</Text>
          <CharacterRing length={length} />
        </HStack>
      </VStack>
    </Screen>
  );
}

/**
 * A TextField can't style ranges of its own text, so what will become a
 * facet is listed under the field instead.
 */
function Highlights({ text }: { text: string }) {
  const t = useTheme();
  const found = detect(text);
  if (!found.length) return null;
  return (
    <HStack spacing={6}>
      {found.slice(0, 4).map((d, i) => (
        <HStack key={i} spacing={3} padding={{ horizontal: 7, vertical: 3 }} background="secondarySystemFill" cornerRadius="capsule">
          <Image systemName={d.kind === "mention" ? "at" : d.kind === "link" ? "link" : "number"} font="caption2" foregroundStyle={t.primary} />
          <Text font="caption" foregroundStyle={t.primary} lineLimit={1}>{text.slice(d.start, d.end)}</Text>
        </HStack>
      ))}
    </HStack>
  );
}

function CharacterRing({ length }: { length: number }) {
  const t = useTheme();
  const left = MAX_GRAPHEMES - length;
  const progress = Math.min(1, length / MAX_GRAPHEMES);
  const color = left < 0 ? t.negative : left <= 20 ? "orange" : t.primary;
  return (
    <HStack spacing={8} accessibilityElement="combine" accessibilityLabel={`${left} characters left`} accessibilityIdentifier="char-count">
      {left <= 20 ? <Text font="footnote" fontWeight="semibold" foregroundStyle={color} monospacedDigit>{left}</Text> : null}
      <VStack frame={{ width: 22, height: 22 }}>
        <Circle stroke={t.border} lineWidth={3} />
        <Circle stroke={color} lineWidth={3} trim={[0, progress]} rotation={-90} animation="snappy" />
      </VStack>
    </HStack>
  );
}

function ParentPreview({ post }: { post: PostView }) {
  const t = useTheme();
  return (
    <VStack spacing={0}>
      <HStack alignment="top" spacing={10} padding={{ horizontal: 16, top: 6, bottom: 14 }} frame={{ maxWidth: "infinity", alignment: "leading" }}>
        <Avatar uri={post.author.avatar} size={42} />
        <VStack alignment="leading" spacing={3}>
          <Text font={ty(T.md, "bold")} foregroundStyle={t.text} lineLimit={1}>{displayName(post.author)}</Text>
          <Text font={ty(T.md)} foregroundStyle={t.text} lineLimit={6} lineSpacing={2}>{post.record.text}</Text>
        </VStack>
      </HStack>
      <Separator />
    </VStack>
  );
}

function QuotePreview({ post }: { post: PostView }) {
  const t = useTheme();
  return (
    <VStack alignment="leading" spacing={4} padding={12} frame={{ maxWidth: "infinity", alignment: "leading" }} border={{ color: t.border, width: 1 }} cornerRadius={12}>
      <HStack spacing={6}>
        <Avatar uri={post.author.avatar} size={18} />
        <Text font={ty(T.sm, "bold")} foregroundStyle={t.text} lineLimit={1}>{displayName(post.author)}</Text>
        <Text font={ty(T.sm)} foregroundStyle={t.textMedium} lineLimit={1}>@{post.author.handle}</Text>
      </HStack>
      <Text font={ty(T.sm)} foregroundStyle={t.text} lineLimit={4}>{post.record.text}</Text>
    </VStack>
  );
}
