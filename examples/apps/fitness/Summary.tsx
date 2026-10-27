// The Summary tab: today's rings, the week at a glance, today's numbers,
// trends with sparklines, and recent workouts.
import { format } from "date-fns";
import {
  Screen, ScrollView, VStack, HStack, LazyVGrid, Text, Image, Button, Spacer, Divider, useNavigation, type Color,
} from "swiftjsx";
import { getData, GOALS } from "./data";
import { METRICS, METRIC_ORDER, series, thisWeek, trend, mean, type MetricId } from "./model";
import { ActivityRings, RING_LABELS } from "./ActivityRings";
import { Chart, Sparkline } from "./Chart";
import { MetricScreen } from "./MetricScreen";
import { WorkoutRow, WorkoutScreen, WorkoutsScreen } from "./Workouts";
import { Card, CardHeader, ChangeBadge, SectionTitle, ValueText } from "./ui";
import { decimal, int } from "./format";

export function SummaryScreen() {
  const nav = useNavigation();
  const { days, workouts, today } = getData();
  const day = days[days.length - 1];
  const open = (id: MetricId) => nav.push(<MetricScreen metricId={id} />);

  return (
    <Screen title="Summary">
      <ScrollView background="systemGroupedBackground">
        <VStack alignment="leading" spacing={14} padding={{ horizontal: 16, bottom: 32 }}>
          <Text font="footnote" fontWeight="semibold" foregroundStyle="secondary" textCase="uppercase" padding={{ horizontal: 4 }}>
            {format(today, "EEEE, MMM d")}
          </Text>

          <ActivityCard onOpen={open} />
          <WeekCard />

          <SectionTitle title="Today" />
          <LazyVGrid columns={2} spacing={12}>
            <TodayTile icon="figure.walk" color="orange" title="Steps" value={int(day.steps)} unit="" onPress={() => open("steps")} />
            <TodayTile icon="point.topleft.down.to.point.bottomright.curvepath" color="orange" title="Distance" value={decimal(day.distanceKm, 2)} unit="km" onPress={() => open("steps")} />
            <TodayTile icon="figure.stairs" color="orange" title="Flights Climbed" value={`${day.flights}`} unit="floors" />
            <TodayTile icon="heart.fill" color="#FF375F" title="Resting Rate" value={`${day.restingHR}`} unit="BPM" onPress={() => open("heart-rate")} />
          </LazyVGrid>

          <StepsThisWeek onPress={() => open("steps")} />

          <SectionTitle title="Trends" />
          <Text font="footnote" foregroundStyle="secondary" padding={{ horizontal: 4 }} frame={{ maxWidth: "infinity", alignment: "leading" }}>
            Your last 90 days compared to your 365-day average. Tap a card for details.
          </Text>
          {METRIC_ORDER.map((id) => (
            <MetricCard key={id} id={id} onPress={() => open(id)} />
          ))}

          <SectionTitle
            title="Workouts"
            action={<Button title="Show More" buttonStyle="borderless" onPress={() => nav.push(<WorkoutsScreen pushed />)} />}
          />
          <Card spacing={0} padding={{ horizontal: 16, vertical: 4 }}>
            {workouts.slice(0, 3).map((w, i) => (
              <VStack key={w.id} spacing={0}>
                {i > 0 ? <Divider padding={{ leading: 52 }} /> : null}
                <Button buttonStyle="plain" onPress={() => nav.push(<WorkoutScreen workoutId={w.id} />)} accessibilityIdentifier="recent-workout">
                  <WorkoutRow workout={w} />
                </Button>
              </VStack>
            ))}
          </Card>
        </VStack>
      </ScrollView>
    </Screen>
  );
}

function ActivityCard({ onOpen }: { onOpen: (id: MetricId) => void }) {
  const { days } = getData();
  const day = days[days.length - 1];
  const values = { move: day.energy, exercise: day.exercise, stand: day.stand };
  const goals = { move: GOALS.move, exercise: GOALS.exercise, stand: GOALS.stand };
  const targets: Record<string, MetricId> = { move: "energy", exercise: "exercise", stand: "stand" };

  return (
    // The rings are made for black: force dark mode on this card.
    <HStack spacing={20} padding={18} background="black" cornerRadius={20} colorScheme="dark" frame={{ maxWidth: "infinity" }}>
      <ActivityRings
        move={values.move / goals.move}
        exercise={values.exercise / goals.exercise}
        stand={values.stand / goals.stand}
        size={150}
        accessibilityIdentifier="activity-rings"
      />
      <VStack alignment="leading" spacing={10}>
        {RING_LABELS.map((ring) => (
          <Button key={ring.key} buttonStyle="plain" onPress={() => onOpen(targets[ring.key])} accessibilityIdentifier={`ring-${ring.key}`}>
            <VStack alignment="leading" spacing={0}>
              <Text font="subheadline" fontWeight="semibold" foregroundStyle="white">{ring.title}</Text>
              <Text font={{ size: 22, weight: "semibold", design: "rounded" }} foregroundStyle={ring.color} monospacedDigit>
                {values[ring.key]}/{goals[ring.key]}
                <Text font={{ size: 15, weight: "semibold", design: "rounded" }}>{ring.unit}</Text>
              </Text>
            </VStack>
          </Button>
        ))}
      </VStack>
      <Spacer minLength={0} />
    </HStack>
  );
}

