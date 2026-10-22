# UIKit and threads: NativeScript inside SwiftJSX

SwiftJSX runs React on a background JS thread. Most of UIKit must be called on the
main thread. NativeScript lets JS call anything from anywhere. This note is what the
iOS-simulator experiments showed and the model they point to. Everything here is
reproducible with the harness:

```sh
SIMCTL_CHILD_SPIKE_THREADMODEL=1 SIMCTL_CHILD_DYLD_INSERT_LIBRARIES=/usr/lib/libMainThreadChecker.dylib \
  xcrun simctl launch --console-pty booted dev.swiftjsx.nsspike
# SIMCTL_CHILD_SPIKE_NO_INLINE=1    blocks fired on main hop to the JS thread (old behavior)
# SIMCTL_CHILD_SPIKE_NO_PRIORITY=1  no main-thread priority for the VM
# SIMCTL_CHILD_SPIKE_THREADS=1      the GCD-queue deadlock repro
```

## Findings

1. **A GCD serial queue is the wrong home for JS.** Its worker threads change between
   jobs. NativeScript records "the JS thread" once, and per block, the thread it was
   created on. A JS callback created in one job and invoked by native code in a later
   job looked cross-thread, so it was queued onto the JS queue, which was busy
   running that very job. **Deadlock on the 2nd attempt.** The same mismatch silently
   dropped NativeScript's deferred cleanup (posted to a dead run loop), and would
   starve run-loop APIs like `CLLocationManager`.
   *Fix:* a dedicated JS thread with a running run loop. 8/8 attempts clean, one
   stable thread.

2. **Where callbacks run depends on their kind:**
   - **Methods** on JS classes (delegates, target-action, data sources) and **C
     function pointers** run on the calling thread, always, with no thread check.
     JSC's VM lock makes that safe.
   - **Blocks** run directly only on the thread that created them. From any other
     thread they're queued to that thread while the caller waits.

   So a block made on the JS thread and fired by UIKit on main ran *off* main, with
   main blocked anyway. Any UIKit call inside it was illegal.

3. **The annotations exist.** UIKit headers mark main-thread-only API with
   `NS_SWIFT_UI_ACTOR` (= `swift_attr("@MainActor")`), the same source Swift uses
   for `@MainActor`. Resolving inheritance, ~59% of UIKit classes are main-actor and
   13 are `Sendable`. Most of the rest are genuinely thread-agnostic (TextKit,
   diffable snapshots). There are 198 member-level annotations and 200 `nonisolated`
   exceptions. Foundation, CoreLocation and AVFoundation are essentially
   unannotated.

4. **Main Thread Checker works in the simulator.** Inject
   `/usr/lib/libMainThreadChecker.dylib` (the copy inside the simulated OS), and it
   flags off-main UIKit calls precisely. In every run it reported exactly the one
   deliberate violation.

5. **The VM lock is unfair.** Even with JS work in ~5 ms slices (how React's
   concurrent renderer yields), a main-thread callback sometimes waited **38 ms**:
   the JS thread re-took the lock for its next slice before main got it.
   *Fix:* main-thread entries announce themselves, and the JS thread doesn't start
   new run-loop work while any are pending. **Max wait 4.9 ms**, median 3 ms.

6. **Long synchronous JS still blocks main.** A tap during 300 ms of *unsliced* JS
   waited 278 ms. There's no deadlock, but it drops frames. No lock policy fixes this;
   the work has to be sliced.

## The model

| Where JS runs | When |
|---|---|
| **JS thread** (dedicated, with a run loop) | React rendering, effects, timers, SwiftJSX events, `await` continuations |
| **Main thread, inline** | Any native callback fired on main: methods, C callbacks, *and blocks* (with `napi-ios-main-thread-callbacks.patch`). UIKit calls inside are legal, and synchronous returns work (`cellForRowAtIndexPath`). |
| **Main thread, explicitly** | `await onMain(() => …)` runs a closure on main, and the promise settles back on the JS thread |
| **Other threads** | Callbacks from native background queues (camera, networking) run there under the VM lock |

Rules:
- **The JS thread never waits for main.** `onMain` is async only. This is what rules
  out deadlocks: main may wait for the VM, but never the other way round.
- **Main gets VM priority.** NativeScript brackets main-thread callbacks with
  embedder hooks, and SwiftJSX's JS thread yields between run-loop jobs while main
  is waiting.
- **JS work is sliced.** React's concurrent scheduler already yields to the run loop
  every ~5 ms. Long synchronous loops in app code are the remaining hazard.

### Measured (iOS 27 simulator, Main Thread Checker on)

| | |
|---|---|
| JS target-action fired by UIKit | runs on main, sets the button title synchronously |
| JS `UITableViewDataSource` | 10 cells returned synchronously, all built on main |
| Block created on JS thread, fired on main | runs on main (with patch; off main without) |
| JS callback on main | 0.03 ms |
| `onMain` round trip | 0.02 ms (0.26 ms with the priority gate; it polls with `usleep`, and a condvar would fix that) |
| 200 `onMain` + 200 main→JS callbacks interleaved | no deadlocks |

## Adopted in SwiftJSX

Done (see the main README's "Native APIs"):
1. **`JSEngine`** runs JS on a dedicated thread with a run loop; timers are run-loop
   timers; NativeScript is initialized on that thread, once per process
   (`NativeHost`, shared by every native-enabled runtime).
2. **Thread-safe host state**: the engine's context and timer table are behind a lock.
3. **`onMain`** is built in (`import { onMain } from "swiftjsx"`), and the
   main-priority gate uses a condition variable (`Sources/SwiftJSXNodeAPI/host.cpp`).
   On device that made `onMain` round trips 0.03 ms (polling: 0.26 ms).
4. **Main Thread Checker** in development builds is still a manual step
   (`DYLD_INSERT_LIBRARIES=/usr/lib/libMainThreadChecker.dylib` in the simulator; on
   device it couldn't be injected from the command line).

On the device (iPhone 15 Pro Max, iOS 27), inside the SwiftJSX app: event handler on
the JS thread, `onMain` on main, continuation after `await` on the JS thread; real
battery level read; haptics fired through `onMain`.

5. **Runtime guard: done** (`patches/napi-ios-main-thread-guard.patch`). The
   metadata generator records `@MainActor` / `nonisolated` / `Sendable` from the
   headers (via the attribute's source extent; libclang doesn't expose `swift_attr`
   otherwise), stored in spare bits so the metadata stays the same size. At bind
   time each member's isolation is resolved (member → protocol → class and
   superclasses, JS subclasses included), and calling a main-actor member off main
   throws `ERR_NATIVESCRIPT_MAIN_THREAD`: *"UILabel.new() must be called on the main
   thread (UILabel is @MainActor). Wrap it in onMain(() => ...)."*. No measurable
   overhead. SwiftJSX enables it by default (`NativeOptions.mainThreadGuard`).
   Gaps: unannotated frameworks (CALayer, AVFoundation), `performSelector`/KVC,
   C functions.

## What isn't solved

- **Long synchronous JS blocks main callbacks**, as above. Slicing is the only cure.
- **JS calling a native API that blocks on main** (some do `dispatch_sync` to main
  internally) while main waits for the VM would deadlock. That's rare, but only the
  runtime guard (point 5) or discipline prevents it.
- **Device numbers.** Everything was measured in the simulator.
