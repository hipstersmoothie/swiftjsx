// The running timers, docked to the bottom of every screen (and of cooking
// mode) with <SafeAreaInset>: a horizontal strip of chips with a progress
// ring, the time left, pause/resume and a menu.
//
// The <SafeAreaInset> that holds this is always mounted; when there are no
// timers this renders nothing. (Mounting/unmounting the attachment itself
// rebuilds the view it's attached to, which would pop a navigation stack.)
import {
  VStack, HStack, ZStack, Text, Image, Button, Menu, Divider, Circle, ScrollView, Label, openURL,
} from "swiftjsx";
import { useTimers, useNow, secondsLeft, formatClock, type KitchenTimer } from "./timers";
import { formatDuration } from "./steps";
import { ACCENT } from "./ui";

export function TimerBar({ dark }: { dark?: boolean }) {
  const timers = useTimers((s) => s.timers);
  const permission = useTimers((s) => s.permission);
  const now = useNow(timers.length > 0);
  if (!timers.length) return null;

  return (
    <VStack spacing={6} padding={{ top: 8, bottom: 6 }} background={dark ? "#1c1c1e" : "bar"} accessibilityElement="contain">
      {permission === "denied" ? (
        <HStack spacing={6} padding={{ horizontal: 16 }}>
          <Image systemName="bell.slash.fill" font="caption" foregroundStyle="secondary" />
          <Text font="caption" foregroundStyle="secondary" lineLimit={2}>
            Notifications are off, so timers only ring while the app is open.
          </Text>
          <Button title="Settings" font="caption" onPress={() => openURL("app-settings:")} />
        </HStack>
      ) : null}
      <ScrollView axis="horizontal" showsIndicators={false} spacing={8} contentMargins={{ horizontal: 12 }}>
        {timers.map((timer) => (
          <TimerChip key={timer.id} timer={timer} now={now} dark={dark} />
        ))}
      </ScrollView>
    </VStack>
  );
}

function TimerChip({ timer, now, dark }: { timer: KitchenTimer; now: number; dark?: boolean }) {
  const pause = useTimers((s) => s.pause);
  const resume = useTimers((s) => s.resume);
  const addTime = useTimers((s) => s.addTime);
  const restart = useTimers((s) => s.restart);
  const cancel = useTimers((s) => s.cancel);
  const left = secondsLeft(timer, now);
  const done = timer.state === "done";
  const progress = done ? 1 : Math.min(1, Math.max(0, 1 - left / Math.max(1, timer.duration)));
  const ring = done ? "white" : timer.state === "paused" ? "gray" : ACCENT;
  const background = done ? "red" : dark ? "white/12" : "secondarySystemBackground";

  return (
    <HStack
      spacing={10}
      padding={{ leading: 8, trailing: 6, vertical: 6 }}
      background={background}
      cornerRadius="capsule"
      animation="snappy"
      accessibilityIdentifier={`timer-${timer.n}`}
      accessibilityElement="contain"
    >
      <ZStack frame={{ width: 34, height: 34 }} accessibilityHidden>
        <Circle stroke={done ? "white/30" : dark ? "white/15" : "systemGray5"} lineWidth={4} />
        <Circle stroke={ring} lineWidth={4} trim={[0, progress]} rotation={-90} animation="linear" />
        <Image
          systemName={done ? "bell.fill" : timer.state === "paused" ? "pause.fill" : "timer"}
          font="caption2"
          foregroundStyle={done ? "white" : "secondary"}
          symbolEffect={{ type: "wiggle", active: done }}
        />
      </ZStack>
      <VStack
        alignment="leading"
        spacing={0}
        accessibilityElement="combine"
        accessibilityLabel={`${timer.label} timer`}
        accessibilityValue={done ? `done ${formatClock(-left).replace("+", "")} ago` : `${formatClock(left)} left${timer.state === "paused" ? ", paused" : ""}`}
      >
        <Text font="caption" fontWeight="semibold" foregroundStyle={done ? "white" : "secondary"} lineLimit={1}>
          {timer.label} · {timer.recipeName}
        </Text>
        <Text font={{ size: 20, weight: "semibold", design: "rounded" }} monospacedDigit foregroundStyle={done ? "white" : "primary"}>
          {done ? `Done ${formatClock(left)}` : formatClock(left)}
        </Text>
      </VStack>
      {done ? (
        <Button buttonStyle="plain" onPress={() => cancel(timer.id)} accessibilityLabel="Stop timer">
          <Text font="subheadline" fontWeight="bold" foregroundStyle="red" padding={{ horizontal: 12, vertical: 8 }} background="white" cornerRadius="capsule">
            Stop
          </Text>
        </Button>
      ) : (
        <Button
          buttonStyle="plain"
          onPress={() => (timer.state === "paused" ? resume(timer.id) : pause(timer.id))}
          accessibilityLabel={timer.state === "paused" ? "Resume" : "Pause"}
        >
          <Image
            systemName={timer.state === "paused" ? "play.fill" : "pause.fill"}
            font="body"
            foregroundStyle={ACCENT}
            frame={{ width: 36, height: 36 }}
            background={dark ? "white/12" : "tertiarySystemFill"}
            cornerRadius="capsule"
          />
        </Button>
      )}
      <Menu systemImage="ellipsis" tint={done ? "white" : "secondary"} accessibilityLabel="Timer options">
        <Button onPress={() => addTime(timer.id, 60)}>
          <Label title="Add 1 Minute" systemImage="plus" />
        </Button>
        <Button onPress={() => addTime(timer.id, 5 * 60)}>
          <Label title="Add 5 Minutes" systemImage="goforward.5" />
        </Button>
        <Button onPress={() => restart(timer.id)}>
          <Label title={`Restart (${formatDuration(timer.duration)})`} systemImage="arrow.counterclockwise" />
        </Button>
        <Divider />
        <Button role="destructive" onPress={() => cancel(timer.id)}>
          <Label title="Cancel Timer" systemImage="xmark" />
        </Button>
      </Menu>
    </HStack>
  );
}
