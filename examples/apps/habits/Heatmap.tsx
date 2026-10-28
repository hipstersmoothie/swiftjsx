// A GitHub-style contribution heatmap of the last six months: one column per
// week, one row per weekday (locale order, top to bottom), shaded by how
// much of the day's target was met. Drawn with Swift Charts RectangleMarks
// on a numeric grid; scrub across it to read a week.
import { useState } from "react";
import { VStack, HStack, Text, Spacer, Chart, RectangleMark, PointMark, RuleMark } from "swiftjsx";
import { useHabits, type Habit } from "./store";
import { formatMonthShort, formatWeekRange, parseDay, orderedWeekdays, weekdayName, type DayKey } from "./dates";
import { heatmap } from "./stats";
import { shade } from "./theme";
import { Card, CardTitle } from "./ui";

const WEEKS = 26;
// Room on the left (in week units) for the weekday labels, and on top for months.
const LABEL_COLUMNS = 2.4;
const GAP = 0.12;

export function Heatmap({ habit, today }: { habit: Habit; today: DayKey }) {
  const logs = useHabits((s) => s.logs);
  const [selected, setSelected] = useState<number | null>(null);
  const columns = heatmap(habit, logs, today, WEEKS);
  const done = columns.flat().filter((c) => c.status === "done").length;

  // A month label over the first week that starts in it.
  const months = columns.flatMap((week, col) => {
    const firstOfMonth = week.find((c) => c.day.endsWith("-01"));
    return firstOfMonth && col < WEEKS - 1 ? [{ col, label: formatMonthShort(parseDay(firstOfMonth.day)) }] : [];
  });

  const week = selected !== null && selected >= 0 && selected < WEEKS ? columns[selected] : null;
  const weekDone = week ? week.filter((c) => c.status === "done").length : 0;

  return (
    <Card spacing={10}>
      <CardTitle title="Last 6 Months" icon="square.grid.3x3.fill" color={habit.color} />
      <Text font="caption" foregroundStyle="secondaryLabel" monospacedDigit>
        {week ? `${formatWeekRange(week[0].day)}: ${weekDone} ${weekDone === 1 ? "day" : "days"} done` : `${done} days done · drag across to see a week`}
      </Text>
      <Chart
        // Square cells: 7 rows + a row of month labels, over the weeks + label columns.
        aspectRatio={(WEEKS + LABEL_COLUMNS) / 8.2}
        xDomain={[-LABEL_COLUMNS, WEEKS]}
        yDomain={[0, 8.2]}
        xAxis="hidden"
        yAxis="hidden"
        legend="hidden"
        onXSelectionChange={(x) => setSelected(typeof x === "number" && x >= 0 ? Math.floor(x) : null)}
        accessibilityIdentifier="heatmap"
        accessibilityLabel={`Heatmap of the last six months: ${done} days done`}
      >
        {columns.flatMap((days, col) =>
          days.map((cell, row) =>
            cell.status === "future" ? null : (
              <RectangleMark
                key={cell.day}
                xStart={col + GAP}
                xEnd={col + 1 - GAP}
                // Row 0 (the first weekday) at the top.
                yStart={7 - row - 1 + GAP}
                yEnd={7 - row - GAP}
                foregroundStyle={cell.status === "before" ? "quinary" : shade(habit.color, cell.fraction)}
                opacity={selected !== null && selected !== col ? 0.45 : 1}
                xLabel="Week"
                yLabel="Day"
              />
            ),
          ),
        )}
        {/* Labels as invisible points with annotations: the axes can't be labeled with custom values. */}
        {months.map(({ col, label }) => (
          <PointMark key={`m${col}`} x={col + 0.5} y={7.7} symbolSize={0} annotation={label} annotationPosition="overlay" />
        ))}
        {orderedWeekdays.map((d, row) =>
          row % 2 === 1 ? (
            <PointMark key={`d${d}`} x={-LABEL_COLUMNS / 2} y={7 - row - 0.5} symbolSize={0} annotation={weekdayName(d, "short")} annotationPosition="overlay" />
          ) : null,
        )}
        {selected !== null ? <RuleMark x={selected + 0.5} foregroundStyle="secondary" lineWidth={1} dash={[2, 2]} /> : null}
      </Chart>
      <HStack spacing={4}>
        <Spacer />
        <Text font="caption2" foregroundStyle="secondaryLabel">Less</Text>
        {[0, 0.3, 0.6, 0.9, 1].map((f) => (
          <VStack key={f} frame={{ width: 11, height: 11 }} background={shade(habit.color, f)} cornerRadius={2.5} />
        ))}
        <Text font="caption2" foregroundStyle="secondaryLabel">More</Text>
      </HStack>
    </Card>
  );
}
