import './styles.css';
import { installSymbolDefs, symbolUse } from './symbols';
import { Sound } from './audio';
import { pickBackend, type Backend } from './backend';
import {
  BET_LEVELS, BUY_COST, CLIMB_OPTIONS, COLS, ROWS, EMBER_MAX, FEATURES, MAX_WIN, PAYTABLE, SYMBOL_NAMES, SYM, scatterPay,
} from '../engine/config';
import type { BaseSpinResult, FreeSpinResult, Grid, SpinSequence } from '../engine/engine';

// ------------------------------------------------------------------ setup
const $ = <T extends HTMLElement = HTMLElement>(id: string) => document.getElementById(id) as T;
const fmt = (n: number) => n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmtX = (n: number) => (Number.isInteger(n) ? String(n) : n.toFixed(2).replace(/0$/, ''));

const sound = new Sound();
const backend: Backend = pickBackend();

const PEAK_SVG = (h: number) => `<svg class="peak" viewBox="0 0 64 48"><path d="M2 46 L${20 - h} ${30 - h * 2} L28 ${36 - h} L${38} ${22 - h * 3} L62 46Z" fill="#3b3f7a" stroke="#bfefff" stroke-width="1.5"/><path d="M${38} ${22 - h * 3} L${33} ${30 - h * 2} L${36} ${29 - h * 2} L${38} ${32 - h * 2} L${41} ${29 - h * 2} L${44} ${30 - h * 2}Z" fill="#fff"/></svg>`;

const SPIN_ICON = `<svg viewBox="0 0 48 48"><path d="M24 7a17 17 0 1 1-16.2 11.8" fill="none" stroke="#3a1404" stroke-width="5" stroke-linecap="round"/><path d="M4 10l4.5 10.5L19 16" fill="none" stroke="#3a1404" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
const SND_ON = `<svg viewBox="0 0 24 24"><path d="M4 9h4l5-4v14l-5-4H4z" fill="#fff"/><path d="M16 8.5a5 5 0 0 1 0 7M18.5 6a8.5 8.5 0 0 1 0 12" stroke="#fff" stroke-width="2" fill="none" stroke-linecap="round"/></svg>`;
const SND_OFF = `<svg viewBox="0 0 24 24"><path d="M4 9h4l5-4v14l-5-4H4z" fill="#fff" opacity=".6"/><path d="M16 9l6 6M22 9l-6 6" stroke="#fff" stroke-width="2" stroke-linecap="round"/></svg>`;
const FLAME = `<svg viewBox="0 0 24 24"><path d="M12 2c1 4 6 6 6 12a6 6 0 0 1-12 0c0-3 2-5 3-6 0 2 1 3 2 3 0-3-1-6 1-9z" fill="#ff8a2a" stroke="#ffcf6a" stroke-width="1.2"/></svg>`;

function mountainsSvg() {
  return `<svg class="mountains" viewBox="0 0 400 200" preserveAspectRatio="xMidYMax slice" aria-hidden="true">
    <path d="M0 120 L40 90 L70 104 L120 50 L150 78 L190 40 L230 84 L270 60 L310 92 L350 66 L400 96 V200 H0Z" fill="#3a2a6a" opacity=".75"/>
    <path d="M120 50 L131 63 L124 61 L118 66 L112 58Z M190 40 L203 55 L196 53 L190 58 L183 51 L178 52Z" fill="#cfd6ff" opacity=".3"/>
    <path d="M0 150 L50 118 L90 136 L150 86 L180 108 L210 70 L250 112 L300 92 L350 124 L400 110 V200 H0Z" fill="#241a4e"/>
    <path d="M210 70 L222 85 L215 83 L209 89 L203 81 L196 86Z M150 86 L160 98 L153 96 L148 101 L142 93Z" fill="#e8ecff" opacity=".4"/>
    <path d="M0 176 L60 150 L120 168 L200 140 L270 166 L340 148 L400 164 V200 H0Z" fill="#140f33"/>
  </svg>`;
}

function floaters() {
  let h = '';
  for (let i = 0; i < 9; i++) {
    const s = 16 + Math.random() * 26;
    h += `<div class="floater" style="left:${Math.random() * 96}%;--s:${s}px;--d:${16 + Math.random() * 18}s;--delay:${-Math.random() * 30}s;--drift:${(Math.random() - .5) * 80}px">${symbolUse(SYM.LANTERN)}</div>`;
  }
  return h;
}

document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
  <div class="sky"><div class="stars"></div><div class="aurora"></div>${mountainsSvg()}<div class="floaters">${floaters()}</div></div>
  <div class="shell" id="shell">
    <header class="top" id="top">
      <div class="logo" aria-label="Lantern Summit"><span class="l1">Lantern</span><span class="l2">Summit</span></div>
      <div class="demo-badge">DEMO CREDITS · NO REAL MONEY</div>
    </header>
    <div class="status" id="status">
      <div class="ember" id="ember">
        <div class="ember-label">${FLAME}EMBER</div>
        <div class="pips" id="pips">${'<i></i>'.repeat(EMBER_MAX)}</div>
        <div class="ember-note" id="emberNote">${EMBER_MAX} tumbles = guaranteed multiplier</div>
      </div>
      <div class="fsbar hidden" id="fsbar">
        <div><b id="fsLeft">0</b><span>spins left</span></div>
        <div class="fs-mult" id="fsMultBox">SUMMIT<b id="fsMult">x1</b></div>
        <div><b id="fsWon">0.00</b><span>won</span></div>
      </div>
    </div>
    <div class="board-area" id="boardArea"><div class="board-frame" id="frame"><div class="board" id="board"></div><div class="board-fx" id="fx"></div></div></div>
    <div class="winline" id="winline">Land 8 or more of a kind anywhere to win</div>
    <footer class="controls" id="controls">
      <div class="meters">
        <div class="meter"><span>BALANCE</span><b id="balance">0.00</b></div>
        <div class="bet"><button id="betDown" aria-label="Lower bet">−</button><div><span>BET</span><b id="bet">1.00</b></div><button id="betUp" aria-label="Raise bet">+</button></div>
        <div class="meter"><span>WIN</span><b id="win">0.00</b></div>
      </div>
      <div class="row">
        <div class="side left">
          <button class="round" id="menuBtn" aria-label="Menu"><svg viewBox="0 0 24 24"><path d="M4 7h16M4 12h16M4 17h16" stroke="#fff" stroke-width="2.5" stroke-linecap="round"/></svg></button>
          <button class="round" id="autoBtn" aria-label="Autoplay">AUTO</button>
        </div>
        <button class="spin" id="spinBtn" aria-label="Spin">${SPIN_ICON}<span class="count" id="autoCount"></span></button>
        <div class="side right">
          <button class="round" id="turboBtn" aria-label="Turbo"><svg viewBox="0 0 24 24"><path d="M13 2L4 14h7l-1 8 9-12h-7z" fill="currentColor"/></svg></button>
          <button class="round" id="soundBtn" aria-label="Sound"></button>
        </div>
      </div>
      <button class="buy ${FEATURES.bonusBuy ? '' : 'hidden'}" id="buyBtn">BUY FREE SPINS · <span id="buyCost"></span></button>
    </footer>
  </div>
  <div class="modal hidden" id="modal"><div class="modal-card" id="modalCard"></div></div>
  <div class="bigwin hidden" id="bigwin"><div class="inner"><div class="title" id="bwTitle">BIG WIN</div><div class="amount" id="bwAmount">0.00</div><div class="hint">TAP TO CONTINUE</div></div></div>
`;
installSymbolDefs();

