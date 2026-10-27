// Workouts: the last 90 days by month with a weekly-minutes chart and a type
// filter, and each workout's details, heart rate (colored by zone), zones
// and splits.
import { useState } from "react";
import { addDays, addMinutes, differenceInCalendarDays, format, startOfWeek } from "date-fns";
import {
  Screen, ScrollView, LazyVStack, VStack, HStack, LazyVGrid, Text, Image, Button, Spacer, Divider, ProgressView,
  useNavigation, withAnimation, haptic, type Color,
} from "swiftjsx";
import { getData, workoutHeartRate, workoutSplits, type Workout, type WorkoutType } from "./data";
import { WORKOUTS, ZONES, MAX_HR, zoneOf } from "./theme";
import { mean, type ChartData } from "./model";
import { Chart, Legend } from "./Chart";
import { Card, SectionTitle, ValueText } from "./ui";
import { clock, decimal, hoursMinutes, int, pace, relativeDay, time } from "./format";

const RECENT_DAYS = 90;
const TYPES = Object.keys(WORKOUTS) as WorkoutType[];

function recentWorkouts() {
  const { workouts, today } = getData();
  return workouts.filter((w) => differenceInCalendarDays(today, w.start) < RECENT_DAYS);
}

/** The primary number of a workout: its distance, or its energy. */
function primaryValue(w: Workout) {
  if (w.distanceKm && w.type === "swim") return { value: int(w.distanceKm * 1000), unit: "M" };
  if (w.distanceKm) return { value: decimal(w.distanceKm, 2), unit: "KM" };
  return { value: int(w.energy), unit: "CAL" };
}

export function WorkoutIcon({ type, size = 40 }: { type: WorkoutType; size?: number }) {
  const meta = WORKOUTS[type];
  return (
    <Image
      systemName={meta.icon}
      font={{ size: size * 0.48, weight: "semibold" }}
      foregroundStyle={meta.color}
      frame={{ width: size, height: size }}
      background={`${meta.color}2E` as Color}
      cornerRadius="capsule"
      accessibilityHidden
    />
  );
}

export function WorkoutRow({ workout }: { workout: Workout }) {
  const meta = WORKOUTS[workout.type];
  const main = primaryValue(workout);
  return (
    <HStack spacing={12} padding={{ vertical: 10 }} frame={{ maxWidth: "infinity" }} contentShape="rectangle" accessibilityElement="combine">
      <WorkoutIcon type={workout.type} />
      <VStack alignment="leading" spacing={1}>
        <Text font="subheadline" fontWeight="medium" foregroundStyle="primary">{meta.name}</Text>
        <Text font={{ size: 24, weight: "semibold", design: "rounded" }} foregroundStyle={meta.color} monospacedDigit>
          {main.value}
          <Text font={{ size: 16, weight: "semibold", design: "rounded" }}>{main.unit}</Text>
        </Text>
      </VStack>
      <Spacer />
      <VStack alignment="trailing" spacing={2}>
        <Text font="footnote" foregroundStyle="secondary">{relativeDay(workout.start, getData().today)}</Text>
        <Text font="caption" foregroundStyle="tertiary" monospacedDigit>{hoursMinutes(workout.minutes)}</Text>
      </VStack>
      <Image systemName="chevron.right" font="footnote" fontWeight="semibold" foregroundStyle="tertiary" />
    </HStack>
  );
}

/** Minutes per week (13 weeks), stacked by workout type. */
function weeklyMinutes(workouts: Workout[]): ChartData {
  const { today } = getData();
  const thisMonday = startOfWeek(today, { weekStartsOn: 1 });
  const points = [];
  for (let w = 12; w >= 0; w--) {
    const from = addDays(thisMonday, -7 * w);
    const to = addDays(from, 7);
    const inWeek = workouts.filter((x) => x.start >= from && x.start < to);
    const parts = TYPES.map((type) => inWeek.filter((x) => x.type === type).reduce((a, x) => a + x.minutes, 0) / 60);
    points.push({
      label: `${format(from, "MMM d")} – ${format(addDays(to, -1), "MMM d")}`,
      axis: w % 4 === 0 ? format(from, "MMM d") : undefined,
      value: parts.reduce((a, b) => a + b, 0),
      parts,
    });
  }
  return { kind: "stacked", color: "green", points, partColors: TYPES.map((t) => WORKOUTS[t].color) };
}

