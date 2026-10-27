// The parts of iOS outside the app: the audio session (play in silent mode,
// pause for calls), the lock screen / Control Center "Now Playing" card
// (MPNowPlayingInfoCenter) and its buttons (MPRemoteCommandCenter).
//
// Remote command handlers and notification blocks fire on the main thread and
// must return synchronously, so they read what they need from the event and
// hand the real work to the JS thread with setTimeout.
import { native, onMain, isNativeAvailable, type Native } from "swiftjsx";
import { art, type Track } from "./api";
import { artworkData } from "./artwork";

export type RemoteHandlers = {
  play(): void;
  pause(): void;
  toggle(): void;
  next(): void;
  previous(): void;
  seek(seconds: number): void;
  /** An interruption (a call, Siri, another app's audio) began or ended. */
  interrupted(began: boolean, shouldResume: boolean): void;
};

export type NowPlaying = { track: Track; position: number; duration: number; playing: boolean };

export interface SystemControls {
  update(state: NowPlaying): void;
  dispose(): void;
}

type MPRemoteCommand = InstanceType<Native["MPRemoteCommand"]>;
type MPRemoteCommandEvent = InstanceType<Native["MPRemoteCommandEvent"]>;
type MPChangePlaybackPositionCommandEvent = InstanceType<Native["MPChangePlaybackPositionCommandEvent"]>;
type MPMediaItemArtwork = InstanceType<Native["MPMediaItemArtwork"]>;