const board = $('board');
const fx = $('fx');
const winline = $('winline');

// ------------------------------------------------------------------ state
let balance = 0;
let betIdx = BET_LEVELS.indexOf(1);
let busy = false;
let turbo = false;
let hurry = false;
let autoLeft = 0;
let cell = 56;
let elems: HTMLDivElement[][] = [];
let currentGrid: Grid | null = null;
const history: { t: Date; kind: string; bet: number; win: number; note: string }[] = [];
const sessionStart = Date.now();
let spinsPlayed = 0;
let totalBet = 0;
let totalWon = 0;

const bet = () => BET_LEVELS[betIdx];
const speed = () => (hurry ? 0.25 : turbo ? 0.45 : 1);
const wait = (ms: number) => new Promise<void>(r => setTimeout(r, ms * speed()));

function anim(el: Element, kf: Keyframe[], duration: number, delay = 0, easing = 'ease-out'): Promise<unknown> {
  const s = speed();
  return el.animate(kf, { duration: duration * s, delay: delay * s, easing, fill: 'forwards' }).finished.catch(() => undefined);
}

// ------------------------------------------------------------------ layout
function layout() {
  const area = $('boardArea');
  const availH = area.clientHeight - 12; // frame padding
  const availW = area.clientWidth - 12;
  cell = Math.max(32, Math.floor(Math.min(availW / COLS, availH / ROWS)));
  document.documentElement.style.setProperty('--cell', cell + 'px');
  if (currentGrid) placeAll();
}
window.addEventListener('resize', layout);

const pos = (c: number, r: number) => `translate(${c * cell}px, ${r * cell}px)`;

function placeAll() {
  elems.forEach((col, c) => col.forEach((el, r) => {
    el.getAnimations().forEach(a => a.cancel());
    el.style.transform = pos(c, r);
  }));
}

function makeCell(s: number, m?: number): HTMLDivElement {
  const d = document.createElement('div');
  d.className = 'cell';
  d.innerHTML = symbolUse(s) + (s === SYM.LANTERN ? `<span class="mult">x${m}</span>` : '');
  d.dataset.s = String(s);
  return d;
}

