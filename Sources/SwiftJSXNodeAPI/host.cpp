#include "SwiftJSXNodeAPI.h"

#include <dlfcn.h>

#include <condition_variable>
#include <cstring>
#include <mutex>
#include <string>

#include "js_native_tsfn.h"
#include "jsc-api.h"

// MARK: Environments

extern "C" swiftjsx_napi_env swiftjsx_napi_env_create(JSGlobalContextRef context) {
  if (auto existing = napi_env__::get(context)) return existing;
  return new napi_env__(context);
}

// MARK: Main-thread priority

namespace {
std::mutex main_mutex;
std::condition_variable main_done;
int main_waiting = 0;
}  // namespace

extern "C" void swiftjsx_main_enter(void) {
  std::lock_guard<std::mutex> lock(main_mutex);
  main_waiting++;
}

extern "C" void swiftjsx_main_exit(void) {
  {
    std::lock_guard<std::mutex> lock(main_mutex);
    main_waiting--;
  }
  main_done.notify_all();
}

extern "C" void swiftjsx_wait_while_main_waiting(void) {
  std::unique_lock<std::mutex> lock(main_mutex);
  main_done.wait(lock, [] { return main_waiting == 0; });
}

// MARK: Threadsafe functions
//
// NativeScript uses these when a native block fires on a thread other than the
// one that created it (and inline main-thread callbacks don't apply): the call
// is queued to the JS thread while the native caller waits for it.

namespace {
CFRunLoopRef js_runloop = nullptr;

struct ThreadsafeFunction {
  napi_env env;
  napi_ref func;
  void *context;
  napi_threadsafe_function_call_js call_js;
};

void run_call(ThreadsafeFunction *tsfn, void *data) {
  napi_value js_cb = nullptr;
  if (tsfn->func) napi_get_reference_value(tsfn->env, tsfn->func, &js_cb);
  if (tsfn->call_js) {
    tsfn->call_js(tsfn->env, js_cb, tsfn->context, data);
  } else if (js_cb) {
    napi_value global;
    napi_get_global(tsfn->env, &global);
    napi_call_function(tsfn->env, global, js_cb, 0, nullptr, nullptr);
  }
}
}  // namespace

extern "C" void swiftjsx_set_js_runloop(CFRunLoopRef runloop) { js_runloop = runloop; }

extern "C" napi_status napi_create_threadsafe_function(
    napi_env env, napi_value func, napi_value, napi_value, size_t, size_t, void *, napi_finalize,
    void *context, napi_threadsafe_function_call_js call_js_cb, napi_threadsafe_function *result) {
  auto tsfn = new ThreadsafeFunction{env, nullptr, context, call_js_cb};
  if (func) napi_create_reference(env, func, 1, &tsfn->func);
  *result = tsfn;
  return napi_ok;
}

extern "C" napi_status napi_call_threadsafe_function(napi_threadsafe_function func, void *data,
                                                     napi_threadsafe_function_call_mode) {
  auto tsfn = (ThreadsafeFunction *)func;
  CFRunLoopRef runloop = js_runloop ? js_runloop : CFRunLoopGetMain();
  CFRunLoopPerformBlock(runloop, kCFRunLoopCommonModes, ^{
    swiftjsx_wait_while_main_waiting();
    run_call(tsfn, data);
  });
  CFRunLoopWakeUp(runloop);
  return napi_ok;
}

// Lifetime is tied to the closure that created it; NativeScript never frees
// these before process exit in practice, so release is bookkeeping only.
extern "C" napi_status napi_acquire_threadsafe_function(napi_threadsafe_function) { return napi_ok; }
extern "C" napi_status napi_release_threadsafe_function(napi_threadsafe_function,
                                                        napi_threadsafe_function_release_mode) {
  return napi_ok;
}
extern "C" napi_status napi_unref_threadsafe_function(napi_env, napi_threadsafe_function) {
  return napi_ok;
}

// MARK: Loading NativeScript

