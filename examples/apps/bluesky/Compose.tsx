// The composer: a new post, a reply (with the parent shown above), or a
// quote. Mentions, links and #tags are highlighted as you type and become
// facets; a ring counts down the 300-character (grapheme) limit.
import { useState } from "react";
import {
  Sheet, Screen, Navigator, ScrollView, VStack, HStack, Text, Image, Button, Spacer, Circle, TextField, ToolbarItem, ProgressView,
  ConfirmationDialog, haptic,
} from "swiftjsx";
import { createPost, resolveHandle } from "./api";
import { displayName } from "./format";
import { MAX_GRAPHEMES, detect, facetsFor, graphemeLength } from "./richtext";
import { toast, useUI, type ComposeTarget } from "./store";
import { useSession } from "./session";
import { useMyProfile } from "./Me";
import { Avatar, brand, hairline, likeColor, subtle } from "./ui";
import type { PostView, StrongRef } from "./types";

export function ComposeSheet() {
  const target = useUI((s) => s.compose);
  const close = useUI((s) => s.closeCompose);
  return (
    <Sheet isPresented={target !== undefined} onDismiss={close} detents={["large"]}>
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

  return (
    <Screen title={replyTo ? "Reply" : quote ? "Quote" : "New post"} titleDisplayMode="inline" interactiveDismissDisabled={!!text.trim()}>
      <ToolbarItem placement="cancellationAction">
        <Button onPress={() => (text.trim() ? setConfirmDiscard(true) : onClose())} title="Cancel">
          <ConfirmationDialog isPresented={confirmDiscard} onDismiss={() => setConfirmDiscard(false)} title="Discard draft?">
            <Button role="destructive" title="Discard" onPress={onClose} />
          </ConfirmationDialog>
        </Button>
      </ToolbarItem>
      <ToolbarItem placement="confirmationAction">
        {posting ? (
          <ProgressView />
        ) : (
          <Button onPress={submit} disabled={!canPost} buttonStyle="borderedProminent" tint={brand} accessibilityIdentifier="post-button">
            <Text fontWeight="bold">{replyTo ? "Reply" : "Post"}</Text>
          </Button>
        )}
      </ToolbarItem>
      <ToolbarItem placement="keyboard">
        <HStack>
          <Spacer />
          <CharacterRing length={length} />
        </HStack>
      </ToolbarItem>
      <ScrollView frame={{ maxWidth: "infinity", maxHeight: "infinity" }}>
        <VStack alignment="leading" spacing={12} padding={16}>
          {replyTo ? <ParentPreview post={replyTo} /> : null}
          <HStack alignment="top" spacing={12}>
            <Avatar uri={me.data?.avatar} size={40} label={session ? `@${session.handle}` : undefined} />
            <VStack alignment="leading" spacing={6}>
              <TextField
                value={text}
                onChange={setText}
                placeholder={replyTo ? "Write your reply" : "What's up?"}
                axis="vertical"
                minLines={4}
                textFieldStyle="plain"
                autoFocus
                font="body"
                accessibilityIdentifier="compose-text"
              />
              <Highlights text={text} />
            </VStack>
          </HStack>
          {quote ? <QuotePreview post={quote} /> : null}
        </VStack>
      </ScrollView>
    </Screen>
  );
}

/**
 * A TextField can't style ranges of its own text, so what will become a
 * facet is listed under the field instead.
 */
function Highlights({ text }: { text: string }) {
  const found = detect(text);
  if (!found.length) return null;
  return (
    <HStack spacing={6}>
      {found.slice(0, 4).map((d, i) => (
        <HStack key={i} spacing={3} padding={{ horizontal: 7, vertical: 3 }} background="secondarySystemFill" cornerRadius="capsule">
          <Image systemName={d.kind === "mention" ? "at" : d.kind === "link" ? "link" : "number"} font="caption2" foregroundStyle={brand} />
          <Text font="caption" foregroundStyle={brand} lineLimit={1}>{text.slice(d.start, d.end)}</Text>
        </HStack>
      ))}
    </HStack>
  );
}

function CharacterRing({ length }: { length: number }) {
  const left = MAX_GRAPHEMES - length;
  const progress = Math.min(1, length / MAX_GRAPHEMES);
  const color = left < 0 ? likeColor : left <= 20 ? "orange" : brand;
  return (
    <HStack spacing={8} accessibilityElement="combine" accessibilityLabel={`${left} characters left`} accessibilityIdentifier="char-count">
      {left <= 20 ? <Text font="footnote" fontWeight="semibold" foregroundStyle={color} monospacedDigit>{left}</Text> : null}
      <VStack frame={{ width: 22, height: 22 }}>
        <Circle stroke={hairline} lineWidth={3} />
        <Circle stroke={color} lineWidth={3} trim={[0, progress]} rotation={-90} animation="snappy" />
      </VStack>
    </HStack>
  );
}

function ParentPreview({ post }: { post: PostView }) {
  return (
    <HStack alignment="top" spacing={12} padding={{ bottom: 4 }}>
      <Avatar uri={post.author.avatar} size={40} />
      <VStack alignment="leading" spacing={3}>
        <Text font="subheadline" fontWeight="bold" lineLimit={1}>{displayName(post.author)}</Text>
        <Text font="subheadline" lineLimit={5} foregroundStyle={subtle}>{post.record.text}</Text>
      </VStack>
    </HStack>
  );
}

function QuotePreview({ post }: { post: PostView }) {
  return (
    <VStack alignment="leading" spacing={4} padding={12} frame={{ maxWidth: "infinity", alignment: "leading" }} border={{ color: hairline, width: 1 }} cornerRadius={12}>
      <HStack spacing={6}>
        <Avatar uri={post.author.avatar} size={18} />
        <Text font="subheadline" fontWeight="semibold" lineLimit={1}>{displayName(post.author)}</Text>
        <Text font="subheadline" foregroundStyle={subtle} lineLimit={1}>@{post.author.handle}</Text>
      </HStack>
      <Text font="subheadline" lineLimit={4}>{post.record.text}</Text>
    </VStack>
  );
}