// ------------------------------------------------------------------ ui updates
function setBalance(b: number) { balance = b; $('balance').textContent = fmt(b); refreshButtons(); }
function setWin(w: number) { $('win').textContent = fmt(w); }
function setLine(html: string) { winline.innerHTML = html; }

function refreshButtons() {
  const fsActive = document.body.classList.contains('fs-mode');
  ($('betDown') as HTMLButtonElement).disabled = busy || fsActive || betIdx === 0;
  ($('betUp') as HTMLButtonElement).disabled = busy || fsActive || betIdx === BET_LEVELS.length - 1;
  ($('buyBtn') as HTMLButtonElement).disabled = busy || fsActive || bet() * BUY_COST > balance + 1e-9;
  $('bet').textContent = fmt(bet());
  $('buyCost').textContent = fmt(bet() * BUY_COST);
  const spinBtn = $('spinBtn');
  spinBtn.classList.toggle('busy', busy);
  $('autoBtn').classList.toggle('on', autoLeft > 0);
  $('autoCount').textContent = autoLeft > 0 ? String(autoLeft) : '';
  $('turboBtn').classList.toggle('on', turbo);
  $('soundBtn').innerHTML = sound.enabled ? SND_ON : SND_OFF;
}

function setEmber(n: number, charged: boolean) {
  const pips = $('pips').children;
  for (let i = 0; i < pips.length; i++) pips[i].classList.toggle('on', i < n);
  $('ember').classList.toggle('charged', charged);
  $('emberNote').textContent = charged
    ? 'Charged! Next win gets a bonus multiplier'
    : `${EMBER_MAX - n} more tumbles to a guaranteed multiplier`;
}

function toast(msg: string, ms = 2200) {
  const t = document.createElement('div');
  t.className = 'toast';
  t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), ms);
}

// ------------------------------------------------------------------ board animation
async function dropIn(grid: Grid) {
  // old symbols fall out
  const old = elems.flat();
  if (old.length) {
    await Promise.all(old.map((el, i) => {
      const c = Math.floor(i / ROWS);
      return anim(el, [{ transform: el.style.transform }, { transform: `${el.style.transform} translateY(${(ROWS + 1) * cell}px)`, opacity: 0.2 }], 240, c * 35, 'ease-in');
    }));
    old.forEach(el => el.remove());
  }
  elems = [];
  currentGrid = grid;
  const landings: Promise<unknown>[] = [];
  for (let c = 0; c < COLS; c++) {
    const col: HTMLDivElement[] = [];
    for (let r = 0; r < ROWS; r++) {
      const el = makeCell(grid[c][r].s, grid[c][r].m);
      el.style.transform = pos(c, r);
      board.appendChild(el);
      col.push(el);
      const delay = c * 70 + (ROWS - 1 - r) * 25;
      landings.push(anim(el, [{ transform: pos(c, r - ROWS - 1) }, { transform: pos(c, r) }], 380, delay, 'cubic-bezier(.25,1.25,.5,1)'));
    }
    elems.push(col);
    setTimeout(() => sound.land(c), (c * 70 + 300) * speed());
  }
  await Promise.all(landings);
}

function sparks(c: number, r: number, n = 5) {
  const cx = (c + 0.5) * cell, cy = (r + 0.5) * cell;
  for (let i = 0; i < n; i++) {
    const s = document.createElement('div');
    s.className = 'spark';
    s.style.left = cx + 'px'; s.style.top = cy + 'px';
    fx.appendChild(s);
    const a = Math.random() * Math.PI * 2, d = cell * (0.4 + Math.random() * 0.6);
    anim(s, [{ transform: 'translate(-50%,-50%) scale(1)', opacity: 1 }, { transform: `translate(${Math.cos(a) * d - 4}px, ${Math.sin(a) * d - 4}px) scale(.2)`, opacity: 0 }], 520, 0, 'ease-out')
      .then(() => s.remove());
  }
}

function floatText(text: string, x: number, y: number, cls = '', dur = 1100) {
  const t = document.createElement('div');
  t.className = 'float-text ' + cls;
  t.textContent = text;
  t.style.left = x + 'px'; t.style.top = y + 'px';
  fx.appendChild(t);
  return anim(t, [{ opacity: 0, transform: 'translate(-50%,-30%) scale(.6)' }, { opacity: 1, transform: 'translate(-50%,-50%) scale(1.1)', offset: 0.2 }, { opacity: 1, transform: 'translate(-50%,-70%) scale(1)', offset: 0.75 }, { opacity: 0, transform: 'translate(-50%,-90%) scale(1)' }], dur).then(() => t.remove());
}

async function banner(title: string, sub = '', ms = 1400) {
  const b = document.createElement('div');
  b.className = 'banner';
  b.innerHTML = `${title}${sub ? `<small>${sub}</small>` : ''}`;
  fx.appendChild(b);
  await anim(b, [{ opacity: 0, transform: 'translate(-50%,-50%) scale(.4)' }, { opacity: 1, transform: 'translate(-50%,-50%) scale(1.08)', offset: 0.25 }, { opacity: 1, transform: 'translate(-50%,-50%) scale(1)', offset: 0.8 }, { opacity: 0, transform: 'translate(-50%,-50%) scale(1.2)' }], ms);
  b.remove();
}

