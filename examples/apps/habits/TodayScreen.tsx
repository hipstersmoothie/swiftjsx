// The home screen: a paging week strip, the selected day's progress and
// widget-like summaries, and that day's habits to check in.
import { useState } from "react";
import {
  withAnimation, Screen, ToolbarItem, ScrollView, VStack, HStack, LazyVGrid, Text, Image, Button, Menu, Spacer, Alert, Label,
  Chart, BarMark,
} from "swiftjsx";
import { useHabits, resetToSample } from "./store";
import { useToday, formatFullDay, relativeDay, weekDays, weekdayName, parseDay, type DayKey } from "./dates";
import { dayProgress, listedOn, perfectDays, started, streaks, streakText } from "./stats";
import { WeekStrip } from "./WeekStrip";
import { HabitRow } from "./HabitRow";
import { HabitFormSheet } from "./HabitForm";
import { Card, EmptyState, Ring, StatTile } from "./ui";

export function TodayScreen() {
  const today = useToday();
  // null follows today (past midnight too); a day key pins a past day.
  const [picked, setPicked] = useState<DayKey | null>(null);
  const [creating, setCreating] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const habits = useHabits((s) => s.habits);
  const logs = useHabits((s) => s.logs);

  const day = picked && picked < today ? picked : today;
  const select = (d: DayKey) => setPicked(d === today ? null : d);
  const listed = habits.filter((h) => listedOn(h, logs, day));
  const others = habits.filter((h) => started(h, day) && !listedOn(h, logs, day));
  const progress = dayProgress(habits, logs, day);

  return (
    <Screen title={relativeDay(day, today)}>
      <ToolbarItem placement="topBarLeading">
        <Menu systemImage="ellipsis.circle" accessibilityLabel="More">
          <Button onPress={() => setConfirmReset(true)}>
            <Label title="Reset Sample Data" systemImage="arrow.counterclockwise" />
          </Button>
        </Menu>
      </ToolbarItem>
      <ToolbarItem placement="primaryAction">
        <Button onPress={() => setCreating(true)} accessibilityLabel="New habit" accessibilityIdentifier="add-habit">
          <Image systemName="plus" />
        </Button>
      </ToolbarItem>

      <ScrollView background="systemGroupedBackground">
        <VStack alignment="leading" spacing={14} padding={{ horizontal: 16, bottom: 32 }}>
          <Text font="footnote" fontWeight="semibold" foregroundStyle="secondaryLabel" textCase="uppercase" padding={{ horizontal: 4 }}>
            {formatFullDay(day)}
          </Text>

          <WeekStrip selected={day} today={today} onSelect={select} />

          {habits.length ? (
            <>
              <ProgressCard done={progress.done} total={progress.total} fraction={progress.fraction} isToday={day === today} />
              <Widgets today={today} />

              <Text font="title3" fontWeight="bold" padding={{ top: 6, horizontal: 4 }}>
                {day === today ? "Today’s Habits" : `Habits on ${relativeDay(day, today)}`}
              </Text>
              {listed.length ? (
                listed.map((habit) => <HabitRow key={habit.id} habit={habit} day={day} today={today} />)
              ) : (
                <Card>
                  <Text foregroundStyle="secondaryLabel">Nothing due {day === today ? "today" : "that day"}.</Text>
                </Card>
              )}

              {others.length ? (
                <>
                  <Text font="subheadline" fontWeight="semibold" foregroundStyle="secondaryLabel" padding={{ top: 6, horizontal: 4 }}>
                    Not Due {day === today ? "Today" : "That Day"}
                  </Text>
                  {others.map((habit) => (
                    <HabitRow key={habit.id} habit={habit} day={day} today={today} dimmed />
                  ))}
                </>
              ) : null}
            </>
          ) : (
            <Card>
              <EmptyState icon="checklist" title="No Habits Yet" message="Small things, every day. Add the first one.">
                <Button title="New Habit" buttonStyle="borderedProminent" onPress={() => setCreating(true)} />
              </EmptyState>
            </Card>
          )}
        </VStack>
      </ScrollView>

      <HabitFormSheet isPresented={creating} onClose={() => setCreating(false)} />
      <Alert
        isPresented={confirmReset}
        onDismiss={() => setConfirmReset(false)}
        title="Reset sample data?"
        message="This replaces your habits and history with the sample ones."
      >
        <Button title="Reset" role="destructive" onPress={() => withAnimation("smooth", () => resetToSample())} />
        <Button title="Cancel" role="cancel" onPress={() => {}} />
      </Alert>
    </Screen>
  );
}

