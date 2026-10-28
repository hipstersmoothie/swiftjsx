// Babel pass: the iOS SDK's classes and functions are typed as globals (the
// type files declare them that way), so `AVPlayer.new()` typechecks, but at
// runtime they only exist on `native` (`native.AVPlayer`). Fail the build
// with a pointer instead of a ReferenceError at runtime.

import { readFileSync } from "node:fs";

const names = new Set();
try {
  for (const match of readFileSync(new URL("../js/native-namespace.d.ts", import.meta.url), "utf8").matchAll(/^  (\w+): typeof/gm)) {
    names.add(match[1]);
  }
} catch {
  // No native types generated: nothing to check.
}
// Globals that do exist at runtime (JavaScript's, and the web APIs SwiftJSX installs).
for (const name of Object.getOwnPropertyNames(globalThis)) names.delete(name);
for (const name of ["window", "self", "navigator", "localStorage", "sessionStorage", "crypto", "fetch", "WebSocket", "native"]) {
  names.delete(name);
}

// TypeScript nodes that wrap a value (`x as T`, `x!`): the value is still checked.
const valueWrappers = new Set(["TSAsExpression", "TSSatisfiesExpression", "TSNonNullExpression", "TSTypeAssertion", "TSInstantiationExpression"]);

export default function nativeGlobalsPlugin() {
  return {
    name: "swiftjsx-native-globals",
    visitor: {
      ReferencedIdentifier(path) {
        const name = path.node.name;
        if (!names.has(name) || path.scope.hasBinding(name)) return;
        if (path.findParent((p) => p.node.type.startsWith("TS") && !valueWrappers.has(p.node.type))) return;
        throw path.buildCodeFrameError(`${name} is part of the native backend: use native.${name} (import { native } from "swiftjsx").`);
      },
    },
  };
}
