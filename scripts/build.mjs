// Builds:
//
//   Sources/SwiftJSX/Resources/runtime.js             React (development) + renderer + components
//   Sources/SwiftJSX/Resources/runtime.production.js  the same with React's production build, minified
//   build/app.js                                      your app, with React Refresh registration
//   build/app.production.js                           your app, minified, for release builds
//   build/tests/*.js                                  Tests/Fixtures/*.tsx, for `swift test`
//
// Both runtimes ship in the Swift package. An app bundle says which one it
// needs (production bundles start with PRODUCTION_BANNER), and JSXRuntime
// loads the matching one. Development is what Fast Refresh and React's
// warnings need; production is smaller and faster.
//
// Our own source goes through Babel for the React Compiler (everything) and
// React Refresh (development app code).
//
// The app bundle doesn't include React: imports of react, react/jsx-runtime and
// swiftjsx resolve to the runtime's copies. Swift re-runs only app.js on change,
// so React Refresh can swap components and keep their state.
//
//   node scripts/build.mjs [entry.tsx] [--watch]
//
// --watch rebuilds the development bundles only.

import * as esbuild from "esbuild";
import { transformAsync } from "@babel/core";
import workletsPlugin from "./worklets-plugin.mjs";
import nativeGlobalsPlugin from "./native-globals-plugin.mjs";
import { readFile, readdir } from "node:fs/promises";
import path from "node:path";

const watch = process.argv.includes("--watch");
const entry = process.argv.slice(2).find((a) => !a.startsWith("--")) ?? "examples/App.tsx";

const common = {
  bundle: true,
  format: "iife",
  target: "es2020",
  define: { "process.env.NODE_ENV": '"development"' },
  logLevel: "info",
  legalComments: "none",
};

// Keep in sync with JSXRuntime.productionBanner.
const PRODUCTION_BANNER = "/* swiftjsx:production */";

const production = {
  ...common,
  define: { "process.env.NODE_ENV": '"production"' },
  minify: true,
};

/** React Refresh's runtime refuses to load in production; leave it out. */
const withoutRefresh = {
  name: "swiftjsx-without-refresh",
  setup(build) {
    build.onResolve({ filter: /\/refresh-setup$/ }, () => ({ path: "refresh-setup", namespace: "swiftjsx-empty" }));
    build.onLoad({ filter: /.*/, namespace: "swiftjsx-empty" }, () => ({ contents: "", loader: "js" }));
  },
};

const SHARED = ["react", "react/jsx-runtime", "react/jsx-dev-runtime", "react/compiler-runtime", "swiftjsx"];

/** Resolve shared modules to the runtime's instances instead of bundling them. */
const useRuntimeModules = {
  name: "swiftjsx-runtime-modules",
  setup(build) {
    const filter = new RegExp(`^(${SHARED.map((m) => m.replace(/[/]/g, "\\/")).join("|")})$`);
    build.onResolve({ filter }, (args) => ({ path: args.path, namespace: "swiftjsx-runtime" }));
    build.onLoad({ filter: /.*/, namespace: "swiftjsx-runtime" }, (args) => ({
      contents: `module.exports = globalThis.__swiftjsx_modules[${JSON.stringify(args.path)}];`,
      loader: "js",
    }));
  },
};

/**
 * Babel pass over our own source (never node_modules):
 *  - React Compiler: auto-memoizes components and hooks, so you don't write
 *    useMemo/useCallback/memo by hand.
 *  - react-refresh (app code only): registers components with React Refresh.
 */
function babel({ refresh, dev = true, worklets = false }) {
  return {
    name: refresh ? "babel-app" : dev ? "babel-runtime" : worklets ? "babel-app-production" : "babel-production",
    setup(build) {
      const stats = { compiled: 0, skipped: 0 };
      build.onStart(() => {
        stats.compiled = stats.skipped = 0;
      });
      build.onEnd(() => {
        const out = build.initialOptions.outfile ?? build.initialOptions.outdir;
        console.log(`React Compiler → ${out}: ${stats.compiled} memoized, ${stats.skipped} skipped`);
      });
      build.onLoad({ filter: /\.[jt]sx?$/ }, async (args) => {
        if (args.path.includes("node_modules")) return;
        const source = await readFile(args.path, "utf8");
        const file = path.relative(process.cwd(), args.path);
        const options = { filename: args.path, babelrc: false, configFile: false, parserOpts: { plugins: ["jsx", "typescript"] } };
        // Worklets first, while useAnimatedStyle's callback is still inline
        // (the compiler hoists it into a memoized temporary).
        const input = worklets && /worklet|useAnimatedStyle/.test(source)
          ? (await transformAsync(source, { ...options, plugins: [workletsPlugin] })).code
          : source;
        const skipped = [];
        const compiled = await transformAsync(input, {
          ...options,
          plugins: [
            ["babel-plugin-react-compiler", reactCompilerOptions(file, stats, dev, skipped)],
            // App code only (the runtime's own code never touches SDK globals).
            ...(worklets ? [nativeGlobalsPlugin] : []),
          ],
        });
        // React Refresh runs as a second pass over the compiler's *printed*
        // output. In a shared pass it reads hook arguments from source text the
        // compiler's new nodes don't have, so editing `useState(0)` to
        // `useState(10)` would no longer remount the component.
        const result = refresh
          ? await transformAsync(compiled.code, { ...options, plugins: [["react-refresh/babel", { skipEnvCheck: true }]] })
          : compiled;
        if (!refresh) return { contents: result.code, loader: path.extname(args.path).slice(1) };
        // Per-module registration helpers; esbuild keeps top-level vars module-scoped.
        const id = JSON.stringify(refreshModuleId(file));
        // Development: also say so in the app's console when the compiler
        // skipped something (easy to miss in the build log).
        const warnings = skipped.map((s) => `console.warn(${JSON.stringify(`[React Compiler] skipped ${file}:${s.line} (left unmemoized): ${s.reason}`)});\n`).join("");
        const prelude =
          `var $RefreshReg$ = (type, name) => __swiftjsx_refresh.register(type, ${id} + " " + name);\n` +
          `var $RefreshSig$ = __swiftjsx_refresh.signature;\n` + warnings;
        return { contents: prelude + result.code, loader: path.extname(args.path).slice(1) };
      });
    },
  };
}

