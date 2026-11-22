import {
  BASE_MODE, CLIMB_OPTIONS, COLS, ROWS, MIN_CLUSTER, PAYING_SYMBOLS, PAYTABLE, SYM,
  scatterPay, FS_TRIGGER, FS_RETRIGGER, FS_RETRIGGER_SPINS, MAX_WIN,
  EMBER_MAX, EMBER_BOOST_VALUES, BUY_COST, EMBER_BOOST_WEIGHTS,
  type ClimbOption, type ReelMode,
} from './config';
import type { Rng } from './rng';

/** A grid cell: symbol id, plus multiplier value for sky lanterns. */
export interface Cell { s: number; m?: number }
/** grid[col][row], row 0 is the top row. */
export type Grid = Cell[][];

export interface ClusterWin {
  symbol: number;
  count: number;
  pay: number; // x bet
  positions: [number, number][]; // [col,row]
}

export interface TumbleStep {
  wins: ClusterWin[];
  stepWin: number; // x bet
  /** grid after winners removed and new symbols dropped in */
  grid: Grid;
  /** per column: how many new cells were dropped in at the top */
  dropped: number[];
}

export interface SpinSequence {
  grid: Grid; // initial grid
  steps: TumbleStep[];
  finalGrid: Grid;
  tumbleWin: number; // x bet, before multipliers
  lanterns: { col: number; row: number; value: number }[]; // on the final grid
  scatters: number;
}

function pickWeighted(rng: Rng, weights: number[], total: number): number {
  let r = rng.next() * total;
  for (let i = 0; i < weights.length; i++) {
    r -= weights[i];
    if (r < 0) return i;
  }
  return weights.length - 1;
}

const sum = (a: number[]) => a.reduce((x, y) => x + y, 0);
const totalsCache = new WeakMap<ReelMode, [number, number]>();
function totals(mode: ReelMode): [number, number] {
  let t = totalsCache.get(mode);
  if (!t) { t = [sum(mode.weights), sum(mode.lanternWeights)]; totalsCache.set(mode, t); }
  return t;
}

export function randomCell(rng: Rng, mode: ReelMode): Cell {
  const [tw, tl] = totals(mode);
  const s = pickWeighted(rng, mode.weights, tw);
  if (s === SYM.LANTERN) {
    return { s, m: mode.lanternValues[pickWeighted(rng, mode.lanternWeights, tl)] };
  }
  return { s };
}

export function randomGrid(rng: Rng, mode: ReelMode): Grid {
  const g: Grid = [];
  for (let c = 0; c < COLS; c++) {
    const col: Cell[] = [];
    for (let r = 0; r < ROWS; r++) col.push(randomCell(rng, mode));
    g.push(col);
  }
  return g;
}

export function payFor(symbol: number, count: number): number {
  if (count < MIN_CLUSTER) return 0;
  const p = PAYTABLE[symbol];
  return count >= 12 ? p[2] : count >= 10 ? p[1] : p[0];
}

export function evaluate(grid: Grid): ClusterWin[] {
  const counts = new Array(PAYING_SYMBOLS).fill(0);
  for (let c = 0; c < COLS; c++) for (let r = 0; r < ROWS; r++) {
    const s = grid[c][r].s;
    if (s < PAYING_SYMBOLS) counts[s]++;
  }
  const wins: ClusterWin[] = [];
  for (let s = 0; s < PAYING_SYMBOLS; s++) {
    if (counts[s] >= MIN_CLUSTER) {
      const positions: [number, number][] = [];
      for (let c = 0; c < COLS; c++) for (let r = 0; r < ROWS; r++) if (grid[c][r].s === s) positions.push([c, r]);
      wins.push({ symbol: s, count: counts[s], pay: payFor(s, counts[s]), positions });
    }
  }
  return wins;
}

const cloneGrid = (g: Grid): Grid => g.map(col => col.map(cell => ({ ...cell })));

