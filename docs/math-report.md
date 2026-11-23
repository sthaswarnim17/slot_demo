# Lantern Summit: math report

Simulated 34,000,000 paid spins **per free-spin option** (102,000,000 total) with the same engine code the game runs (`src/engine`). Seed 20261122. Runtime 94s. Regenerate with `npm run sim -- --spins 34000000 --report`.

Bet = 1 credit. All figures are in multiples of the total bet. Demo math: not certified by any test lab.

## Headline

| Free-spin choice | RTP | Base game | Scatter pays | Free spins | Hit rate | Free spins every | Avg free-spin round | Max win seen | Std dev |
|---|---|---|---|---|---|---|---|---|---|
| Long Trail (15 spins from x1) | **96.31%** | 61.63% | 1.42% | 33.27% | 1 in 3.57 | 1 in 241 | 80.0x | 6,169x | 10.5 |
| Ridge Path (10 spins from x15) | **96.06%** | 61.59% | 1.41% | 33.06% | 1 in 3.57 | 1 in 242 | 80.0x | 4,277x | 9.4 |
| Summit Dash (6 spins from x42) | **96.06%** | 61.55% | 1.41% | 33.11% | 1 in 3.57 | 1 in 240 | 79.6x | 4,054x | 9.4 |

Ember meter: fills about once every 52 spins; the guaranteed multiplier it charges contributes 5.36% of RTP (included in the base game figure).

Max win cap: 10,000x per spin including its free-spin round. Ember meter size: 20 tumbles.

## Win distribution (all options pooled)

| Total win per paid spin | Share of spins |
|---|---|
| No win | 71.9671% (73,406,490) |
| 0 to 1x | 15.3474% (15,654,397) |
| 1x to 2x | 5.6735% (5,786,938) |
| 2x to 5x | 4.2535% (4,338,617) |
| 5x to 10x | 1.4425% (1,471,368) |
| 10x to 20x | 0.6858% (699,543) |
| 20x to 50x | 0.3629% (370,140) |
| 50x to 100x | 0.1407% (143,549) |
| 100x to 250x | 0.1013% (103,283) |
| 250x to 500x | 0.0208% (21,205) |
| 500x to 1,000x | 0.0037% (3,747) |
| 1,000x to 2,500x | 0.0007% (670) |
| 2,500x to 5,000x | 0.0001% (52) |
| 5,000x to 10,000x | 0.0000% (1) |
## Free-spin rounds and bonus buy

Measured separately with `npm run sim -- --fs 2000000 --seed 77` (2,000,000 forced rounds per climb):

| Climb | Spins | Start multiplier | Mean round win | Std dev | Highest round seen |
|---|---|---|---|---|---|
| Long Trail | 15 | x1 | 79.96x | 124.6 | 8,945x |
| Ridge Path | 10 | x15 | 79.96x | 101.7 | 7,273x |
| Summit Dash | 6 | x42 | 79.92x | 102.8 | 6,727x |

The three climbs pay the same on average (within 0.05x), so the choice changes only the feel and variance, never the return. Lantern frequency per climb is calibrated with `sim/calibrate.ts`.

Bonus buy costs 83x bet, so its return is about 79.95 / 83 = **96.3%**, in line with the base game. Operators can switch bonus buy off per market (`FEATURES.bonusBuy` in `src/engine/config.ts`).

## How the RNG works

- Live play (browser demo and `server/`) uses Web Crypto (`crypto.getRandomValues`), a cryptographically secure generator.
- The simulator uses a seeded xoshiro128** generator so runs are reproducible. It is never used for play.
- Every cell is drawn independently from weighted symbol tables (`BASE_MODE` and the per-climb free-spin modes in `src/engine/config.ts`). Outcomes never depend on balance, history or session.

These are prototype figures for a sales demo. Before any real-money release the math, RNG and game client must be certified by an accredited lab (GLI, BMM or iTech Labs).
