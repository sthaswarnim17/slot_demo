import { GameSession, type BaseSpinResult, type FreeSpinResult, type FreeSpinsState } from '../engine/engine';
import { SecureRng } from '../engine/rng';
import { START_BALANCE } from '../engine/config';
import {
  allowedServer, errorMessage, parseBaseSpin, parseBuy, parseFreeSpin, parseFsState, parsePublicState, parseSession,
  type PublicState,
} from './validate';

export type { PublicState };

/** Where spin outcomes come from. The client only animates what the backend decides. */
export interface Backend {
  readonly mode: 'local' | 'server';
  init(): Promise<PublicState>;
  spin(bet: number): Promise<BaseSpinResult>;
  buy(bet: number): Promise<{ cost: number; balance: number }>;
  chooseClimb(option: number): Promise<FreeSpinsState>;
  freeSpin(): Promise<FreeSpinResult>;
  topUp(): Promise<PublicState>;
}

const pub = (s: GameSession): PublicState => ({
  balance: s.state.balance, ember: s.state.ember, emberCharged: s.state.emberCharged,
  awaitingClimb: s.state.awaitingClimb, fs: s.state.fs ? { ...s.state.fs } : null,
});

/**
 * Runs the engine in the browser with Web Crypto RNG. Used for the stand-alone demo link.
 *
 * Anything in the browser can be changed by the person holding it (devtools, a proxy, an edited
 * copy of the page), so this mode is for free-play demos only. Real stakes need ServerBackend
 * against a server that owns the RNG and the wallet.
 */
export class LocalBackend implements Backend {
  readonly mode = 'local' as const;
  // `#s` is a true private field, so the session is not reachable as a property of the backend.
  readonly #s = new GameSession(new SecureRng(), START_BALANCE);
  async init() { return pub(this.#s); }
  async spin(bet: number) { return this.#s.spin(bet); }
  async buy(bet: number) { return this.#s.buyFreeSpins(bet); }
  async chooseClimb(o: number) { return this.#s.chooseClimb(o); }
  async freeSpin() { return this.#s.freeSpin(); }
  async topUp() { this.#s.topUp(START_BALANCE); return pub(this.#s); }
}

const TIMEOUT_MS = 10_000;

/** Talks to server/server.ts, which owns the RNG and the balance. */
export class ServerBackend implements Backend {
  readonly mode = 'server' as const;
  #sid = '';
  constructor(private base: string) {}
  private async call(path: string, body: Record<string, unknown> = {}): Promise<unknown> {
    const ctl = new AbortController();
    const timer = setTimeout(() => ctl.abort(), TIMEOUT_MS);
    let r: Response;
    try {
      r = await fetch(this.base + path, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ ...body, sid: this.#sid }),
        credentials: 'omit',
        redirect: 'error',
        referrerPolicy: 'no-referrer',
        cache: 'no-store',
        signal: ctl.signal,
      });
    } catch {
      throw new Error('Cannot reach the game server');
    } finally {
      clearTimeout(timer);
    }
    let j: unknown = null;
    try { j = await r.json(); } catch { /* handled below */ }
    if (!r.ok) throw new Error(errorMessage(j));
    return j;
  }
  async init() { const r = parseSession(await this.call('/session')); this.#sid = r.sid; return parsePublicState(r); }
  async spin(bet: number) { return parseBaseSpin(await this.call('/spin', { bet })); }
  async buy(bet: number) { return parseBuy(await this.call('/buy', { bet })); }
  async chooseClimb(option: number) { return parseFsState(await this.call('/climb', { option })); }
  async freeSpin() { return parseFreeSpin(await this.call('/free-spin')); }
  async topUp() { return parsePublicState(await this.call('/top-up')); }
}

export interface BackendChoice { backend: Backend; rejectedServer?: string }

export function pickBackend(): BackendChoice {
  const raw = new URLSearchParams(location.search).get('server');
  if (!raw) return { backend: new LocalBackend() };
  const allowList = String(import.meta.env.VITE_GAME_SERVERS ?? '')
    .split(',').map(s => s.trim()).filter(Boolean)
    .map(s => { try { return new URL(s).origin; } catch { return ''; } }).filter(Boolean);
  const origin = allowedServer(raw, { pageOrigin: location.origin, dev: import.meta.env.DEV, allowList });
  if (!origin) return { backend: new LocalBackend(), rejectedServer: raw };
  return { backend: new ServerBackend(origin) };
}