/** Plays a whole spin sequence: wins pop, symbols tumble, returns when settled. */
async function playTumbles(seq: SpinSequence, betAmt: number, onStepWin: (running: number) => void) {
  let running = 0;
  for (let i = 0; i < seq.steps.length; i++) {
    const step = seq.steps[i];
    const removeSet = new Set<number>();
    for (const w of step.wins) for (const [c, r] of w.positions) { removeSet.add(c * ROWS + r); elems[c][r].classList.add('hit'); }
    sound.win(i);
    running += step.stepWin * betAmt;
    onStepWin(running);
    const names = step.wins.map(w => `${w.count} × ${SYMBOL_NAMES[w.symbol]}&nbsp;<b>${fmt(w.pay * betAmt)}</b>`).join('&nbsp;&nbsp;·&nbsp;&nbsp;');
    setLine(names);
    // a label at the centre of each cluster
    for (const w of step.wins) {
      const cx = w.positions.reduce((a, p) => a + p[0], 0) / w.positions.length;
      const cy = w.positions.reduce((a, p) => a + p[1], 0) / w.positions.length;
      void floatText(fmt(w.pay * betAmt), (cx + 0.5) * cell, (cy + 0.5) * cell);
    }
    await wait(700);
    // pop
    sound.pop();
    await Promise.all([...removeSet].map(k => {
      const c = Math.floor(k / ROWS), r = k % ROWS;
      const el = elems[c][r];
      sparks(c, r, hurry || turbo ? 2 : 5);
      return anim(el, [{ transform: el.style.transform + ' scale(1)', opacity: 1 }, { transform: el.style.transform + ' scale(1.25)', opacity: 1, offset: 0.35 }, { transform: el.style.transform + ' scale(0)', opacity: 0 }], 260);
    }));
    // tumble
    const moves: Promise<unknown>[] = [];
    const next: HTMLDivElement[][] = [];
    for (let c = 0; c < COLS; c++) {
      const survivors = elems[c].filter((el, r) => { if (removeSet.has(c * ROWS + r)) { el.remove(); return false; } return true; });
      const oldRows = elems[c].map((_, r) => r).filter(r => !removeSet.has(c * ROWS + r));
      const n = step.dropped[c];
      const col: HTMLDivElement[] = [];
      for (let k = 0; k < n; k++) {
        const cellData = step.grid[c][k];
        const el = makeCell(cellData.s, cellData.m);
        el.style.transform = pos(c, k);
        board.appendChild(el);
        moves.push(anim(el, [{ transform: pos(c, k - n - 0.3) }, { transform: pos(c, k) }], 340, c * 40 + (n - k) * 20, 'cubic-bezier(.3,1.2,.5,1)'));
        col.push(el);
      }
      survivors.forEach((el, idx) => {
        const from = oldRows[idx], to = n + idx;
        el.style.transform = pos(c, to);
        if (from !== to) moves.push(anim(el, [{ transform: pos(c, from) }, { transform: pos(c, to) }], 300, c * 40, 'cubic-bezier(.3,1.2,.5,1)'));
      });
      col.push(...survivors);
      next.push(col);
    }
    elems = next;
    currentGrid = step.grid;
    await Promise.all(moves);
    await wait(120);
  }
}

function lanternEls(seq: SpinSequence) {
  return seq.lanterns.map(l => ({ ...l, el: elems[l.col][l.row] }));
}

async function showLanterns(seq: SpinSequence, label: (sum: number) => string) {
  const ls = lanternEls(seq);
  if (!ls.length) return;
  for (const l of ls) {
    l.el.classList.add('lit');
    sound.lantern();
    void floatText('x' + l.value, (l.col + 0.5) * cell, (l.row + 0.2) * cell, '', 900);
    await wait(260);
  }
  const sum = ls.reduce((a, l) => a + l.value, 0);
  await banner(label(sum), '', 1100);
}

async function showScatters(seq: SpinSequence) {
  for (let c = 0; c < COLS; c++) for (let r = 0; r < ROWS; r++) if (seq.finalGrid[c][r].s === SYM.SCATTER) elems[c][r].classList.add('scat');
  sound.scatter();
  await wait(1200);
}

// ------------------------------------------------------------------ win presentation
function bigWinTier(x: number) {
  if (x >= 100) return 'SUMMIT WIN';
  if (x >= 50) return 'GRAND WIN';
  if (x >= 20) return 'BIG WIN';
  return '';
}

