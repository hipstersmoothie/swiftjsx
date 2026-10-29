#!/usr/bin/env bash
# Runs GalleryTests UI tests on a simulator, working around two Xcode quirks:
# `xcodebuild test` can hang after the tests finish (while writing results),
# and a stale test runner sometimes executes 0 tests.
#
#   scripts/ui-tests.sh testGestures testCanvas …
#
# SIMULATOR=<udid> picks the device (default: the first available iPhone).
# RESULT_BUNDLE=<path> keeps the .xcresult (screenshots, failures).
set -euo pipefail
cd "$(dirname "$0")/../Apps/iOS"

[ $# -gt 0 ] || { echo "usage: $0 testName…" >&2; exit 2; }

SIM="${SIMULATOR:-$(xcrun simctl list devices available -j | python3 -c '
import json, sys
devices = json.load(sys.stdin)["devices"]
for runtime in sorted(devices, reverse=True):
    if "iOS" in runtime:
        for d in devices[runtime]:
            if d["name"].startswith("iPhone"):
                print(d["udid"]); sys.exit()
')}"
[ -n "$SIM" ] || { echo "no iPhone simulator available" >&2; exit 1; }
echo "simulator: $SIM"
xcrun simctl boot "$SIM" 2>/dev/null || true

DERIVED="${DERIVED_DATA:-build}"
ONLY=()
for name in "$@"; do ONLY+=("-only-testing:SwiftJSXDemoUITests/GalleryTests/$name"); done

xcodebuild build-for-testing -project SwiftJSXDemo.xcodeproj -scheme SwiftJSXDemo \
  -destination "id=$SIM" -derivedDataPath "$DERIVED" -quiet

run() {
  local log="$1" bundle="$2"
  rm -rf "$bundle"
  xcodebuild test-without-building -project SwiftJSXDemo.xcodeproj -scheme SwiftJSXDemo \
    -destination "id=$SIM" -derivedDataPath "$DERIVED" -resultBundlePath "$bundle" "${ONLY[@]}" >"$log" 2>&1 &
  local pid=$!
  # Done when it prints the summary (or exits); then give it a minute to
  # finish writing the results before stopping it.
  local waited=0
  until grep -qE "Executed [0-9]+ tests?, with" "$log" || ! kill -0 "$pid" 2>/dev/null; do
    sleep 5
    waited=$((waited + 5))
    if [ "$waited" -gt 3600 ]; then echo "timed out" >&2; kill "$pid" 2>/dev/null || true; break; fi
  done
  for _ in $(seq 1 12); do
    grep -q "\*\* TEST" "$log" && break
    kill -0 "$pid" 2>/dev/null || break
    sleep 5
  done
  kill "$pid" 2>/dev/null || true
  wait "$pid" 2>/dev/null || true
}

LOG="${TMPDIR:-/tmp}/swiftjsx-ui-tests.log"
BUNDLE="${RESULT_BUNDLE:-${TMPDIR:-/tmp}/swiftjsx-ui-tests.xcresult}"
run "$LOG" "$BUNDLE"
if grep -q "Executed 0 tests" "$LOG"; then
  echo "0 tests executed (a stale runner): rebuilding and retrying"
  xcodebuild build-for-testing -project SwiftJSXDemo.xcodeproj -scheme SwiftJSXDemo \
    -destination "id=$SIM" -derivedDataPath "$DERIVED" -quiet
  run "$LOG" "$BUNDLE"
fi

grep -E "Test Case .*(passed|failed)|error: -\[" "$LOG" || true
passed=$(grep -cE "Test Case .*passed" "$LOG" || true)
failed=$(grep -cE "Test Case .*failed" "$LOG" || true)
echo "passed $passed, failed $failed (of $# requested)"
[ "$failed" -eq 0 ] && [ "$passed" -eq $# ]
