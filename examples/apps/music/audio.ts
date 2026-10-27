// Two ways to play a preview, behind one interface:
//  - AVPlayer through the native backend (real sound, lock screen, AirPlay…)
//  - a silent clock, when the runtime was created without the native backend,
//    so the whole UI (progress, queue, auto-advance) still works.
//
// Threading: AVPlayer and NSNotificationCenter are fine from the JS thread.
// The time observer and notification blocks below fire on the main thread
// (we ask for the main queue), so they only read a few numbers and hop back to
// the JS thread with setTimeout before touching app state: zustand's `set`
// notifies React, and React must only run on the JS thread.
import { native, isNativeAvailable, type Native } from "swiftjsx";

export type AudioEvents = {
  /** Called a few times a second while playing, and after loads and seeks. */
  onProgress(position: number, duration: number, buffering: boolean): void;
  onEnded(): void;
  onError(message: string): void;
};

export interface AudioBackend {
  readonly kind: "native" | "simulated";
  load(url: string, autoplay: boolean): void;
  play(): void;
  pause(): void;
  seek(seconds: number): Promise<void>;
  setVolume(volume: number): void;
  dispose(): void;
}

/** AVFoundation exists on iOS and macOS; this is false without the native backend. */
export const canPlayAudio = () => isNativeAvailable() && "AVPlayer" in native;

export function createAudio(events: AudioEvents): AudioBackend {
  if (canPlayAudio()) {
    try {
      return nativeAudio(events);
    } catch (error) {
      console.error("AVPlayer setup failed; falling back to silent playback", error);
    }
  }
  return simulatedAudio(events);
}

type AVPlayer = InstanceType<Native["AVPlayer"]>;
type AVPlayerItem = InstanceType<Native["AVPlayerItem"]>;
type NSObject = InstanceType<Native["NSObject"]>;
type CMTime = InstanceType<Native["CMTime"]>;

function nativeAudio(events: AudioEvents): AudioBackend {
  const n = native;
  const center = n.NSNotificationCenter.defaultCenter;
  const player: AVPlayer = n.AVPlayer.new();
  // One preview at a time; the queue lives in JS.
  player.actionAtItemEnd = n.AVPlayerActionAtItemEnd?.Pause ?? 1;

  let item: AVPlayerItem | null = null;
  let itemObservers: NSObject[] = [];
  let watchdog: number | undefined;
  let disposed = false;

  // Enum objects are there at runtime too; the fallbacks are the SDK values.
  const WAITING = n.AVPlayerTimeControlStatus?.WaitingToPlayAtSpecifiedRate ?? 1;
  const READY = n.AVPlayerItemStatus?.ReadyToPlay ?? 1;
  const FAILED = n.AVPlayerItemStatus?.Failed ?? 2;

  const seconds = (time: CMTime) => n.CMTimeGetSeconds(time);
  const toJS = (fn: () => void) =>
    setTimeout(() => {
      if (!disposed) fn();
    }, 0);
  const describe = (error: { localizedDescription?: string } | null | undefined) =>
    error?.localizedDescription || "This preview couldn't be played.";

  // Snapshot of the player, read on whichever thread we're on.
  const snapshot = () => ({
    position: seconds(player.currentTime()),
    duration: item ? seconds(item.duration) : NaN,
    buffering: player.timeControlStatus === WAITING,
  });

  // Fires every 0.25 s of playback, and when playback starts, stops or jumps.
  // `queue: null` = the main queue, so this block runs on the main thread.
  const timeObserver = player.addPeriodicTimeObserverForIntervalQueueUsingBlock(
    n.CMTimeMakeWithSeconds(0.25, 600),
    null,
    (time) => {
      const position = seconds(time);
      const { duration, buffering } = snapshot();
      toJS(() => events.onProgress(position, duration, buffering));
    },
  );

  // Until the item is ready (or failed), poll its status from the JS thread:
  // nothing else tells us about a load that fails before playback starts (KVO
  // on `status` would need a native NSObject subclass).
  const watch = () => {
    clearInterval(watchdog);
    watchdog = setInterval(() => {
      if (!item) return clearInterval(watchdog);
      const status = item.status;
      if (status === FAILED) {
        clearInterval(watchdog);
        events.onError(describe(item.error));
      } else if (status === READY) {
        clearInterval(watchdog);
        const s = snapshot();
        events.onProgress(s.position, s.duration, s.buffering);
      }
    }, 300);
  };

  const dropItemObservers = () => {
    itemObservers.forEach((token) => center.removeObserver(token));
    itemObservers = [];
  };

  return {
    kind: "native",
    load(url, autoplay) {
      dropItemObservers();
      const next = n.AVPlayerItem.playerItemWithURL(n.NSURL.URLWithString(url));
      item = next;
      const main = n.NSOperationQueue.mainQueue;
      itemObservers = [
        center.addObserverForNameObjectQueueUsingBlock(n.AVPlayerItemDidPlayToEndTimeNotification, next, main, () =>
          toJS(() => events.onEnded()),
        ),
        center.addObserverForNameObjectQueueUsingBlock(n.AVPlayerItemFailedToPlayToEndTimeNotification, next, main, () =>
          toJS(() => events.onError(describe(next.error))),
        ),
      ];
      player.replaceCurrentItemWithPlayerItem(next);
      if (autoplay) player.play();
      watch();
    },
    play() {
      player.play();
    },
    pause() {
      player.pause();
    },
    seek(to) {
      return new Promise((resolve) => {
        const zero = n.kCMTimeZero;
        // Exact seeks (zero tolerance): previews are short and local-ish.
        player.seekToTimeToleranceBeforeToleranceAfterCompletionHandler(n.CMTimeMakeWithSeconds(to, 600), zero, zero, () =>
          toJS(() => {
            const s = snapshot();
            events.onProgress(s.position, s.duration, s.buffering);
            resolve();
          }),
        );
      });
    },
    setVolume(volume) {
      player.volume = volume;
    },
    dispose() {
      disposed = true;
      clearInterval(watchdog);
      dropItemObservers();
      player.pause();
      player.removeTimeObserver(timeObserver);
      player.replaceCurrentItemWithPlayerItem(null);
      item = null;
    },
  };
}

/** No sound: a clock that advances while "playing". Previews are 30 s. */
function simulatedAudio(events: AudioEvents): AudioBackend {
  const DURATION = 30;
  const TICK = 0.25;
  let position = 0;
  let playing = false;
  const timer = setInterval(() => {
    if (!playing) return;
    position = Math.min(DURATION, position + TICK);
    events.onProgress(position, DURATION, false);
    if (position >= DURATION) {
      playing = false;
      events.onEnded();
    }
  }, TICK * 1000);

  return {
    kind: "simulated",
    load(_url, autoplay) {
      position = 0;
      playing = autoplay;
      events.onProgress(0, DURATION, false);
    },
    play() {
      playing = true;
    },
    pause() {
      playing = false;
    },
    seek(to) {
      position = Math.max(0, Math.min(DURATION, to));
      events.onProgress(position, DURATION, false);
      return Promise.resolve();
    },
    setVolume() {},
    dispose() {
      clearInterval(timer);
    },
  };
}