function showBigWin(amount: number, xBet: number): Promise<void> {
  const tier = bigWinTier(xBet);
  if (!tier) return Promise.resolve();
  return new Promise(res => {
    const box = $('bigwin');
    $('bwTitle').textContent = tier;
    box.classList.remove('hidden');
    sound.bigWin();
    const dur = (autoLeft > 0 || turbo ? 1800 : 3200);
    const t0 = performance.now();
    let done = false;
    const tick = (t: number) => {
      const p = Math.min(1, (t - t0) / dur);
      $('bwAmount').textContent = fmt(amount * (1 - Math.pow(1 - p, 3)));
      if (p < 1 && !done) requestAnimationFrame(tick); else $('bwAmount').textContent = fmt(amount);
    };
    requestAnimationFrame(tick);
    const close = () => { if (done) return; done = true; box.classList.add('hidden'); box.removeEventListener('click', close); res(); };
    box.addEventListener('click', close);
    setTimeout(close, dur + (autoLeft > 0 ? 800 : 2200));
  });
}

// ------------------------------------------------------------------ game flow
async function doSpin() {
  if (busy) { hurry = true; return; }
  if (document.body.classList.contains('fs-mode')) return;
  if (bet() > balance + 1e-9) { autoLeft = 0; refreshButtons(); toast('Not enough demo credits. Top up from the menu.'); return; }
  busy = true; hurry = false; refreshButtons();
  sound.unlock(); sound.spin();
  setWin(0);
  setLine('Good luck!');
  let res: BaseSpinResult;
  try {
    res = await backend.spin(bet());
  } catch (e) {
    busy = false; refreshButtons(); toast((e as Error).message); return;
  }
  setBalance(balance - bet()); // show the stake leaving; real balance arrives after animation
  spinsPlayed++; totalBet += bet();
  await dropIn(res.seq.grid);
  await playTumbles(res.seq, res.bet, run => setWin(run));

  if (res.seq.tumbleWin > 0 && (res.lanternSum > 0 || res.emberBoost > 0)) {
    if (res.lanternSum > 0) await showLanterns(res.seq, s => `x${s}`);
    if (res.emberBoost > 0) {
      sound.ember();
      $('ember').animate([{ boxShadow: '0 0 0 0 #ff8a2a' }, { boxShadow: '0 0 30px 6px #ff8a2a' }, { boxShadow: '0 0 0 0 #ff8a2a' }], 900);
      await banner(`+x${res.emberBoost}`, 'EMBER MULTIPLIER', 1300);
    }
    setLine(`${fmt(res.seq.tumbleWin * res.bet)} × <b>x${res.multiplier}</b> = <span class="big">${fmt(res.clusterWin)}</span>`);
    setWin(res.clusterWin);
    await wait(900);
  }
  if (res.scatterWin > 0) {
    await showScatters(res.seq);
    setLine(`${res.seq.scatters} Snow Leopard Spirits pay <b>${fmt(res.scatterWin)}</b>`);
  }
  setWin(res.win);
  setBalance(res.balance);
  setEmber(res.emberAfter, res.emberCharged);
  if (res.emberJustCharged) { sound.ember(); toast('Ember meter full! Next win gets a guaranteed multiplier'); }
  totalWon += res.win;
  history.unshift({ t: new Date(), kind: 'Spin', bet: res.bet, win: res.win, note: res.capped ? 'Max win' : res.triggeredFreeSpins ? 'Free spins' : res.multiplier > 1 ? `x${res.multiplier}` : '' });
  if (history.length > 100) history.pop();
  if (res.win > 0 && !res.triggeredFreeSpins) {
    if (res.seq.tumbleWin === 0 || res.multiplier === 1) setLine(`You won <span class="big">${fmt(res.win)}</span>`);
    await showBigWin(res.win, res.win / res.bet);
  } else if (res.win === 0) {
    setLine('No win this time. Embers keep building.');
  }
  if (res.capped) await banner('MAX WIN', `${MAX_WIN.toLocaleString()}x reached`, 2000);

  if (res.triggeredFreeSpins) {
    await showScatters(res.seq);
    await banner('SPIRIT AWAKENS', `${res.seq.scatters} Snow Leopard Spirits`, 1800);
    busy = false;
    await runFreeSpins(res.bet, res.win);
  }
  busy = false; hurry = false;
  refreshButtons();
  continueAuto();
}

async function doBuy() {
  if (busy || document.body.classList.contains('fs-mode')) return;
  const cost = bet() * BUY_COST;
  const ok = await confirmModal('Buy free spins', `Go straight to the Summit climb for <b>${fmt(cost)}</b> demo credits (${BUY_COST}x your bet).`, 'Buy');
  if (!ok) return;
  sound.unlock();
  try {
    const r = await backend.buy(bet());
    setBalance(r.balance);
    spinsPlayed++; totalBet += cost;
    history.unshift({ t: new Date(), kind: 'Buy', bet: cost, win: 0, note: 'Bought free spins' });
  } catch (e) { toast((e as Error).message); return; }
  autoLeft = 0;
  await runFreeSpins(bet(), 0);
  refreshButtons();
}

