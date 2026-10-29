// One habit: streaks and rates, a month calendar, a six-month heatmap and a
// weekly chart. Pushed with just an id (pushed screens keep the props they
// were pushed with), so everything is read from the store.
import { useState } from "react";
import {
  format, useNavigation, Screen, ToolbarItem, ScrollView, VStack, HStack, LazyVGrid, Text, Image, Button, IconTile, ContentUnavailable,
} from "swiftjsx";
import { useHabits, countOn } from "./store";
import { formatTime, orderedWeekdays, useTodayKey, useWeekStartsOn, weekdayName } from "./dates";
import { completionRate, describeSchedule, streaks, streakText, totalCompletions } from "./stats";
import { MonthCalendar } from "./MonthCalendar";
import { Heatmap } from "./Heatmap";
import { WeeklyChart } from "./WeeklyChart";
import { HabitFormSheet } from "./HabitForm";
import { CompleteButton } from "./HabitRow";
import { Card, StatTile } from "./ui";

export function HabitDetail({ habitId }: { habitId: string }) {
  const nav = useNavigation();
  const today = useTodayKey();
  const weekStartsOn = useWeekStartsOn();
  const habit = useHabits((s) => s.habits.find((h) => h.id === habitId));
  const logs = useHabits((s) => s.logs);
  const [editing, setEditing] = useState(false);

  if (!habit) {
    return (
      <Screen title="Habit" titleDisplayMode="inline">
        <ContentUnavailable systemImage="trash" title="Habit Deleted" description="This habit isn’t around any more." />
      </Screen>
    );
  }

  const s = streaks(habit, logs, today, weekStartsOn);
  const rate = completionRate(habit, logs, today, weekStartsOn);
  const total = totalCompletions(habit, logs);
  const schedule = describeSchedule(habit, (d) => weekdayName(d), orderedWeekdays(weekStartsOn));

  return (
    <Screen title={habit.name} titleDisplayMode="inline">
      <ToolbarItem placement="primaryAction">
        <Button title="Edit" onPress={() => setEditing(true)} accessibilityIdentifier="edit-habit" />
      </ToolbarItem>

      <ScrollView background="systemGroupedBackground">
        <VStack alignment="leading" spacing={14} padding={{ horizontal: 16, top: 8, bottom: 32 }}>
          <Card>
            <HStack spacing={14}>
              <IconTile systemImage={habit.icon} color={habit.color} size={56} />
              <VStack alignment="leading" spacing={3}>
                <Text font="title2" fontWeight="bold" lineLimit={2}>{habit.name}</Text>
                <Text font="subheadline" foregroundStyle="secondaryLabel">
                  {schedule}
                  {habit.target > 1 ? ` · ${habit.target} ${habit.unit || "times"} a day` : ""}
                </Text>
                {habit.reminder ? (
                  <Text font="subheadline" foregroundStyle="secondaryLabel">
                    <Image systemName="bell.fill" /> {formatTime(habit.reminder.hour, habit.reminder.minute)}
                  </Text>
                ) : null}
              </VStack>
              <VStack frame={{ maxWidth: "infinity", alignment: "trailing" }}>
                <CompleteButton habit={habit} day={today} count={countOn(logs, habit.id, today)} size={54} />
              </VStack>
            </HStack>
          </Card>

          <LazyVGrid columns={2} spacing={12}>
            <StatTile
              icon="flame.fill"
              color="orange"
              title="Current Streak"
              value={streakText(s.current, s.unit)}
              detail={s.current && s.current === s.best ? "Your best yet" : s.current ? `${s.best - s.current} to beat your best` : "Check in to start one"}
              accessibilityIdentifier="current-streak"
            />
            <StatTile icon="trophy.fill" color="yellow" title="Best Streak" value={streakText(s.best, s.unit)} accessibilityIdentifier="best-streak" />
            <StatTile
              icon="percent"
              color={habit.color}
              title="Last 30 Days"
              value={rate === null ? "–" : format.percent(rate)}
              detail={habit.schedule.kind === "weekly" ? "of weekly goals met" : "of scheduled days"}
              accessibilityIdentifier="completion-rate"
            />
            <StatTile icon="checkmark.seal.fill" color="green" title="Completed" value={format.number(total)} detail={format.count(total, { one: "day in all", other: "days in all" })} />
          </LazyVGrid>

          <MonthCalendar habit={habit} today={today} />
          <Heatmap habit={habit} today={today} />
          <WeeklyChart habit={habit} today={today} />
        </VStack>
      </ScrollView>

      <HabitFormSheet
        isPresented={editing}
        habit={habit}
        onClose={() => setEditing(false)}
        onDelete={() => {
          setEditing(false);
          nav.pop();
        }}
      />
    </Screen>
  );
}
