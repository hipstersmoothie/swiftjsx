import { HStack, VStack, ZStack, Text, Image, Button, Label, Spacer, ContextMenu, Overlay, withAnimation } from "swiftjsx";
import { useChat, type Message } from "./store";
import { clockTime } from "./format";

// Translucent, so it reads as a light gray bubble in light mode and a dark
// gray one in dark mode (there are no semantic system colors to use).
const THEIRS = "systemGray5";

export function MessageBubble({ message, contactId, showMeta }: { message: Message; contactId: string; showMeta: boolean }) {
  const mine = message.from === "me";
  const toggleHeart = () =>
    withAnimation("bouncy", () => useChat.getState().toggleReaction(contactId, message.id, "❤️"));
  const remove = () => withAnimation("snappy", () => useChat.getState().remove(contactId, message.id));

  return (
    <HStack padding={{ top: message.reaction ? 14 : 0 }} transition="move">
      {mine ? <Spacer minLength={56} /> : null}
      <VStack alignment={mine ? "trailing" : "leading"} spacing={3}>
        <ZStack alignment={mine ? "topLeading" : "topTrailing"} onDoubleTap={toggleHeart}>
          <Text
            padding={{ horizontal: 13, vertical: 8 }}
            background={mine ? "blue" : THEIRS}
            foregroundStyle={mine ? "white" : "primary"}
            cornerRadius={18}
            accessibilityIdentifier="message-bubble"
          >
            {message.text}
          </Text>
          {message.reaction ? <Reaction emoji={message.reaction} mine={mine} /> : null}
          <ContextMenu>
            <Button onPress={toggleHeart}>
              <Label title={message.reaction ? "Remove ❤️" : "React ❤️"} systemImage={message.reaction ? "heart.slash" : "heart"} />
            </Button>
            <Button role="destructive" onPress={remove}>
              <Label title="Delete" systemImage="trash" />
            </Button>
          </ContextMenu>
        </ZStack>
        {showMeta ? <Meta message={message} /> : null}
      </VStack>
      {mine ? null : <Spacer minLength={56} />}
    </HStack>
  );
}

function Reaction({ emoji, mine }: { emoji: string; mine: boolean }) {
  return (
    <Text
      font="caption"
      padding={5}
      background="thickMaterial"
      cornerRadius={14}
      shadow={{ radius: 1, y: 1 }}
      offset={{ x: mine ? -12 : 12, y: -14 }}
      transition="scale"
      accessibilityLabel={`Reacted ${emoji}`}
    >
      {emoji}
    </Text>
  );
}

function Meta({ message }: { message: Message }) {
  const sending = message.status === "sending";
  const status = message.from !== "me" ? "" : sending ? " · Sending…" : " · Sent";
  return (
    <HStack spacing={3} padding={{ horizontal: 6 }} foregroundStyle="secondary">
      {sending ? <Image systemName="clock" font="caption2" /> : null}
      <Text font="caption2">{clockTime(message.at)}{status}</Text>
    </HStack>
  );
}

export function DayHeader({ label }: { label: string }) {
  return (
    <Text
      font="caption"
      fontWeight="semibold"
      foregroundStyle="secondary"
      padding={{ top: 14, bottom: 6 }}
      frame={{ maxWidth: "infinity" }}
      accessibilityTraits="header"
    >
      {label}
    </Text>
  );
}

/** Three dots that light up and bob in turn, like iMessage. */
export function TypingBubble() {
  return (
    <HStack transition="move">
      <HStack
        spacing={5}
        padding={{ horizontal: 14, vertical: 14 }}
        background={THEIRS}
        cornerRadius={18}
        accessibilityElement="ignore"
        accessibilityLabel="Typing"
      >
        {[0, 1, 2].map((dot) => (
          <VStack key={dot} frame={{ width: 8, height: 8 }} background="gray" cornerRadius={4} keyframes={turn(dot, { y: -3 })}>
            {/* Keyframes start and end at the view's own props, so the dimming
                is a bubble-colored cover that clears on the dot's turn. */}
            <Overlay>
              <VStack background={THEIRS} cornerRadius={4} opacity={0.6} keyframes={turn(dot, { opacity: 0 })} />
            </Overlay>
          </VStack>
        ))}
      </HStack>
      <Spacer />
    </HStack>
  );
}

/** A 1 s loop where `dot` (of three) is `lit` in turn. The waits nudge y a hair so each one takes its time. */
const turn = (dot: number, lit: { y?: number; opacity?: number }) => ({
  repeat: true,
  settle: { type: "linear" as const, duration: 0.01 },
  steps: [
    { y: 0.01, duration: 0.25 * dot + 0.01 },
    { ...lit, duration: 0.25 },
    { y: 0.02, duration: 0.25 },
    { y: 0.03, duration: 0.25 * (2 - dot) + 0.01 },
  ],
});
