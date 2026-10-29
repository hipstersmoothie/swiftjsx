// Completed days per week for the last 12 weeks, with the weekly goal as a
// rule. Scrub to read a week.
import { useState } from "react";
import { format, Text, Chart, BarMark, RuleMark } from "swiftjsx";
import { useHabits, type Habit } from "./store";
import { addDayKeys, dayKey, formatWeekRange, parseDay, useWeekStartsOn, type DayKey } from "./dates";
import { weeklyGoal, weeklySeries } from "./stats";
import { Card, CardTitle } from "./ui";

const WEEKS = 12;

export function WeeklyChart({ habit, today }: { habit: Habit; today: DayKey }) {
  const logs = useHabits((s) => s.logs);
  const weekStartsOn = useWeekStartsOn();
  const [selectedMs, setSelectedMs] = useState<number | null>(null);
  // Weeks that overlap the habit's start still show.
  const data = weeklySeries(habit, logs, today, weekStartsOn, WEEKS).filter((p) => p.week >= addDayKeys(habit.createdAt, -6));
  const goal = weeklyGoal(habit);
  const met = data.filter((p) => p.done >= goal).length;
  const average = data.length ? data.reduce((n, p) => n + p.done, 0) / data.length : 0;

  // With `xUnit`, the selection is the start of the week under the finger (ms).
  const selectedWeek = selectedMs === null ? null : dayKey(selectedMs);
  const selected = data.find((p) => p.week === selectedWeek) ?? null;

  return (
    <Card spacing={10}>
      <CardTitle title="Weekly" icon="chart.bar.fill" color={habit.color} />
      <Text font="caption" foregroundStyle="secondaryLabel" monospacedDigit>
        {selected
          ? `${formatWeekRange(selected.week)}: ${selected.done} of ${format.count(goal, { one: "# day", other: "# days" })}`
          : `Goal met ${met} of ${format.count(data.length, { one: "# week", other: "# weeks" })} · ${format.number(average, { minimumFractionDigits: 1, maximumFractionDigits: 1 })} days a week on average`}
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
              x={parseDay(p.week)}
              xUnit="weekOfYear"
              y={p.done}
              barWidth={14}
              cornerRadius={4}
              foregroundStyle={selected && selected.week !== p.week ? `${habit.color}/35` : p.done >= goal ? habit.color : `${habit.color}/70`}
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
