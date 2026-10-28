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
// The esbuild/Babel setup lives in cli/bundler.mjs (shared with the
// `swiftjsx` command apps use).
//
//   node scripts/build.mjs [entry.tsx] [--watch]
//
// --watch rebuilds the development bundles only, and serves the app to
// simulators and devices (cli/dev-server.mjs, port 8081 or SWIFTJSX_PORT).

import * as esbuild from "esbuild";
import { readdir } from "node:fs/promises";
import {
  common, production, withoutRefresh, useRuntimeModules, babel, reportBuilds, appDevelopment, appProduction, PRODUCTION_BANNER,
} from "../cli/bundler.mjs";
import { startDevServer } from "../cli/dev-server.mjs";

const watch = process.argv.includes("--watch");
const entry = process.argv.slice(2).find((a) => !a.startsWith("--")) ?? "examples/App.tsx";
const server = watch ? startDevServer({ port: Number(process.env.SWIFTJSX_PORT ?? 8081) }) : null;

const runtime = await esbuild.context({
  ...common,
  entryPoints: ["js/runtime-entry.ts"],
  outfile: "Sources/SwiftJSX/Resources/runtime.js",
  plugins: [babel({ refresh: false })],
});

const app = await appDevelopment(entry, "build/app.js", server ? [reportBuilds(server.update)] : []);

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

const appRelease = await appProduction(entry, "build/app.production.js");

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
  const contexts = [runtime, app, fixtures, runtimeProduction, appRelease, fixturesProduction];
  await Promise.all(contexts.map((c) => c.rebuild()));
  await Promise.all(contexts.map((c) => c.dispose()));
}