/** Play one spin with tumbles. Winning symbols vanish; scatters and lanterns stay until the end. */
export function playSequence(rng: Rng, mode: ReelMode, initial?: Grid): SpinSequence {
  const grid = initial ?? randomGrid(rng, mode);
  let cur = grid;
  const steps: TumbleStep[] = [];
  let tumbleWin = 0;
  for (;;) {
    const wins = evaluate(cur);
    if (wins.length === 0) break;
    const stepWin = wins.reduce((a, w) => a + w.pay, 0);
    tumbleWin += stepWin;
    const remove = new Set<number>();
    for (const w of wins) for (const [c, r] of w.positions) remove.add(c * ROWS + r);
    const next: Grid = [];
    const dropped: number[] = [];
    for (let c = 0; c < COLS; c++) {
      const survivors = cur[c].filter((_, r) => !remove.has(c * ROWS + r)).map(x => ({ ...x }));
      const n = ROWS - survivors.length;
      const fresh: Cell[] = [];
      for (let i = 0; i < n; i++) fresh.push(randomCell(rng, mode));
      next.push([...fresh, ...survivors]);
      dropped.push(n);
    }
    steps.push({ wins, stepWin, grid: next, dropped });
    cur = next;
  }
  const lanterns: SpinSequence['lanterns'] = [];
  let scatters = 0;
  for (let c = 0; c < COLS; c++) for (let r = 0; r < ROWS; r++) {
    const cell = cur[c][r];
    if (cell.s === SYM.LANTERN) lanterns.push({ col: c, row: r, value: cell.m! });
    else if (cell.s === SYM.SCATTER) scatters++;
  }
  return { grid, steps, finalGrid: cur, tumbleWin, lanterns, scatters };
}

const round2 = (x: number) => Math.round(x * 100) / 100;

// ---------------------------------------------------------------- session

export interface BaseSpinResult {
  kind: 'base';
  bet: number;
  seq: SpinSequence;
  lanternSum: number;
  emberBoost: number; // value of the ember charge applied on this spin (0 if none)
  multiplier: number; // total multiplier applied to tumble wins (1 if none)
  clusterWin: number; // credits, after multiplier
  scatterWin: number; // credits
  win: number; // credits total for this spin
  emberBefore: number;
  emberAfter: number;
  emberCharged: boolean; // charge state after this spin
  emberJustCharged: boolean;
  triggeredFreeSpins: boolean;
  balance: number;
  capped: boolean;
}

export interface FreeSpinResult {
  kind: 'free';
  bet: number;
  seq: SpinSequence;
  lanternSum: number;
  multBefore: number;
  multAfter: number;
  clusterWin: number;
  scatterWin: number;
  win: number;
  retriggered: boolean;
  remaining: number;
  played: number;
  roundTotal: number;
  finished: boolean;
  capped: boolean;
  balance: number;
}

export interface FreeSpinsState {
  option: number;
  bet: number;
  remaining: number;
  played: number;
  mult: number;
  roundTotal: number; // credits won in FS + trigger spin
}

export interface SessionState {
  balance: number;
  ember: number;
  emberCharged: boolean;
  awaitingClimb: boolean;
  fs: FreeSpinsState | null;
  pendingBet: number;
  pendingTriggerWin: number;
}

export class GameSession {
  state: SessionState;
  constructor(
    private rng: Rng,
    balance: number,
    private climbs: ClimbOption[] = CLIMB_OPTIONS,
    private baseMode: ReelMode = BASE_MODE,
  ) {
    this.state = { balance, ember: 0, emberCharged: false, awaitingClimb: false, fs: null, pendingBet: 0, pendingTriggerWin: 0 };
  }

  get busy() { return this.state.awaitingClimb || this.state.fs !== null; }

