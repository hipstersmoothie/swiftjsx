#!/bin/bash
# Builds the NativeScript Node-API add-on that backs SwiftJSX's `native` API:
# NativeScript/napi-ios at a pinned commit + nativescript/patches (see their
# README), for iOS (device + simulator) and macOS, plus matching TypeScript
# declarations.
#
#   scripts/build-nativescript.sh
#
# Outputs (git-ignored, except the types):
#   build/nativescript/NativeScript.xcframework   embed in iOS apps (Apps/iOS does)
#   build/nativescript/macos/…                    used by `swift run Demo` / `swift test`
#   nativescript/types/ios/*.d.ts                 types for `native` (then: node scripts/gen-native-types.mjs)
#
# Needs: Xcode, Node, cmake on PATH, ~1.5 GB of disk (LLVM 17 is downloaded
# for NativeScript's metadata generator). Takes 10–20 minutes the first time.
set -euo pipefail

PIN=5b697b393152f973dd392851fd72dacf03a7a0c9
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
WORK="${NATIVESCRIPT_WORK:-$ROOT/.nativescript/napi-ios}"
OUT="$ROOT/build/nativescript"

step() { printf "\n\033[1m==> %s\033[0m\n" "$*"; }

command -v cmake >/dev/null || { echo "error: cmake not found (brew install cmake, or pipx install cmake)"; exit 1; }

step "NativeScript/napi-ios @ ${PIN:0:7} in $WORK"
if [ ! -d "$WORK/.git" ]; then
  mkdir -p "$WORK"
  git -C "$WORK" init -q
  git -C "$WORK" remote add origin https://github.com/NativeScript/napi-ios.git
  git -C "$WORK" fetch -q --depth 1 origin "$PIN"
  git -C "$WORK" checkout -q FETCH_HEAD
fi
cd "$WORK"
[ "$(git rev-parse HEAD)" = "$PIN" ] || { echo "error: $WORK is not at $PIN"; exit 1; }

step "Applying SwiftJSX patches"
git checkout -q -- . && git clean -qfd -e llvm -e node_modules -e metadata-generator/dist
grep -v '^#' "$ROOT/nativescript/patches/series" | while read -r patch; do
  [ -n "$patch" ] || continue
  echo "  $patch"
  git apply "$ROOT/nativescript/patches/$patch"
done
# Xcode 27 rejects NativeScript's iOS 13 deployment target (build-only tweak, not a patch).
sed -i '' 's/DEPLOYMENT_TARGET "13.0"/DEPLOYMENT_TARGET "17.0"/' NativeScript/CMakeLists.txt

step "Dependencies (npm, LLVM 17)"
npm install --silent
./scripts/download_llvm.sh

step "Metadata generator"
# Patches change the generator too (e.g. the main-thread guard's isolation
# flags), so rebuild it whenever the patch series changes.
STAMP="$(cat "$ROOT/nativescript/patches/series" "$ROOT"/nativescript/patches/*.patch | shasum | cut -d' ' -f1)"
if [ ! -x metadata-generator/dist/arm64/bin/objc-metadata-generator ] ||
   [ "$(cat metadata-generator/dist/.swiftjsx-patches 2>/dev/null)" != "$STAMP" ]; then
  ./scripts/build_metadata_generator.sh
  echo "$STAMP" > metadata-generator/dist/.swiftjsx-patches
else
  echo "  up to date"
fi
# Without Rosetta the x86_64 generator can't run; the arm64 one generates
# metadata for every target architecture.
if [ "$(uname -m)" = "arm64" ] && ! /usr/bin/pgrep -q oahd; then
  rm -rf metadata-generator/dist/x86_64
fi

step "Metadata: iOS, iOS simulator, macOS"
npm run --silent metagen ios
npm run --silent metagen ios-sim
npm run --silent metagen macos

step "Add-on: iOS (device + simulator)"
./scripts/build_nativescript.sh --no-vision --no-engine --embed-metadata --iphone --sim --no-macos
rm -rf "$OUT/NativeScript.xcframework"
mkdir -p "$OUT"
cp -R packages/ios-node-api/build/RelWithDebInfo/NativeScript.apple.node "$OUT/NativeScript.xcframework"
rm -f "$OUT/NativeScript.xcframework/react-native-node-api-module"

step "Add-on: macOS"
./scripts/build_nativescript.sh --no-vision --no-engine --embed-metadata --no-iphone --no-sim --macos
rm -rf "$OUT/macos"
cp -R packages/macos-node-api/build/RelWithDebInfo/NativeScript.apple.node "$OUT/macos"

step "TypeScript declarations for \`native\`"
rm -rf "$ROOT/nativescript/types/ios" "$ROOT/nativescript/types/objc"
mkdir -p "$ROOT/nativescript/types/ios" "$ROOT/nativescript/types/objc"
cp packages/ios/types/*.d.ts "$ROOT/nativescript/types/ios/"
cp packages/objc-node-api/index.d.ts packages/objc-node-api/inline_functions.d.ts "$ROOT/nativescript/types/objc/"
cd "$ROOT"
node scripts/sanitize-native-types.mjs nativescript/types/ios
node scripts/gen-native-types.mjs

step "Done"
echo "  iOS:   $OUT/NativeScript.xcframework"
echo "  macOS: $OUT/macos/macos-arm64/NativeScript.framework"
