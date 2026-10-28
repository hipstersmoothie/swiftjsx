// React DevTools (development runtime only): the standalone app
// (`npx react-devtools`, port 8097) shows the component tree, props, state and
// hooks, and profiles renders. The hook has to exist before React loads (and
// before React Refresh wraps it); Swift connects once it knows the Mac's
// address (the dev server's host, or loopback in the simulator).
// @ts-expect-error: no type declarations
import { initialize, connectToDevTools } from "react-devtools-core";

initialize();

let connected = false;
(globalThis as any).__swiftjsx_connectDevTools = (host: string, port = 8097) => {
  if (connected) return;
  connected = true;
  // Retries quietly until the DevTools app is open.
  connectToDevTools({ host, port, retryConnectionDelay: 3000 });
};
