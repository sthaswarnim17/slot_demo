# Security notes

Lantern Summit is a **free-play demo**. No real money can be staked, won or withdrawn, and the
public GitHub Pages build runs the whole game in the visitor's browser.

## Threat model in one paragraph

Anything that runs in a browser belongs to the person holding the browser. In the default
(local) mode the engine, the RNG and the balance all live in the page, so a player can always
change them with devtools or an edited copy of the page. That is acceptable for demo credits and
is why the page says "DEMO CREDITS · NO REAL MONEY". **Any version that takes real stakes must be
server-authoritative:** the server draws the outcomes with a certified RNG, owns the wallet, and
the client only animates results it is given. `server/server.ts` is the starting point for that
model; it still needs authenticated players, an operator wallet, persistence and lab
certification before real money.

## What is hardened

| Area | Protection |
|---|---|
| `?server=` link parameter | Only the page's own origin, loopback, origins in `VITE_GAME_SERVERS` (set at build time), and private LAN addresses in dev builds are accepted. A link pointing the official page at someone else's server falls back to the built-in demo. |
| Server responses | Every response is parsed strictly (`src/game/validate.ts`): types, ranges, grid size and symbol ids are checked and objects are rebuilt from known fields, so a bad server cannot inject markup or NaN. Server error text is reduced to short plain text. |
| Rendering | Values from the engine or server are written with `textContent`; the few HTML templates escape their dynamic text. |
| Content-Security-Policy | The production build adds a CSP meta tag: scripts only from the site, network only to the site, localhost and configured game servers, no plugins, no `<base>` or form hijacking. |
| Engine rules | Bets must be one of `BET_LEVELS` (rejects NaN, negatives, Infinity, strings). Bonus buy honours `FEATURES.bonusBuy`. Climb choice must be a valid index. Demo top-up resets to the start balance (never stacks) and is refused during a feature. |
| Demo server | CORS limited to `ALLOWED_ORIGINS`; unknown browser origins are refused. Listens on 127.0.0.1 by default. Per-address rate limits, a session cap, 4 KB JSON-only bodies, request timeouts, UUID-shaped session ids, generic 500 errors, `nosniff` and `no-store` headers. `/health` no longer reports session counts. |
| Deploy workflow | Only `main` deploys. Token permissions are per job (build is read-only; only deploy can write Pages). Actions are pinned to commit SHAs. Checkout does not persist credentials. Dependency install scripts are skipped. |
| CI | Pull requests and branches run tests, build and `npm audit` with a read-only token and never deploy. |
| Dependencies | Vite upgraded to 6.4.6 to close dev-server file-read and cross-origin advisories. `npm run dev` now binds to localhost; use `npm run dev:lan` only on a trusted network. |

## Running the demo server for another site

```bash
ALLOWED_ORIGINS=https://sthaswarnim17.github.io HOST=0.0.0.0 npm run server
VITE_GAME_SERVERS=https://your-game-server.example npm run build
```

Put the server behind HTTPS (a reverse proxy) before exposing it.

## Reporting

Please report security issues privately to the repository owner rather than opening a public issue.
