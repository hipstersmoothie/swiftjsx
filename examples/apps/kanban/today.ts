// The start of today (ms), kept current across midnight and app launches.
import { useSyncExternalStore } from "react";
import { startOfToday, startOfTomorrow } from "date-fns";

function subscribe(onChange: () => void) {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const schedule = () => {
    timer = setTimeout(() => {
      onChange();
      schedule();
    }, startOfTomorrow().getTime() - Date.now() + 1000);
  };
  schedule();
  addEventListener("visibilitychange", onChange);
  return () => {
    clearTimeout(timer);
    removeEventListener("visibilitychange", onChange);
  };
}

export const useToday = () => useSyncExternalStore(subscribe, () => startOfToday().getTime());
