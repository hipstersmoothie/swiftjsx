// A horizontally paging strip of weeks (locale's first weekday first), with a
// completion ring per day. Opens on this week; swipe back through history.
import { useEffect, useRef, useState } from "react";
import { withAnimation, haptic, ScrollView, HStack, VStack, ZStack, Text, Button, Spacer, ProgressRing, type HostInstance } from "swiftjsx";
import type { Day } from "date-fns";
import { addDayKeys, formatWeekRange, parseDay, useWeekStartsOn, weekDays, weekStartKey, weekdayName, type DayKey } from "./dates";
import { dayProgress } from "./stats";
import { useHabits, type Habit, type Logs } from "./store";
import { Card } from "./ui";

export function WeekStrip({ selected, today, onSelect }: { selected: DayKey; today: DayKey; onSelect: (day: DayKey) => void }) {
  const habits = useHabits((s) => s.habits);
  const logs = useHabits((s) => s.logs);
  const weekStartsOn = useWeekStartsOn();
  const scroller = useRef<HostInstance>(null);

  // Weeks from the oldest habit's first week to this one.
  const current = weekStartKey(today, weekStartsOn);
  const first = weekStartKey(habits.reduce((min, h) => (h.createdAt < min ? h.createdAt : min), today), weekStartsOn);
  const weeks: DayKey[] = [];
  for (let w = first; w <= current; w = addDayKeys(w, 7)) weeks.push(w);
  const [page, setPage] = useState(weeks.length - 1);
  const visible = weeks[Math.min(page, weeks.length - 1)] ?? current;

  // Start on this week. A scrollTo sent before the scroll view appears is
  // applied when it does.
  useEffect(() => {
    scroller.current?.scrollTo("end", { animated: false });
  }, []);

  const goToToday = () => {
    scroller.current?.scrollTo("end");
    withAnimation("snappy", () => onSelect(today));
  };

  const offToday = visible !== current || selected !== today;
  return (
    <Card spacing={10} padding={{ top: 14, bottom: 10, horizontal: 0 }}>
      <HStack padding={{ horizontal: 16 }}>
        <Text font="headline" animation="snappy" contentTransition="opacity">
          {visible === current ? "This Week" : visible === addDayKeys(current, -7) ? "Last Week" : formatWeekRange(visible)}
        </Text>
        <Spacer />
        {offToday ? (
          <Button title="Today" buttonStyle="bordered" font="subheadline" onPress={goToToday} transition="opacity" accessibilityIdentifier="go-to-today" />
        ) : null}
      </HStack>
      <ScrollView
        ref={scroller}
        axis="horizontal"
        paging
        showsIndicators={false}
        spacing={0}
        // relativeWidth alone also sizes the pages to the scroll view's
        // height, so the strip needs a fixed height.
        frame={{ height: 78 }}
        onScrollIndexChange={setPage}
        accessibilityIdentifier="week-strip"
        accessibilityElement="contain"
      >
        {weeks.map((week) => (
          <WeekPage key={week} week={week} weekStartsOn={weekStartsOn} habits={habits} logs={logs} selected={selected} today={today} onSelect={onSelect} />
        ))}
      </ScrollView>
    </Card>
  );
}

function WeekPage({ week, weekStartsOn, habits, logs, selected, today, onSelect }: {
  week: DayKey;
  weekStartsOn: Day;
  habits: Habit[];
  logs: Logs;
  selected: DayKey;
  today: DayKey;
  onSelect: (day: DayKey) => void;
}) {
  return (
    <HStack spacing={0} relativeWidth={1} padding={{ horizontal: 8 }}>
      {weekDays(week, weekStartsOn).map((day) => {
        const future = day > today;
        const progress = dayProgress(habits, logs, day, weekStartsOn);
        const isSelected = day === selected;
        const isToday = day === today;
        const date = parseDay(day);
        return (
          <Button
            key={day}
            buttonStyle="plain"
            disabled={future}
            frame={{ maxWidth: "infinity" }}
            onPress={() => {
              haptic("selection");
              withAnimation("snappy", () => onSelect(day));
            }}
            accessibilityIdentifier={`strip-${day}`}
            accessibilityLabel={`${weekdayName(date.getDay(), "long")} ${date.getDate()}`}
            accessibilityValue={progress.total ? `${progress.done} of ${progress.total} done` : "Nothing due"}
            accessibilityTraits={isSelected ? ["button", "selected"] : "button"}
          >
            <VStack spacing={5} padding={{ vertical: 6 }} frame={{ width: 44 }} background={isSelected ? "tertiarySystemFill" : "clear"} cornerRadius={12}>
              <Text font="caption2" fontWeight="semibold" foregroundStyle={isToday ? "accent" : "secondaryLabel"} textCase="uppercase">
                {weekdayName(date.getDay(), "narrow")}
              </Text>
              <ZStack frame={{ width: 34, height: 34 }} opacity={future ? 0.35 : 1}>
                <ProgressRing
                  value={future ? 0 : progress.fraction}
                  frame={{ width: 34, height: 34 }}
                  lineWidth={4}
                  color={progress.total && progress.done === progress.total ? "green" : "accent"}
                  track="quaternarySystemFill"
                />
                <Text
                  font={{ size: 13, weight: isToday || isSelected ? "bold" : "medium", design: "rounded" }}
                  foregroundStyle={isToday ? "accent" : "label"}
                  monospacedDigit
                >
                  {date.getDate()}
                </Text>
              </ZStack>
            </VStack>
          </Button>
        );
      })}
    </HStack>
  );
}
