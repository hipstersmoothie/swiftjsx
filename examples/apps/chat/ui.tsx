import { HStack, VStack, Text, type Color, type Font } from "swiftjsx";
import { useConnection } from "./socket";
import { queuedMessages, useChat, type Contact } from "./store";

export function Avatar({ contact, size }: { contact: Contact; size: 30 | 48 | 72 }) {
  const initials = contact.name.split(" ").map((word) => word[0]).join("").slice(0, 2).toUpperCase();
  // Fonts are named sizes only, so pick one per avatar size.
  const font: Font = size === 30 ? "caption" : size === 48 ? "title3" : "title";
  return (
    <Text
      font={font}
      fontWeight="semibold"
      fontDesign="rounded"
      foregroundStyle="white"
      frame={{ width: size, height: size }}
      background={{ gradient: contact.colors, start: "topLeading", end: "bottomTrailing" }}
      cornerRadius={size / 2}
      accessibilityHidden
    >
      {initials}
    </Text>
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
      {contact ? <Avatar contact={contact} size={30} /> : null}
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
