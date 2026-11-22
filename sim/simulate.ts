/**
 * Lantern Summit math simulator. Uses the exact same engine code as the game.
 *
 *   npm run sim -- --spins 20000000            full game, all climb options
 *   npm run sim -- --fs 2000000                free-spin rounds only, per option
 *   npm run sim -- --spins 1e8 --report        writes docs/math-report.md
 */
import { Worker, isMainThread, parentPort, workerData } from 'node:worker_threads';
import { cpus } from 'node:os';
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { GameSession } from '../src/engine/engine';
import { SeededRng } from '../src/engine/rng';
import { CLIMB_OPTIONS, MAX_WIN, EMBER_MAX } from '../src/engine/config';

interface Stats {
  spins: number;
  wagered: number;
  baseCluster: number;
  baseScatter: number;
  emberBoostWins: number; // extra paid because of ember boosts
  fsWin: number; // sum of FS round totals (excl. trigger spin)
  fsTriggers: number;
  fsSpinsPlayed: number;
  hits: number;
  maxWin: number;
  capped: number;
  sumSq: number; // sum of (spin total win)^2 for volatility
  buckets: number[]; // win size buckets
  emberCharges: number;
  fsRounds: number;
  fsRoundSum: number;
  fsRoundSq: number;
  fsMax: number;
}

const BUCKETS = [0, 1, 2, 5, 10, 20, 50, 100, 250, 500, 1000, 2500, 5000, 10000];
const emptyStats = (): Stats => ({
  spins: 0, wagered: 0, baseCluster: 0, baseScatter: 0, emberBoostWins: 0, fsWin: 0, fsTriggers: 0,
  fsSpinsPlayed: 0, hits: 0, maxWin: 0, capped: 0, sumSq: 0, buckets: new Array(BUCKETS.length).fill(0),
  emberCharges: 0, fsRounds: 0, fsRoundSum: 0, fsRoundSq: 0, fsMax: 0,
});

function bucket(stats: Stats, x: number) {
  let i = 0;
  while (i < BUCKETS.length - 1 && x > BUCKETS[i] + 1e-9) i++;
  stats.buckets[i]++;
}

function runFull(seed: number, spins: number, option: number): Stats {
  const st = emptyStats();
  const s = new GameSession(new SeededRng(seed), 1e12);
  for (let i = 0; i < spins; i++) {
    s.state.balance = 1e12;
    const r = s.spin(1);
    st.spins++; st.wagered += 1;
    st.baseCluster += r.clusterWin; st.baseScatter += r.scatterWin;
    if (r.emberBoost > 0) {
      const without = r.lanternSum > 0 ? r.seq.tumbleWin * r.lanternSum : r.seq.tumbleWin;
      st.emberBoostWins += r.clusterWin - without;
    }
    if (r.emberJustCharged) st.emberCharges++;
    if (r.capped) st.capped++;
    let total = r.win;
    if (r.triggeredFreeSpins) {
      st.fsTriggers++;
      const opt = option >= 0 ? option : Math.floor(Math.random() * CLIMB_OPTIONS.length);
      s.chooseClimb(opt);
      let fsTotal = 0;
      for (;;) {
        const f = s.freeSpin();
        st.fsSpinsPlayed++;
        fsTotal += f.win;
        if (f.capped) st.capped++;
        if (f.finished) break;
      }
      st.fsWin += fsTotal;
      total += fsTotal;
    }
    if (total > 0) st.hits++;
    st.sumSq += total * total;
    if (total > st.maxWin) st.maxWin = total;
    bucket(st, total);
  }
  return st;
}

/** Free-spin rounds only, forced trigger, for per-option calibration. */
function runFs(seed: number, rounds: number, option: number): Stats {
  const st = emptyStats();
  const s = new GameSession(new SeededRng(seed), 1e12);
  for (let i = 0; i < rounds; i++) {
    s.state.awaitingClimb = true; s.state.pendingBet = 1; s.state.pendingTriggerWin = 0;
    s.chooseClimb(option);
    let t = 0;
    for (;;) { const f = s.freeSpin(); st.fsSpinsPlayed++; t += f.win; if (f.capped) st.capped++; if (f.finished) break; }
    st.fsRounds++; st.fsRoundSum += t; st.fsRoundSq += t * t; if (t > st.fsMax) st.fsMax = t;
  }
  return st;
}

