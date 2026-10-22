# Patches for NativeScript/napi-ios

All six patches are against `NativeScript/napi-ios` main at `5b697b3`
(2026-09-12). They apply with `git apply` from the repo root, alone or together.
Applied together, they produce exactly the sources that were built and tested
(`napi-ios-main-thread-guard.patch` was built and tested on top of the other five).
`napi-ios-ref-leaks.patch` relies on the weak-ref fix: it deletes references in
finalizers, and reads cache entries that must reliably return null once their
target is dead.

## `napi-jsc-weakref-and-shared-class.patch`: JSC Node-API layer

Changes `NativeScript/napi/jsc/jsc-api.{h,cpp}` only.

### 1. Weak references could return dead objects (use-after-free)

**Symptom.** Under allocation churn on iOS, the app crashes with SIGSEGV in
`napi_typeof` ← `nativescript::getCachedPointer` ← `Pointer::create`. Calls that
normally return objects also sometimes come back `undefined`.

**Cause.** JSC's public C API has no weak handles, so `napi_ref__` tracked weak
liveness with a finalizer attached to the target (`ReferenceInfo` +
`active_ref_values`). JSC runs finalizers lazily, when it *sweeps*, which can be
long after the collection that found the object dead. During that window:

- `napi_get_reference_value` returns the dead cell, and
- `napi_reference_ref` calls `JSValueProtect` on it, resurrecting it.

NativeScript's pointer cache (`g_pointerCache`, weak refs keyed by address) hits
this all the time, because freed native addresses are reused right away.

**Fix.** Weak references to objects are backed by a JS `WeakRef`, created with the
global `WeakRef` constructor and protected for the reference's lifetime. The
collector clears a `WeakRef` *during* collection, so `deref()` is `undefined`
exactly when the target is dead. `value()` and `ref()` check it, so a dead target
is never returned or re-protected. Non-object values keep the old path. This uses
only public API (`WeakRef` has shipped in JSC since iOS 14.5).

**Tradeoff.** As with any `WeakRef`, a target that's created or dereferenced during
the current synchronous job is kept alive until that job ends. Long synchronous
loops that create many wrapped objects have a higher peak memory (in one macOS
test, the plateau went from ~430 MB to ~890 MB). Memory still levels off, and
across jobs nothing accumulates. The only alternative without this behavior is
JSC's private weak-handle API.

### 2. One JSClass per wrapped object (leak)

`BaseInfoT` called `JSClassCreate` for every info object (wrapper, reference,
external), and that's 3 per wrapped object. JSC keeps per-class context data
(structure, prototype) on the global object for the context's lifetime, even
after `JSClassRelease`. That leaked about 2 KB per wrapped object (400 MB per
200,000 `NSObject.new()`). Each info type now shares a single class. The instance
data is per-object private data, so it doesn't need a class per instance.

### Verification

Done in the iOS 27 simulator (iPhone 17 Pro) and on macOS 27, with SwiftJSX's
spike harness (`spikes/nativescript`). The stress test creates 30,000
`NSObject.new()` and 30,000 `interop.alloc(16)`/`interop.free()` per round, with
a GC between rounds.

| Layer | Launches | Crashed | Notes |
|---|---|---|---|
| Before | 5 | 5 (rounds 1–2) | Instrumented build counted 5–91 dead objects returned by weak refs before each crash |
| With this patch | 10 (5 of them with the exact patch file) | 0 | 10 rounds each, 0 unexpected `undefined`; one 30-round run (1.8M allocations) clean |

The functional suite still passes: UIKit/Foundation calls, structs, blocks
(including from other threads), and React running in the same context. There's
no measurable change in call overhead (iOS sim: cached property 730 ns, object
creation 3.3 µs).

## `napi-ios-objectrefs-index.patch`: quadratic wrapper lookup

`ObjCBridgeState::getNormalizedObjectRef` and `hasObjectRef` (in
`ffi/napi/ObjCBridge.h`) scanned *every* live object reference on every cache miss,
and every newly wrapped object is a miss. Creating n objects was O(n²): 20,000
`NSObject.new()` hadn't finished after 110 s. This adds an index from
tag-stripped pointer to object (`objectRefsByKey`), kept in sync where `objectRefs`
is modified (`storeObjectRef` / `takeObjectRef`). Allocation is now a flat
3–4 µs per object.

## `napi-ios-ref-leaks.patch`: napi_refs never deleted

Changes `ffi/napi/Object.mm`, `Interop.mm` and `Interop.h`. Found by tagging each
`napi_ref` with its creating call site. After 30 stress rounds, 1.8M references
were still live, half from `napi_add_finalizer` (wrapped objects) and half from
`Pointer::constructor` (pointer cache).

