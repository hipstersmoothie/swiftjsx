#pragma once
// Host side of SwiftJSX's optional `native` backend: Node-API on JavaScriptCore
// (jsc-api.cpp, from NativeScript/napi-ios + patches) plus the glue that loads
// NativeScript's Node-API add-on into a SwiftJSX VM.

#include <CoreFoundation/CoreFoundation.h>
#include <JavaScriptCore/JavaScriptCore.h>
#include <stdbool.h>

#ifdef __cplusplus
extern "C" {
#endif

typedef struct napi_env__ *swiftjsx_napi_env;

/// Wraps an existing JSC context in a Node-API environment.
swiftjsx_napi_env swiftjsx_napi_env_create(JSGlobalContextRef context);

/// The JS thread's run loop. Native callbacks arriving on other threads that
/// NativeScript decides to queue (blocks) are posted here.
void swiftjsx_set_js_runloop(CFRunLoopRef runloop);

/// dlopen()s NativeScript's Node-API add-on, registers it, initializes it in
/// `env` (its classes, functions, etc. become globals of that context) and
/// configures its threading policy:
///   - mainThreadCallbacksInline: callbacks fired on the main thread run their
///     JS on main (UIKit-safe) instead of being queued to the JS thread.
///   - mainThreadGuard: JS→ObjC calls to @MainActor API from other threads
///     throw (only if the add-on supports it).
/// Returns NULL on success, or an error message (caller frees).
char *swiftjsx_load_nativescript(swiftjsx_napi_env env, const char *path,
                                 bool mainThreadCallbacksInline, bool mainThreadGuard);

/// Whether the loaded add-on supports the main-thread guard.
bool swiftjsx_nativescript_has_main_thread_guard(void);

/// Main-thread priority for the VM. JSC's VM lock is unfair: a busy JS thread
/// can re-take it between slices while main waits. Main-thread entries into JS
/// are bracketed with enter/exit; the JS thread calls wait before starting
/// each unit of work and blocks while main is waiting.
void swiftjsx_main_enter(void);
void swiftjsx_main_exit(void);
void swiftjsx_wait_while_main_waiting(void);

#ifdef __cplusplus
}
#endif
