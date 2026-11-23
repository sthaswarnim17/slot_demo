/** Engine self-test: checks tumble physics, pays and balance accounting over many random spins. */
import { GameSession, evaluate, payFor, type Grid } from '../src/engine/engine';
import { SeededRng } from '../src/engine/rng';
import { COLS, ROWS, SYM, MAX_WIN, BUY_COST, START_BALANCE } from '../src/engine/config';
import { allowedServer, parseBaseSpin, parseFreeSpin, parsePublicState } from '../src/game/validate';

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

const throws = (fn: () => unknown) => { try { fn(); return false; } catch { return true; } };

// ---------------------------------------------------------------- security: engine input checks
{
  const g = new GameSession(new SeededRng(7), 1000);
  for (const bad of [NaN, -1, 0, Infinity, 0.01, 1.5, 1e6, '1' as unknown as number]) {
    check(throws(() => g.spin(bad)), `spin rejects bet ${String(bad)}`);
    check(throws(() => g.buyFreeSpins(bad)), `buy rejects bet ${String(bad)}`);
  }
  check(g.state.balance === 1000 && !g.busy, 'rejected bets leave balance and state untouched');
  check(throws(() => g.chooseClimb(0)), 'cannot start free spins without a trigger');
  check(throws(() => g.freeSpin()), 'cannot free spin without a round');
  g.buyFreeSpins(1);
  for (const bad of [-1, 3, 1.5, NaN, '__proto__' as unknown as number]) check(throws(() => g.chooseClimb(bad)), `climb rejects ${String(bad)}`);
  check(throws(() => g.topUp(START_BALANCE)), 'no top-up during a feature');
  g.chooseClimb(2);
  while (g.state.fs) g.freeSpin();
  g.state.balance = 5;
  g.topUp(START_BALANCE);
  g.topUp(START_BALANCE);
  check(g.state.balance === START_BALANCE, 'top-up resets, never stacks');
  check(throws(() => g.topUp(NaN)) && throws(() => g.topUp(-5)), 'top-up rejects bad amounts');
}

// ---------------------------------------------------------------- security: server response parsing
{
  const g = new GameSession(new SeededRng(11), 1e6);
  const good = JSON.parse(JSON.stringify(g.spin(1)));
  check(throws(() => parseBaseSpin(good)) === false, 'valid spin parses');
  const xss = JSON.parse(JSON.stringify(good));
  xss.seq.grid[0][0] = { s: SYM.LANTERN, m: '<img src=x onerror=alert(1)>' };
  check(throws(() => parseBaseSpin(xss)), 'markup in lantern value rejected');
  const badSym = JSON.parse(JSON.stringify(good)); badSym.seq.finalGrid[1][1] = { s: 99 };
  check(throws(() => parseBaseSpin(badSym)), 'unknown symbol rejected');
  const nanBal = JSON.parse(JSON.stringify(good)); nanBal.balance = 'NaN';
  check(throws(() => parseBaseSpin(nanBal)), 'non-numeric balance rejected');
  const shortGrid = JSON.parse(JSON.stringify(good)); shortGrid.seq.grid.pop();
  check(throws(() => parseBaseSpin(shortGrid)), 'wrong grid size rejected');
  const extra = JSON.parse(JSON.stringify(good)); extra.injected = '<script>';
  check(!('injected' in parseBaseSpin(extra)), 'unknown fields dropped');
  check(throws(() => parsePublicState({ balance: 1, ember: 0, emberCharged: 'yes', awaitingClimb: false, fs: null })), 'bad boolean rejected');
  g.state.balance = 1e6; g.buyFreeSpins(1); g.chooseClimb(0);
  const fsr = JSON.parse(JSON.stringify(g.freeSpin()));
  check(throws(() => parseFreeSpin(fsr)) === false, 'valid free spin parses');
  fsr.multAfter = Infinity;
  check(throws(() => parseFreeSpin(fsr)), 'infinite multiplier rejected');
}

// ---------------------------------------------------------------- security: ?server= policy
{
  const prod = { pageOrigin: 'https://sthaswarnim17.github.io', dev: false, allowList: ['https://games.example.com'] };
  const dev = { ...prod, dev: true };
  check(allowedServer('https://evil.example', prod) === null, 'unknown server rejected');
  check(allowedServer('javascript:alert(1)', prod) === null, 'javascript: rejected');
  check(allowedServer('data:text/html,hi', prod) === null, 'data: rejected');
  check(allowedServer('https://user:pw@games.example.com', prod) === null, 'credentials in URL rejected');
  check(allowedServer('https://games.example.com/../x?y', prod) === null, 'path/query rejected');
  check(allowedServer('https://games.example.com', prod) === 'https://games.example.com', 'allow-listed server accepted');
  check(allowedServer('https://games.example.com.evil.example', prod) === null, 'look-alike host rejected');
  check(allowedServer('http://localhost:8787', prod) === 'http://localhost:8787', 'localhost accepted');
  check(allowedServer('http://192.168.1.20:8787', prod) === null, 'LAN rejected in production build');
  check(allowedServer('http://192.168.1.20:8787', dev) === 'http://192.168.1.20:8787', 'LAN accepted in dev build');
}

console.log(failures ? `${failures} checks failed` : 'All engine and security checks passed (200,000 spins)');
process.exit(failures ? 1 : 0);
