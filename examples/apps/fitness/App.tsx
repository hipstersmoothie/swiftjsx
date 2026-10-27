// Fitness: an Apple Fitness / Health-style dashboard over a year of seeded
// fake data. Activity rings that lap past 100%, a week of mini rings, trend
// cards with sparklines, and per-metric charts (bars, heart-rate ranges with
// an average line, stacked sleep stages, a sleep hypnogram) with a D/W/M/6M
// picker and worklet-driven scrubbing. Plus a workouts log with zone-colored
// heart rate, zones and splits.
import { TabView, Tab, Navigator } from "swiftjsx";
import { SummaryScreen } from "./Summary";
import { WorkoutsScreen } from "./Workouts";

export function FitnessApp() {
  return (
    // Like the Fitness app: always dark (the ring colors are made for black).
    <TabView colorScheme="dark">
      <Tab title="Summary" systemImage="circle.circle" value="summary">
        <Navigator>
          <SummaryScreen />
        </Navigator>
      </Tab>
      <Tab title="Workouts" systemImage="figure.run" value="workouts">
        <Navigator>
          <WorkoutsScreen />
        </Navigator>
      </Tab>
    </TabView>
  );
}
