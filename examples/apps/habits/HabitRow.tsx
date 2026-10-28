// A habit on the Today screen: tap the ring to check in (count habits go up
// by one), long-press it for undo / reset; tap the rest for the details.
import { useState } from "react";
import {
  withAnimation, haptic, useNavigation, HStack, VStack, ZStack, Text, Image, Button, Circle, Spacer, Label, Divider, ContextMenu, Overlay,
} from "swiftjsx";
import { setCount, countOn, useHabits, type Habit } from "./store";
import { doneInWeek, describeSchedule, streaks } from "./stats";
import { orderedWeekdays, weekdayName, type DayKey } from "./dates";
import { withAlpha } from "./theme";
import { Burst, HabitIcon, Ring } from "./ui";
import { HabitDetail } from "./HabitDetail";

export function HabitRow({ habit, day, today, dimmed }: { habit: Habit; day: DayKey; today: DayKey; dimmed?: boolean }) {
  const nav = useNavigation();
  const logs = useHabits((s) => s.logs);
  const count = countOn(logs, habit.id, day);
  const done = count >= habit.target;
  const streak = streaks(habit, logs, today);

  let detail: string;
  if (habit.target > 1) detail = `${count} of ${habit.target}${habit.unit ? ` ${habit.unit}` : ""}`;
  else if (habit.schedule.kind === "weekly") detail = `${doneInWeek(habit, logs, day)} of ${habit.schedule.times} this week`;
  else detail = describeSchedule(habit, (d) => weekdayName(d), orderedWeekdays);

  return (
    <HStack
      spacing={14}
      padding={{ vertical: 12, leading: 14, trailing: 12 }}
      frame={{ maxWidth: "infinity" }}
      background={done ? withAlpha(habit.color, 0.12) : "secondarySystemGroupedBackground"}
      cornerRadius={18}
      opacity={dimmed ? 0.6 : 1}
      animation="smooth"
      onTapGesture={() => nav.push(<HabitDetail habitId={habit.id} />)}
      accessibilityElement="contain"
      accessibilityIdentifier="habit-row"
    >
      <HabitIcon icon={habit.icon} color={habit.color} size={42} />
      <VStack alignment="leading" spacing={3} accessibilityElement="combine" accessibilityHint="Shows history and streaks">
        <Text font="headline" lineLimit={1}>{habit.name}</Text>
        <HStack spacing={8}>
          <Text font="subheadline" foregroundStyle="secondaryLabel" monospacedDigit lineLimit={1} animation="snappy">{detail}</Text>
          {streak.current > 1 ? (
            <Text font="subheadline" fontWeight="semibold" foregroundStyle="orange" monospacedDigit accessibilityLabel={`${streak.current} ${streak.unit} streak`}>
              <Image systemName="flame.fill" /> {streak.current}
            </Text>
          ) : null}
        </HStack>
      </VStack>
      <Spacer minLength={8} />
      <CompleteButton habit={habit} day={day} count={count} />
    </HStack>
  );
}

/** The check-in ring. Finishing plays a burst, a bounce and a success haptic. */
export function CompleteButton({ habit, day, count, size = 48 }: { habit: Habit; day: DayKey; count: number; size?: number }) {
  const [burst, setBurst] = useState(0);
  const done = count >= habit.target;
  const counted = habit.target > 1;

  const set = (next: number) => withAnimation("snappy", () => setCount(habit.id, day, next));
  const press = () => {
    if (done) {
      if (!counted) {
        // Yes/no habits toggle back off with a tap.
        haptic("soft");
        set(0);
      } else {
        haptic("rigid");
      }
      return;
    }
    if (count + 1 >= habit.target) {
      haptic("success");
      setBurst((b) => b + 1);
    } else {
      haptic("light");
    }
    set(count + 1);
  };

  const unit = habit.unit || "time";
  return (
    <Button
      onPress={press}
      pressedScale={0.88}
      accessibilityIdentifier={`complete-${habit.name}`}
      accessibilityLabel={done ? `${habit.name}, done` : counted ? `Add one ${unit} to ${habit.name}` : `Complete ${habit.name}`}
      accessibilityValue={counted ? `${count} of ${habit.target}` : done ? "Done" : "Not done"}
      accessibilityHint={counted || done ? "Touch and hold to undo or reset" : undefined}
    >
      <ZStack frame={{ width: size, height: size }} contentShape="circle">
        <Ring progress={count / habit.target} size={size} lineWidth={size * 0.11} color={habit.color} track={withAlpha(habit.color, 0.18)} />
        {/* Always mounted, so finishing animates it in and the bounce plays on a value change. */}
        <ZStack
          frame={{ width: size, height: size }}
          scale={done ? 1 : 0.4}
          opacity={done ? 1 : 0}
          animation={{ type: "spring", duration: 0.45, bounce: 0.45 }}
        >
          <Circle fill={habit.color} frame={{ width: size * 0.7, height: size * 0.7 }} />
          <Image
            systemName="checkmark"
            font={{ size: size * 0.32, weight: "bold" }}
            foregroundStyle="white"
            symbolEffect={{ type: "bounce", value: burst }}
          />
        </ZStack>
        {done ? null : counted ? (
          <Text font={{ size: size * 0.32, weight: "bold", design: "rounded" }} foregroundStyle={habit.color} monospacedDigit animation="snappy" transition="opacity">
            {count}
          </Text>
        ) : (
          <Image systemName="plus" font={{ size: size * 0.3, weight: "semibold" }} foregroundStyle={withAlpha(habit.color, 0.5)} transition="opacity" />
        )}
      </ZStack>
      {burst > 0 ? (
        <Overlay>
          <Burst key={burst} color={habit.color} size={size} />
        </Overlay>
      ) : null}

      {/* Long press: undo and reset (a context menu is the native long-press-for-more). */}
      <ContextMenu>
        {!done ? (
          <Button onPress={() => { haptic("success"); setBurst((b) => b + 1); set(habit.target); }}>
            <Label title="Mark as Done" systemImage="checkmark.circle" />
          </Button>
        ) : null}
        {counted && count > 0 ? (
          <Button onPress={() => { haptic("light"); set(count - 1); }}>
            <Label title={`Remove One ${capitalize(unit)}`} systemImage="minus.circle" />
          </Button>
        ) : null}
        {counted && count < habit.target ? (
          <Button onPress={press}>
            <Label title={`Add One ${capitalize(unit)}`} systemImage="plus.circle" />
          </Button>
        ) : null}
        {count > 0 ? <Divider /> : null}
        {count > 0 ? (
          <Button role="destructive" onPress={() => { haptic("warning"); set(0); }}>
            <Label title="Reset" systemImage="arrow.counterclockwise" />
          </Button>
        ) : null}
      </ContextMenu>
    </Button>
  );
}

/** "glasses" → "Glass", "pages" → "Page" (good enough for English units). */
function capitalize(unit: string) {
  const singular = /(s|x|ch|sh)es$/.test(unit) ? unit.slice(0, -2) : unit.replace(/s$/, "");
  return singular.charAt(0).toUpperCase() + singular.slice(1);
}
