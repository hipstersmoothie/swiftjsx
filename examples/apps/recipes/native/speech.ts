// Read steps aloud with AVSpeechSynthesizer, and follow along word by word
// (the delegate's willSpeakRange callback) so cooking mode can highlight the
// word being spoken.
//
// The delegate is a JS class registered with the Objective-C runtime
// (NativeClass + ObjCProtocols). Its methods are called on the main thread and
// must not touch React, so each one copies what it needs out of its
// arguments and hops to the JS thread.
//
// Fast Refresh re-runs this module, but an Objective-C class can only be
// registered once per process, so the class lives on globalThis and calls
// into whichever version of this module is current through a global hook.
import { useSyncExternalStore } from "react";
import { native, onMain, type Native } from "swiftjsx";
import { capabilities, toJS } from "./platform";

type Synthesizer = InstanceType<Native["AVSpeechSynthesizer"]>;
type Utterance = InstanceType<Native["AVSpeechUtterance"]>;
type Voice = InstanceType<Native["AVSpeechSynthesisVoice"]>;

export type SpeechState = {
  /** What's being read (a step's key), or null. */
  key: string | null;
  /** The word being spoken, as UTF-16 offsets into the text (JS string indices). */
  range: { location: number; length: number } | null;
};

let state: SpeechState = { key: null, range: null };
const listeners = new Set<() => void>();
const emit = (next: SpeechState) => {
  state = next;
  listeners.forEach((listener) => listener());
};

let synthesizer: Promise<Synthesizer> | null = null;
// The synthesizer's delegate property is weak: keep the object alive here.
let delegate: unknown = null;
let current: { key: string; utterance: Utterance } | null = null;
let voice: Voice | null | undefined;

type SpeechEvent = { kind: "range"; utterance: Utterance; location: number; length: number } | { kind: "end"; utterance: Utterance };
const host = globalThis as typeof globalThis & {
  __recipesSpeechDelegateClass?: { new (): object; new: () => object };
  __recipesSpeechEvent?: (event: SpeechEvent) => void;
};

/** Same native object? Wrappers are usually cached, but compare pointers to be sure. */
function same(a: Utterance, b: Utterance) {
  if (a === b) return true;
  try {
    return native.interop.handleof(a).toNumber() === native.interop.handleof(b).toNumber();
  } catch {
    return false;
  }
}

host.__recipesSpeechEvent = (event) => {
  if (!current || !same(current.utterance, event.utterance)) return; // a stopped utterance's late callbacks
  if (event.kind === "range") {
    emit({ key: current.key, range: { location: event.location, length: event.length } });
  } else {
    current = null;
    emit({ key: null, range: null });
    deactivateAudioSession();
  }
};

function delegateClass() {
  if (host.__recipesSpeechDelegateClass) return host.__recipesSpeechDelegateClass;
  const n = native;
  class RecipesSpeechDelegate extends n.NSObject {
    static ObjCProtocols = [n.AVSpeechSynthesizerDelegate];

    speechSynthesizerWillSpeakRangeOfSpeechStringUtterance(_s: Synthesizer, range: { location: number; length: number }, utterance: Utterance) {
      // Copy the struct's fields now; the callback's arguments don't outlive it.
      const location = range.location;
      const length = range.length;
      toJS(() => host.__recipesSpeechEvent?.({ kind: "range", utterance, location, length }));
    }

    speechSynthesizerDidFinishSpeechUtterance(_s: Synthesizer, utterance: Utterance) {
      toJS(() => host.__recipesSpeechEvent?.({ kind: "end", utterance }));
    }

    speechSynthesizerDidCancelSpeechUtterance(_s: Synthesizer, utterance: Utterance) {
      toJS(() => host.__recipesSpeechEvent?.({ kind: "end", utterance }));
    }
  }
  n.NativeClass(RecipesSpeechDelegate);
  host.__recipesSpeechDelegateClass = RecipesSpeechDelegate as never;
  return host.__recipesSpeechDelegateClass!;
}

function getSynthesizer(): Promise<Synthesizer> {
  // Made on main so its delegate callbacks come on main too.
  synthesizer ??= onMain(() => {
    const synth = native.AVSpeechSynthesizer.new();
    const Delegate = delegateClass();
    delegate = Delegate.new();
    synth.delegate = delegate as never;
    return synth;
  });
  return synthesizer;
}

/** The best installed voice for the device language (enhanced/premium if downloaded). */
function preferredVoice(): Voice | null {
  if (voice !== undefined) return voice;
  const n = native;
  const language = n.AVSpeechSynthesisVoice.currentLanguageCode();
  const prefix = language.split("-")[0];
  const voices = n.AVSpeechSynthesisVoice.speechVoices();
  let best: Voice | null = null;
  for (let i = 0; i < voices.count; i++) {
    const v = voices.objectAtIndex(i) as Voice;
    if (!v.language.startsWith(prefix)) continue;
    const score = v.quality * 10 + (v.language === language ? 1 : 0);
    const bestScore = best ? best.quality * 10 + (best.language === language ? 1 : 0) : -1;
    if (score > bestScore) best = v;
  }
  voice = best;
  return voice;
}

// Speech should be heard with the ringer switch on silent, and duck (not stop)
// a podcast that's playing. iOS only: macOS has no AVAudioSession.
let sessionActive = false;
function activateAudioSession() {
  const n = native;
  if (sessionActive || !("AVAudioSession" in n)) return;
  const session = n.AVAudioSession.sharedInstance();
  const options = n.AVAudioSessionCategoryOptions;
  session.setCategoryModeOptionsError(
    n.AVAudioSessionCategoryPlayback,
    n.AVAudioSessionModeSpokenAudio,
    options.DuckOthers | options.InterruptSpokenAudioAndMixWithOthers,
    null,
  );
  sessionActive = session.setActiveError(true, null);
}

function deactivateAudioSession() {
  const n = native;
  if (!sessionActive || !("AVAudioSession" in n)) return;
  sessionActive = false;
  const NOTIFY = n.AVAudioSessionSetActiveOptions?.AVAudioSessionSetActiveOptionNotifyOthersOnDeactivation ?? 1;
  n.AVAudioSession.sharedInstance().setActiveWithOptionsError(false, NOTIFY, null);
}

export async function speak(key: string, text: string, rate = 1) {
  if (!capabilities.speech) return;
  const n = native;
  const synth = await getSynthesizer();
  const utterance = n.AVSpeechUtterance.speechUtteranceWithString(text);
  utterance.rate = Math.min(n.AVSpeechUtteranceMaximumSpeechRate, n.AVSpeechUtteranceDefaultSpeechRate * rate);
  const v = preferredVoice();
  if (v) utterance.voice = v;
  utterance.postUtteranceDelay = 0.2;
  // Stopping the previous one fires its didCancel later; `current` already
  // points at the new utterance by then, so that callback is ignored.
  current = { key, utterance };
  emit({ key, range: null });
  if (synth.speaking) synth.stopSpeakingAtBoundary(n.AVSpeechBoundary.Immediate);
  activateAudioSession();
  synth.speakUtterance(utterance);
}

export async function stopSpeaking() {
  if (!synthesizer) return;
  const synth = await synthesizer;
  current = null;
  emit({ key: null, range: null });
  if (synth.speaking) synth.stopSpeakingAtBoundary(native.AVSpeechBoundary.Immediate);
  deactivateAudioSession();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function useSpeech(): SpeechState & { available: boolean } {
  const snapshot = useSyncExternalStore(subscribe, () => state);
  return { ...snapshot, available: capabilities.speech };
}