function chooseClimb(): Promise<number> {
  return new Promise(res => {
    const heights = [0, 2, 4];
    openModal(`
      <h2>Choose your climb</h2>
      <p class="sub">The Snow Leopard Spirit opens the path to the summit. Every lantern that lands adds to your Summit multiplier.</p>
      <div class="climbs">
        ${CLIMB_OPTIONS.map((o, i) => `
          <button class="climb" data-o="${o.id}">
            ${PEAK_SVG(heights[i])}
            <div><b>${o.label}</b><small>${['More spins, build the multiplier from x1', 'Balanced climb with a strong start', 'Few spins, huge multiplier from the first win'][i]}</small></div>
            <div class="pill">${o.spins} spins<em>x${o.startMult}</em></div>
          </button>`).join('')}
      </div>
      <p class="sub" style="margin-top:10px;font-size:12px">All three climbs have the same long-run return.</p>`, false);
    $('modalCard').querySelectorAll<HTMLButtonElement>('.climb').forEach(b => b.addEventListener('click', () => {
      sound.click();
      closeModal();
      res(Number(b.dataset.o));
    }));
  });
}

async function runFreeSpins(betAmt: number, triggerWin: number) {
  const option = await chooseClimb();
  let fs = await backend.chooseClimb(option);
  busy = true; hurry = false;
  document.body.classList.add('fs-mode');
  $('ember').classList.add('hidden');
  $('fsbar').classList.remove('hidden');
  layout();
  const setFs = (left: number, mult: number, won: number) => {
    $('fsLeft').textContent = String(left);
    $('fsMult').textContent = 'x' + fmtX(mult);
    $('fsWon').textContent = fmt(won);
  };
  setFs(fs.remaining, fs.mult, fs.roundTotal - triggerWin);
  refreshButtons();
  await banner(`${fs.remaining} FREE SPINS`, `Summit multiplier x${fs.mult}`, 1600);
  let last: FreeSpinResult | null = null;
  for (;;) {
    hurry = false;
    sound.spin();
    const r = await backend.freeSpin();
    last = r;
    setFs(r.remaining + 1, r.multBefore, r.roundTotal - triggerWin - r.win);
    $('fsLeft').textContent = String(r.remaining - (r.retriggered ? 5 : 0));
    setWin(0);
    setLine(`Free spin ${r.played}`);
    await dropIn(r.seq.grid);
    await playTumbles(r.seq, r.bet, run => setWin(run));
    if (r.seq.tumbleWin > 0) {
      if (r.lanternSum > 0) {
        await showLanterns(r.seq, s => `+x${s}`);
        $('fsMult').textContent = 'x' + fmtX(r.multAfter);
        $('fsMultBox').classList.remove('bump'); void $('fsMultBox').offsetWidth; $('fsMultBox').classList.add('bump');
      }
      if (r.multAfter > 1) {
        setLine(`${fmt(r.seq.tumbleWin * r.bet)} × <b>Summit x${fmtX(r.multAfter)}</b> = <span class="big">${fmt(r.clusterWin)}</span>`);
        await wait(900);
      }
    } else if (r.lanternSum > 0) {
      setLine('Lanterns need a win to light the summit');
    }
    if (r.scatterWin > 0 || r.retriggered) await showScatters(r.seq);
    if (r.retriggered) { await banner('+5 FREE SPINS', 'The spirit returns', 1500); }
    setWin(r.win);
    setBalance(r.balance);
    setFs(r.remaining, r.multAfter, r.roundTotal - triggerWin);
    if (r.win > 0) await showBigWin(r.win, r.win / r.bet);
    if (r.finished) break;
    await wait(500);
  }
  fs = { ...fs, roundTotal: last?.roundTotal ?? fs.roundTotal };
  const total = fs.roundTotal;
  totalWon += total - triggerWin;
  history.unshift({ t: new Date(), kind: 'Free spins', bet: 0, win: total - triggerWin, note: `${CLIMB_OPTIONS[option].label}, x${fmtX(last?.multAfter ?? 1)}` });
  if (last?.capped) await banner('MAX WIN', `${MAX_WIN.toLocaleString()}x reached`, 2000);
  await showBigWin(total, total / betAmt);
  await new Promise<void>(res => {
    openModal(`
      <h2>Summit reached</h2>
      <p class="sub">${CLIMB_OPTIONS[option].label} · final multiplier x${fmtX(last?.multAfter ?? 1)}</p>
      <div style="text-align:center;font-size:40px;font-weight:900;margin:14px 0;text-shadow:0 0 16px #ff9a2a">${fmt(total)}</div>
      <p class="sub">${fmtX(Math.round((total / betAmt) * 100) / 100)}x your bet in demo credits</p>
      <button class="btn" id="fsDone">Continue</button>`, false);
    $('fsDone').addEventListener('click', () => { closeModal(); res(); });
    if (autoLeft > 0) setTimeout(() => { if (!$('modal').classList.contains('hidden')) { closeModal(); res(); } }, 3500);
  });
  document.body.classList.remove('fs-mode');
  $('ember').classList.remove('hidden');
  $('fsbar').classList.add('hidden');
  layout();
  setLine(`Free spins won <span class="big">${fmt(total)}</span>`);
  setWin(total);
  busy = false;
  refreshButtons();
}

