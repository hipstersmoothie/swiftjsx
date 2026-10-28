// Declarations for the npm package: dist/types/*.d.ts from js/ (tsc), plus the
// hand-written .d.ts files (the runtime's globals, the native SDK namespace)
// that tsc doesn't copy. Apps typecheck against these, not js/ itself.
import { execFileSync } from "node:child_process";
import { copyFile, mkdir, readFile, rm, writeFile } from "node:fs/promises";

await rm("dist/types", { recursive: true, force: true });
execFileSync("npx", ["tsc", "-p", "tsconfig.types.json"], { stdio: "inherit" });

const handWritten = ["globals.d.ts", "web/globals.d.ts", "web/native.d.ts", "native-namespace.d.ts"];
for (const file of handWritten) {
  await mkdir(`dist/types/${file.split("/").slice(0, -1).join("/")}`, { recursive: true });
  await copyFile(`js/${file}`, `dist/types/${file}`);
}

// tsc drops index.ts's references to them; put them back.
const index = await readFile("dist/types/index.d.ts", "utf8");
const references = ["globals.d.ts", "web/globals.d.ts", "web/native.d.ts"].map((f) => `/// <reference path="./${f}" />`).join("\n");
await writeFile("dist/types/index.d.ts", `${references}\n${index}`);
console.log("dist/types: declarations for the package");
