// A GitHub-style contribution heatmap of the last six months: one column per
// week, one row per weekday (locale order, top to bottom), shaded by how
// much of the day's target was met. Drawn with Swift Charts RectangleMarks
// on a numeric grid, labeled by its axes; scrub across it to read a week.
import { useState } from "react";
import { format, VStack, HStack, Text, Spacer, Chart, RectangleMark, RuleMark } from "swiftjsx";
import { useHabits, type Habit } from "./store";
import { formatMonthShort, formatWeekRange, parseDay, orderedWeekdays, useWeekStartsOn, weekdayName, type DayKey } from "./dates";
import { heatmap } from "./stats";
import { shade } from "./theme";
import { Card, CardTitle } from "./ui";

const WEEKS = 26;
// About how much room (in cells) the weekday labels take on the left and the
// month labels on top, so the cells come out square.
const LABEL_COLUMNS = 2.4;
const LABEL_ROWS = 1.2;
const GAP = 0.12;

export function Heatmap({ habit, today }: { habit: Habit; today: DayKey }) {
  const logs = useHabits((s) => s.logs);
  const weekStartsOn = useWeekStartsOn();
  const [selected, setSelected] = useState<number | null>(null);
  const columns = heatmap(habit, logs, today, weekStartsOn, WEEKS);
  const done = columns.flat().filter((c) => c.status === "done").length;

  // A month label over the first week that starts in it.
  const months = columns.flatMap((week, col) => {
    const firstOfMonth = week.find((c) => c.day.endsWith("-01"));
    return firstOfMonth && col < WEEKS - 1 ? [{ value: col + 0.5, label: formatMonthShort(parseDay(firstOfMonth.day)) }] : [];
  });
  // Every other weekday, row 0 (the first weekday) at the top.
  const weekdays = orderedWeekdays(weekStartsOn).flatMap((d, row) =>
    row % 2 === 1 ? [{ value: 7 - row - 0.5, label: weekdayName(d, "short") }] : [],
  );

  const week = selected !== null && selected >= 0 && selected < WEEKS ? columns[selected] : null;
  const weekDone = week ? week.filter((c) => c.status === "done").length : 0;

  return (
    <Card spacing={10}>
      <CardTitle title="Last 6 Months" icon="square.grid.3x3.fill" color={habit.color} />
      <Text font="caption" foregroundStyle="secondaryLabel" monospacedDigit>
        {week
          ? `${formatWeekRange(week[0].day)}: ${format.count(weekDone, { one: "# day", other: "# days" })} done`
          : `${format.count(done, { one: "# day", other: "# days" })} done · drag across to see a week`}
      </Text>
      <Chart
        // Square cells: 7 rows + the month labels, over the weeks + the weekday labels.
        aspectRatio={(WEEKS + LABEL_COLUMNS) / (7 + LABEL_ROWS)}
        xDomain={[0, WEEKS]}
        yDomain={[0, 7]}
        xAxis={{ position: "top", values: months, gridlines: false, ticks: false }}
        yAxis={{ position: "leading", values: weekdays, gridlines: false, ticks: false }}
        legend="hidden"
        onXSelectionChange={(x) => setSelected(typeof x === "number" && x >= 0 ? Math.floor(x) : null)}
        accessibilityIdentifier="heatmap"
        accessibilityLabel={`Heatmap of the last six months: ${format.count(done, { one: "# day", other: "# days" })} done`}
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