**Wrapped objects.** `ObjCBridgeState::getObject` gets a reference from
`napi_add_finalizer(…, &ref)` and stores it in the finalizer context, plus (as
borrowed) `objectRefs` and `handleObjectRefs` (`ownsRef = false`). When the wrapper
dies, `finalize_objc_object_now` unregisters the object but never deletes the
reference. The context is its only owner, so it now deletes it with
`DeleteReferenceOnOwningThread`, the same helper other NativeScript finalizers use.
Unregistering bumps the handle cache generation, so the thread-local fast-path
caches can't use the deleted reference.

**Pointer cache.** References in `g_pointerCache` had no clear owner:
- `finalizePointerNow` erased the entry for its address *unconditionally* without
  deleting it, which leaked the reference and could drop a newer live `Pointer`'s
  entry.
- `getCachedPointer` and `interop.free` deleted references they didn't create.

Now each `Pointer` owns the reference it registers (`Pointer::cacheRef`):
- `cachePointer` returns it and replaces a dead entry.
- The finalizer deletes it, and removes the cache entry only if the entry is still
  its own.
- Lookups only drop stale entries.
- `interop.free` drops the entry and releases only its own `Pointer`'s reference.

**Results** (iOS simulator, same stress test):

| | Live refs | RSS |
|---|---|---|
| Before, 30 rounds | 1.8M, +60,000 per round | 797 MB and climbing |
| After, 30 rounds | 160–210k, flat from round 12 on (≈ wrappers awaiting finalization) | ~510 MB, flat from round 24 on |
| After, 10 rounds × 5 launches (exact patch files) | — | ~437 MB (was ~531), 0 crashes |

Live references now track live wrappers. The plateau comes from JSC's lazy
sweeping plus `WeakRef` keep-alive within a job, not from references that are
never deleted.

## `napi-ios-pointer-lookups.patch`: linear scans on every pointer and object return

Changes `ffi/napi/ObjCBridge.h`, `Class.mm` and `TypeConv.mm`.

Every raw-pointer return (`PointerTypeConv::toJS`) checks whether the value is
really a class or protocol, so it can be returned as its constructor. On a miss,
which is every ordinary pointer, it:
- scanned all of `mdClassesByPointer` comparing tag-stripped addresses,
- scanned all of `mdProtocolsByPointer`, and
- copied the runtime's entire protocol list with `objc_copyProtocolList` and
  scanned it.

`ObjCObjectTypeConv::toJS` did the same `mdProtocolsByPointer` scan for nearly every
Objective-C object returned.

**Fix.**
- `mdClassesByNormalizedPointer` and `mdProtocolsByNormalizedPointer` index the
  metadata maps by tag-stripped address. They're written alongside the existing
  maps through `registerClassMetadata` / `registerProtocolMetadata`, including
  `Class.mm`'s direct write.
- The runtime protocol list is indexed once (`runtimeProtocolForPointer`) and
  rebuilt only when `_dyld_image_count()` changes. Protocols with metadata come from
  loaded images; protocols registered at runtime have no metadata, so this path
  never resolved them anyway.
- Lookup results are unchanged. Checked: a `void*` to a class returns its
  constructor (`CFRetain(interop.handleof(NSObject)) === NSObject`), and likewise for
  a protocol; `NSProtocolFromString` returns the protocol constructor; an ordinary
  `void*` is still an `interop.Pointer`.

**Results.** Two otherwise identical app builds, run alternately 3× each in the
iOS simulator under the same machine load (the Swift host-call control was
identical at ~210 ns):

| | Before | After |
|---|---|---|
| `void*` return (`NSMutableData.mutableBytes`) | 1,194,500–1,212,000 ns | 500–1,000 ns (timer resolution) |
| `id` return (`NSArray.firstObject`) | 1,150–1,200 ns | 900–950 ns |
| `NSObject.new()` | 3,940–4,500 ns | 4,120–4,240 ns (no change) |

The stress test is unchanged: 3 of 3 clean, same memory.

## `napi-ios-main-thread-callbacks.patch`: run main-thread callbacks on main

Changes `ffi/napi/CallbackThreading.h` and `Closure.mm`. Details and measurements
are in `../THREADING.md`.

A JS *block* invoked on a thread other than the one that created it was always
queued to the creating thread, with the caller waiting. For a block created on the
JS thread and fired by UIKit on main, that meant main blocked while the block ran
*off* main, so any UIKit call inside it was illegal. The Hermes build already has a
hook for running callbacks on the caller's thread (`shouldInvokeCallbackOnNativeCallerThread`),
but it's always false for Node-API engines.

