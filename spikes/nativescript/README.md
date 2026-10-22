# Spike: NativeScript inside SwiftJSX (October 2026)

**Question:** can NativeScript's engine-agnostic Node-API runtime
(`NativeScript/napi-ios`) give SwiftJSX JavaScript direct access to every iOS API,
sharing our JavaScriptCore context, with JS on our background thread, at low overhead?

**Verdict: with the four patches in `patches/`, it's stable, doesn't leak, and
has no pathological slow paths under stress in the iOS simulator.** Remaining
before building on it:
- UIKit off the main thread (problem 4): solved in `THREADING.md` and adopted by
  SwiftJSX: a dedicated JS thread, main-thread callbacks run on main, `onMain()`,
  main-thread VM priority, and a runtime guard that turns off-main @MainActor
  calls into JS errors.
- Building with Xcode 27 needs workarounds (problem 5).
- It's alpha, and it hasn't been measured on a device.

## What works

Checked on macOS (published add-on 0.4.0) and the iOS 27 simulator (add-on built from
`napi-ios` main):

- **Shares our context.** Their Node-API-on-JavaScriptCore layer wraps any
  `JSGlobalContextRef`. The add-on loads with `dlopen` and `init()`.
- **One clean namespace.** NativeScript defines about 89,000 globals (`open`, `exit`,
  `sleep`, a getter called `pi`…). Initializing it in a *sibling* context in the same VM
  and exposing that context's global object as `native` leaves the app realm with 64
  globals: `native.UIDevice.currentDevice.model`. This costs no speed.
- **Off the main thread.** JS on a background serial queue can call Foundation and
  UIKit APIs, use C functions and structs (`CGRect`), and pass JS functions as blocks.
  Blocks fired on the main thread hop to the JS queue (main waits about 0.08 ms).
- **React coexists.** SwiftJSX's `runtime.js` evaluates alongside it. A hook built on
  `useSyncExternalStore` + `NSNotificationCenter` renders.
- **Startup:** dlopen 4–7 ms, `init` 76–140 ms.

## Overhead

Best of 5 runs. The simulator runs JavaScriptCore *with* the JIT; iPhone apps can't,
so device numbers will be worse. The device wasn't connected, so they're unmeasured.

