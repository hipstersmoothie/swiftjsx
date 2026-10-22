// Loader + minimal napi threadsafe functions for the spike.
#include "NodeAPIJSC.h"

#include <CoreFoundation/CoreFoundation.h>
#include <dlfcn.h>
#include <pthread.h>
#include <atomic>
#include <cstring>

#include "jsc-api.h"
#include "js_native_tsfn.h"

static dispatch_queue_t js_queue = nullptr;
static CFRunLoopRef js_runloop = nullptr;
static bool main_inline = false;
static void *addon_handle = nullptr;
// Main-thread priority for the VM: while > 0, the JS thread doesn't start new
// run-loop work, so main isn't starved by JSC's unfair VM lock.
static std::atomic<int> main_waiting{0};
extern "C" void sjsx_main_enter(void) { main_waiting++; }
extern "C" void sjsx_main_exit(void) { main_waiting--; }
extern "C" int sjsx_main_waiting(void) { return main_waiting.load(); }

// NativeScript decides where callbacks run; tell it our policy (and hooks so
// main-thread callbacks get VM priority).
static void configure_main_thread_callbacks() {
  if (!addon_handle) return;
  using Configure = void (*)(bool, void (*)(void), void (*)(void));
  if (auto configure = (Configure)dlsym(addon_handle, "nativescript_set_main_thread_callbacks")) {
    configure(main_inline, sjsx_main_enter, sjsx_main_exit);
  }
}

extern "C" int sjsx_set_main_thread_guard(int enabled) {
  if (!addon_handle) return 0;
  using SetGuard = void (*)(bool);
  auto setGuard = (SetGuard)dlsym(addon_handle, "nativescript_set_main_thread_guard");
  if (!setGuard) return 0;
  setGuard(enabled != 0);
  return 1;
}

extern "C" void sjsx_set_js_queue(dispatch_queue_t queue) { js_queue = queue; }
extern "C" void sjsx_set_js_runloop(CFRunLoopRef runloop) { js_runloop = runloop; }
static void configure_main_thread_callbacks();
extern "C" void sjsx_set_main_inline(int enabled) {
  main_inline = enabled != 0;
  configure_main_thread_callbacks();
}

extern "C" sjsx_napi_env sjsx_napi_env_create(JSGlobalContextRef context) {
  if (auto existing = napi_env__::get(context)) return existing;
  return new napi_env__(context);
}

extern "C" const char *sjsx_load_addon(sjsx_napi_env env, const char *path, const char *globalName) {
  void *handle = dlopen(path, RTLD_NOW | RTLD_LOCAL);
  if (!handle) return strdup(dlerror());
  addon_handle = handle;
  configure_main_thread_callbacks();
  using Register = napi_value (*)(napi_env, napi_value);
  auto registerModule = (Register)dlsym(handle, "napi_register_module_v1");
  if (!registerModule) return strdup("napi_register_module_v1 not found");

  napi_value exports, global;
  napi_create_object(env, &exports);
  napi_value result = registerModule(env, exports);
  napi_get_global(env, &global);
  napi_set_named_property(env, global, globalName, result ? result : exports);
  return nullptr;
}

// --- Threadsafe functions -------------------------------------------------
// NativeScript uses these when a native block/callback fires on a thread other
// than the JS thread: it enqueues the call and blocks that thread until JS ran.
// Here "enqueue" = dispatch_async onto the JS queue.

struct SpikeTSFN {
  napi_env env;
  napi_ref func;
  void *context;
  napi_threadsafe_function_call_js call_js;
  std::atomic<int> refs{1};
};

struct SpikeCall {
  SpikeTSFN *tsfn;
  void *data;
};

extern "C" napi_status napi_create_threadsafe_function(
    napi_env env, napi_value func, napi_value, napi_value, size_t, size_t, void *, napi_finalize,
    void *context, napi_threadsafe_function_call_js call_js_cb, napi_threadsafe_function *result) {
  auto tsfn = new SpikeTSFN{env, nullptr, context, call_js_cb};
  if (func) napi_create_reference(env, func, 1, &tsfn->func);
  *result = tsfn;
  return napi_ok;
}

static void run_tsfn_call(void *raw) {
  auto call = (SpikeCall *)raw;
  auto tsfn = call->tsfn;
  napi_value js_cb = nullptr;
  if (tsfn->func) napi_get_reference_value(tsfn->env, tsfn->func, &js_cb);
  if (tsfn->call_js) {
    tsfn->call_js(tsfn->env, js_cb, tsfn->context, call->data);
  } else if (js_cb) {
    napi_value global;
    napi_get_global(tsfn->env, &global);
    napi_call_function(tsfn->env, global, js_cb, 0, nullptr, nullptr);
  }
  delete call;
}

extern "C" napi_status napi_call_threadsafe_function(napi_threadsafe_function func, void *data,
                                                     napi_threadsafe_function_call_mode) {
  // (Running main-thread callbacks inline is NativeScript's decision, made
  // before it gets here; see nativescript_set_main_thread_callbacks. Doing it
  // here instead self-deadlocks: the caller holds a mutex the callback takes.)
  auto call = new SpikeCall{(SpikeTSFN *)func, data};
  if (js_runloop) {
    CFRunLoopPerformBlock(js_runloop, kCFRunLoopCommonModes, ^{ run_tsfn_call(call); });
    CFRunLoopWakeUp(js_runloop);
    return napi_ok;
  }
  dispatch_async_f(js_queue ? js_queue : dispatch_get_main_queue(), call, run_tsfn_call);
  return napi_ok;
}

extern "C" napi_status napi_acquire_threadsafe_function(napi_threadsafe_function func) {
  ((SpikeTSFN *)func)->refs++;
  return napi_ok;
}

extern "C" napi_status napi_release_threadsafe_function(napi_threadsafe_function func,
                                                        napi_threadsafe_function_release_mode) {
  ((SpikeTSFN *)func)->refs--;  // leaked on purpose in the spike
  return napi_ok;
}

extern "C" napi_status napi_unref_threadsafe_function(napi_env, napi_threadsafe_function) {
  return napi_ok;
}
