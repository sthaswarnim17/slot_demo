/**
 * Strict parsers for everything the game server sends back.
 *
 * The client renders server data into the page, so a server response is untrusted input.
 * Each parser checks types and ranges, then rebuilds the object from known fields only, so a
 * malicious or buggy server cannot inject markup, prototype keys or NaN into the UI.
 */
import { COLS, ROWS, SYM, PAYING_SYMBOLS } from '../engine/config';
import type {
  BaseSpinResult, Cell, ClusterWin, FreeSpinResult, FreeSpinsState, Grid, SpinSequence, TumbleStep,
} from '../engine/engine';

export interface PublicState {
  balance: number;
  ember: number;
  emberCharged: boolean;
  awaitingClimb: boolean;
  fs: FreeSpinsState | null;
}

const MAX_SYMBOL = SYM.LANTERN;
const MAX_STEPS = 500;

class BadResponse extends Error {
  constructor(what: string) { super(`Unexpected server response (${what})`); }
}

type Obj = Record<string, unknown>;

function obj(v: unknown, what: string): Obj {
  if (typeof v !== 'object' || v === null || Array.isArray(v)) throw new BadResponse(what);
  return v as Obj;
}
function arr(v: unknown, what: string, max = 10_000): unknown[] {
  if (!Array.isArray(v) || v.length > max) throw new BadResponse(what);
  return v;
}
function num(v: unknown, what: string, min = -Infinity, max = Infinity): number {
  if (typeof v !== 'number' || !Number.isFinite(v) || v < min || v > max) throw new BadResponse(what);
  return v;
}
function int(v: unknown, what: string, min: number, max: number): number {
  const n = num(v, what, min, max);
  if (!Number.isInteger(n)) throw new BadResponse(what);
  return n;
}
function bool(v: unknown, what: string): boolean {
  if (typeof v !== 'boolean') throw new BadResponse(what);
  return v;
}

function cell(v: unknown): Cell {
  const o = obj(v, 'cell');
  const s = int(o.s, 'symbol', 0, MAX_SYMBOL);
  if (s === SYM.LANTERN) return { s, m: num(o.m, 'lantern value', 0, 1e6) };
  return { s };
}

function grid(v: unknown): Grid {
  const cols = arr(v, 'grid', COLS);
  if (cols.length !== COLS) throw new BadResponse('grid');
  return cols.map(c => {
    const rows = arr(c, 'grid column', ROWS);
    if (rows.length !== ROWS) throw new BadResponse('grid column');
    return rows.map(cell);
  });
}

function win(v: unknown): ClusterWin {
  const o = obj(v, 'win');
  return {
    symbol: int(o.symbol, 'win symbol', 0, PAYING_SYMBOLS - 1),
    count: int(o.count, 'win count', 0, COLS * ROWS),
    pay: num(o.pay, 'win pay', 0),
    positions: arr(o.positions, 'win positions', COLS * ROWS).map(p => {
      const pair = arr(p, 'position', 2);
      return [int(pair[0], 'col', 0, COLS - 1), int(pair[1], 'row', 0, ROWS - 1)] as [number, number];
    }),
  };
}

function step(v: unknown): TumbleStep {
  const o = obj(v, 'step');
  const dropped = arr(o.dropped, 'dropped', COLS).map(d => int(d, 'dropped', 0, ROWS));
  if (dropped.length !== COLS) throw new BadResponse('dropped');
  return { wins: arr(o.wins, 'wins', PAYING_SYMBOLS).map(win), stepWin: num(o.stepWin, 'step win', 0), grid: grid(o.grid), dropped };
}

function sequence(v: unknown): SpinSequence {
  const o = obj(v, 'sequence');
  return {
    grid: grid(o.grid),
    steps: arr(o.steps, 'steps', MAX_STEPS).map(step),
    finalGrid: grid(o.finalGrid),
    tumbleWin: num(o.tumbleWin, 'tumble win', 0),
    lanterns: arr(o.lanterns, 'lanterns', COLS * ROWS).map(l => {
      const lo = obj(l, 'lantern');
      return { col: int(lo.col, 'lantern col', 0, COLS - 1), row: int(lo.row, 'lantern row', 0, ROWS - 1), value: num(lo.value, 'lantern value', 0, 1e6) };
    }),
    scatters: int(o.scatters, 'scatters', 0, COLS * ROWS),
  };
}

export function parseFsState(v: unknown): FreeSpinsState {
  const o = obj(v, 'free spins');
  return {
    option: int(o.option, 'option', 0, 99),
    bet: num(o.bet, 'bet', 0),
    remaining: int(o.remaining, 'remaining', 0, 10_000),
    played: int(o.played, 'played', 0, 10_000),
    mult: num(o.mult, 'multiplier', 0),
    roundTotal: num(o.roundTotal, 'round total', 0),
  };
}

export function parsePublicState(v: unknown): PublicState {
  const o = obj(v, 'state');
  return {
    balance: num(o.balance, 'balance', 0),
    ember: int(o.ember, 'ember', 0, 1000),
    emberCharged: bool(o.emberCharged, 'ember charged'),
    awaitingClimb: bool(o.awaitingClimb, 'awaiting climb'),
    fs: o.fs === null || o.fs === undefined ? null : parseFsState(o.fs),
  };
}

