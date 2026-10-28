// A metric's detail: D / W / M / 6M picker, a scrubbable chart under a
// headline that follows the selection, then comparisons and facts.
import { useState } from "react";
import {
  Screen, ScrollView, VStack, HStack, LazyVGrid, Text, Picker, ProgressView, RoundedRectangle, Circle, Spacer, Divider,
  withAnimation, haptic,
} from "swiftjsx";
import { METRICS, RANGES, series, headline, selectionHeadline, comparison, stats, stageBreakdown, type MetricId, type Range, type ChartData, type Metric } from "./model";
import { Chart, Legend } from "./Chart";
import { Card, ChangeBadge, SectionTitle, StatTile, ValueText } from "./ui";
import { STAGE_COLORS, STAGE_NAMES } from "./theme";
import { compact, hoursMinutes } from "./format";

export function MetricScreen({ metricId }: { metricId: MetricId }) {
  const metric = METRICS[metricId];
  const [range, setRange] = useState<Range>("W");
  const [selected, setSelected] = useState<number | null>(null);

  const data = series(metric, range);
  const head = selected === null ? headline(metric, range) : selectionHeadline(metric, range, data, selected);

  const changeRange = (value: string) =>
    // Bars, gridlines and labels move to their new places together.
    withAnimation({ type: "smooth", duration: 0.45 }, () => {
      setRange(value as Range);
      setSelected(null);
    });

  return (
    <Screen title={metric.title} titleDisplayMode="inline">
      <ScrollView background="systemGroupedBackground">
        <VStack alignment="leading" spacing={16} padding={{ horizontal: 16, top: 8, bottom: 32 }}>
          <Picker
            pickerStyle="segmented"
            value={range}
            onChange={changeRange}
            options={RANGES}
            accessibilityIdentifier="range-picker"
          />

          <Card spacing={14}>
            <VStack alignment="leading" spacing={2} accessibilityElement="combine" accessibilityIdentifier="chart-headline">
              <Text font="caption" fontWeight="semibold" foregroundStyle="secondary">{head.caption}</Text>
              <ValueText value={head.value} unit={head.unit} size={30} />
              <Text font="subheadline" foregroundStyle="secondary" fontWeight="medium" monospacedDigit>{head.detail}</Text>
            </VStack>
            <Chart
              data={data}
              height={220}
              selected={selected}
              onSelect={(i) => {
                setSelected(i);
                if (i !== null) haptic("selection");
              }}
              yFormat={metricId === "sleep" ? "{} hr" : "compact"}
              accessibilityLabel={chartDescription(metric, range, data)}
              accessibilityIdentifier="metric-chart"
            />
            <ChartLegend metricId={metricId} data={data} />
            <Text font="caption2" foregroundStyle="tertiary">Drag across the chart to see each {range === "D" ? "hour" : range === "6M" ? "week" : "day"}.</Text>
          </Card>

          <SectionTitle title="Highlights" />
          <ComparisonCard metric={metric} range={range} />

          {metricId === "sleep" ? <StagesCard range={range} /> : null}

          <LazyVGrid columns={2} spacing={12}>
            {stats(metric, range).map((stat) => (
              <StatTile key={stat.title} stat={stat} />
            ))}
          </LazyVGrid>

          <SectionTitle title={`About ${metric.title}`} />
          <Card>
            <Text font="subheadline" foregroundStyle="secondary">{metric.about}</Text>
          </Card>
        </VStack>
      </ScrollView>
    </Screen>
  );
}

function ChartLegend({ metricId, data }: { metricId: MetricId; data: ChartData }) {
  if (metricId === "sleep") {
    const order = ["awake", "rem", "core", "deep"] as const;
    return <Legend items={order.map((s) => ({ name: STAGE_NAMES[s], color: STAGE_COLORS[s] }))} />;
  }
  if (metricId === "heart-rate") {
    return <Legend items={[{ name: "Range", color: "#FF375F60" }, { name: "Average", color: data.color }]} />;
  }
  if (data.goal !== undefined) return <Legend items={[{ name: `Goal ${compact(data.goal)}`, color: "secondaryLabel" }]} />;
  return null;
}

function chartDescription(metric: Metric, range: Range, data: ChartData) {
  const h = headline(metric, range);
  const kind = data.kind === "range" ? "Range chart" : data.kind === "timeline" ? "Sleep stages timeline" : "Bar chart";
  return `${kind} of ${metric.title.toLowerCase()}, ${h.detail}. ${h.caption.toLowerCase()}: ${h.value} ${h.unit}.`;
}

/** This period against the previous one, as two bars. */
function ComparisonCard({ metric, range }: { metric: Metric; range: Range }) {
  const c = comparison(metric, range);
  const max = Math.max(c.current.value, c.previous.value) || 1;
  return (
    <Card accessibilityElement="combine" accessibilityIdentifier="comparison">
      <HStack alignment="top">
        <Text font="subheadline" fontWeight="medium" frame={{ maxWidth: "infinity", alignment: "leading" }}>{c.sentence}</Text>
        <ChangeBadge change={c.change} lowerIsBetter={metric.id === "heart-rate"} />
      </HStack>
      <Divider />
      {[
        { row: c.current, color: metric.color },
        { row: c.previous, color: "systemGray3" as const },
      ].map(({ row, color }) => (
        <VStack key={row.label} alignment="leading" spacing={4}>
          <HStack>
            <Text font="caption" fontWeight="semibold" foregroundStyle="secondary">{row.label.toUpperCase()}</Text>
            <Spacer />
            <Text font="caption" fontWeight="semibold" monospacedDigit animation="snappy">{row.text}</Text>
          </HStack>
          {/* A proportional bar without measuring: ProgressView (its thickness isn't adjustable). */}
          <ProgressView value={row.value / max} tint={color} animation="smooth" />
        </VStack>
      ))}
    </Card>
  );
}

/** Average time per stage, as one stacked bar and a list. */
function StagesCard({ range }: { range: Range }) {
  const stages = stageBreakdown(range);
  const [width, setWidth] = useState(0);
  return (
    <Card accessibilityIdentifier="sleep-stages">
      <Text font="headline">Sleep Stages</Text>
      {/* Proportional widths need the row's width (no GeometryReader / relative frames inside a card). */}
      <HStack spacing={2} frame={{ maxWidth: "infinity", height: 14 }} onLayout={(s) => setWidth(s.width)}>
        {stages.map((s) => (
          <RoundedRectangle
            key={s.stage}
            cornerRadius={3}
            fill={STAGE_COLORS[s.stage]}
            frame={{ width: Math.max(0, s.share * (width - 2 * stages.length)), height: 14 }}
            animation="smooth"
          />
        ))}
        <Spacer minLength={0} />
      </HStack>
      {stages.map((s) => (
        <HStack key={s.stage} spacing={8} accessibilityElement="combine">
          <Circle fill={STAGE_COLORS[s.stage]} frame={{ width: 10, height: 10 }} />
          <Text font="subheadline">{STAGE_NAMES[s.stage]}</Text>
          <Spacer />
          <Text font="subheadline" foregroundStyle="secondary" monospacedDigit>{hoursMinutes(s.minutes)}</Text>
          <Text font="subheadline" fontWeight="semibold" monospacedDigit frame={{ width: 44, alignment: "trailing" }}>
            {Math.round(s.share * 100)}%
          </Text>
        </HStack>
      ))}
    </Card>
  );
}