- `nativescript_set_main_thread_callbacks(runInline, enter, exit)` lets an embedder
  opt in. When enabled in non-Hermes builds, blocks fired on the main thread run
  directly on main. That's safe for JSC, whose VM lock serializes threads.
- `MainThreadCallbackScope` calls the embedder's `enter`/`exit` around every
  callback that executes JS on main: method and C-function trampolines, plus the
  direct block path (not the queued path, where main waits for the JS thread). This
  lets the embedder give main priority over its JS thread for the VM lock, which
  is unfair. Measured: the worst main wait during time-sliced JS dropped from
  38 ms to 4.9 ms.
- Off by default; existing behavior is unchanged unless the embedder opts in.

(Implementing this inside the embedder's threadsafe-function shim instead
self-deadlocks: `Closure.mm` holds `ctx.mutex` while calling it, and the callback
takes the same mutex.)

## `napi-ios-main-thread-guard.patch`: throw on off-main UIKit calls

Changes the metadata generator (`metadata-generator/`) and `ffi/napi/` (`Class`,
`ClassBuilder`, `ClassMember`, `Object`, `Protocol`, new `MainThreadGuard.h`).
Off by default.

**Cause.** NativeScript lets JS call any Objective-C API from any thread. With JS
on a background thread, calling UIKit there logs warnings or crashes (problem 4
in `../README.md`), and nothing in the API stops you.

**Approach.** Apple's headers already say which APIs are main-thread-only, in the
form Swift imports as `@MainActor`: `NS_SWIFT_UI_ACTOR` → `NS_SWIFT_MAIN_ACTOR`
→ `__attribute__((swift_attr("@MainActor")))`. Exceptions are marked
`NS_SWIFT_NONISOLATED` (`swift_attr("nonisolated")`). The generator records these
annotations in the metadata. The runtime checks them when JS calls into native
code: if the guard is on and the call isn't on the main thread, it throws a JS
`Error` and never calls the method:

```
UILabel.new() must be called on the main thread (UILabel is @MainActor). Wrap it in onMain(() => ...).
UIView.backgroundColor = ... must be accessed on the main thread (UIView is @MainActor). Wrap it in onMain(() => ...).
GuardView.new() must be called on the main thread (GuardView inherits @MainActor from UIView). Wrap it in onMain(() => ...).
```

The error's `code` is `ERR_NATIVESCRIPT_MAIN_THREAD`.

**Opt-in API** (`ClassMember.mm`, next to `nativescript_set_main_thread_callbacks`):

```c
extern "C" void nativescript_set_main_thread_guard(bool enabled);   // default false
```

The embedder looks it up with `dlsym` after `dlopen`, like the callbacks hook. It
can be toggled at any time; it's a process-wide relaxed atomic.

### Reading `swift_attr` through libclang

libclang doesn't expose `SwiftAttr`. The attribute is a `CXCursor_UnexposedAttr`
child of the declaration with no spelling, no tokens and no pretty-printed form.
`clang_getCursorPrettyPrinted` on a whole `@interface` does print
`swift_attr("@MainActor")`, but it drops the attribute on protocols, members and
`@Sendable`. What works for every kind of declaration is the attribute's
**extent**. It covers the text as written in the header, which is the macro
invocation (`NS_SWIFT_UI_ACTOR`, `CARPLAY_TEMPLATE_UI_ACTOR`, `CF_SWIFT_NONISOLATED`
…) or a literal `__attribute__((swift_attr("…")))`. `getSwiftIsolationAttrs()`
(`Util.h`) reads that text with `clang_getFileContents` and classifies it. In the
iOS 27.1 SDK, every wrapper of these macros keeps `MAIN_ACTOR`, `UI_ACTOR` or
`NONISOLATED` in its name, and none spells `swift_attr` literally.

One catch: `NS_SWIFT_NONISOLATED` and `NS_SWIFT_SENDABLE` expand to nothing
unless `__SWIFT_ATTR_SUPPORTS_SENDABLE_DECLS` is defined, and Swift's
ClangImporter defines it. The generator now passes
`-D__SWIFT_ATTR_SUPPORTS_SENDABLE_DECLS=1`. Without it, it found 0 nonisolated
members; with it, it finds 144. Everything else in the metadata is unchanged:
section counts and sizes are identical to the unpatched generator.