/** Mini rings for each day of this week, Monday first. */
function WeekCard() {
  const week = thisWeek();
  const { today } = getData();
  const closed = week.filter((d) => d && d.energy >= GOALS.move && d.exercise >= GOALS.exercise && d.stand >= GOALS.stand).length;
  return (
    <Card>
      <HStack>
        <Text font="headline" foregroundStyle="white">This Week</Text>
        <Spacer />
        <Text font="footnote" foregroundStyle="secondary">{closed ? `All rings closed on ${closed} ${closed === 1 ? "day" : "days"}` : "Close your rings"}</Text>
      </HStack>
      <HStack spacing={0}>
        {week.map((d, i) => {
          const isToday = d !== null && d.date.getTime() === today.getTime();
          return (
            <VStack key={i} spacing={6} frame={{ maxWidth: "infinity" }}>
              <Text font="caption2" fontWeight="bold" foregroundStyle={isToday ? "white" : "secondary"}>
                {["M", "T", "W", "T", "F", "S", "S"][i]}
              </Text>
              {/* Days still to come: empty tracks. */}
              <ActivityRings
                move={d ? d.energy / GOALS.move : 0}
                exercise={d ? d.exercise / GOALS.exercise : 0}
                stand={d ? d.stand / GOALS.stand : 0}
                size={36}
              />
            </VStack>
          );
        })}
      </HStack>
    </Card>
  );
}

function TodayTile({ icon, color, title, value, unit, onPress }: { icon: string; color: Color; title: string; value: string; unit: string; onPress?: () => void }) {
  const tile = (
    <VStack alignment="leading" spacing={6} padding={14} frame={{ maxWidth: "infinity", alignment: "leading" }} background="secondarySystemGroupedBackground" cornerRadius={16}>
      <HStack spacing={5}>
        <Image systemName={icon} font="caption" foregroundStyle={color} />
        <Text font="caption" fontWeight="semibold" foregroundStyle={color} lineLimit={1}>{title}</Text>
      </HStack>
      <ValueText value={value} unit={unit} size={24} />
    </VStack>
  );
  if (!onPress) return <VStack accessibilityElement="combine">{tile}</VStack>;
  return (
    <Button buttonStyle="plain" onPress={onPress} accessibilityElement="combine">
      {tile}
    </Button>
  );
}

function StepsThisWeek({ onPress }: { onPress: () => void }) {
  const metric = METRICS.steps;
  const data = series(metric, "W");
  const average = mean(data.points.map((p) => p.value));
  return (
    <Button buttonStyle="plain" onPress={onPress} accessibilityIdentifier="steps-week-card">
      <Card>
        <CardHeader icon={metric.icon} title="Steps This Week" color={metric.color} trailing="Daily avg." />
        <HStack alignment="firstTextBaseline">
          <ValueText value={int(average)} unit="steps" size={26} />
          <Spacer />
          <Text font="caption" foregroundStyle="secondary">Goal {int(GOALS.steps)}</Text>
        </HStack>
        <Chart data={data} height={120} animateOnAppear accessibilityLabel={`Steps over the last 7 days, averaging ${int(average)} a day`} />
      </Card>
    </Button>
  );
}

function MetricCard({ id, onPress }: { id: MetricId; onPress: () => void }) {
  const metric = METRICS[id];
  const t = trend(metric);
  const latestCaption = id === "sleep" ? "Last night" : id === "heart-rate" ? "Resting, today" : "Today";
  return (
    <Button buttonStyle="plain" onPress={onPress} accessibilityIdentifier={`metric-${id}`} accessibilityHint={`Shows ${metric.title.toLowerCase()} charts`}>
      <Card spacing={10}>
        <CardHeader icon={metric.icon} title={metric.title} color={metric.color} trailing={latestCaption} />
        <HStack alignment="bottom" spacing={12}>
          <VStack alignment="leading" spacing={4}>
            <ValueText value={metric.text(t.latest)} unit={id === "sleep" ? "" : metric.unit} size={26} />
            <HStack spacing={6}>
              <ChangeBadge change={t.change} lowerIsBetter={id === "heart-rate"} />
              <Text font="caption" foregroundStyle="secondary" lineLimit={1}>
                90-day avg. {metric.text(t.recent)}
                {id === "sleep" ? "" : ` ${metric.unit}`}
              </Text>
            </HStack>
          </VStack>
          <Spacer minLength={0} />
          <Sparkline values={t.weekly} color={metric.color} />
          <Image systemName="chevron.right" font="footnote" fontWeight="semibold" foregroundStyle="tertiary" />
        </HStack>
      </Card>
    </Button>
  );
}
