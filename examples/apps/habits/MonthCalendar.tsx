// A month calendar for one habit: swipe between months (a page-style
// TabView) or use the chevrons. Days are colored by completion, today is
// outlined, future days are dimmed; tap a past day to fix its check-in.
import { useState } from "react";
import { addMonths, differenceInCalendarMonths, startOfMonth } from "date-fns";
import {
  withAnimation, haptic, TabView, Tab, VStack, HStack, ZStack, Grid, GridRow, Text, Button, Image, Circle, Spacer,
} from "swiftjsx";
import { setCount, useHabits, countOn, type Habit, type Logs } from "./store";
import { formatFullDay, formatMonthYear, isInMonth, monthGrid, orderedWeekdays, parseDay, weekdayName, type DayKey } from "./dates";
import { dayStatus, type DayStatus } from "./stats";
import { withAlpha } from "./theme";
import { Card } from "./ui";

const CELL = 38;
const ROW_SPACING = 6;

export function MonthCalendar({ habit, today }: { habit: Habit; today: DayKey }) {
  const logs = useHabits((s) => s.logs);
  const first = startOfMonth(parseDay(habit.createdAt < today ? habit.createdAt : today));
  const count = differenceInCalendarMonths(parseDay(today), first) + 1;
  const months = Array.from({ length: count }, (_, i) => addMonths(first, i));
  // Controlled, so the chevrons can page too. Strings: TabView's selection type.
  const [page, setPage] = useState(String(count - 1));
  const index = Math.min(Math.max(Number(page), 0), count - 1);

  const go = (delta: number) => {
    const next = Math.min(Math.max(index + delta, 0), count - 1);
    if (next === index) return;
    haptic("selection");
    withAnimation("snappy", () => setPage(String(next)));
  };

  return (
    <Card spacing={8} padding={{ top: 14, horizontal: 12, bottom: 4 }}>
      <HStack padding={{ horizontal: 4 }}>
        <Text font="headline" accessibilityIdentifier="month-title" accessibilityTraits="header">
          {formatMonthYear(months[index])}
        </Text>
        <Spacer />
        <HStack spacing={18}>
          <Button onPress={() => go(-1)} disabled={index === 0} buttonStyle="borderless" accessibilityLabel="Previous month" accessibilityIdentifier="previous-month">
            <Image systemName="chevron.left" fontWeight="semibold" />
          </Button>
          <Button onPress={() => go(1)} disabled={index === count - 1} buttonStyle="borderless" accessibilityLabel="Next month" accessibilityIdentifier="next-month">
            <Image systemName="chevron.right" fontWeight="semibold" />
          </Button>
        </HStack>
      </HStack>

      <HStack spacing={0}>
        {orderedWeekdays.map((d) => (
          <Text key={d} font="caption2" fontWeight="semibold" foregroundStyle="secondaryLabel" frame={{ maxWidth: "infinity" }} textCase="uppercase">
            {weekdayName(d, "short")}
          </Text>
        ))}
      </HStack>

      {/* Six rows always, so every page is the same height. Room at the bottom for the page dots. */}
      <TabView
        tabViewStyle="page"
        selection={String(index)}
        onSelectionChange={setPage}
        frame={{ height: 6 * CELL + 5 * ROW_SPACING + 34 }}
        accessibilityIdentifier="month-grid"
        accessibilityElement="contain"
      >
        {months.map((month, i) => (
          <Tab key={i} value={String(i)}>
            <MonthPage month={month} habit={habit} logs={logs} today={today} />
          </Tab>
        ))}
      </TabView>
      <Legend color={habit.color} />
    </Card>
  );
}

function MonthPage({ month, habit, logs, today }: { month: Date; habit: Habit; logs: Logs; today: DayKey }) {
  return (
    <VStack frame={{ maxHeight: "infinity", alignment: "top" }}>
      <Grid horizontalSpacing={0} verticalSpacing={ROW_SPACING}>
        {monthGrid(month).map((week) => (
          <GridRow key={week[0]}>
            {week.map((day) => (
              <DayCell key={day} day={day} inMonth={isInMonth(day, month)} habit={habit} logs={logs} today={today} />
            ))}
          </GridRow>
        ))}
      </Grid>
    </VStack>
  );
}

