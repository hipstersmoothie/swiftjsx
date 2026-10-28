#!/usr/bin/env node
// swiftjsx: build and serve SwiftJSX apps, and start new ones.
//
//   swiftjsx create <Name> [--dir <path>] [--swiftjsx <path to a local checkout>]
//   swiftjsx dev [entry]     watch, rebuild build/app.js, serve it to the app (port 8081)
//   swiftjsx build [entry]   build/app.js (development) and build/app.production.js
//
// The entry defaults to package.json's "swiftjsx.entry", then src/App.tsx.

import { readFile, writeFile, mkdir, readdir, stat } from "node:fs/promises";
import { existsSync } from "node:fs";
import { execFileSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const [command, ...args] = process.argv.slice(2);
const flag = (name) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? args[i + 1] : undefined;
};
const positional = args.filter((a, i) => !a.startsWith("--") && !args[i - 1]?.startsWith("--"));

async function entryPoint() {
  if (positional[0]) return positional[0];
  try {
    const pkg = JSON.parse(await readFile("package.json", "utf8"));
    if (pkg.swiftjsx?.entry) return pkg.swiftjsx.entry;
  } catch {}
  return "src/App.tsx";
}

async function dev() {
  const { appDevelopment, reportBuilds } = await import("./bundler.mjs");
  const { startDevServer } = await import("./dev-server.mjs");
  const entry = await entryPoint();
  const server = startDevServer({ port: Number(flag("port") ?? process.env.SWIFTJSX_PORT ?? 8081) });
  const context = await appDevelopment(entry, "build/app.js", [reportBuilds(server.update)]);
  await context.watch();
}

async function build() {
  const { appDevelopment, appProduction } = await import("./bundler.mjs");
  const entry = await entryPoint();
  const contexts = [await appDevelopment(entry, "build/app.js"), await appProduction(entry, "build/app.production.js")];
  const results = await Promise.allSettled(contexts.map((c) => c.rebuild()));
  await Promise.all(contexts.map((c) => c.dispose()));
  if (results.some((r) => r.status === "rejected")) process.exit(1);
}

/** Copies template/ to the new app, filling in its name. */
async function create() {
  const name = positional[0];
  if (!name || !/^[A-Za-z][A-Za-z0-9]*$/.test(name)) {
    console.error("usage: swiftjsx create <Name> (letters and digits, starting with a letter)");
    process.exit(1);
  }
  const target = path.resolve(flag("dir") ?? name);
  if (existsSync(target) && (await readdir(target)).length) {
    console.error(`${target} already exists and isn't empty`);
    process.exit(1);
  }
  const here = path.dirname(fileURLToPath(import.meta.url));
  const template = path.join(here, "..", "template");
  const pkg = JSON.parse(await readFile(path.join(here, "..", "package.json"), "utf8"));
  const local = flag("swiftjsx") && path.resolve(flag("swiftjsx"));
  const values = {
    __NAME__: name,
    __PACKAGE_NAME__: name.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase(),
    __BUNDLE_ID__: `dev.swiftjsx.${name.toLowerCase()}`,
    // npm: the published version, or a local checkout (for trying changes).
    __SWIFTJSX_NPM__: local ? `file:${local}` : `^${pkg.version}`,
    // SwiftPM: the GitHub repo, or the same local checkout.
    __SWIFTJSX_SWIFT_PACKAGE__: local
      ? `path: ${JSON.stringify(local)}`
      : `url: https://github.com/hipstersmoothie/swiftjsx\n    branch: main`,
  };
  await copy(template, target, values);
  console.log(`Created ${name} in ${target}\n`);
  let hasXcodegen = true;
  try {
    execFileSync("xcodegen", ["generate", "--quiet"], { cwd: path.join(target, "ios"), stdio: "inherit" });
  } catch {
    hasXcodegen = false;
  }
  console.log("Next:");
  console.log(`  cd ${path.relative(process.cwd(), target) || "."}`);
  console.log("  npm install");
  console.log("  npm run dev            # serves the app; keep it running");
  if (!hasXcodegen) console.log("  brew install xcodegen && (cd ios && xcodegen)");
  console.log(`  open ios/${name}.xcodeproj   # run it in the simulator or on a device`);
}

async function copy(from, to, values) {
  await mkdir(to, { recursive: true });
  for (const entry of await readdir(from)) {
    const source = path.join(from, entry);
    const name = fill(entry === "gitignore" ? ".gitignore" : entry, values);
    const target = path.join(to, name);
    if ((await stat(source)).isDirectory()) {
      await copy(source, target, values);
    } else {
      await writeFile(target, fill(await readFile(source, "utf8"), values));
    }
  }
}

function fill(text, values) {
  return Object.entries(values).reduce((out, [key, value]) => out.replaceAll(key, value), text);
}

const commands = { dev, build, create };
if (!commands[command]) {
  console.log("usage: swiftjsx create <Name> | dev [entry] | build [entry]");
  process.exit(command ? 1 : 0);
}
await commands[command]();