Found in the iOS 27.1 simulator SDK (all frameworks): 484 classes and 222
protocols annotated `@MainActor`, 118 member-level `@MainActor`, 144
`nonisolated` members, 711 `Sendable` classes. In UIKit itself, 385 of 540
classes are annotated directly and 19 are `Sendable`. The rest are main-actor
through inheritance, which the runtime resolves. The generator prints these counts
after its serialization stats. The JSON emitter also gains
`mainActor`/`nonisolated`/`sendable` fields.

### Format change

There are no new bytes and no new sections; total size is unchanged (4.35 MB).
Flags go into high bits of string offsets that were always zero. The strings
section is about 3 MB, far below 2^29:

| Field | Bit 30 | Bit 29 |
|---|---|---|
| class name offset (bit 31 = "has protocols", as before) | class annotated `@MainActor` | — |
| protocol name offset (bit 31 as before) | protocol annotated `@MainActor` | — |
| member's selector (method) / name (property) offset | member `@MainActor` | member `nonisolated` |

`MDMetadataReader::resolveString()` masks bits 29–31, so every reader that
resolves names keeps working unchanged. That includes the engine-direct (JSI,
V8, JSC, QuickJS) backends. `NS_SWIFT_UI_ACTOR` on a category is applied to each
of its members. `MD_HEADER_VERSION` goes from 1 to 2, and the reader accepts
both:
- New runtime with old metadata: works, with no guard information.
- Old runtime with new metadata: fails cleanly with "Invalid metadata header
  version" instead of misreading names.

### What's guarded, and how isolation is resolved

Isolation is resolved once per member, when it's bound to its JS class
(`ObjCClassMember::defineMembers`), and stored on the member:

1. The member is `nonisolated` → never guarded (`UIApplication.backgroundTimeRemaining`).
2. The member itself is `@MainActor` → guarded, even on a non-actor class
   (`NSObject.accessibilityLabel`, from `NSObject (UIAccessibility)`).
3. It comes from a `@MainActor` protocol → guarded (`UITableViewDataSource`).
4. Its declaring class or any superclass is `@MainActor` → guarded.
   `ObjCClass::mainActorSource` is inherited when classes are built
   (`UIColorWell : UIControl : UIView`). JS subclasses (`ClassBuilder`) inherit
   it from their native superclass. A UIKit method called on a JS subclass is
   guarded because it's declared on the UIKit class.
5. `alloc`, `allocWithZone:`, `new` and `init*` are declared once, on NSObject,
   for every class. They're guarded if the **receiver's** class is
   `@MainActor`, which is checked at call time by walking `class_getSuperclass`
   (`mainActorSourceForClass`). `new UILabel()` is checked before `alloc`.

The check sits in `jsCall`/`jsCallInit`, the property getter and setter,
`alloc`, and the bridged constructor. A redeclaration of the same selector (a
class after its protocol) replaces the isolation. Different overloads under one
JS name take the strictest.

Not guarded:
- `Sendable` and unannotated classes: TextKit, Foundation, CoreLocation, …
- Members declared on NSObject when they're called on a UIKit object
  (`isKindOfClass:`, `performSelectorOnMainThread:…`). Swift treats these as
  nonisolated too.
- C functions.
- JS-implemented methods that native code invokes. That's the callback path, not
  a JS → native call.

**Hot path.** For an unguarded member, the check is a one-byte test. For a
guarded one, it's that test, a relaxed atomic load and `pthread_main_np()`.
Everything else (receiver walk, message) happens only when a call is about to
be rejected, or is an off-main `alloc`/`new`/`init`.

### Verification

The iOS 27.0 simulator (iPhone 17 Pro) ran a new `SPIKE_GUARD=1` harness mode
(`GuardTest.swift`). It was built in a copy of `../ios` + `../Sources` at
`/tmp/ns-guard-harness`; it isn't merged into `../ios` yet. JS ran on the
dedicated JS thread from `THREADING.md`. `sjsx_set_main_thread_guard()` in
`loader.cpp` calls the new export through `dlsym`. Main Thread Checker ran with `MTC_IGNORE_DUPS_BY_THREAD_PC=0`. The run
had 37 PASS and 0 FAIL, and the results were the same in all 7 launches (4 with
MTC, 3 without).