const STATUS_LABEL: Record<DayStatus, string> = {
  future: "upcoming",
  before: "before this habit started",
  off: "not scheduled",
  done: "done",
  partial: "partly done",
  missed: "missed",
  pending: "not done yet",
  optional: "free day",
};

function DayCell({ day, inMonth, habit, logs, today }: { day: DayKey; inMonth: boolean; habit: Habit; logs: Logs; today: DayKey }) {
  const status = dayStatus(habit, logs, day, today);
  const count = countOn(logs, habit.id, day);
  const isToday = day === today;
  const editable = inMonth && status !== "future" && status !== "before";
  const date = parseDay(day);

  const fill =
    status === "done" ? habit.color
    : status === "partial" ? withAlpha(habit.color, 0.3)
    : status === "missed" ? withAlpha(habit.color, 0.08)
    : "clear";
  const textColor =
    status === "done" ? "white"
    : status === "future" || status === "before" || status === "off" ? "tertiaryLabel"
    : "label";

  const toggle = () => {
    haptic(count >= habit.target ? "soft" : "success");
    withAnimation("snappy", () => setCount(habit.id, day, count >= habit.target ? 0 : habit.target));
  };

  return (
    <ZStack
      frame={{ maxWidth: "infinity", height: CELL }}
      opacity={inMonth ? 1 : 0}
      onTapGesture={editable ? toggle : undefined}
      accessibilityElement="ignore"
      accessibilityIdentifier={inMonth ? `day-${day}` : undefined}
      accessibilityLabel={formatFullDay(day)}
      accessibilityValue={habit.target > 1 && count > 0 && count < habit.target ? `${count} of ${habit.target}` : STATUS_LABEL[status]}
      accessibilityTraits={editable ? "button" : "staticText"}
      accessibilityHint={editable ? (count >= habit.target ? "Marks it as not done" : "Marks it as done") : undefined}
      accessibilityHidden={!inMonth}
    >
      <Circle fill={fill} frame={{ width: CELL - 4, height: CELL - 4 }} animation="snappy" />
      {status === "partial" ? (
        <Circle stroke={habit.color} lineWidth={2} trim={[0, count / habit.target]} rotation={-90} frame={{ width: CELL - 4, height: CELL - 4 }} />
      ) : null}
      {isToday ? <Circle stroke={status === "done" ? "label" : habit.color} lineWidth={2} frame={{ width: CELL, height: CELL }} /> : null}
      <Text font={{ size: 15, weight: isToday || status === "done" ? "semibold" : "regular", design: "rounded" }} foregroundStyle={textColor} monospacedDigit>
        {date.getDate()}
      </Text>
    </ZStack>
  );
}

function Legend({ color }: { color: Habit["color"] }) {
  const items: { label: string; fill: ReturnType<typeof withAlpha> | Habit["color"] }[] = [
    { label: "Done", fill: color },
    { label: "Partly", fill: withAlpha(color, 0.3) },
    { label: "Missed", fill: withAlpha(color, 0.08) },
  ];
  return (
    <HStack spacing={14} padding={{ horizontal: 4, bottom: 10 }} accessibilityHidden>
      {items.map((item) => (
        <HStack key={item.label} spacing={5}>
          <Circle fill={item.fill} frame={{ width: 10, height: 10 }} />
          <Text font="caption" foregroundStyle="secondaryLabel">{item.label}</Text>
        </HStack>
      ))}
      <HStack spacing={5}>
        <Circle stroke={color} lineWidth={1.5} frame={{ width: 10, height: 10 }} />
        <Text font="caption" foregroundStyle="secondaryLabel">Today</Text>
      </HStack>
    </HStack>
  );
}