/** null without the native backend, or where there's no Now Playing (no MediaPlayer). */
export function createSystemControls(handlers: RemoteHandlers): SystemControls | null {
  if (!isNativeAvailable() || !("MPRemoteCommandCenter" in native)) return null;
  const n = native;
  let disposed = false;
  const later = (fn: () => void) =>
    setTimeout(() => {
      if (!disposed) fn();
    }, 0);

  // MARK: Audio session (iOS only; macOS has no AVAudioSession).
  let interruptionObserver: InstanceType<Native["NSObject"]> | null = null;
  if ("AVAudioSession" in n) {
    const session = n.AVAudioSession.sharedInstance();
    // NSError** out-parameters: pass a Reference and read `.value`.
    const error = new n.interop.Reference<InstanceType<Native["NSError"]> | null>();
    if (!session.setCategoryError(n.AVAudioSessionCategoryPlayback, error)) {
      console.warn("AVAudioSession category:", error.value?.localizedDescription);
    }
    if (!session.setActiveError(true, error)) {
      console.warn("AVAudioSession activate:", error.value?.localizedDescription);
    }
    interruptionObserver = n.NSNotificationCenter.defaultCenter.addObserverForNameObjectQueueUsingBlock(
      n.AVAudioSessionInterruptionNotification,
      session,
      n.NSOperationQueue.mainQueue,
      (note) => {
        // userInfo values come back as NSNumbers (or numbers); Number() takes either.
        const info = note.userInfo;
        const type = Number(info?.objectForKey(n.AVAudioSessionInterruptionTypeKey) ?? 0);
        const options = Number(info?.objectForKey(n.AVAudioSessionInterruptionOptionKey) ?? 0);
        const began = type === (n.AVAudioSessionInterruptionType?.Began ?? 1);
        const SHOULD_RESUME = n.AVAudioSessionInterruptionOptions?.AVAudioSessionInterruptionOptionShouldResume ?? 1;
        later(() => handlers.interrupted(began, (options & SHOULD_RESUME) !== 0));
      },
    );
  }

  // MARK: Remote commands (lock screen, Control Center, headphones, CarPlay).
  const SUCCESS = n.MPRemoteCommandHandlerStatus?.Success ?? 0;
  const targets: [MPRemoteCommand, unknown][] = [];
  // Registered on main, where the handlers will fire anyway.
  const registered = onMain(() => {
    const commands = n.MPRemoteCommandCenter.sharedCommandCenter();
    const on = (command: MPRemoteCommand, run: (event: MPRemoteCommandEvent) => () => void) => {
      command.enabled = true;
      targets.push([
        command,
        // Runs on main and must return a status now. `run` reads the event here
        // (it isn't safe to keep), and returns the work to do on the JS thread.
        command.addTargetWithHandler((event) => {
          later(run(event));
          return SUCCESS;
        }),
      ]);
    };
    on(commands.playCommand, () => handlers.play);
    on(commands.pauseCommand, () => handlers.pause);
    on(commands.togglePlayPauseCommand, () => handlers.toggle);
    on(commands.nextTrackCommand, () => handlers.next);
    on(commands.previousTrackCommand, () => handlers.previous);
    on(commands.changePlaybackPositionCommand, (event) => {
      const position = (event as MPChangePlaybackPositionCommandEvent).positionTime;
      return () => handlers.seek(position);
    });
  }).catch((error) => console.warn("remote commands:", error));

  // MARK: Now Playing info.
  let artworkFor: { trackId: number; artwork: MPMediaItemArtwork } | null = null;
  let loadingArtworkFor = 0;
  let last: NowPlaying | null = null;

  const publish = (state: NowPlaying) => {
    const { track, position, duration, playing } = state;
    const info: Record<string, unknown> = {
      [n.MPMediaItemPropertyTitle]: track.title,
      [n.MPMediaItemPropertyArtist]: track.artist,
      [n.MPMediaItemPropertyAlbumTitle]: track.album,
      [n.MPMediaItemPropertyPlaybackDuration]: Number.isFinite(duration) ? duration : 30,
      [n.MPNowPlayingInfoPropertyElapsedPlaybackTime]: position,
      [n.MPNowPlayingInfoPropertyPlaybackRate]: playing ? 1 : 0,
    };
    if (artworkFor?.trackId === track.id) info[n.MPMediaItemPropertyArtwork] = artworkFor.artwork;
    onMain(() => {
      n.MPNowPlayingInfoCenter.defaultCenter().nowPlayingInfo = info;
    }).catch((e) => console.warn("nowPlayingInfo:", e));
  };

  const loadArtwork = async (track: Track) => {
    loadingArtworkFor = track.id;
    try {
      const data = await artworkData(art(track.artwork, 600));
      const artwork = await onMain(() => {
        const image = n.UIImage.imageWithData(data);
        if (!image) return null;
        // The handler can be called on any thread, at any size; one image will do.
        return n.MPMediaItemArtwork.alloc().initWithBoundsSizeRequestHandler(image.size, () => image);
      });
      if (!artwork || disposed || loadingArtworkFor !== track.id) return;
      artworkFor = { trackId: track.id, artwork };
      if (last?.track.id === track.id) publish(last);
    } catch (error) {
      console.warn("Now Playing artwork:", error);
    }
  };

  return {
    update(state) {
      if (disposed) return;
      last = state;
      publish(state);
      if (state.track.id !== artworkFor?.trackId && state.track.id !== loadingArtworkFor && "UIImage" in n) {
        void loadArtwork(state.track);
      }
    },
    dispose() {
      disposed = true;
      if (interruptionObserver) n.NSNotificationCenter.defaultCenter.removeObserver(interruptionObserver);
      void registered.then(() =>
        onMain(() => {
          for (const [command, target] of targets) {
            command.removeTarget(target);
            command.enabled = false;
          }
          // Typed as non-null, but nil is how you clear the card.
          n.MPNowPlayingInfoCenter.defaultCenter().nowPlayingInfo = null as never;
        }).catch((error) => console.warn("remote commands cleanup:", error)),
      );
      if ("AVAudioSession" in n) {
        // Let other apps' audio resume.
        // Single-member options enums keep their full prefix in the generated types.
        const NOTIFY = n.AVAudioSessionSetActiveOptions?.AVAudioSessionSetActiveOptionNotifyOthersOnDeactivation ?? 1;
        n.AVAudioSession.sharedInstance().setActiveWithOptionsError(false, NOTIFY, null);
      }
    },
  };
}