function merge(a: Stats, b: Stats): Stats {
  const out = emptyStats();
  for (const k of Object.keys(out) as (keyof Stats)[]) {
    if (k === 'buckets') out.buckets = a.buckets.map((x, i) => x + b.buckets[i]);
    else if (k === 'maxWin' || k === 'fsMax') out[k] = Math.max(a[k], b[k]);
    else (out[k] as number) = (a[k] as number) + (b[k] as number);
  }
  return out;
}

// ------------------------------------------------------------------ worker
if (!isMainThread) {
  const { kind, seed, n, option } = workerData as { kind: string; seed: number; n: number; option: number };
  parentPort!.postMessage(kind === 'fs' ? runFs(seed, n, option) : runFull(seed, n, option));
}

async function parallel(kind: 'full' | 'fs', n: number, option: number, seedBase: number): Promise<Stats> {
  const threads = Math.max(1, cpus().length);
  const per = Math.ceil(n / threads);
  const file = fileURLToPath(import.meta.url);
  const parts = await Promise.all(
    Array.from({ length: threads }, (_, i) => new Promise<Stats>((res, rej) => {
      const w = new Worker(file, { workerData: { kind, seed: seedBase + i * 7919, n: per, option }});
      w.once('message', res); w.once('error', rej);
    })),
  );
  return parts.reduce(merge);
}

const pct = (x: number) => (x * 100).toFixed(2) + '%';

function describeFull(st: Stats, label: string) {
  const rtp = (st.baseCluster + st.baseScatter + st.fsWin) / st.wagered;
  const mean = rtp;
  const sd = Math.sqrt(st.sumSq / st.spins - mean * mean);
  return {
    label,
    spins: st.spins,
    rtp,
    baseRtp: st.baseCluster / st.wagered,
    scatterRtp: st.baseScatter / st.wagered,
    fsRtp: st.fsWin / st.wagered,
    emberRtp: st.emberBoostWins / st.wagered,
    hitRate: st.hits / st.spins,
    fsFreq: st.fsTriggers ? st.spins / st.fsTriggers : Infinity,
    avgFs: st.fsTriggers ? st.fsWin / st.fsTriggers : 0,
    avgFsSpins: st.fsTriggers ? st.fsSpinsPlayed / st.fsTriggers : 0,
    emberEvery: st.emberCharges ? st.spins / st.emberCharges : Infinity,
    maxWin: st.maxWin,
    capped: st.capped,
    sd,
    buckets: st.buckets,
  };
}

async function main() {
  const args = process.argv.slice(2);
  const get = (k: string) => { const i = args.indexOf(k); return i >= 0 ? Number(args[i + 1]) : undefined; };
  const fsRounds = get('--fs');
  const spins = get('--spins');
  const seed = get('--seed') ?? 20261122;
  const t0 = Date.now();

  if (fsRounds) {
    for (const o of CLIMB_OPTIONS) {
      const st = await parallel('fs', fsRounds, o.id, seed + o.id * 1000003);
      const mean = st.fsRoundSum / st.fsRounds;
      const sd = Math.sqrt(st.fsRoundSq / st.fsRounds - mean * mean);
      console.log(`${o.label.padEnd(12)} ${o.spins} spins from x${o.startMult}: mean ${mean.toFixed(2)}x  sd ${sd.toFixed(1)}  ±${(1.96 * sd / Math.sqrt(st.fsRounds)).toFixed(2)}  max ${st.fsMax.toFixed(0)}x  capped ${st.capped}  avgSpins ${(st.fsSpinsPlayed / st.fsRounds).toFixed(2)}`);
    }
    console.log(`(${((Date.now() - t0) / 1000).toFixed(1)}s)`);
    return;
  }

  const n = spins ?? 2_000_000;
  const results = [];
  for (const o of CLIMB_OPTIONS) {
    const st = await parallel('full', n, o.id, seed + o.id * 1000003);
    const d = describeFull(st, `${o.label} (${o.spins} spins from x${o.startMult})`);
    results.push(d);
    console.log(`${d.label.padEnd(34)} RTP ${pct(d.rtp)} | base ${pct(d.baseRtp)} scat ${pct(d.scatterRtp)} fs ${pct(d.fsRtp)} (ember ${pct(d.emberRtp)}) | hit 1/${(1 / d.hitRate).toFixed(2)} | FS 1/${d.fsFreq.toFixed(0)} avg ${d.avgFs.toFixed(1)}x | ember 1/${d.emberEvery.toFixed(1)} | max ${d.maxWin.toFixed(0)}x capped ${d.capped} | sd ${d.sd.toFixed(1)}`);
  }
  const secs = (Date.now() - t0) / 1000;
  console.log(`(${secs.toFixed(1)}s)`);

  if (args.includes('--report')) writeReport(results, n, seed, secs);
}

