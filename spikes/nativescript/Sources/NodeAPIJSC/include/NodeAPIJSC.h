#pragma once
#include <JavaScriptCore/JavaScriptCore.h>
#include <dispatch/dispatch.h>

#ifdef __cplusplus
extern "C" {
#endif

typedef struct napi_env__ *sjsx_napi_env;

/// Wrap an existing JSC context (e.g. SwiftJSX's) in a Node-API environment.
sjsx_napi_env sjsx_napi_env_create(JSGlobalContextRef context);

/// The serial queue JS runs on; native callbacks from other threads are queued here.
void sjsx_set_js_queue(dispatch_queue_t queue);

/// Prefer a dedicated JS thread: callbacks from other threads are posted to its run loop.
void sjsx_set_js_runloop(CFRunLoopRef runloop);

/// Run callbacks that fire on the main thread inline, on main (under JSC's VM lock).
void sjsx_set_main_inline(int enabled);

/// Main-thread guard: throw instead of calling @MainActor APIs off main.
/// Returns 0 if the add-on doesn't export nativescript_set_main_thread_guard.
int sjsx_set_main_thread_guard(int enabled);

/// Bracket main-thread entries into JS; the JS thread yields while any are pending.
void sjsx_main_enter(void);
void sjsx_main_exit(void);
int sjsx_main_waiting(void);

/// dlopen a Node-API add-on, call its napi_register_module_v1, and store the
/// exports on globalThis[globalName]. Returns NULL or an error message.
const char *sjsx_load_addon(sjsx_napi_env env, const char *path, const char *globalName);

// SPIKE instrumentation (type: 0 Constructor, 1 External, 2 Function, 3 Reference, 4 Wrapper)
void sjsx_counts(int type, long *created, long *finalized);
long sjsx_protected_refs(void);
/// 0 = legacy weak refs, 1 = legacy + count stale returns, 2 = WeakRef-backed (default).
void sjsx_set_weak_mode(int mode);
long sjsx_stale_returns(void);
void sjsx_ref_counts(long *refs, long *weakrefs);
void sjsx_dump_ref_sites(void (*emit)(const char *));

#ifdef __cplusplus
}
#endif
