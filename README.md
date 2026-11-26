[![make.fun · best-flight-game-20261126-0057](https://make.fun/badge/best-flight-game-20261126-0057.svg)](https://make.fun/bounty/best-flight-game-20261126-0057?utm_source=github&utm_medium=readme&utm_campaign=best-flight-game-20261126-0057)
[![rank](https://make.fun/badge/best-flight-game-20261126-0057/chuck147147/best-flight-game-20261126/rank.svg)](https://make.fun/bounty/best-flight-game-20261126-0057/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-flight-game-20261126-0057)
[![reward](https://make.fun/badge/best-flight-game-20261126-0057/chuck147147/best-flight-game-20261126/reward.svg)](https://make.fun/bounty/best-flight-game-20261126-0057?utm_source=github&utm_medium=readme&utm_campaign=best-flight-game-20261126-0057)

# RIDGE RUNNER

A little plane. A very big wilderness. Fly an original bush plane through a dawn-lit alpine canyon, thread golden gates, rescue a stranded hiker, and bring precious cargo through gusting weather. Original canvas illustrations and synthesised engine/chime audio. Vanilla JavaScript, no dependencies, downloads, or build step.

## Fly

Open `game/index.html` in desktop Chrome, or run `node serve.ts` and visit `http://localhost:3000` (Node 22).

- **1 / 2 / 3** selects a mission; **Enter** or the start button launches.
- **W / Up** increases throttle; **S / Down** decreases it. You can also drag the cockpit throttle lever.
- **A / Left** raises the nose; **D / Right** lowers it. Trim stays where you leave it.
- **Space** gives a short rechargeable boost. **P** pauses, **R** restarts, **Escape** returns to mission selection, **M** toggles sound.

Build to 50 knots on the runway, then gently raise the nose. Below 38 knots you stall; sharp pitch changes at high speed bleed energy. For a landing, lower power early, level the nose, stay below 97 knots, and settle gently. Terrain and balloons damage your airframe. Strips repair and refuel. Rings award 200, clean landings 350, and a completed mission adds a time bonus. Personal best is stored locally when browser storage is available.

## Missions

1. **Ring Run** — thread all eight golden rings and land at High Pass Strip.
2. **Canyon Rescue** — follow the smoke and land at the short Hiker’s Rest strip.
3. **Storm Delivery** — carry a parcel through stronger gusts to the far runway with limited fuel.

## Package and screenshots

```sh
./take-shots.sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

`main.ts` copies the static game and rendered screenshots and creates the canonical make.fun dossier using the unchanged supplied library in `vendor/`. It uses only Node's standard library. The screenshot script uses headless Chromium at the prescribed cached path (override with `CHROME`). It captures the actual game at 1280×800 and validates dimensions and byte limits. If Chromium is denied a required socket by the sandbox, run the same script outside that sandbox before packaging; no substitute images are generated.

Deterministic scene URLs: `?shot=title&seed=7`, `?shot=cover&seed=7`, `?shot=takeoff&seed=7`, `?shot=canyon&seed=7`, `?shot=landing&seed=7`. These freeze the normal game renderers at authored flight positions. R starts a live flight from a posed scene.

Source jobs: `main.js` states and fixed-step loop; `plane.js` physics and aircraft; `world.js` terrain, objectives and weather; `hud.js` cockpit and menus; `input.js` keyboard/pointer; `audio.js` synthesised sound; `shots.js` reproducible screenshot poses.

MIT © 2026 chuck147147.

## Verification

`node verify-game.mjs` runs dependency-free simulation checks for takeoff, stalls, boost, gate scoring/clearance, mission landings, damage, servicing, pause/menu, mouse throttle, and the five posed renderer paths. The canvas is a mock in these checks; they do not establish browser rendering quality.

After capturing real screenshots, run `node verify-build.ts`. It invokes `main.ts` twice, reports each dossier SHA-256, and compares every output file and directory.

Session limitation: Chromium failed with `setsockopt: Operation not permitted` in the sandbox. No screenshots were created. Both packaging verification attempts therefore fail the supplied library's required-image check. Run `./take-shots.sh && node verify-build.ts` outside that sandbox to finish capture and determinism verification. The session's installed Node was v24.22.1; the programs use erasable TypeScript and Node standard APIs compatible with Node 22 versions supporting direct `.ts` execution.