export function WorkoutsScreen({ pushed = false }: { pushed?: boolean }) {
  const nav = useNavigation();
  const [filter, setFilter] = useState<WorkoutType | "all">("all");
  const [selected, setSelected] = useState<number | null>(null);
  const all = recentWorkouts();
  const workouts = filter === "all" ? all : all.filter((w) => w.type === filter);
  const chart = weeklyMinutes(workouts);
  const totalMinutes = workouts.reduce((a, w) => a + w.minutes, 0);
  const point = selected === null ? null : chart.points[selected];

  // Group by month, newest first.
  const months: { title: string; items: Workout[] }[] = [];
  for (const w of workouts) {
    const title = format(w.start, "MMMM yyyy");
    if (months[months.length - 1]?.title !== title) months.push({ title, items: [] });
    months[months.length - 1].items.push(w);
  }

  return (
    <Screen title="Workouts" titleDisplayMode={pushed ? "inline" : "large"}>
      <ScrollView background="systemGroupedBackground">
        <LazyVStack alignment="leading" spacing={14} padding={{ horizontal: 16, bottom: 32 }}>
          <Card>
            <VStack alignment="leading" spacing={2} accessibilityElement="combine">
              <Text font="caption" fontWeight="semibold" foregroundStyle="secondary">{point ? "WEEK" : "AVG. PER WEEK"}</Text>
              <ValueText value={hoursMinutes((point ? point.value * 60 : totalMinutes / 13))} unit="" size={28} />
              <Text font="subheadline" fontWeight="medium" foregroundStyle="secondary">
                {point ? point.label : `${workouts.length} workouts · ${int(workouts.reduce((a, w) => a + w.energy, 0))} kcal · last 90 days`}
              </Text>
            </VStack>
            <Chart
              data={chart}
              height={150}
              selected={selected}
              onSelect={(i) => {
                setSelected(i);
                if (i !== null) haptic("selection");
              }}
              yLabel={(v) => `${v}h`}
              accessibilityLabel={`Workout hours per week for the last 13 weeks, ${hoursMinutes(totalMinutes / 13)} on average`}
              accessibilityIdentifier="workouts-chart"
            />
          </Card>

          {/* Type filter */}
          <ScrollView axis="horizontal" showsIndicators={false}>
            <HStack spacing={8} padding={{ vertical: 2 }}>
              <FilterChip title="All" active={filter === "all"} color="green" onPress={() => withAnimation("snappy", () => setFilter("all"))} />
              {TYPES.filter((t) => all.some((w) => w.type === t)).map((t) => (
                <FilterChip key={t} title={WORKOUTS[t].name.replace("Outdoor ", "").replace("Pool ", "")} icon={WORKOUTS[t].icon} active={filter === t} color={WORKOUTS[t].color} onPress={() => withAnimation("snappy", () => setFilter(t))} />
              ))}
            </HStack>
          </ScrollView>

          {months.map((month) => (
            <VStack key={month.title} alignment="leading" spacing={8}>
              <SectionTitle title={month.title} />
              <Card spacing={0} padding={{ horizontal: 16, vertical: 2 }}>
                {month.items.map((w, i) => (
                  <VStack key={w.id} spacing={0} transition="opacity">
                    {i > 0 ? <Divider padding={{ leading: 52 }} /> : null}
                    <Button buttonStyle="plain" onPress={() => nav.push(<WorkoutScreen workoutId={w.id} />)} accessibilityIdentifier="workout-row">
                      <WorkoutRow workout={w} />
                    </Button>
                  </VStack>
                ))}
              </Card>
            </VStack>
          ))}
          {!months.length ? (
            <Text foregroundStyle="secondary" frame={{ maxWidth: "infinity" }} padding={24}>No workouts of this type in the last 90 days.</Text>
          ) : null}
        </LazyVStack>
      </ScrollView>
    </Screen>
  );
}

function FilterChip({ title, icon, active, color, onPress }: { title: string; icon?: string; active: boolean; color: Color; onPress: () => void }) {
  return (
    <Button buttonStyle="plain" onPress={onPress} accessibilityTraits={active ? ["button", "selected"] : "button"}>
      <HStack
        spacing={5}
        padding={{ horizontal: 12, vertical: 7 }}
        background={active ? color : "tertiarySystemFill"}
        cornerRadius="capsule"
      >
        {icon ? <Image systemName={icon} font="caption" foregroundStyle={active ? "black" : color} /> : null}
        <Text font="subheadline" fontWeight="semibold" foregroundStyle={active ? "black" : "primary"}>{title}</Text>
      </HStack>
    </Button>
  );
}

// MARK: Detail

