// Must run before the renderer is created: the reconciler registers itself
// with this hook, which is how React Refresh finds the root to update.
import * as RefreshRuntime from "react-refresh/runtime";

RefreshRuntime.injectIntoGlobalHook(globalThis);

// The build plugin (scripts/build.mjs) rewrites each app module to call these.
(globalThis as any).__swiftjsx_refresh = {
  register: RefreshRuntime.register,
  signature: RefreshRuntime.createSignatureFunctionForTransform,
};

// Swift calls this after re-running an updated app bundle.
(globalThis as any).__swiftjsx_hotUpdate = () => {
  RefreshRuntime.performReactRefresh();
};
