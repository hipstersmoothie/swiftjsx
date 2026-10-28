// Fast Refresh re-runs your whole app bundle: React Refresh keeps component
// state, but module-level things are created again (stores reset; timers,
// sockets and native objects from the old run keep going). `hot` handles
// both, like `import.meta.hot`:
//
//   export const useStore = (hot.data.store ??= create(...));   // survives updates
//   const player = native.AVPlayer.new();
//   hot.dispose(() => player.pause());                          // before the next update
//
// In production bundles there are no updates: `data` is a plain object and
// `dispose` callbacks never run.

const g = globalThis as any;
const state: { data: Record<string, any>; dispose: (() => void)[] } = (g.__swiftjsx_hot ??= { data: {}, dispose: [] });

g.__swiftjsx_beforeHotUpdate = () => {
  const callbacks = state.dispose.splice(0);
  for (const callback of callbacks) {
    try {
      callback();
    } catch (error) {
      console.error(error instanceof Error ? `${error.message}\n${error.stack}` : String(error));
    }
  }
};

export const hot = {
  /** Kept across hot updates (the same object every run). */
  data: state.data,
  /** Runs once, right before the next hot update re-runs the bundle. */
  dispose(callback: () => void) {
    state.dispose.push(callback);
  },
};
