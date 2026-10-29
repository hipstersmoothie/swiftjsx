import { Avatar, HStack, VStack, Text, type Color } from "swiftjsx";
import { useConnection } from "./socket";
import { queuedMessages, useChat, type Contact } from "./store";

export function ContactAvatar({ contact, size }: { contact: Contact; size: number }) {
  return (
    <Avatar
      name={contact.name}
      size={size}
      color={{ gradient: contact.colors, start: "topLeading", end: "bottomTrailing" }}
      accessibilityHidden
    />
  );
}

/** The navigation bar's title, with the connection status underneath. */
export function NavTitle({ title, contact, typing }: { title: string; contact?: Contact; typing?: boolean }) {
  const status = useConnection((s) => s.status);
  const queued = useChat((s) => queuedMessages(s).length);
  const [label, color]: [string, Color] =
    status === "online" ? [typing ? "typing…" : "online", "green"]
    : status === "connecting" ? ["connecting…", "orange"]
    : [queued ? `offline · ${queued} waiting to send` : "offline", "gray"];

  return (
    <HStack spacing={8}>
      {contact ? <ContactAvatar contact={contact} size={30} /> : null}
      <VStack spacing={1} alignment={contact ? "leading" : "center"}>
        <Text font="headline" lineLimit={1}>{title}</Text>
        <HStack spacing={4} accessibilityElement="combine" accessibilityIdentifier="connection-status">
          <VStack frame={{ width: 6, height: 6 }} background={color} cornerRadius={3} />
          <Text font="caption2" foregroundStyle="secondary" lineLimit={1}>{label}</Text>
        </HStack>
      </VStack>
    </HStack>
  );
}
