// Entry point for runtime.js, which ships inside the Swift package. It holds
// React, the renderer and the component library; app bundles import them from
// `__swiftjsx_modules` instead of bundling their own copies. That split is what
// lets a hot update re-run just the app code against the same React instance.
import "./refresh-setup";
import * as React from "react";
import * as JSXRuntime from "react/jsx-runtime";
import * as JSXDevRuntime from "react/jsx-dev-runtime";
import * as CompilerRuntime from "react/compiler-runtime";
import * as SwiftJSX from "./index";

(globalThis as any).__swiftjsx_modules = {
  react: React,
  "react/jsx-runtime": JSXRuntime,
  "react/jsx-dev-runtime": JSXDevRuntime,
  // Memo cache used by React Compiler output.
  "react/compiler-runtime": CompilerRuntime,
  swiftjsx: SwiftJSX,
};