  spin(bet: number): BaseSpinResult {
    const st = this.state;
    if (this.busy) throw new Error('Free spins in progress');
    if (bet <= 0 || bet > st.balance + 1e-9) throw new Error('Insufficient demo credits');
    st.balance = round2(st.balance - bet);

    const seq = playSequence(this.rng, this.baseMode);
    const lanternSum = seq.lanterns.reduce((a, l) => a + l.value, 0);
    let emberBoost = 0;
    const emberBefore = st.ember;
    if (st.emberCharged && seq.tumbleWin > 0) {
      emberBoost = EMBER_BOOST_VALUES[pickWeighted(this.rng, EMBER_BOOST_WEIGHTS, sum(EMBER_BOOST_WEIGHTS))];
      st.emberCharged = false;
      st.ember = 0;
    }
    const multiplier = seq.tumbleWin > 0 && lanternSum + emberBoost > 0 ? lanternSum + emberBoost : 1;
    let clusterX = seq.tumbleWin * multiplier;
    const scatterX = scatterPay(seq.scatters);
    let capped = false;
    if (clusterX + scatterX >= MAX_WIN) { clusterX = MAX_WIN - scatterX; capped = true; }

    let emberJustCharged = false;
    if (!st.emberCharged) {
      st.ember += seq.steps.length;
      if (st.ember >= EMBER_MAX) { st.ember = EMBER_MAX; st.emberCharged = true; emberJustCharged = true; }
    }

    const clusterWin = round2(clusterX * bet);
    const scatterWin = round2(scatterX * bet);
    const win = round2(clusterWin + scatterWin);
    st.balance = round2(st.balance + win);
    const triggeredFreeSpins = seq.scatters >= FS_TRIGGER && !capped;
    if (triggeredFreeSpins) {
      st.awaitingClimb = true;
      st.pendingBet = bet;
      st.pendingTriggerWin = win;
    }
    return {
      kind: 'base', bet, seq, lanternSum, emberBoost, multiplier, clusterWin, scatterWin, win,
      emberBefore, emberAfter: st.ember, emberCharged: st.emberCharged, emberJustCharged,
      triggeredFreeSpins, balance: st.balance, capped,
    };
  }

  chooseClimb(option: number): FreeSpinsState {
    const st = this.state;
    if (!st.awaitingClimb) throw new Error('No free spins to start');
    const o = this.climbs[option];
    if (!o) throw new Error('Unknown option');
    st.awaitingClimb = false;
    st.fs = { option, bet: st.pendingBet, remaining: o.spins, played: 0, mult: o.startMult, roundTotal: st.pendingTriggerWin };
    return { ...st.fs };
  }

  freeSpin(): FreeSpinResult {
    const st = this.state;
    const fs = st.fs;
    if (!fs) throw new Error('No free spins active');
    const o = this.climbs[fs.option];
    const seq = playSequence(this.rng, o.mode);
    const lanternSum = seq.lanterns.reduce((a, l) => a + l.value, 0);
    const multBefore = fs.mult;
    if (seq.tumbleWin > 0) fs.mult += lanternSum;
    let clusterX = seq.tumbleWin * fs.mult;
    const scatterX = scatterPay(seq.scatters);
    const roomX = MAX_WIN - fs.roundTotal / fs.bet;
    let capped = false;
    if (clusterX + scatterX >= roomX) { clusterX = Math.max(0, roomX - scatterX); capped = true; }
    const clusterWin = round2(clusterX * fs.bet);
    const scatterWin = round2(Math.min(scatterX, roomX) * fs.bet);
    const win = round2(clusterWin + scatterWin);
    fs.roundTotal = round2(fs.roundTotal + win);
    st.balance = round2(st.balance + win);
    fs.remaining--;
    fs.played++;
    const retriggered = !capped && seq.scatters >= FS_RETRIGGER;
    if (retriggered) fs.remaining += FS_RETRIGGER_SPINS;
    const finished = capped || fs.remaining <= 0;
    const res: FreeSpinResult = {
      kind: 'free', bet: fs.bet, seq, lanternSum, multBefore, multAfter: fs.mult, clusterWin, scatterWin, win,
      retriggered, remaining: fs.remaining, played: fs.played, roundTotal: fs.roundTotal, finished, capped, balance: st.balance,
    };
    if (finished) st.fs = null;
    return res;
  }

  /** Bonus buy: pay BUY_COST x bet to go straight to the climb choice. */
  buyFreeSpins(bet: number): { cost: number; balance: number } {
    const st = this.state;
    if (this.busy) throw new Error('Free spins in progress');
    const cost = round2(bet * BUY_COST);
    if (cost > st.balance + 1e-9) throw new Error('Insufficient demo credits');
    st.balance = round2(st.balance - cost);
    st.awaitingClimb = true;
    st.pendingBet = bet;
    st.pendingTriggerWin = 0;
    return { cost, balance: st.balance };
  }

  /** Demo top-up so a showcase never runs dry. */
  topUp(amount: number) { this.state.balance = round2(this.state.balance + amount); }
}
