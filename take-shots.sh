#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"
CHROME="${CHROME:-$HOME/.cache/ms-playwright/chromium-1255/chrome-linux64/chrome}"
mkdir -p screenshots
profile=$(mktemp -d "$PWD/.chromium-shots.XXXXXX")
trap 'rm -rf "$profile"' EXIT
names=(cover takeoff canyon landing)
for i in 0 1 2 3; do
  "$CHROME" --headless --no-sandbox --user-data-dir="$profile" --disable-gpu --hide-scrollbars --force-device-scale-factor=1 \
    --screenshot="$PWD/screenshots/$((i+1))-${names[$i]}.png" \
    --window-size=1280,800 --virtual-time-budget=4000 \
    "file://$PWD/game/index.html?shot=${names[$i]}&seed=7"
done
node --input-type=module <<'JS'
import { readdirSync, readFileSync } from 'node:fs';
for (const name of readdirSync('screenshots').sort()) {
  const b=readFileSync('screenshots/'+name);
  const w=b.readUInt32BE(16),h=b.readUInt32BE(20);
  if(b.length>262144||Math.max(w,h)>1280||Math.min(w,h)<480)throw Error('Screenshot exceeds limits: '+name);
  console.log(`${name}: ${w}×${h}, ${b.length} bytes`);
}
JS
