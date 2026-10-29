import { Fragment, useEffect, useRef, useState, type RefObject } from "react";
import {
  Screen, ToolbarItem, ScrollView, VStack, HStack, Text, TextField, Button, Image, Divider, type HostInstance,
} from "swiftjsx";
import { useChat, type Contact } from "./store";
import { sendMessage } from "./socket";
import { groupByDay, endsCluster } from "./format";
import { DayHeader, MessageBubble, TypingBubble } from "./MessageBubble";
import { ContactAvatar, NavTitle } from "./ui";

export function ConversationScreen({ contactId }: { contactId: string }) {
  const { contact, messages, unread } = useChat((s) => s.conversations[contactId]);
  const typing = useChat((s) => (s.typing[contactId] ?? 0) > 0);
  const markRead = useChat((s) => s.markRead);
  const scroller = useRef<HostInstance>(null);
  const input = useRef<HostInstance>(null);
  const newest = messages[messages.length - 1]?.id;

  useEffect(() => {
    if (unread) markRead(contactId);
  }, [unread, contactId, markRead]);

  // Keep the newest message (or the typing bubble) in view. Keyed on the
  // newest id, not the count, so deleting an old message doesn't scroll.
  useEffect(() => {
    scroller.current?.scrollTo("end");
  }, [newest, typing]);

  return (
    <Screen title={contact.name} titleDisplayMode="inline">
      <ToolbarItem placement="principal">
        <NavTitle title={contact.name} contact={contact} typing={typing} />
      </ToolbarItem>
      <ScrollView
        ref={scroller}
        frame={{ maxWidth: "infinity", maxHeight: "infinity" }}
        defaultScrollAnchor="bottom"
        onTapGesture={() => input.current?.blur()}
      >
        {messages.length === 0 && !typing ? <EmptyConversation contact={contact} /> : null}
        <VStack spacing={2} padding={{ horizontal: 12, bottom: 12 }} animation="snappy">
          {groupByDay(messages).map((day) => (
            <Fragment key={day.key}>
              <DayHeader label={day.label} />
              {day.messages.map((message, i) => (
                <MessageBubble
                  key={message.id}
                  message={message}
                  contactId={contactId}
                  showMeta={message.status === "sending" || endsCluster(message, day.messages[i + 1])}
                />
              ))}
            </Fragment>
          ))}
          {typing ? <TypingBubble /> : null}
        </VStack>
      </ScrollView>
      <Composer
        input={input}
        onSend={(text) => sendMessage(contactId, text)}
        // The keyboard shrinks the scroll view; once it's up, show the end again.
        onFocus={() => setTimeout(() => scroller.current?.scrollTo("end"), 350)}
      />
    </Screen>
  );
}

function Composer({ input, onSend, onFocus }: { input: RefObject<HostInstance | null>; onSend(text: string): void; onFocus(): void }) {
  const [text, setText] = useState("");
  const canSend = text.trim() !== "";
  const send = () => {
    if (!canSend) return;
    onSend(text.trim());
    setText("");
  };

  return (
    <VStack spacing={0} background="bar">
      <Divider />
      <HStack spacing={8} padding={{ horizontal: 12, vertical: 8 }}>
        <TextField
          ref={input}
          value={text}
          onChange={setText}
          placeholder="Message"
          // Return sends, and keeps the keyboard up for the next message.
          onSubmit={() => {
            send();
            input.current?.focus();
          }}
          onFocus={onFocus}
          accessibilityIdentifier="message-input"
        />
        <Button onPress={send} disabled={!canSend} accessibilityIdentifier="send-button" accessibilityLabel="Send">
          <Image systemName="arrow.up.circle.fill" font="title" foregroundStyle={canSend ? "blue" : "gray"} />
        </Button>
      </HStack>
    </VStack>
  );
}

// Not a ContentUnavailable: it shows the contact's avatar, and that only takes a symbol.
function EmptyConversation({ contact }: { contact: Contact }) {
  return (
    <VStack spacing={8} padding={{ top: 80 }} frame={{ maxWidth: "infinity" }}>
      <ContactAvatar contact={contact} size={72} />
      <Text font="title3" fontWeight="semibold">{contact.name}</Text>
      <Text font="subheadline" foregroundStyle="secondary">No messages yet. Say hi 👋</Text>
    </VStack>
  );
}
