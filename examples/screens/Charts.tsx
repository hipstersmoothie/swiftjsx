import { useState } from "react";
import { Screen, ScrollView, VStack, HStack, Text, Picker, Chart, BarMark, LineMark, AreaMark, RuleMark, PointMark } from "swiftjsx";

// Deterministic sample data.
const days = Array.from({ length: 14 }, (_, i) => {
  const date = new Date(2026, 9, 14 + i);
  return { date, steps: Math.round(6000 + 4000 * Math.sin(i / 2) + (i % 3) * 900), resting: 56 + Math.round(4 * Math.cos(i / 3)) };
});
// Three months of daily distance, for a scrolling chart.
const year = Array.from({ length: 90 }, (_, i) => ({ date: new Date(2026, 7, 1 + i), km: Math.round((3 + 2.5 * Math.sin(i / 5) + (i % 4)) * 10) / 10 }));
const sleep = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day, i) => ({
  day,
  stages: { Deep: 1 + (i % 3) * 0.3, Core: 3.5 + (i % 2) * 0.4, REM: 1.5 + ((i + 1) % 3) * 0.2, Awake: 0.3 },
}));

export function ChartsDemo() {
  const [selected, setSelected] = useState<number | null>(null);
  const [kind, setKind] = useState("bars");
  const [leading, setLeading] = useState(+year[year.length - 14].date);
  const [level, setLevel] = useState<number | null>(null);
  const [range, setRange] = useState<[number, number] | null>(null);
  const day = selected === null ? null : days.reduce((a, b) => (Math.abs(+b.date - selected) < Math.abs(+a.date - selected) ? b : a));

  return (
    <Screen title="Charts" titleDisplayMode="inline">
      <ScrollView>
        <VStack alignment="leading" spacing={24} padding={20}>
          <VStack alignment="leading" spacing={8}>
            <Text font="headline">Steps</Text>
            <Text font="caption" foregroundStyle="secondary">
              {day ? `${day.date.toDateString()}: ${day.steps.toLocaleString()} steps` : "Drag across the chart"}
            </Text>
            <Picker pickerStyle="segmented" value={kind} onChange={setKind} options={[{ value: "bars", label: "Bars" }, { value: "line", label: "Line" }]} />
            <Chart
              frame={{ height: 200 }}
              onXSelectionChange={(x) => typeof x === "number" && setSelected(x)}
              animation="smooth"
              xAxis={{ stride: { unit: "day", count: 2 }, format: "monthDay", gridlines: false }}
              yAxis={{ values: [0, 5000, 10000], format: "compact" }}
            >
              {days.map((d) =>
                kind === "bars" ? (
                  <BarMark key={+d.date} x={d.date} xUnit="day" y={d.steps} cornerRadius={4} foregroundStyle={day && +day.date === +d.date ? "orange" : "pink"} />
                ) : (
                  <LineMark key={+d.date} x={d.date} y={d.steps} interpolation="catmullRom" foregroundStyle="pink" lineWidth={3} />
                ),
              )}
              <RuleMark y={10000} foregroundStyle="secondary" dash={[4, 4]} lineWidth={1} annotation="Goal 10,000" annotationPosition="top" />
            </Chart>
          </VStack>

          <VStack alignment="leading" spacing={8}>
            <Text font="headline">Distance (scrolls)</Text>
            <Text font="caption" foregroundStyle="secondary" accessibilityIdentifier="scroll-chart-status">
              {range
                ? `${new Date(range[0]).toLocaleDateString()} – ${new Date(range[1]).toLocaleDateString()}`
                : `From ${new Date(leading).toLocaleDateString()}${level === null ? "" : ` · ${level.toFixed(1)} km`}`}
            </Text>
            <Chart
              frame={{ height: 180 }}
              xVisibleDomain={{ unit: "day", count: 14 }}
              xScrollPosition={year[year.length - 14].date}
              xScrollAlignment="day"
              onXScrollPositionChange={(x) => setLeading(x as number)}
              onYSelectionChange={setLevel}
              onXRangeSelectionChange={setRange}
              xAxis={{ stride: { unit: "day", count: 3 }, format: "monthDay" }}
              yAxis={{ format: "{} km" }}
              accessibilityIdentifier="scroll-chart"
            >
              {year.map((d) => (
                <BarMark key={+d.date} x={d.date} xUnit="day" y={d.km} cornerRadius={3} foregroundStyle="teal" />
              ))}
              {level !== null && <RuleMark y={level} foregroundStyle="secondary" lineWidth={1} />}
            </Chart>
          </VStack>

          <VStack alignment="leading" spacing={8}>
            <Text font="headline">Sleep stages</Text>
            <Chart frame={{ height: 180 }} seriesColors={{ Deep: "indigo", Core: "blue", REM: "cyan", Awake: "orange" }} yAxis={{ stride: 2, format: "{} h" }}>
              {sleep.flatMap((d) =>
                Object.entries(d.stages).map(([stage, hours]) => <BarMark key={d.day + stage} x={d.day} y={hours} series={stage} cornerRadius={2} />),
              )}
            </Chart>
          </VStack>

          <VStack alignment="leading" spacing={8}>
            <Text font="headline">Resting heart rate</Text>
            <Chart frame={{ height: 160 }} yDomain={[45, 70]} xAxis={{ format: "weekday" }} yAxis={{ position: "leading", values: [50, 60, 70], format: "{} bpm" }}>
              {days.map((d) => (
                <AreaMark key={`band${+d.date}`} x={d.date} yStart={d.resting - 4} yEnd={d.resting + 4} foregroundStyle="red/15" interpolation="catmullRom" />
              ))}
              {days.map((d) => (
                <LineMark key={`line${+d.date}`} x={d.date} y={d.resting} foregroundStyle="red" interpolation="catmullRom" />
              ))}
              {days.map((d) => (
                <PointMark key={`pt${+d.date}`} x={d.date} y={d.resting} foregroundStyle="red" symbolSize={20} />
              ))}
            </Chart>
          </VStack>
        </VStack>
      </ScrollView>
    </Screen>
  );
}