function continueAuto() {
  if (autoLeft <= 0) return;
  if (bet() > balance + 1e-9) { autoLeft = 0; refreshButtons(); return; }
  setTimeout(() => {
    if (autoLeft > 0 && !busy) { autoLeft--; refreshButtons(); void doSpin(); }
  }, 350 * speed());
}

// ------------------------------------------------------------------ modals
function openModal(html: string, dismissable = true) {
  const m = $('modal');
  $('modalCard').innerHTML = html;
  m.classList.remove('hidden');
  m.onclick = dismissable ? (e => { if (e.target === m) closeModal(); }) : null;
}
function closeModal() { $('modal').classList.add('hidden'); }

function confirmModal(title: string, body: string, okLabel: string): Promise<boolean> {
  return new Promise(res => {
    openModal(`<h2>${title}</h2><p class="sub">${body}</p><button class="btn" id="cOk">${okLabel}</button><button class="btn ghost" id="cNo">Cancel</button>`);
    $('cOk').onclick = () => { closeModal(); res(true); };
    $('cNo').onclick = () => { closeModal(); res(false); };
  });
}

function paytableHtml() {
  const b = bet();
  const order = [8, 7, 6, 5, 4, 3, 2, 1, 0];
  return `<div class="paytable">${order.map(s => `
    <div class="pay">${symbolUse(s)}<div>${SYMBOL_NAMES[s]}<br>
      <span>12+</span>${fmt(PAYTABLE[s][2] * b)}<br><span>10-11</span>${fmt(PAYTABLE[s][1] * b)}<br><span>8-9</span>${fmt(PAYTABLE[s][0] * b)}</div></div>`).join('')}
    <div class="pay">${symbolUse(SYM.SCATTER)}<div>Snow Leopard Spirit<br><span>6</span>${fmt(scatterPay(6) * b)}<br><span>5</span>${fmt(scatterPay(5) * b)}<br><span>4</span>${fmt(scatterPay(4) * b)}</div></div>
  </div>`;
}

