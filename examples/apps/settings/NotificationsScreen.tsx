// Notifications: a master switch, per-kind toggles, quiet hours (a from/to
// time range) and an alert sound.
import { format } from "date-fns";
import { useNavigation, withAnimation, Screen, List, Section, Picker, HStack, VStack, Text, Image } from "swiftjsx";
import { update, useAccent, useSettings, type PreviewSetting } from "./store";
import { ChoiceScreen, NavRow, ToggleRow, type Choice } from "./ui";

export const previewOptions: Choice[] = [
  { value: "always", label: "Always" },
  { value: "unlocked", label: "When Unlocked" },
  { value: "never", label: "Never" },
];

export const sounds: Choice[] = [
  { value: "chime", label: "Chime", detail: "Default" },
  { value: "bamboo", label: "Bamboo" },
  { value: "pop", label: "Pop" },
  { value: "glass", label: "Glass" },
  { value: "pulse", label: "Pulse" },
  { value: "ripple", label: "Ripple" },
  { value: "none", label: "None" },
];

const labelOf = (options: Choice[], value: string) => options.find((o) => o.value === value)?.label ?? value;

/** "10:00 PM" for 22 * 60. */
export const timeLabel = (minutes: number) => format(new Date(2000, 0, 1, Math.floor(minutes / 60), minutes % 60), "p");

// Every half hour. (No DatePicker in time mode yet.)
const times = Array.from({ length: 48 }, (_, i) => ({ value: String(i * 30), label: timeLabel(i * 30) }));

function quietDuration(from: number, to: number): string {
  const minutes = (to - from + 24 * 60) % (24 * 60) || 24 * 60;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest ? `${hours} h ${rest} min` : `${hours} ${hours === 1 ? "hour" : "hours"}`;
}

export function notificationsSummary(n: { enabled: boolean; quietHours: boolean }) {
  if (!n.enabled) return "Off";
  return n.quietHours ? "Quiet Hours" : "On";
}

export function NotificationsScreen() {
  const nav = useNavigation();
  const accent = useAccent();
  const n = useSettings((s) => s.notifications);
  const set = <K extends keyof typeof n>(key: K, value: (typeof n)[K]) =>
    update((s) => {
      s.notifications[key] = value;
    });

  return (
    <Screen title="Notifications" titleDisplayMode="inline">
      <List>
        <Section footer={n.enabled ? undefined : "You won’t get any notifications from this app, including direct messages."}>
          <ToggleRow
            title="Allow Notifications"
            icon="bell.badge.fill"
            color="red"
            value={n.enabled}
            onChange={(on) => withAnimation("snappy", () => set("enabled", on))}
          />
        </Section>

        {n.enabled ? (
          <>
            <Section header="Alerts">
              <NotificationPreview previews={n.previews} />
              <NavRow
                title="Show Previews"
                value={labelOf(previewOptions, n.previews)}
                onPress={() =>
                  nav.push(
                    <ChoiceScreen
                      title="Show Previews"
                      options={previewOptions}
                      select={(s) => s.notifications.previews}
                      onSelect={(v) => set("previews", v as PreviewSetting)}
                      footer="Previews show the first line of a message on the Lock Screen and in banners."
                    />,
                  )
                }
              />
              <NavRow
                title="Sound"
                value={labelOf(sounds, n.sound)}
                onPress={() =>
                  nav.push(
                    <ChoiceScreen
                      title="Sound"
                      header="Alert Tones"
                      options={sounds}
                      select={(s) => s.notifications.sound}
                      onSelect={(v) => set("sound", v)}
                    />,
                  )
                }
              />
              <ToggleRow title="Badge App Icon" value={n.badges} onChange={(v) => set("badges", v)} />
            </Section>

            <Section header="Notify Me About">
              <ToggleRow title="Direct Messages" icon="bubble.left.fill" color="green" value={n.messages} onChange={(v) => set("messages", v)} />
              <ToggleRow title="Mentions" icon="at" color="blue" value={n.mentions} onChange={(v) => set("mentions", v)} />
              <ToggleRow title="Product Updates" icon="sparkles" color="purple" value={n.updates} onChange={(v) => set("updates", v)} />
              <ToggleRow
                title="Weekly Digest"
                subtitle="By email, every Monday"
                icon="envelope.fill"
                color="orange"
                value={n.digest}
                onChange={(v) => set("digest", v)}
              />
            </Section>

            <Section
              header="Quiet Hours"
              footer={
                n.quietHours
                  ? `Notifications are silenced from ${timeLabel(n.quietFrom)} to ${timeLabel(n.quietTo)} (${quietDuration(n.quietFrom, n.quietTo)}).`
                  : "Silence notifications overnight. Calls from favorites still come through."
              }
            >
              <ToggleRow
                title="Quiet Hours"
                icon="moon.fill"
                color="indigo"
                value={n.quietHours}
                onChange={(on) => withAnimation("snappy", () => set("quietHours", on))}
              />
              {n.quietHours ? (
                <>
                  <Picker
                    label="From"
                    pickerStyle="menu"
                    tint={accent.color}
                    value={String(n.quietFrom)}
                    options={times}
                    onChange={(v) => set("quietFrom", Number(v))}
                  />
                  <Picker
                    label="To"
                    pickerStyle="menu"
                    tint={accent.color}
                    value={String(n.quietTo)}
                    options={times}
                    onChange={(v) => set("quietTo", Number(v))}
                  />
                </>
              ) : null}
            </Section>
          </>
        ) : null}
      </List>
    </Screen>
  );
}

/** A mock Lock Screen banner showing what "Show Previews" does. */
function NotificationPreview({ previews }: { previews: PreviewSetting }) {
  const accent = useAccent();
  const full = previews === "always" || previews === "unlocked";
  return (
    <HStack spacing={12} padding={12} background="tertiarySystemFill" cornerRadius={14} animation="snappy" accessibilityElement="combine">
      <Image systemName="bubble.left.fill" font="title3" foregroundStyle="white" frame={{ width: 38, height: 38 }} background={accent.color} cornerRadius={9} />
      <VStack alignment="leading" spacing={2} frame={{ maxWidth: "infinity", alignment: "leading" }}>
        <HStack>
          <Text font="subheadline" fontWeight="semibold">{full ? "Sam Chen" : "Messages"}</Text>
          <Text font="caption" foregroundStyle="secondaryLabel" frame={{ maxWidth: "infinity", alignment: "trailing" }}>now</Text>
        </HStack>
        <Text font="subheadline" foregroundStyle="secondaryLabel" lineLimit={1}>
          {full ? "Are we still on for the ride Saturday?" : "Notification"}
        </Text>
      </VStack>
    </HStack>
  );
}