function ProgressCard({ done, total, fraction, isToday }: { done: number; total: number; fraction: number; isToday: boolean }) {
  const all = total > 0 && done === total;
  const message = !total
    ? "Nothing due. Enjoy the day off."
    : all
      ? isToday ? "Everything done. See you tomorrow!" : "Everything done that day."
      : done === 0
        ? isToday ? "A fresh start. Tap a ring to check in." : "Nothing checked in that day."
        : `${total - done} to go${isToday ? ". Keep it up!" : "."}`;
  return (
    <Card accessibilityElement="combine" accessibilityIdentifier="day-progress">
      <HStack spacing={18}>
        <Ring progress={fraction} size={84} lineWidth={11} color={all ? "green" : "accent"} track="quaternarySystemFill">
          <Text font={{ size: 20, weight: "bold", design: "rounded" }} monospacedDigit animation="snappy">
            {Math.round(fraction * 100)}%
          </Text>
        </Ring>
        <VStack alignment="leading" spacing={4}>
          <Text font={{ size: 22, weight: "bold", design: "rounded" }} monospacedDigit animation="snappy">
            {done} of {total} done
          </Text>
          <Text font="subheadline" foregroundStyle="secondaryLabel">{message}</Text>
        </VStack>
        <Spacer minLength={0} />
      </HStack>
    </Card>
  );
}

/** Widget-style tiles: perfect days, the longest current streak, and this week at a glance. */
function Widgets({ today }: { today: DayKey }) {
  const habits = useHabits((s) => s.habits);
  const logs = useHabits((s) => s.logs);
  const perfect = perfectDays(habits, logs, today);
  const top = habits
    .map((habit) => ({ habit, streak: streaks(habit, logs, today) }))
    .sort((a, b) => b.streak.current - a.streak.current)[0];
  const week = weekDays(today).map((day) => ({ day, progress: dayProgress(habits, logs, day), future: day > today }));
  const weekDone = week.reduce((n, d) => n + d.progress.done, 0);
  const weekTotal = week.reduce((n, d) => n + (d.future ? 0 : d.progress.total), 0);

  return (
    <VStack spacing={12}>
      <LazyVGrid columns={2} spacing={12}>
      <StatTile
        icon="star.fill"
        color="yellow"
        title="Perfect Days"
        value={String(perfect)}
        detail={perfect ? "in a row, everything done" : "Finish everything for one"}
        accessibilityIdentifier="perfect-days"
      />
      {top ? (
        <StatTile
          icon="flame.fill"
          color="orange"
          title="Top Streak"
          value={streakText(top.streak.current, top.streak.unit)}
          detail={top.habit.name}
        />
      ) : null}
      </LazyVGrid>
      <VStack
        alignment="leading"
        spacing={8}
        padding={14}
        frame={{ maxWidth: "infinity", alignment: "leading" }}
        background="secondarySystemGroupedBackground"
        cornerRadius={16}
        accessibilityElement="combine"
        accessibilityLabel="This week"
        accessibilityValue={`${weekDone} of ${weekTotal} check-ins so far`}
      >
        <HStack spacing={5}>
          <Image systemName="chart.bar.fill" font="caption" fontWeight="semibold" foregroundStyle="accent" />
          <Text font="caption" fontWeight="semibold" foregroundStyle="secondaryLabel" textCase="uppercase">This Week</Text>
          <Spacer />
          <Text font="caption" foregroundStyle="secondaryLabel" monospacedDigit>
            {weekTotal ? `${Math.round((weekDone / weekTotal) * 100)}% done` : "Nothing due"}
          </Text>
        </HStack>
        {/*
          Categories are day keys (narrow weekday names repeat: T, T, S, S),
          so the axis is hidden and the labels are drawn underneath.
        */}
        <Chart frame={{ height: 64 }} xAxis="hidden" yAxis="hidden" yDomain={[0, 1]} legend="hidden">
          {week.map(({ day }) => (
            <BarMark key={`track${day}`} x={day} yStart={0} yEnd={1} foregroundStyle="quaternarySystemFill" cornerRadius={4} barWidthRatio={0.55} />
          ))}
          {week.map(({ day, progress, future }) =>
            future || progress.fraction <= 0 ? null : (
              <BarMark
                key={day}
                x={day}
                yStart={0}
                yEnd={progress.fraction}
                foregroundStyle={progress.done === progress.total ? "green" : "accent"}
                cornerRadius={4}
                barWidthRatio={0.55}
              />
            ),
          )}
        </Chart>
        <HStack spacing={0}>
          {week.map(({ day }) => (
            <Text key={day} font="caption2" fontWeight={day === today ? "bold" : "regular"} foregroundStyle={day === today ? "accent" : "secondaryLabel"} frame={{ maxWidth: "infinity" }}>
              {weekdayName(parseDay(day).getDay(), "narrow")}
            </Text>
          ))}
        </HStack>
      </VStack>
    </VStack>
  );
}
