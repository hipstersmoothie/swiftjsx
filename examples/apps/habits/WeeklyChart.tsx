// Completed days per week for the last 12 weeks, with the weekly goal as a
// rule. Scrub to read a week.
import { useState } from "react";
import { addDays, addHours } from "date-fns";
import { Text, Chart, BarMark, RuleMark } from "swiftjsx";
import { useHabits, type Habit } from "./store";
import { addDayKeys, formatWeekRange, parseDay, type DayKey } from "./dates";
import { weeklyGoal, weeklySeries } from "./stats";
import { withAlpha } from "./theme";
import { Card, CardTitle } from "./ui";

const WEEKS = 12;

export function WeeklyChart({ habit, today }: { habit: Habit; today: DayKey }) {
  const logs = useHabits((s) => s.logs);
  const [selectedMs, setSelectedMs] = useState<number | null>(null);
  // Weeks that overlap the habit's start still show.
  const data = weeklySeries(habit, logs, today, WEEKS).filter((p) => p.week >= addDayKeys(habit.createdAt, -6));
  const goal = weeklyGoal(habit);
  const met = data.filter((p) => p.done >= goal).length;
  const average = data.length ? data.reduce((n, p) => n + p.done, 0) / data.length : 0;

  // Selection comes back as ms since 1970: snap to the week it falls in
  // (bars are drawn at the middle of their week).
  const selected =
    selectedMs === null
      ? null
      : data.reduce<(typeof data)[number] | null>(
          (best, p) => (!best || Math.abs(+middle(p.week) - selectedMs) < Math.abs(+middle(best.week) - selectedMs) ? p : best),
          null,
        );

  return (
    <Card spacing={10}>
      <CardTitle title="Weekly" icon="chart.bar.fill" color={habit.color} />
      <Text font="caption" foregroundStyle="secondaryLabel" monospacedDigit>
        {selected
          ? `${formatWeekRange(selected.week)}: ${selected.done} of ${goal} ${goal === 1 ? "day" : "days"}`
          : `Goal met ${met} of ${data.length} weeks · ${average.toFixed(1)} days a week on average`}
      </Text>
      {data.length ? (
        <Chart
          frame={{ height: 170 }}
          yDomain={[0, 7]}
          onXSelectionChange={(x) => setSelectedMs(typeof x === "number" ? x : null)}
          accessibilityIdentifier="weekly-chart"
        >
          {data.map((p) => (
            <BarMark
              key={p.week}
              // Middle of the week: a Date x has no unit (".weekOfYear"), so a bar sits centered on its instant.
              x={middle(p.week)}
              y={p.done}
              barWidth={14}
              cornerRadius={4}
              foregroundStyle={selected && selected.week !== p.week ? withAlpha(habit.color, 0.35) : p.done >= goal ? habit.color : withAlpha(habit.color, 0.7)}
              xLabel="Week"
              yLabel="Days done"
            />
          ))}
          <RuleMark y={goal} foregroundStyle="secondary" lineWidth={1} dash={[4, 3]} annotation={`Goal ${goal}`} annotationPosition="top" />
        </Chart>
      ) : (
        <Text foregroundStyle="secondaryLabel">No weeks yet.</Text>
      )}
    </Card>
  );
}

/** Noon on the 4th day of the week (calendar math, so DST weeks don't shift it). */
const middle = (week: DayKey) => addHours(addDays(parseDay(week), 3), 12);
