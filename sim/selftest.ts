/** Engine self-test: checks tumble physics, pays and balance accounting over many random spins. */
import { GameSession, evaluate, payFor, type Grid } from '../src/engine/engine';
import { SeededRng } from '../src/engine/rng';
import { COLS, ROWS, SYM, MAX_WIN, BUY_COST } from '../src/engine/config';

let failures = 0;
const check = (cond: boolean, msg: string) => { if (!cond) { failures++; if (failures < 10) console.error('FAIL:', msg); } };
const close = (a: number, b: number) => Math.abs(a - b) < 0.011;

function checkTumble(prev: Grid, next: Grid, removed: Set<number>, dropped: number[]) {
  for (let c = 0; c < COLS; c++) {
    const survivors = prev[c].filter((_, r) => !removed.has(c * ROWS + r));
    check(dropped[c] === ROWS - survivors.length, 'dropped count');
    survivors.forEach((cell, i) => {
      const n = next[c][dropped[c] + i];
      check(n.s === cell.s && n.m === cell.m, 'survivor order kept');
    });
  }
}

const s = new GameSession(new SeededRng(99), 1e9);
for (let i = 0; i < 200_000; i++) {
  s.state.balance = 1e6;
  const before = s.state.balance;
  const r = s.spin(1);
  let prev = r.seq.grid;
  let tumble = 0;
  for (const st of r.seq.steps) {
    const wins = evaluate(prev);
    check(wins.length === st.wins.length, 'wins match evaluation');
    const removed = new Set<number>();
    for (const w of wins) {
      check(w.count >= 8 && w.symbol !== SYM.SCATTER && w.symbol !== SYM.LANTERN, 'only paying symbols, 8+');
      check(w.pay === payFor(w.symbol, w.count), 'pay lookup');
      for (const [c, rr] of w.positions) removed.add(c * ROWS + rr);
    }
    tumble += st.stepWin;
    checkTumble(prev, st.grid, removed, st.dropped);
    prev = st.grid;
  }
  check(evaluate(prev).length === 0, 'final grid has no wins');
  check(close(tumble, r.seq.tumbleWin), 'tumble total');
  check(close(r.balance, before - 1 + r.win), 'balance accounting');
  check(r.win <= MAX_WIN + 1e-6, 'max win cap');
  if (r.triggeredFreeSpins) {
    check(r.seq.scatters >= 4, 'trigger needs 4 scatters');
    s.chooseClimb(i % 3);
    let total = r.win;
    for (;;) {
      const b0 = s.state.balance;
      const f = s.freeSpin();
      check(close(s.state.balance, b0 + f.win), 'fs balance');
      check(f.multAfter >= f.multBefore, 'summit multiplier never drops');
      total += f.win;
      if (f.finished) { check(close(f.roundTotal, total), 'round total'); check(total <= MAX_WIN + 0.01, 'round cap'); break; }
    }
  }
}
// bonus buy
s.state.balance = 1000;
const b = s.buyFreeSpins(2);
check(close(b.balance, 1000 - 2 * BUY_COST), 'buy cost');
check(s.state.awaitingClimb, 'buy goes to climb choice');
let threw = false; try { s.spin(1); } catch { threw = true; }
check(threw, 'cannot spin during feature');

console.log(failures ? `${failures} checks failed` : 'All engine checks passed (200,000 spins)');
process.exit(failures ? 1 : 0);