| From the JS thread, guard on | Result |
|---|---|
| `UILabel.new()` | throws `UILabel.new() must be called on the main thread (UILabel is @MainActor). Wrap it in onMain(() => ...).` |
| `UIView.alloc().init()` | throws at `UIView.alloc()` |
| `new UIView()` | throws `new UIView() must be called …` |
| `UIApplication.sharedApplication` | throws `… must be accessed on the main thread (UIApplication is @MainActor)` |
| `view.backgroundColor = red` (view made in `onMain`) | throws; afterwards `backgroundColor` is still `null` |
| `gv.setNeedsLayout()`, `gv` a `class GuardView extends UIView` | throws `UIView.setNeedsLayout() …` |
| `GuardView.new()` | throws `… (GuardView inherits @MainActor from UIView)` |
| `UIButton.buttonWithType(0)`, `view.addSubview(gv)`, `view.layoutIfNeeded()` | throw; afterwards `subviews.count` is 0 |
| `NSObject.new().accessibilityLabel` (member-level `@MainActor`) | throws |
| Main Thread Checker reports during the above | **0** |
| `UIColor.redColor`, `UIImage.systemImageNamed('star')` (Sendable) | allowed |
| `NSMutableParagraphStyle.new()` + setter (TextKit) | allowed |
| `NSProcessInfo.processInfo.processName` | allowed |
| `uiApp.backgroundTimeRemaining`, `uiApp.protectedDataAvailable` (`nonisolated` on `@MainActor` `UIApplication`) | allowed |
| `view.isKindOfClass(UIView)` (NSObject member) | allowed |
| JS `UITextFieldDelegate` method, invoked by native code (`performSelector:withObject:afterDelay:`) on the JS thread | runs; not guarded |
| Main Thread Checker reports during the allowed calls | 0 |

| Other | Result |
|---|---|
| All of the guarded calls above, inside `onMain(() => …)` | 9/9 succeed |
| Guard disabled: `UIView.alloc().init()`, `sharedApplication`, the setter, `setNeedsLayout`, `accessibilityLabel`, `addSubview`, `layoutIfNeeded` from the JS thread | all run, as before; MTC reports `-[UIView init]` and `-[UIView initWithFrame:]` |
| `SPIKE_THREADMODEL=1` (with MTC) | 9/9 PASS; exactly the one expected MTC report |
| Default functional run | unchanged: 14/15. `batteryMonitoringEnabled` fails, but the run's own Swift control also reads `false` on this simulator. |

Main Thread Checker caveat: in this setup it only reports UIKit calls that
NativeScript makes through its initializer path (`-[UIView init]`). It doesn't
report the off-main setter, `addSubview:` or `layoutIfNeeded` calls in the
guard-disabled run, even with `MTC_MAX_HIT_COUNT`, `MTC_IGNORE_THREADSAFE_METHODS=0`
and `MTC_SUPPRESS_SYSTEM_REPORTS=0`. So "0 reports" only proves the initializers
never ran. For setters and methods, the evidence is that the rejected calls left
no trace (`backgroundColor`, `subviews`), and that the check comes before any
dispatch.

**Overhead.** Measured in Release without MTC, best of 5 rounds per launch, 3
launches, 200,000 calls per measurement (5 ns resolution):

| Call | Guard off | Guard on | Difference |
|---|---|---|---|
| Unguarded `NSProcessInfo.processIdentifier`, JS thread | 1,380–1,390 ns | 1,380–1,395 ns | −5 to +5 ns |
| Guarded but allowed `UIView.tag`, on main | 2,065–2,070 ns | 2,055–2,070 ns | −15 to +5 ns |

The guard costs less than the measurement can resolve. That's consistent with
its few instructions per call.

### Limitations

- Only the Node-API FFI backend (`ffi/napi`, used by `--no-engine` builds)
  checks. The engine-direct backends read the new metadata fine but don't guard.
- APIs that route through NSObject-declared members get around the guard:
  `performSelector:`, KVC (`setValue:forKey:`), `NSInvocation`, `interop`
  function pointers. So do C functions; very few are annotated
  (`CF_SWIFT_MAIN_ACTOR`).
- Only annotated frameworks are covered. QuartzCore (`CALayer`), AVFoundation
  and others are unannotated, even where they have thread requirements.
- Members of a `@MainActor` protocol are guarded even on a non-actor class that
  conforms to it, which is the conservative choice.
- Detection is textual: a future wrapper macro named without
  `MAIN_ACTOR`/`UI_ACTOR`/`NONISOLATED` would be missed. libclang has no API
  for the attribute's argument.
- The hint ("Wrap it in onMain(() => ...)") names the embedder's helper.
  Upstream would want it configurable.
- Tested only in the simulator.

## Not patched (found while testing; worth reporting upstream)
- **Building with Xcode 27.** `NativeScript/CMakeLists.txt` sets the iOS deployment
  target to 13.0, which Xcode 27 rejects (minimum 15.0). The metadata generator
  (LLVM 17) also reports parse errors on the iOS 27.1 SDK.
