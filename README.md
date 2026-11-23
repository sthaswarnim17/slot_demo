# Lantern Summit

An original 6 x 5 pay-anywhere tumbling slot set at a Himalayan sky-lantern festival, built as a playable sales prototype.

**Demo credits only. No real money can be staked, won or withdrawn.**

## What is in the prototype

| Feature | How it works |
|---|---|
| Pays anywhere | 8+ of the same symbol anywhere on the 6 x 5 grid pays (8-9, 10-11, 12+ tiers). |
| Tumbles | Winning symbols vanish, new ones fall in, repeat until no new wins. |
| Sky lanterns | Multiplier symbols from x2 to x500. When a spin ends with a win, all lanterns on the grid are added and multiply the tumble win. |
| Ember meter | Every tumble adds an ember. 20 embers charge a guaranteed x2 to x10 multiplier on the next winning spin. Fewer dead streaks. |
| Pick your climb | 4+ Snow Leopard Spirits start free spins. Choose Long Trail (15 spins from x1), Ridge Path (10 from x15) or Summit Dash (6 from x42). Lanterns add to a Summit multiplier that never drops. 3+ Spirits retrigger +5 spins. All three climbs have the same return. |
| Bonus buy | 83x bet, switchable per market (`FEATURES.bonusBuy`). |
| UX | Portrait, one-thumb layout, turbo, autoplay, tap-to-hurry, sound toggle, history, session summary, big-win celebrations. |

Math (100M simulated spins, see [docs/math-report.md](docs/math-report.md)): **RTP about 96.1%**, hit rate 1 in 3.6, free spins about 1 in 241 spins, average free-spin round 80x, max win cap 10,000x, high volatility.

All art is vector drawn in code and all sound is synthesized in code, so there are no third-party assets to license. The whole game is about 60 KB.

## Run it

```bash
npm install
npm run dev          # http://localhost:5173 (use your phone on the same Wi-Fi via the printed network URL)
npm run build        # static site in dist/
npm run build:single # one self-contained HTML file in dist-single/index.html
```

### Game server mode

By default the demo runs the engine in the browser with a secure RNG so a single link works anywhere. For buyers who want to see server-authoritative play:

```bash
npm run server                                   # http://localhost:8787
open "http://localhost:5173/?server=http://localhost:8787"
```

The server owns the RNG and the balance; the client only animates results. Endpoints: `POST /session`, `/spin`, `/buy`, `/climb`, `/free-spin`, `/top-up`, `GET /health`.

### Math tools

```bash
npm test                                   # engine self-test, 200k spins of invariants
npm run sim -- --spins 2000000             # full-game RTP per climb option
npm run sim -- --fs 1000000                # free-spin rounds only
npm run sim -- --spins 34000000 --report   # rewrite docs/math-report.md (~100M spins total)
```

## Android and iPhone builds (Capacitor)

The web build is the app. To wrap it:

```bash
npm install -D @capacitor/cli @capacitor/core @capacitor/android @capacitor/ios
npm run build
npx cap add android && npx cap add ios
npx cap sync
npx cap open android   # build an APK in Android Studio
npx cap open ios       # build in Xcode (needs a Mac and an Apple developer account for TestFlight)
```

`capacitor.config.json` is already set up (`webDir: dist`). Note that Apple and Google only allow real-money gambling apps from licensed operators; a free-play demo APK for sideloading and a TestFlight build for buyer previews are fine.

## Code map

```
src/engine/   config.ts (paytable, weights, features)  engine.ts (grid, tumbles, session)  rng.ts
src/game/     main.ts (UI + animation)  symbols.ts (vector art)  audio.ts (synth sound)  backend.ts (local or server)
server/       server.ts (authoritative demo game server)
sim/          simulate.ts  calibrate.ts  selftest.ts
docs/         math-report.md
```

## Before a real-money release

Lab certification of the RNG, math and client (GLI, BMM or iTech Labs), integration with the operator's wallet or an aggregator API, responsible-gaming features required per market, and a licensed operator or supplier licence. None of that is in this prototype.
