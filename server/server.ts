/**
 * Minimal authoritative game server for Lantern Summit.
 * The server owns the RNG (Web Crypto) and the demo balance; the client only animates results.
 *
 *   npm run server            # listens on 127.0.0.1:8787
 *   open http://localhost:5173/?server=http://localhost:8787
 *
 * Settings (environment variables):
 *   PORT             default 8787
 *   HOST             default 127.0.0.1. Use 0.0.0.0 to test from a phone on the same Wi-Fi.
 *   ALLOWED_ORIGINS  comma-separated browser origins allowed to call the API (CORS).
 *                    Default: the Vite dev and preview servers on localhost.
 *   MAX_SESSIONS     cap on live sessions, default 5000.
 *
 * Demo credits only. A real-money deployment needs an operator platform, wallet integration,
 * authenticated players and a certified RNG; this server is the starting point for that work.
 */
import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import { randomUUID } from 'node:crypto';
import { GameSession } from '../src/engine/engine';
import { SecureRng } from '../src/engine/rng';
import { START_BALANCE } from '../src/engine/config';

const PORT = Number(process.env.PORT ?? 8787);
const HOST = process.env.HOST ?? '127.0.0.1';
const MAX_SESSIONS = Number(process.env.MAX_SESSIONS ?? 5000);
const MAX_BODY = 4_096;
const SESSION_IDLE_MS = 2 * 3600_000;
const ALLOWED_ORIGINS = new Set(
  (process.env.ALLOWED_ORIGINS ?? 'http://localhost:5173,http://127.0.0.1:5173,http://localhost:4173,http://127.0.0.1:4173')
    .split(',').map(s => s.trim()).filter(Boolean),
);

// Simple fixed-window rate limits per client address.
const RATE_WINDOW_MS = 10_000;
const RATE_MAX_REQUESTS = 100; // ~10 calls a second is far above what the animated client needs
const RATE_MAX_NEW_SESSIONS = 5;

/** Errors whose message is safe to show the player. Anything else is reported generically. */
class ClientError extends Error {
  constructor(public code: number, message: string) { super(message); }
}

const sessions = new Map<string, { s: GameSession; seen: number }>();
const rates = new Map<string, { start: number; n: number; created: number }>();

const pub = (s: GameSession) => ({
  balance: s.state.balance, ember: s.state.ember, emberCharged: s.state.emberCharged,
  awaitingClimb: s.state.awaitingClimb, fs: s.state.fs,
});

function headers(req: IncomingMessage): Record<string, string> {
  const h: Record<string, string> = {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-store',
    'x-content-type-options': 'nosniff',
    'referrer-policy': 'no-referrer',
    'cross-origin-resource-policy': 'same-site',
    vary: 'Origin',
  };
  const origin = req.headers.origin;
  if (origin && ALLOWED_ORIGINS.has(origin)) {
    h['access-control-allow-origin'] = origin;
    h['access-control-allow-methods'] = 'POST, GET, OPTIONS';
    h['access-control-allow-headers'] = 'content-type';
    h['access-control-max-age'] = '600';
  }
  return h;
}

function send(req: IncomingMessage, res: ServerResponse, code: number, body?: unknown) {
  res.writeHead(code, headers(req));
  res.end(body === undefined ? undefined : JSON.stringify(body));
}

async function readJson(req: IncomingMessage): Promise<Record<string, unknown>> {
  const type = String(req.headers['content-type'] ?? '');
  if (!type.toLowerCase().startsWith('application/json')) throw new ClientError(415, 'Expected application/json');
  const chunks: Buffer[] = [];
  let size = 0;
  for await (const chunk of req as AsyncIterable<Buffer>) {
    size += chunk.length;
    if (size > MAX_BODY) throw new ClientError(413, 'Body too large');
    chunks.push(chunk);
  }
  if (size === 0) return {};
  let v: unknown;
  try { v = JSON.parse(Buffer.concat(chunks).toString('utf8')); } catch { throw new ClientError(400, 'Invalid JSON'); }
  if (typeof v !== 'object' || v === null || Array.isArray(v)) throw new ClientError(400, 'Invalid body');
  return v as Record<string, unknown>;
}

function rateLimit(ip: string, creating: boolean) {
  const now = Date.now();
  let r = rates.get(ip);
  if (!r || now - r.start > RATE_WINDOW_MS) { r = { start: now, n: 0, created: 0 }; rates.set(ip, r); }
  r.n++;
  if (creating) r.created++;
  if (r.n > RATE_MAX_REQUESTS || r.created > RATE_MAX_NEW_SESSIONS) throw new ClientError(429, 'Too many requests');
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

function getSession(body: Record<string, unknown>) {
  const sid = body.sid;
  const entry = typeof sid === 'string' && UUID.test(sid) ? sessions.get(sid) : undefined;
  if (!entry) throw new ClientError(401, 'Unknown session');
  entry.seen = Date.now();
  return entry.s;
}

/** Engine rule violations (bad bet, wrong phase, no credits) are safe to show the player. */
function play<T>(fn: () => T): T {
  try { return fn(); } catch (e) { throw new ClientError(400, (e as Error).message); }
}

const server = createServer(async (req, res) => {
  const url = (req.url ?? '').split('?')[0];
  try {
    // Browsers send an Origin header on cross-origin calls. Refuse origins we don't know, so
    // other websites cannot drive sessions from a visitor's browser.
    const origin = req.headers.origin;
    if (origin && !ALLOWED_ORIGINS.has(origin)) throw new ClientError(403, 'Origin not allowed');
    if (req.method === 'OPTIONS') return send(req, res, 204);
    if (req.method === 'GET' && url === '/health') return send(req, res, 200, { ok: true });
    if (req.method !== 'POST') throw new ClientError(404, 'Not found');

    rateLimit(req.socket.remoteAddress ?? 'unknown', url === '/session');
    const body = await readJson(req);

    if (url === '/session') {
      if (sessions.size >= MAX_SESSIONS) throw new ClientError(503, 'Server busy, try again later');
      const sid = randomUUID();
      const s = new GameSession(new SecureRng(), START_BALANCE);
      sessions.set(sid, { s, seen: Date.now() });
      return send(req, res, 200, { sid, ...pub(s) });
    }
    const s = getSession(body);
    switch (url) {
      case '/spin':
        return send(req, res, 200, play(() => s.spin(body.bet as number)));
      case '/buy':
        return send(req, res, 200, play(() => s.buyFreeSpins(body.bet as number)));
      case '/climb':
        return send(req, res, 200, play(() => s.chooseClimb(body.option as number)));
      case '/free-spin':
        return send(req, res, 200, play(() => s.freeSpin()));
      case '/top-up':
        play(() => s.topUp(START_BALANCE));
        return send(req, res, 200, pub(s));
      default:
        throw new ClientError(404, 'Not found');
    }
  } catch (e) {
    if (e instanceof ClientError) return send(req, res, e.code, { error: e.message });
    console.error(e);
    return send(req, res, 500, { error: 'Server error' });
  }
});
server.requestTimeout = 10_000;
server.headersTimeout = 5_000;
server.listen(PORT, HOST, () => console.log(`Lantern Summit server on http://${HOST}:${PORT}`));

// drop idle sessions and stale rate-limit windows
setInterval(() => {
  const now = Date.now();
  for (const [k, v] of sessions) if (now - v.seen > SESSION_IDLE_MS) sessions.delete(k);
  for (const [k, v] of rates) if (now - v.start > RATE_WINDOW_MS) rates.delete(k);
}, 60_000).unref();