export function parseSession(v: unknown): PublicState & { sid: string } {
  const o = obj(v, 'session');
  if (typeof o.sid !== 'string' || !/^[A-Za-z0-9-]{8,64}$/.test(o.sid)) throw new BadResponse('session id');
  return { sid: o.sid, ...parsePublicState(o) };
}

export function parseBaseSpin(v: unknown): BaseSpinResult {
  const o = obj(v, 'spin');
  if (o.kind !== 'base') throw new BadResponse('spin kind');
  return {
    kind: 'base',
    bet: num(o.bet, 'bet', 0),
    seq: sequence(o.seq),
    lanternSum: num(o.lanternSum, 'lantern sum', 0),
    emberBoost: num(o.emberBoost, 'ember boost', 0),
    multiplier: num(o.multiplier, 'multiplier', 0),
    clusterWin: num(o.clusterWin, 'cluster win', 0),
    scatterWin: num(o.scatterWin, 'scatter win', 0),
    win: num(o.win, 'win', 0),
    emberBefore: int(o.emberBefore, 'ember', 0, 1000),
    emberAfter: int(o.emberAfter, 'ember', 0, 1000),
    emberCharged: bool(o.emberCharged, 'ember charged'),
    emberJustCharged: bool(o.emberJustCharged, 'ember just charged'),
    triggeredFreeSpins: bool(o.triggeredFreeSpins, 'triggered'),
    balance: num(o.balance, 'balance', 0),
    capped: bool(o.capped, 'capped'),
  };
}

export function parseFreeSpin(v: unknown): FreeSpinResult {
  const o = obj(v, 'free spin');
  if (o.kind !== 'free') throw new BadResponse('free spin kind');
  return {
    kind: 'free',
    bet: num(o.bet, 'bet', 0),
    seq: sequence(o.seq),
    lanternSum: num(o.lanternSum, 'lantern sum', 0),
    multBefore: num(o.multBefore, 'multiplier', 0),
    multAfter: num(o.multAfter, 'multiplier', 0),
    clusterWin: num(o.clusterWin, 'cluster win', 0),
    scatterWin: num(o.scatterWin, 'scatter win', 0),
    win: num(o.win, 'win', 0),
    retriggered: bool(o.retriggered, 'retriggered'),
    remaining: int(o.remaining, 'remaining', 0, 10_000),
    played: int(o.played, 'played', 0, 10_000),
    roundTotal: num(o.roundTotal, 'round total', 0),
    finished: bool(o.finished, 'finished'),
    capped: bool(o.capped, 'capped'),
    balance: num(o.balance, 'balance', 0),
  };
}

export function parseBuy(v: unknown): { cost: number; balance: number } {
  const o = obj(v, 'buy');
  return { cost: num(o.cost, 'cost', 0), balance: num(o.balance, 'balance', 0) };
}

/** Pulls a short, plain-text error message out of an error response. */
export function errorMessage(v: unknown): string {
  const e = typeof v === 'object' && v !== null ? (v as Obj).error : undefined;
  return typeof e === 'string' ? e.replace(/[^\x20-\x7E]/g, '').slice(0, 120) || 'Server error' : 'Server error';
}

// ---------------------------------------------------------------- server URL policy

const LOOPBACK = /^(localhost|127(?:\.\d{1,3}){3}|\[::1\])$/i;
const PRIVATE_LAN = /^(10(?:\.\d{1,3}){3}|192\.168(?:\.\d{1,3}){2}|172\.(?:1[6-9]|2\d|3[01])(?:\.\d{1,3}){2}|[a-z0-9-]+\.local)$/i;

/**
 * Decides whether the `?server=` query parameter may be used.
 *
 * Without this, anyone could send a link like `...github.io/slot_demo/?server=https://evil.example`
 * and the trusted game page would show whatever balances and wins that server invents (a phishing
 * vector), and feed attacker-controlled data into the UI. Allowed:
 * - the page's own origin
 * - loopback (localhost, 127.x, [::1]) for local testing
 * - private LAN addresses, only in a dev build (phone testing with `npm run dev`)
 * - origins listed at build time in VITE_GAME_SERVERS (comma separated)
 * Returns the normalised origin, or null if the URL is not allowed.
 */
export function allowedServer(raw: string, opts: { pageOrigin: string; dev: boolean; allowList: string[] }): string | null {
  let u: URL;
  try { u = new URL(raw); } catch { return null; }
  if (u.protocol !== 'http:' && u.protocol !== 'https:') return null;
  if (u.username || u.password || u.search || u.hash) return null;
  if (u.pathname !== '/' && u.pathname !== '') return null;
  const origin = u.origin;
  if (origin === opts.pageOrigin) return origin;
  if (opts.allowList.includes(origin)) return origin;
  if (LOOPBACK.test(u.hostname)) return origin;
  if (opts.dev && PRIVATE_LAN.test(u.hostname)) return origin;
  return null;
}
