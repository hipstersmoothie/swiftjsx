// Playback state (a zustand store) and the actions that drive it. The audio
// backend and the lock-screen controls are created on first play and torn
// down when the app unmounts (`shutdownPlayer`).
import { create } from "zustand";
import type { Track } from "./api";
import { createAudio, type AudioBackend } from "./audio";
import { createSystemControls, type SystemControls } from "./system";
import { useLibrary } from "./library";

export type Repeat = "off" | "all" | "one";

type PlayerState = {
  queue: Track[];
  /** Index of the current track in `queue`, or -1. */
  index: number;
  /** Where the queue came from ("Search", an album's name…). */
  source: string;
  /** What the user asked for (stays true while buffering). */
  playing: boolean;
  buffering: boolean;
  position: number;
  duration: number;
  repeat: Repeat;
  error: string | null;
  /** "simulated" when there's no native backend: everything works, silently. */
  backend: "native" | "simulated" | null;
};

const initial: PlayerState = {
  queue: [],
  index: -1,
  source: "",
  playing: false,
  buffering: false,
  position: 0,
  duration: 30,
  repeat: "off",
  error: null,
  backend: null,
};

export const usePlayer = create<PlayerState>(() => initial);

export const useCurrentTrack = () => usePlayer((s) => (s.index >= 0 ? s.queue[s.index] : undefined));

let audio: AudioBackend | null = null;
let system: SystemControls | null = null;

function engine(): AudioBackend {
  if (audio) return audio;
  audio = createAudio({
    onProgress(position, duration, buffering) {
      const s = usePlayer.getState();
      // A finite duration from AVPlayer replaces the 30 s guess; tell the lock screen once.
      const known = Number.isFinite(duration) && duration > 0;
      const durationChanged = known && Math.abs(duration - s.duration) > 0.5;
      usePlayer.setState({ position, buffering: buffering && s.playing, ...(known ? { duration } : null) });
      if (durationChanged) syncSystem();
    },
    onEnded: () => advance(true),
    onError: (message) => {
      usePlayer.setState({ error: message, playing: false, buffering: false });
      syncSystem();
    },
  });
  audio.setVolume(useLibrary.getState().volume);
  usePlayer.setState({ backend: audio.kind });
  system = safely(() => createSystemControls({
    play,
    pause,
    toggle: togglePlay,
    next: () => advance(false),
    previous,
    seek,
    interrupted(began, shouldResume) {
      if (began) {
        usePlayer.setState({ playing: false });
        syncSystem();
      } else if (shouldResume) {
        play();
      }
    },
  }));
  return audio;
}

/** Lock-screen controls are a nicety: if setting them up throws, play anyway. */
function safely<T>(make: () => T | null): T | null {
  try {
    return make();
  } catch (error) {
    console.warn("Now Playing / remote commands unavailable:", error);
    return null;
  }
}

function syncSystem() {
  const s = usePlayer.getState();
  const track = s.queue[s.index];
  if (track) system?.update({ track, position: s.position, duration: s.duration, playing: s.playing });
}

function start(index: number, autoplay = true) {
  const { queue } = usePlayer.getState();
  const track = queue[index];
  if (!track) return;
  usePlayer.setState({ index, position: 0, duration: 30, playing: autoplay, buffering: autoplay, error: null });
  engine().load(track.previewUrl, autoplay);
  useLibrary.getState().addPlayed(track);
  syncSystem();
}

/** Replace the queue with `tracks` and play `tracks[index]`. */
export function playTracks(tracks: Track[], index = 0, source = "") {
  if (!tracks.length) return;
  usePlayer.setState({ queue: tracks, source });
  start(index);
}

export function shuffleTracks(tracks: Track[], source = "") {
  playTracks(shuffled(tracks), 0, source);
}

export function play() {
  const s = usePlayer.getState();
  if (s.index < 0) return;
  // At the end of the last track: start it over.
  if (s.position >= s.duration - 0.3) void seek(0);
  usePlayer.setState({ playing: true, error: null });
  engine().play();
  syncSystem();
}

export function pause() {
  usePlayer.setState({ playing: false, buffering: false });
  audio?.pause();
  syncSystem();
}

export function togglePlay() {
  usePlayer.getState().playing ? pause() : play();
}

/** Next track; `auto` when the current one finished by itself. */
export function advance(auto = false) {
  const { index, queue, repeat } = usePlayer.getState();
  if (auto && repeat === "one") return void seek(0).then(play);
  if (index + 1 < queue.length) return start(index + 1);
  if (repeat === "all" && queue.length) return start(0);
  // End of the queue: stop on the last track, ready to play it again.
  usePlayer.setState({ playing: false, buffering: false, position: auto ? usePlayer.getState().duration : usePlayer.getState().position });
  audio?.pause();
  syncSystem();
}

export function previous() {
  const { index, position } = usePlayer.getState();
  if (position > 3 || index <= 0) return void seek(0);
  start(index - 1, true);
}

export function seek(seconds: number): Promise<void> {
  if (usePlayer.getState().index < 0) return Promise.resolve();
  usePlayer.setState({ position: seconds });
  return engine()
    .seek(seconds)
    .then(syncSystem);
}

export function setVolume(volume: number) {
  useLibrary.getState().setVolume(volume);
  audio?.setVolume(volume);
}

export function cycleRepeat() {
  usePlayer.setState(({ repeat }) => ({ repeat: repeat === "off" ? "all" : repeat === "all" ? "one" : "off" }));
}

export function jumpTo(index: number) {
  start(index);
}

/** Insert right after the current track. */
export function playNext(track: Track) {
  const { queue, index } = usePlayer.getState();
  if (index < 0) return playTracks([track], 0, "Up Next");
  usePlayer.setState({ queue: [...queue.slice(0, index + 1), track, ...queue.slice(index + 1)] });
}

export function addToQueue(track: Track) {
  const { queue, index } = usePlayer.getState();
  if (index < 0) return playTracks([track], 0, "Up Next");
  usePlayer.setState({ queue: [...queue, track] });
}

export function removeFromQueue(at: number) {
  const { queue, index } = usePlayer.getState();
  if (at === index) return;
  usePlayer.setState({ queue: queue.filter((_, i) => i !== at), index: at < index ? index - 1 : index });
}

export function clearUpcoming() {
  const { queue, index } = usePlayer.getState();
  usePlayer.setState({ queue: queue.slice(0, index + 1) });
}

export function shuffleUpcoming() {
  const { queue, index } = usePlayer.getState();
  usePlayer.setState({ queue: [...queue.slice(0, index + 1), ...shuffled(queue.slice(index + 1))] });
}

/** Stop and release everything native (the app was closed). */
export function shutdownPlayer() {
  system?.dispose();
  audio?.dispose();
  system = null;
  audio = null;
  usePlayer.setState(initial);
}

function shuffled<T>(items: T[]): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

// Fast Refresh re-runs every module of the bundle, so this file's `audio`
// would start over as null while the old AVPlayer kept playing (and its
// observers kept firing into the old store). Stop the previous instance.
const host = globalThis as { __musicShutdown?: () => void };
host.__musicShutdown?.();
host.__musicShutdown = shutdownPlayer;