function writeReport(rs: ReturnType<typeof describeFull>[], n: number, seed: number, secs: number) {
  const fmt = (x: number) => x.toLocaleString('en-US');
  const lines: string[] = [];
  lines.push('# Lantern Summit: math report', '');
  lines.push(`Simulated ${fmt(n)} paid spins **per free-spin option** (${fmt(n * rs.length)} total) with the same engine code the game runs (\`src/engine\`). Seed ${seed}. Runtime ${secs.toFixed(0)}s. Regenerate with \`npm run sim -- --spins ${n} --report\`.`, '');
  lines.push('Bet = 1 credit. All figures are in multiples of the total bet. Demo math: not certified by any test lab.', '');
  lines.push('## Headline', '');
  lines.push('| Free-spin choice | RTP | Base game | Scatter pays | Free spins | Hit rate | Free spins every | Avg free-spin round | Max win seen | Std dev |');
  lines.push('|---|---|---|---|---|---|---|---|---|---|');
  for (const d of rs) {
    lines.push(`| ${d.label} | **${pct(d.rtp)}** | ${pct(d.baseRtp)} | ${pct(d.scatterRtp)} | ${pct(d.fsRtp)} | 1 in ${(1 / d.hitRate).toFixed(2)} | 1 in ${d.fsFreq.toFixed(0)} | ${d.avgFs.toFixed(1)}x | ${fmt(Math.round(d.maxWin))}x | ${d.sd.toFixed(1)} |`);
  }
  lines.push('', `Ember meter: fills about once every ${rs[0].emberEvery.toFixed(0)} spins; the guaranteed multiplier it charges contributes ${pct(rs[0].emberRtp)} of RTP (included in the base game figure).`, '');
  lines.push(`Max win cap: ${fmt(MAX_WIN)}x per spin including its free-spin round. Ember meter size: ${EMBER_MAX} tumbles.`, '');
  lines.push('## Win distribution (all options pooled)', '');
  lines.push('| Total win per paid spin | Share of spins |', '|---|---|');
  const pooled = rs[0].buckets.map((_, i) => rs.reduce((a, d) => a + d.buckets[i], 0));
  const tot = pooled.reduce((a, b) => a + b, 0);
  const labels = ['No win', '0 to 1x', '1x to 2x', '2x to 5x', '5x to 10x', '10x to 20x', '20x to 50x', '50x to 100x', '100x to 250x', '250x to 500x', '500x to 1,000x', '1,000x to 2,500x', '2,500x to 5,000x', '5,000x to 10,000x'];
  pooled.forEach((c, i) => lines.push(`| ${labels[i]} | ${(c / tot * 100).toFixed(4)}% (${fmt(c)}) |`));
  lines.push('');
  writeFileSync(new URL('../docs/math-report.md', import.meta.url), lines.join('\n'));
  console.log('wrote docs/math-report.md');
}

if (isMainThread) main();
