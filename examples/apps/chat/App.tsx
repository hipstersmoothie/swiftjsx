// A messaging app over a WebSocket echo server: conversations persisted with
// zustand + localStorage, delivery receipts, offline queueing with reconnect,
// typing indicators, reactions and context menus.
import {
  Navigator, useNavigation, useNow, Screen, ToolbarItem, List, HStack, VStack, Text, Button, Label, Spacer, SwipeActions,
} from "swiftjsx";
import { lastMessage, useChat, type Conversation } from "./store";
import { useChatSocket } from "./socket";
import { listTime } from "./format";
import { ConversationScreen } from "./ConversationScreen";
import { ContactAvatar, NavTitle } from "./ui";

export function ChatApp() {
  useChatSocket();
  return (
    <Navigator>
      <ConversationsScreen />
    </Navigator>
  );
}

function ConversationsScreen() {
  const conversations = useChat((s) => s.conversations);
  const now = useNow();
  const newestFirst = Object.values(conversations).sort((a, b) => (lastMessage(b)?.at ?? 0) - (lastMessage(a)?.at ?? 0));

  return (
    <Screen title="Messages" titleDisplayMode="inline">
      <ToolbarItem placement="principal">
        <NavTitle title="Messages" />
      </ToolbarItem>
      <List>
        {newestFirst.map((conversation) => (
          <ConversationRow key={conversation.contact.id} conversation={conversation} now={now} />
        ))}
      </List>
    </Screen>
  );
}

function ConversationRow({ conversation, now }: { conversation: Conversation; now: number }) {
  const nav = useNavigation();
  const { contact, unread } = conversation;
  const last = lastMessage(conversation);
  const typing = useChat((s) => (s.typing[contact.id] ?? 0) > 0);
  const markRead = useChat((s) => s.markRead);
  const markUnread = useChat((s) => s.markUnread);
  const clear = useChat((s) => s.clear);
  const preview = typing ? "typing…" : !last ? "No messages yet" : last.from === "me" ? `You: ${last.text}` : last.text;

  return (
    <Button buttonStyle="plain" onPress={() => nav.push(<ConversationScreen contactId={contact.id} />)} accessibilityIdentifier="conversation-row">
      <HStack spacing={10} padding={{ vertical: 4 }}>
        <VStack frame={{ width: 10, height: 10 }} background={unread ? "blue" : "clear"} cornerRadius={5} accessibilityHidden />
        <ContactAvatar contact={contact} size={48} />
        <VStack alignment="leading" spacing={3}>
          <HStack>
            <Text font="headline" lineLimit={1}>{contact.name}</Text>
            <Spacer />
            <Text font="subheadline" foregroundStyle="secondary" lineLimit={1}>{last ? listTime(last.at, now) : ""}</Text>
          </HStack>
          <Text font="subheadline" foregroundStyle="secondary" italic={typing} lineLimit={2}>{preview}</Text>
        </VStack>
      </HStack>
      <SwipeActions edge="leading">
        <Button tint="blue" onPress={() => (unread ? markRead(contact.id) : markUnread(contact.id))}>
          <Label title={unread ? "Read" : "Unread"} systemImage={unread ? "envelope.open" : "envelope.badge"} />
        </Button>
      </SwipeActions>
      <SwipeActions edge="trailing">
        <Button role="destructive" onPress={() => clear(contact.id)}>
          <Label title="Clear" systemImage="trash" />
        </Button>
      </SwipeActions>
    </Button>
  );
}