export function WorkoutScreen({ workoutId }: { workoutId: string }) {
  const workout = getData().workouts.find((w) => w.id === workoutId)!;
  const meta = WORKOUTS[workout.type];
  const end = addMinutes(workout.start, workout.minutes);

  return (
    <Screen title={format(workout.start, "EEE, MMM d")} titleDisplayMode="inline">
      <ScrollView background="systemGroupedBackground">
        <VStack alignment="leading" spacing={16} padding={{ horizontal: 16, top: 8, bottom: 32 }}>
          <HStack spacing={14} accessibilityElement="combine">
            <WorkoutIcon type={workout.type} size={64} />
            <VStack alignment="leading" spacing={2}>
              <Text font="title2" fontWeight="bold">{meta.name}</Text>
              <Text font="subheadline" foregroundStyle="secondary" monospacedDigit>{time(workout.start)} – {time(end)}</Text>
              <HStack spacing={4}>
                <Image systemName="location.fill" font="caption" foregroundStyle="secondary" />
                <Text font="caption" foregroundStyle="secondary">{workout.type === "swim" ? "Indoor pool" : workout.type === "yoga" || workout.type === "strength" || workout.type === "hiit" ? "Indoor" : "Golden Gate Park"}</Text>
              </HStack>
            </VStack>
          </HStack>

          <SectionTitle title="Workout Details" />
          <Card>
            <LazyVGrid columns={2} spacing={16}>
              {details(workout).map((d) => (
                <VStack key={d.title} alignment="leading" spacing={2} frame={{ maxWidth: "infinity", alignment: "leading" }} accessibilityElement="combine">
                  <Text font="caption" foregroundStyle="secondary">{d.title}</Text>
                  <ValueText value={d.value} unit={d.unit} size={24} color={d.color} />
                </VStack>
              ))}
            </LazyVGrid>
          </Card>

          <HeartRateCard workout={workout} />
          <ZonesCard workout={workout} />
          <SplitsCard workout={workout} />
        </VStack>
      </ScrollView>
    </Screen>
  );
}

function details(w: Workout): { title: string; value: string; unit: string; color: Color }[] {
  const seconds = w.minutes * 60 + (w.seed % 60);
  const out: { title: string; value: string; unit: string; color: Color }[] = [
    { title: "Workout Time", value: clock(seconds), unit: "", color: "yellow" },
  ];
  if (w.distanceKm) {
    out.push(w.type === "swim" ? { title: "Distance", value: int(w.distanceKm * 1000), unit: "M", color: "cyan" } : { title: "Distance", value: decimal(w.distanceKm, 2), unit: "KM", color: "cyan" });
  }
  out.push({ title: "Active Calories", value: int(w.energy), unit: "CAL", color: "pink" });
  out.push({ title: "Total Calories", value: int(w.energy + w.minutes * 1.25), unit: "CAL", color: "pink" });
  out.push({ title: "Avg. Heart Rate", value: `${w.avgHR}`, unit: "BPM", color: "red" });
  out.push({ title: "Max Heart Rate", value: `${w.maxHR}`, unit: "BPM", color: "red" });
  if (w.distanceKm && (w.type === "run" || w.type === "walk")) out.push({ title: "Avg. Pace", value: pace(seconds / w.distanceKm), unit: "/KM", color: "cyan" });
  if (w.distanceKm && w.type === "cycle") out.push({ title: "Avg. Speed", value: decimal(w.distanceKm / (seconds / 3600), 1), unit: "KM/H", color: "cyan" });
  if (w.distanceKm && w.type === "swim") out.push({ title: "Avg. Pace", value: pace(seconds / (w.distanceKm * 10)), unit: "/100M", color: "cyan" });
  if (w.elevation) out.push({ title: "Elevation Gain", value: `${w.elevation}`, unit: "M", color: "green" });
  if (w.type === "run") out.push({ title: "Avg. Cadence", value: `${158 + (w.seed % 14)}`, unit: "SPM", color: "teal" });
  return out;
}

