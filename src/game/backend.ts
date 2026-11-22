import { GameSession, type BaseSpinResult, type FreeSpinResult, type FreeSpinsState } from '../engine/engine';
import { SecureRng } from '../engine/rng';
import { START_BALANCE } from '../engine/config';

export interface PublicState {
  balance: number;
  ember: number;
  emberCharged: boolean;
  awaitingClimb: boolean;
  fs: FreeSpinsState | null;
}

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

/** Runs the engine in the browser with Web Crypto RNG. Used for the stand-alone demo link. */
export class LocalBackend implements Backend {
  readonly mode = 'local' as const;
  private s = new GameSession(new SecureRng(), START_BALANCE);
  async init() { return pub(this.s); }
  async spin(bet: number) { return this.s.spin(bet); }
  async buy(bet: number) { return this.s.buyFreeSpins(bet); }
  async chooseClimb(o: number) { return this.s.chooseClimb(o); }
  async freeSpin() { return this.s.freeSpin(); }
  async topUp() { this.s.topUp(START_BALANCE); return pub(this.s); }
}

/** Talks to server/server.ts, which owns the RNG and the balance. */
export class ServerBackend implements Backend {
  readonly mode = 'server' as const;
  private sid = '';
  constructor(private base: string) {}
  private async call<T>(path: string, body: Record<string, unknown> = {}): Promise<T> {
    const r = await fetch(this.base + path, {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ sid: this.sid, ...body }),
    });
    const j = await r.json();
    if (!r.ok) throw new Error(j.error || 'Server error');
    return j as T;
  }
  async init() { const r = await this.call<PublicState & { sid: string }>('/session'); this.sid = r.sid; return r; }
  spin(bet: number) { return this.call<BaseSpinResult>('/spin', { bet }); }
  buy(bet: number) { return this.call<{ cost: number; balance: number }>('/buy', { bet }); }
  chooseClimb(option: number) { return this.call<FreeSpinsState>('/climb', { option }); }
  freeSpin() { return this.call<FreeSpinResult>('/free-spin'); }
  topUp() { return this.call<PublicState>('/top-up'); }
}

export function pickBackend(): Backend {
  const server = new URLSearchParams(location.search).get('server');
  return server ? new ServerBackend(server.replace(/\/$/, '')) : new LocalBackend();
}