function menu(tab: 'rules' | 'history' | 'settings' = 'rules') {
  const mins = Math.floor((Date.now() - sessionStart) / 60000);
  const tabs = `<div class="tabs">${(['rules', 'history', 'settings'] as const).map(t => `<button data-tab="${t}" class="${t === tab ? 'on' : ''}">${{ rules: 'How to play', history: 'History', settings: 'Settings' }[t]}</button>`).join('')}</div>`;
  let body = '';
  if (tab === 'rules') {
    body = `
      <h3>Pays anywhere</h3>
      <p>Land 8 or more of the same symbol anywhere on the 6 x 5 grid to win. Pays shown at your current bet of ${fmt(bet())}.</p>
      ${paytableHtml()}
      <h3>Tumbles</h3>
      <p>Winning symbols vanish and new ones fall in. Tumbles continue until there are no new wins.</p>
      <h3>Sky lanterns</h3>
      <div class="pay" style="grid-template-columns:44px 1fr">${symbolUse(SYM.LANTERN)}<div>Lanterns carry multipliers from x2 to x500. When a spin ends with a win, all lanterns on the grid are added together and multiply the total tumble win.</div></div>
      <h3>Ember meter</h3>
      <p>Every tumble adds an ember. When ${EMBER_MAX} embers fill the meter it charges, and your next winning spin gets a guaranteed extra multiplier of x2 to x10. No more long dry runs.</p>
      <h3>Free spins: pick your climb</h3>
      <p>4 or more Snow Leopard Spirits anywhere start free spins. Choose your climb: ${CLIMB_OPTIONS.map(o => `${o.label} (${o.spins} spins from x${o.startMult})`).join(', ')}. Every lantern that lands on a winning free spin adds to the Summit multiplier, which applies to every win for the rest of the round. 3 or more Spirits during free spins add 5 more spins.</p>
      ${FEATURES.bonusBuy ? `<h3>Buy free spins</h3><p>Go straight to the climb choice for ${BUY_COST}x your bet. Operators can switch this off per market.</p>` : ''}
      <h3>Game facts</h3>
      <p>Theoretical return to player: about 96.1% (100 million simulated spins). Max win ${MAX_WIN.toLocaleString()}x bet. Volatility: high.</p>
      <p>This is a demo with play credits only. Credits have no cash value and cannot be bought, won or withdrawn.</p>`;
  } else if (tab === 'history') {
    body = history.length
      ? `<table class="hist"><tr><th>TIME</th><th>TYPE</th><th>BET</th><th>WIN</th><th></th></tr>${history.slice(0, 50).map(h => `<tr><td>${h.t.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</td><td>${h.kind}</td><td>${h.bet ? fmt(h.bet) : '-'}</td><td class="w">${fmt(h.win)}</td><td>${h.note}</td></tr>`).join('')}</table>`
      : '<p class="sub">No spins yet.</p>';
  } else {
    body = `
      <div class="toggle-row">Sound <button id="sndT" class="${sound.enabled ? 'on' : ''}">${sound.enabled ? 'ON' : 'OFF'}</button></div>
      <div class="toggle-row">Turbo spins <button id="trbT" class="${turbo ? 'on' : ''}">${turbo ? 'ON' : 'OFF'}</button></div>
      <div class="toggle-row">Outcomes decided by <span>${backend.mode === 'server' ? 'game server' : 'in-browser engine (secure RNG)'}</span></div>
      <h3>Session</h3>
      <p>Playing for ${mins} min · ${spinsPlayed} spins · staked ${fmt(totalBet)} · won ${fmt(totalWon)}</p>
      <button class="btn" id="topUp">Reset demo credits</button>`;
  }
  openModal(`<h2>Lantern Summit</h2>${tabs}${body}<button class="btn ghost" id="mClose">Close</button>`);
  $('modalCard').querySelectorAll<HTMLButtonElement>('[data-tab]').forEach(b => b.onclick = () => menu(b.dataset.tab as 'rules'));
  $('mClose').onclick = closeModal;
  if (tab === 'settings') {
    $('sndT').onclick = () => { sound.enabled = !sound.enabled; refreshButtons(); menu('settings'); };
    $('trbT').onclick = () => { turbo = !turbo; refreshButtons(); menu('settings'); };
    $('topUp').onclick = async () => { const s = await backend.topUp(); setBalance(s.balance); toast('Demo credits reset'); closeModal(); };
  }
}

function autoMenu() {
  if (autoLeft > 0) { autoLeft = 0; refreshButtons(); return; }
  openModal(`<h2>Autoplay</h2><p class="sub">Stops when you tap the spin button's counter or run out of demo credits.</p>
    <div class="auto-grid">${[10, 25, 50, 100].map(n => `<button data-n="${n}">${n}</button>`).join('')}</div>
    <button class="btn ghost" id="aNo">Cancel</button>`);
  $('modalCard').querySelectorAll<HTMLButtonElement>('[data-n]').forEach(b => b.onclick = () => {
    closeModal();
    autoLeft = Number(b.dataset.n) - 1;
    refreshButtons();
    void doSpin();
  });
  $('aNo').onclick = closeModal;
}

// ------------------------------------------------------------------ wiring
$('spinBtn').addEventListener('click', () => {
  if (autoLeft > 0 && !busy) { autoLeft = 0; refreshButtons(); return; }
  if (autoLeft > 0 && busy) { autoLeft = 0; refreshButtons(); hurry = true; return; }
  void doSpin();
});
$('betDown').addEventListener('click', () => { if (betIdx > 0) { betIdx--; sound.click(); refreshButtons(); } });
$('betUp').addEventListener('click', () => { if (betIdx < BET_LEVELS.length - 1) { betIdx++; sound.click(); refreshButtons(); } });
$('turboBtn').addEventListener('click', () => { turbo = !turbo; sound.click(); refreshButtons(); });
$('autoBtn').addEventListener('click', () => { sound.unlock(); autoMenu(); });
$('menuBtn').addEventListener('click', () => { sound.unlock(); menu(); });
$('soundBtn').addEventListener('click', () => { sound.enabled = !sound.enabled; sound.click(); refreshButtons(); });
$('buyBtn').addEventListener('click', () => void doBuy());
window.addEventListener('keydown', e => {
  if (e.code === 'Space' && $('modal').classList.contains('hidden')) { e.preventDefault(); void doSpin(); }
});

// expose a tiny hook for automated UI tests
(window as unknown as { __ls: object }).__ls = { get busy() { return busy; }, get balance() { return balance; } };

async function start() {
  const s = await backend.init();
  setBalance(s.balance);
  setEmber(s.ember, s.emberCharged);
  refreshButtons();
  requestAnimationFrame(() => {
    layout();
    // a calm opening grid with no wins, just for show
    const demo: Grid = [
      [{ s: 8 }, { s: 3 }, { s: 0 }, { s: 5 }, { s: 1 }],
      [{ s: 2 }, { s: 10, m: 5 }, { s: 4 }, { s: 7 }, { s: 0 }],
      [{ s: 6 }, { s: 1 }, { s: 9 }, { s: 2 }, { s: 3 }],
      [{ s: 4 }, { s: 7 }, { s: 0 }, { s: 8 }, { s: 5 }],
      [{ s: 1 }, { s: 5 }, { s: 3 }, { s: 6 }, { s: 10, m: 25 }],
      [{ s: 0 }, { s: 2 }, { s: 8 }, { s: 4 }, { s: 6 }],
    ];
    void dropIn(demo);
  });
}
void start();
