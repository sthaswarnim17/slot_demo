/** Finds the free-spin lantern weight per climb option that hits a target mean round win. */
import { GameSession } from '../src/engine/engine';
import { SeededRng } from '../src/engine/rng';
import { CLIMB_OPTIONS, type ClimbOption } from '../src/engine/config';

const target = Number(process.argv[2] ?? 130);
const rounds = Number(process.argv[3] ?? 60000);

function meanFor(o: ClimbOption, w: number): number {
  const opt: ClimbOption = { ...o, id: 0, mode: { ...o.mode, weights: [...o.mode.weights.slice(0, 10), w] } };
  const s = new GameSession(new SeededRng(12345), 1e12, [opt]);
  let tot = 0;
  for (let i = 0; i < rounds; i++) {
    s.state.awaitingClimb = true; s.state.pendingBet = 1; s.state.pendingTriggerWin = 0;
    s.chooseClimb(0);
    for (;;) { const f = s.freeSpin(); tot += f.win; if (f.finished) break; }
  }
  return tot / rounds;
}

for (const o of CLIMB_OPTIONS.filter(o => !process.argv[4] || String(o.id) === process.argv[4])) {
  let lo = Number(process.argv[5] ?? 5), hi = Number(process.argv[6] ?? 80);
  const flo = meanFor(o, lo), fhi = meanFor(o, hi);
  const up = fhi > flo;
  if ((target - flo) * (target - fhi) > 0) { console.log(`${o.label}: target out of range (${flo.toFixed(1)}..${fhi.toFixed(1)})`); continue; }
  for (let it = 0; it < 7; it++) {
    const mid = (lo + hi) / 2;
    if ((meanFor(o, mid) < target) === up) lo = mid; else hi = mid;
  }
  console.log(`${o.label}: lantern weight ${((lo + hi) / 2).toFixed(2)}`);
}