| Call | macOS | iOS sim |
|---|---|---|
| SwiftJSX's existing Swift host function | 190 ns | 190–210 ns |
| Property on a cached native object | 570 ns | 650–1,090 ns |
| `UIDevice.currentDevice.model` (2 hops + string) | ~1,000 ns | 2,300–2,700 ns |
| Struct-returning call (`UIScreen.mainScreen.bounds`) | 70 ns (C fn) | ~4,800 ns |
| Create an Objective-C object | 2,300 ns | 3,700 ns (after fix #2) |

That's fine for hooks (events, sensors, settings). It's not for per-frame loops over
thousands of native calls.

## Problems found

1. **Leak: one JavaScriptCore class per wrapped object.** The Node-API layer called
   `JSClassCreate` for every wrapper. JavaScriptCore keeps per-class data until the
   context dies, so memory grew about 2 KB per object (400 MB per 200,000).
   *Fixed here* by sharing one class per wrapper type
   (`Sources/NodeAPIJSC/jsc-api.cpp`, marked `SPIKE FIX`). Growth dropped to about
   30 B per object.
2. **Quadratic wrapper lookup.** On every cache miss (every new object),
   `ObjCBridgeState::getNormalizedObjectRef` / `hasObjectRef` scanned *all* live
   object references, so creating n objects cost O(n²). 20,000 objects hadn't finished
   after 110 s. *Fixed here* with an index keyed on the tag-stripped pointer
   (`patches/napi-ios-objectrefs-index.patch`). It's now a flat 3–4 µs per object.
3. **Use-after-free crash: fixed.** Under allocation churn on iOS,
   `napi_typeof` ← `getCachedPointer` ← `Pointer::create` ended in SIGSEGV. The
   Node-API layer's weak references only noticed a dead object when JavaScriptCore
   lazily ran its finalizer, so dead objects were handed back in the meantime.
   Confirmed with an instrumented build, which counted 5–91 such returns before
   each crash. 5 of 5 launches crashed. *Fixed* by backing weak references with JS
   `WeakRef`, which is cleared during collection and is public API
   (`patches/napi-jsc-weakref-and-shared-class.patch`). 10 of 10 launches clean, plus
   a 30-round run (1.8M allocations). Tradeoff: like any `WeakRef`, targets touched
   in a long synchronous JS job survive until the job ends, so peak memory in big
   loops is higher. Details in `patches/README.md`.
7. **References never deleted: fixed.** NativeScript never deleted the
   reference it got for each wrapped object, and its pointer cache had no clear
   owner for its references. That's 60,000 leaked per stress round, 1.8M after
   30 rounds. *Fixed* in `patches/napi-ios-ref-leaks.patch`: live references now
   level off with live wrappers, and memory is flat (797 MB and climbing → ~510 MB
   flat after 30 rounds).
8. **Slow pointer returns: fixed.** Every `void*` return scanned all class
   and protocol metadata and copied the runtime's whole protocol list, about
   1.2 ms per call. Every object return also scanned the protocol metadata. *Fixed*
   with hash indexes and a cached protocol index
   (`patches/napi-ios-pointer-lookups.patch`): `void*` returns now take ≤ 1 µs
   (~1,200×), and `id` returns are ~20% faster. Measured A/B under identical load.
4. **UIKit off the main thread crashes.** Creating a `UILabel` from JS on the
   background queue logged "Unsupported layout off the main thread" and the app
   segfaulted. Every UIKit *view* API would need a main-thread hop, and nothing in the
   API stops you from forgetting it.
5. **Toolchain friction with Xcode 27 / iOS 27.1:**
   - The build needs about 400 MB of LLVM 17 plus `cmake`.
   - The x86_64 metadata generator needs Rosetta, so I used the arm64 binary.
   - The CMake config hard-codes iOS 13 as the minimum version, which Xcode 27 rejects
     (raised to 17).
   - The generator (LLVM 17) prints parse errors on the iOS 27.1 SDK, so some APIs
     (for example UIFocus) may be missing from the metadata.
   - The add-on is about 7 MB per architecture (1.5 MB code + 4.6 MB metadata).
6. **Alpha.** `@nativescript/ios-node-api` is 1.0.0-alpha.7. The published iOS binary
   has no metadata and predates the current source.

## Recommendation

Don't build SwiftJSX's native-API story on it yet. Instead:

- Ship **hooks as the public API** (`useBattery()`, `useLocation()`, `useHaptics()`…),
  backed by a small **typed Swift module bridge** (Expo-Modules style). Calls cost
  about 200 ns, it fits the background-thread design, and Swift decides which calls
  must hop to the main thread.
- Keep a NativeScript backend as an **opt-in experiment** behind the same hooks, using
  the sibling-context `native` namespace shown here. Revisit once problem 3 is fixed
  upstream.
- The four patches in `patches/` (fixes 1–3, 7 and 8) are ready to send upstream to
  `NativeScript/napi-ios`.

## On a real device (iPhone 15 Pro Max, iOS 27, no JIT)

Same harness, signed with the team's existing wildcard development profile:

| | iPhone | Simulator |
|---|---|---|
| Functional suite | all pass (incl. the battery setter the simulator can't do) | all pass |
| Swift host function (SwiftJSX's bridge) | 280 ns | ~210 ns |
| Cached native property | 1.1 µs | ~0.84 µs |
| `UIDevice.currentDevice.model` | 2.9 µs | ~2.5 µs |
| `UIScreen.mainScreen.bounds` (struct) | 6.5 µs | ~5 µs |
| `NSObject.new()` (flat across 100k) | 6.5 µs | ~4.2 µs |
| `void*` / `id` return | 1.0 / 1.4 µs | ≤1 / 0.9 µs |
| NativeScript dlopen + init | 18 + 188 ms | ~70–140 ms |
| Stress (10 rounds × 60k objects) | 3/3 clean, RSS flat ~216 MB | clean |
| Threading model | all pass; sliced-JS max main wait 3.7 ms; JS callback on main 7 µs | all pass |

## Reproduce

```sh
# macOS (uses the published add-on in vendor/)
cd spikes/nativescript
swift run -c release Spike            # main checks
SPIKE_NAMESPACE=1 .build/release/Spike # sibling-context `native` namespace
SPIKE_ISOLATE=1  .build/release/Spike  # globals, cached-object and memory isolation

# iOS simulator: build the add-on from source, then run the harness
git clone --depth 1 https://github.com/NativeScript/napi-ios /tmp/ns-spike/repo
cd /tmp/ns-spike/repo && npm install && ./scripts/download_llvm.sh
# needs cmake on PATH; on Apple Silicon without Rosetta, delete metadata-generator/dist/x86_64
# after building the generator; raise the iOS deployment target in NativeScript/CMakeLists.txt to 17.0
git apply /path/to/spikes/nativescript/patches/*.patch
./scripts/build_metadata_generator.sh && npm run metagen ios-sim
./scripts/build_nativescript.sh --no-vision --no-engine --embed-metadata --no-iphone --sim --no-macos
mkdir -p /tmp/ns-spike/addon && cp -R packages/ios-node-api/build/RelWithDebInfo/NativeScript.apple.node/ios-arm64-simulator/NativeScript.framework /tmp/ns-spike/addon/
cd spikes/nativescript/ios && xcodegen generate && open NSSpike.xcodeproj
```

The vendored `Sources/NodeAPIJSC/jsc-api.{cpp,h}` and headers come from
`NativeScript/napi-ios` (MIT, see `vendor/NATIVESCRIPT-LICENSE`) with the patch in
`patches/` applied, exactly as it would go upstream. `instrumented/` holds the
diagnostic variant used to find the bugs: counters, call-site attribution for live
refs, and a weak-ref mode switch (0 legacy, 1 legacy + stale-return detection,
2 WeakRef). It isn't compiled. Swap it in, replacing
`Sources/NodeAPIJSC/instrumentation-stubs.cpp`, to rerun those experiments. The
iOS harness's stress mode is `SIMCTL_CHILD_SPIKE_STRESS=<mode>
[SIMCTL_CHILD_SPIKE_ROUNDS=n] xcrun simctl launch --console-pty booted dev.swiftjsx.nsspike`. `loader.cpp` is new: the add-on loader
and a minimal threadsafe-function implementation that queues onto the JS queue.