namespace {
void *addon = nullptr;

// The add-on resolves napi_* against the host process at load time. Keep every
// function it imports from being dead-stripped out of the final binary.
// This is exactly the set the NativeScript add-ons import (`nm -u`, all three
// platforms); regenerate it if a new NativeScript version imports more.
__attribute__((used)) const void *const kExportedForNativeScript[] = {
    (const void *)&napi_acquire_threadsafe_function,
    (const void *)&napi_add_finalizer,
    (const void *)&napi_call_function,
    (const void *)&napi_call_threadsafe_function,
    (const void *)&napi_coerce_to_bool,
    (const void *)&napi_coerce_to_number,
    (const void *)&napi_coerce_to_string,
    (const void *)&napi_create_array_with_length,
    (const void *)&napi_create_arraybuffer,
    (const void *)&napi_create_bigint_int64,
    (const void *)&napi_create_bigint_uint64,
    (const void *)&napi_create_double,
    (const void *)&napi_create_error,
    (const void *)&napi_create_external,
    (const void *)&napi_create_external_arraybuffer,
    (const void *)&napi_create_function,
    (const void *)&napi_create_int32,
    (const void *)&napi_create_int64,
    (const void *)&napi_create_object,
    (const void *)&napi_create_reference,
    (const void *)&napi_create_string_utf16,
    (const void *)&napi_create_string_utf8,
    (const void *)&napi_create_threadsafe_function,
    (const void *)&napi_create_uint32,
    (const void *)&napi_define_class,
    (const void *)&napi_define_properties,
    (const void *)&napi_delete_property,
    (const void *)&napi_delete_reference,
    (const void *)&napi_get_all_property_names,
    (const void *)&napi_get_and_clear_last_exception,
    (const void *)&napi_get_array_length,
    (const void *)&napi_get_arraybuffer_info,
    (const void *)&napi_get_boolean,
    (const void *)&napi_get_cb_info,
    (const void *)&napi_get_dataview_info,
    (const void *)&napi_get_element,
    (const void *)&napi_get_global,
    (const void *)&napi_get_instance_data,
    (const void *)&napi_get_last_error_info,
    (const void *)&napi_get_named_property,
    (const void *)&napi_get_new_target,
    (const void *)&napi_get_null,
    (const void *)&napi_get_property,
    (const void *)&napi_get_property_names,
    (const void *)&napi_get_prototype,
    (const void *)&napi_get_reference_value,
    (const void *)&napi_get_typedarray_info,
    (const void *)&napi_get_undefined,
    (const void *)&napi_get_value_bigint_int64,
    (const void *)&napi_get_value_bigint_uint64,
    (const void *)&napi_get_value_bool,
    (const void *)&napi_get_value_double,
    (const void *)&napi_get_value_external,
    (const void *)&napi_get_value_int32,
    (const void *)&napi_get_value_int64,
    (const void *)&napi_get_value_string_utf16,
    (const void *)&napi_get_value_string_utf8,
    (const void *)&napi_get_value_uint32,
    (const void *)&napi_has_element,
    (const void *)&napi_has_named_property,
    (const void *)&napi_has_own_property,
    (const void *)&napi_has_property,
    (const void *)&napi_is_array,
    (const void *)&napi_is_arraybuffer,
    (const void *)&napi_is_dataview,
    (const void *)&napi_is_error,
    (const void *)&napi_is_exception_pending,
    (const void *)&napi_is_typedarray,
    (const void *)&napi_new_instance,
    (const void *)&napi_reference_unref,
    (const void *)&napi_release_threadsafe_function,
    (const void *)&napi_remove_wrap,
    (const void *)&napi_run_script,
    (const void *)&napi_set_element,
    (const void *)&napi_set_instance_data,
    (const void *)&napi_set_named_property,
    (const void *)&napi_set_property,
    (const void *)&napi_strict_equals,
    (const void *)&napi_throw,
    (const void *)&napi_throw_error,
    (const void *)&napi_throw_type_error,
    (const void *)&napi_typeof,
    (const void *)&napi_unref_threadsafe_function,
    (const void *)&napi_unwrap,
    (const void *)&napi_wrap,
};

// And make sure the image that defines them is in the global symbol scope.
// The main executable always is; a test bundle or plug-in may have been loaded
// RTLD_LOCAL, and re-opening it RTLD_GLOBAL promotes it.
void promote_own_image() {
  Dl_info info{};
  if (dladdr((const void *)&napi_create_object, &info) && info.dli_fname) {
    dlopen(info.dli_fname, RTLD_NOLOAD | RTLD_GLOBAL);
  }
}

char *error(const std::string &message) { return strdup(message.c_str()); }
}  // namespace

extern "C" bool swiftjsx_nativescript_has_main_thread_guard(void) {
  return addon && dlsym(addon, "nativescript_set_main_thread_guard");
}

extern "C" char *swiftjsx_load_nativescript(swiftjsx_napi_env env, const char *path,
                                            bool mainThreadCallbacksInline, bool mainThreadGuard) {
  (void)kExportedForNativeScript;
  promote_own_image();
  if (!addon) {
    addon = dlopen(path, RTLD_NOW | RTLD_LOCAL);
    if (!addon) return error(std::string("Couldn't load NativeScript: ") + dlerror());
  }

  using Register = napi_value (*)(napi_env, napi_value);
  auto registerModule = (Register)dlsym(addon, "napi_register_module_v1");
  if (!registerModule) return error("Not a Node-API add-on (no napi_register_module_v1)");

  using ConfigureCallbacks = void (*)(bool, void (*)(void), void (*)(void));
  if (auto configure = (ConfigureCallbacks)dlsym(addon, "nativescript_set_main_thread_callbacks")) {
    configure(mainThreadCallbacksInline, swiftjsx_main_enter, swiftjsx_main_exit);
  } else if (mainThreadCallbacksInline) {
    return error("This NativeScript build lacks nativescript_set_main_thread_callbacks; "
                 "rebuild it with SwiftJSX's patches (scripts/build-nativescript.sh)");
  }
  using ConfigureGuard = void (*)(bool);
  if (auto guard = (ConfigureGuard)dlsym(addon, "nativescript_set_main_thread_guard")) {
    guard(mainThreadGuard);
  }

  napi_value exports, init;
  napi_create_object(env, &exports);
  napi_value result = registerModule(env, exports);
  if (!result) result = exports;
  if (napi_get_named_property(env, result, "init", &init) != napi_ok) return error("Add-on has no init()");
  napi_value global, ignored;
  napi_get_global(env, &global);
  if (napi_call_function(env, global, init, 0, nullptr, &ignored) != napi_ok) {
    napi_value exception;
    napi_get_and_clear_last_exception(env, &exception);
    return error("NativeScript init() threw");
  }
  return nullptr;
}
