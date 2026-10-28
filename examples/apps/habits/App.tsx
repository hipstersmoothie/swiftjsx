// Habits: a habit tracker with a calendar. A paging week strip of daily
// rings, tap-to-complete rings (count habits go up one per tap; touch and
// hold to undo), per-habit month calendars, a six-month heatmap and weekly
// charts on Swift Charts, streaks for daily, weekday and N-times-a-week
// schedules, and a validated create/edit form. Weeks start on the locale's
// first weekday; history is keyed by calendar day, so DST and time zone
// changes don't move check-ins. Persisted with zustand + localStorage.
import { Navigator } from "swiftjsx";
import { TodayScreen } from "./TodayScreen";

export function HabitsApp() {
  return (
    <Navigator>
      <TodayScreen />
    </Navigator>
  );
}