function HeartRateCard({ workout }: { workout: Workout }) {
  const [selected, setSelected] = useState<number | null>(null);
  const hr = workoutHeartRate(workout);
  const tick = workout.minutes > 40 ? 15 : 10;
  const data: ChartData = {
    kind: "line",
    color: "red",
    points: hr.map((bpm, m) => ({ label: `${m} min · ${time(addMinutes(workout.start, m))}`, axis: m % tick === 0 ? `${m}m` : undefined, value: bpm })),
    pointColors: hr.map((bpm) => ZONES[zoneOf(bpm)].color),
  };
  const point = selected === null ? null : data.points[selected];
  return (
    <>
      <SectionTitle title="Heart Rate" />
      <Card>
        <VStack alignment="leading" spacing={2} accessibilityElement="combine">
          <Text font="caption" fontWeight="semibold" foregroundStyle="secondary">{point ? "HEART RATE" : "AVERAGE"}</Text>
          <ValueText value={`${point ? point.value : Math.round(mean(hr))}`} unit="BPM" size={28} color={point ? ZONES[zoneOf(point.value)].color : undefined} />
          <Text font="subheadline" fontWeight="medium" foregroundStyle="secondary">{point ? point.label : `${Math.min(...hr)}–${Math.max(...hr)} BPM range`}</Text>
        </VStack>
        <Chart
          data={data}
          height={170}
          selected={selected}
          onSelect={(i) => {
            setSelected(i);
            if (i !== null && (selected === null || zoneOf(hr[i]) !== zoneOf(hr[selected]))) haptic("selection");
          }}
          accessibilityLabel={`Heart rate during the workout, averaging ${Math.round(mean(hr))} beats per minute`}
          accessibilityIdentifier="workout-heart-rate"
        />
        <Legend items={ZONES.map((z, i) => ({ name: `${i + 1}`, color: z.color }))} />
      </Card>
    </>
  );
}

function ZonesCard({ workout }: { workout: Workout }) {
  const hr = workoutHeartRate(workout);
  const minutes = ZONES.map((_, i) => hr.filter((bpm) => zoneOf(bpm) === i).length);
  const most = Math.max(...minutes, 1);
  return (
    <>
      <SectionTitle title="Heart Rate Zones" />
      <Card spacing={14}>
        {ZONES.map((zone, i) => {
          const lo = Math.round(zone.from * MAX_HR);
          const hi = i + 1 < ZONES.length ? Math.round(ZONES[i + 1].from * MAX_HR) - 1 : null;
          return (
            <VStack key={zone.name} alignment="leading" spacing={5} accessibilityElement="combine">
              <HStack>
                <Text font="subheadline" fontWeight="semibold" foregroundStyle={zone.color}>{zone.name}</Text>
                <Text font="caption" foregroundStyle="secondary">{i === 0 ? `< ${hi! + 1}` : hi ? `${lo}–${hi}` : `${lo}+`} BPM</Text>
                <Spacer />
                <Text font="subheadline" fontWeight="semibold" monospacedDigit>{clock(minutes[i] * 60)}</Text>
              </HStack>
              <ProgressView value={minutes[i] / most} tint={zone.color} />
            </VStack>
          );
        })}
      </Card>
    </>
  );
}

function SplitsCard({ workout }: { workout: Workout }) {
  const splits = workoutSplits(workout);
  if (!splits.length) return null;
  const fastest = Math.min(...splits.map((s) => s.seconds));
  const slowest = Math.max(...splits.map((s) => s.seconds));
  return (
    <>
      <SectionTitle title="Splits" />
      <Card spacing={10}>
        <HStack>
          <Text font="caption" fontWeight="semibold" foregroundStyle="secondary" frame={{ width: 34, alignment: "leading" }}>KM</Text>
          <Text font="caption" fontWeight="semibold" foregroundStyle="secondary" frame={{ width: 60, alignment: "leading" }}>PACE</Text>
          <Spacer />
          <Text font="caption" fontWeight="semibold" foregroundStyle="secondary">HEART RATE</Text>
        </HStack>
        {splits.map((s) => (
          <HStack key={s.km} spacing={8} accessibilityElement="combine">
            <Text font="subheadline" fontWeight="semibold" monospacedDigit frame={{ width: 34, alignment: "leading" }}>{s.km}</Text>
            <Text font="subheadline" monospacedDigit foregroundStyle={s.seconds === fastest ? "cyan" : "primary"} frame={{ width: 60, alignment: "leading" }}>{pace(s.seconds)}</Text>
            {/* Faster splits get longer bars. */}
            <ProgressView value={0.35 + 0.65 * (slowest === fastest ? 1 : (slowest - s.seconds) / (slowest - fastest))} tint={s.seconds === fastest ? "cyan" : "teal"} />
            <Text font="subheadline" monospacedDigit foregroundStyle="secondary" frame={{ width: 64, alignment: "trailing" }}>{s.hr} BPM</Text>
          </HStack>
        ))}
      </Card>
    </>
  );
}