function reactCompilerOptions(file, stats, dev, skipped = []) {
  return {
    target: "19",
    // Skip (and report) components the compiler can't prove safe; never fail the build.
    panicThreshold: "none",
    environment: !dev ? {} : {
      // Drop a component's memo cache when its source changes, so a hot update
      // never renders new code against cached JSX from the old code. React 19's
      // dev build already does this when Refresh swaps a component's function;
      // this is the compiler's own safeguard on top. (The compiler only enables
      // it itself when the *build* process has NODE_ENV=development.)
      enableResetCacheOnSourceFileChanges: true,
    },
    logger: {
      logEvent(_filename, event) {
        if (event.kind === "CompileSuccess") stats.compiled++;
        if (event.kind !== "CompileError" && event.kind !== "PipelineError") return;
        stats.skipped++;
        const line = event.fnLoc?.start.line ?? "?";
        const detail = event.detail ?? {};
        const reason = detail.reason ?? detail.options?.reason ?? event.data ?? "unknown reason";
        console.warn(`⚠ React Compiler skipped a function at ${file}:${line} (left unmemoized): ${reason}`);
        skipped.push({ line, reason: String(reason) });
      },
    },
  };
}

/**
 * React Refresh family ids are "<module> <ComponentName>". Test fixtures that
 * simulate an edit live next to the original as `Name.edit1.tsx` and share its id.
 */
function refreshModuleId(file) {
  return file.replace(/\.edit\d+(\.[jt]sx?)$/, "$1");
}

const runtime = await esbuild.context({
  ...common,
  entryPoints: ["js/runtime-entry.ts"],
  outfile: "Sources/SwiftJSX/Resources/runtime.js",
  plugins: [babel({ refresh: false })],
});

const app = await esbuild.context({
  ...common,
  entryPoints: [entry],
  outfile: "build/app.js",
  jsx: "automatic",
  jsxDev: true,
  plugins: [useRuntimeModules, babel({ refresh: true, worklets: true })],
});

const fixtures = await esbuild.context({
  ...common,
  logLevel: "warning",
  entryPoints: (await readdir("Tests/Fixtures")).filter((f) => f.endsWith(".tsx")).map((f) => `Tests/Fixtures/${f}`),
  outdir: "build/tests",
  jsx: "automatic",
  jsxDev: true,
  plugins: [useRuntimeModules, babel({ refresh: true, worklets: true })],
});

const runtimeProduction = await esbuild.context({
  ...production,
  logLevel: "warning",
  entryPoints: ["js/runtime-entry.ts"],
  outfile: "Sources/SwiftJSX/Resources/runtime.production.js",
  plugins: [withoutRefresh, babel({ refresh: false, dev: false })],
});

const appProduction = await esbuild.context({
  ...production,
  logLevel: "warning",
  entryPoints: [entry],
  outfile: "build/app.production.js",
  banner: { js: PRODUCTION_BANNER },
  jsx: "automatic",
  plugins: [useRuntimeModules, babel({ refresh: false, dev: false, worklets: true })],
});

// One fixture in production mode, to test the production runtime.
const fixturesProduction = await esbuild.context({
  ...production,
  logLevel: "warning",
  entryPoints: { "Hooks.production": "Tests/Fixtures/Hooks.tsx" },
  outdir: "build/tests",
  banner: { js: PRODUCTION_BANNER },
  jsx: "automatic",
  plugins: [useRuntimeModules, babel({ refresh: false, dev: false, worklets: true })],
});

if (watch) {
  await Promise.all([runtime, app, fixtures].map((c) => c.watch()));
} else {
  const contexts = [runtime, app, fixtures, runtimeProduction, appProduction, fixturesProduction];
  await Promise.all(contexts.map((c) => c.rebuild()));
  await Promise.all(contexts.map((c) => c.dispose()));
}
