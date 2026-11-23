/**
 * Minimal authoritative game server for Lantern Summit.
 * The server owns the RNG (Web Crypto) and the demo balance; the client only animates results.
 *
 *   npm run server            # listens on :8787
 *   open http://localhost:5173/?server=http://localhost:8787
 *
 * Demo credits only. A real-money deployment needs an operator platform, wallet integration
 * and a certified RNG; this server is the starting point for that integration.
 */
import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import { randomUUID } from 'node:crypto';
import { GameSession } from '../src/engine/engine';
import { SecureRng } from '../src/engine/rng';
import { START_BALANCE, BET_LEVELS } from '../src/engine/config';

const PORT = Number(process.env.PORT ?? 8787);
const sessions = new Map<string, { s: GameSession; seen: number }>();

const pub = (s: GameSession) => ({
  balance: s.state.balance, ember: s.state.ember, emberCharged: s.state.emberCharged,
  awaitingClimb: s.state.awaitingClimb, fs: s.state.fs,
});

function send(res: ServerResponse, code: number, body: unknown) {
  res.writeHead(code, {
    'content-type': 'application/json',
    'access-control-allow-origin': '*',
    'access-control-allow-headers': 'content-type',
  });
  res.end(JSON.stringify(body));
}

async function readJson(req: IncomingMessage): Promise<Record<string, unknown>> {
  let data = '';
  for await (const chunk of req) { data += chunk; if (data.length > 10_000) throw new Error('Body too large'); }
  return data ? JSON.parse(data) : {};
}

createServer(async (req, res) => {
  if (req.method === 'OPTIONS') return send(res, 204, {});
  if (req.method === 'GET' && req.url === '/health') return send(res, 200, { ok: true, sessions: sessions.size });
  if (req.method !== 'POST') return send(res, 404, { error: 'Not found' });
  try {
    const body = await readJson(req);
    if (req.url === '/session') {
      const sid = randomUUID();
      const s = new GameSession(new SecureRng(), START_BALANCE);
      sessions.set(sid, { s, seen: Date.now() });
      return send(res, 200, { sid, ...pub(s) });
    }
    const entry = sessions.get(String(body.sid ?? ''));
    if (!entry) return send(res, 401, { error: 'Unknown session' });
    entry.seen = Date.now();
    const s = entry.s;
    const bet = Number(body.bet);
    switch (req.url) {
      case '/spin':
        if (!BET_LEVELS.includes(bet)) return send(res, 400, { error: 'Invalid bet' });
        return send(res, 200, s.spin(bet));
      case '/buy':
        if (!BET_LEVELS.includes(bet)) return send(res, 400, { error: 'Invalid bet' });
        return send(res, 200, s.buyFreeSpins(bet));
      case '/climb':
        return send(res, 200, s.chooseClimb(Number(body.option)));
      case '/free-spin':
        return send(res, 200, s.freeSpin());
      case '/top-up':
        s.state.balance = START_BALANCE;
        return send(res, 200, pub(s));
      default:
        return send(res, 404, { error: 'Not found' });
    }
  } catch (e) {
    return send(res, 400, { error: (e as Error).message });
  }
}).listen(PORT, () => console.log(`Lantern Summit server on http://localhost:${PORT}`));

// drop idle sessions after 2 hours
setInterval(() => {
  const cutoff = Date.now() - 2 * 3600_000;
  for (const [k, v] of sessions) if (v.seen < cutoff) sessions.delete(k);
}, 600_000).unref();
