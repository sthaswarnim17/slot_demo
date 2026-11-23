import './styles.css';
import { installSymbolDefs, symbolUse } from './symbols';
import { Sound } from './audio';
import { pickBackend, type Backend } from './backend';
import {
  BET_LEVELS, BUY_COST, CLIMB_OPTIONS, COLS, ROWS, EMBER_MAX, FEATURES, MAX_WIN, PAYTABLE, SYMBOL_NAMES, SYM, scatterPay,
} from '../engine/config';
import type { BaseSpinResult, Cell, FreeSpinResult, Grid, SpinSequence } from '../engine/engine';

// ------------------------------------------------------------------ setup
const $ = <T extends HTMLElement = HTMLElement>(id: string) => document.getElementById(id) as T;
const fmt = (n: number) => n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmtX = (n: number) => (Number.isInteger(n) ? String(n) : n.toFixed(2).replace(/0$/, ''));
/** Escapes text for the few places that still build HTML strings. */
const esc = (v: unknown) => String(v).replace(/[&<>"']/g, ch => `&#${ch.charCodeAt(0)};`);

const sound = new Sound();
const picked = pickBackend();
const backend: Backend = picked.backend;

const PEAK_SVG = (h: number) => `<svg class="peak" viewBox="0 0 64 48"><path d="M2 46 L${20 - h} ${30 - h * 2} L28 ${36 - h} L${38} ${22 - h * 3} L62 46Z" fill="#3b3f7a" stroke="#bfefff" stroke-width="1.5"/><path d="M${38} ${22 - h * 3} L${33} ${30 - h * 2} L${36} ${29 - h * 2} L${38} ${32 - h * 2} L${41} ${29 - h * 2} L${44} ${30 - h * 2}Z" fill="#fff"/></svg>`;

const SPIN_ICON = `<svg viewBox="0 0 48 48"><path d="M24 7a17 17 0 1 1-16.2 11.8" fill="none" stroke="#3a1404" stroke-width="5" stroke-linecap="round"/><path d="M4 10l4.5 10.5L19 16" fill="none" stroke="#3a1404" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
const SND_ON = `<svg viewBox="0 0 24 24"><path d="M4 9h4l5-4v14l-5-4H4z" fill="#fff"/><path d="M16 8.5a5 5 0 0 1 0 7M18.5 6a8.5 8.5 0 0 1 0 12" stroke="#fff" stroke-width="2" fill="none" stroke-linecap="round"/></svg>`;
const SND_OFF = `<svg viewBox="0 0 24 24"><path d="M4 9h4l5-4v14l-5-4H4z" fill="#fff" opacity=".6"/><path d="M16 9l6 6M22 9l-6 6" stroke="#fff" stroke-width="2" stroke-linecap="round"/></svg>`;
const FLAME = `<svg viewBox="0 0 24 24"><path d="M12 2c1 4 6 6 6 12a6 6 0 0 1-12 0c0-3 2-5 3-6 0 2 1 3 2 3 0-3-1-6 1-9z" fill="#ff8a2a" stroke="#ffcf6a" stroke-width="1.2"/></svg>`;

function mountainsSvg() {
  // three ranges with snow caps, a hilltop stupa and a prayer-flag line, all original vector art
  return `<svg class="mountains" viewBox="0 0 400 200" preserveAspectRatio="xMidYMax slice" aria-hidden="true">
    <defs>
      <linearGradient id="mFar" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#6a4a9a"/><stop offset="1" stop-color="#3a2a6a"/></linearGradient>
      <linearGradient id="mMid" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3b2a72"/><stop offset="1" stop-color="#1e1646"/></linearGradient>
      <linearGradient id="mNear" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1d1542"/><stop offset="1" stop-color="#0d0a26"/></linearGradient>
      <linearGradient id="mSnow" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffffff"/><stop offset="1" stop-color="#c9c4ff" stop-opacity=".2"/></linearGradient>
    </defs>
    <path d="M0 112 L30 96 L58 104 L92 70 L118 84 L150 44 L172 60 L196 30 L222 58 L246 48 L276 80 L306 62 L336 88 L366 64 L400 84 V200 H0Z" fill="url(#mFar)" opacity=".8"/>
    <path d="M150 44 L161 57 L155 56 L150 61 L145 55 L139 58Z M196 30 L208 45 L201 43 L196 49 L190 42 L185 45Z M246 48 L255 58 L249 57 L244 61 L240 56Z M366 64 L374 73 L369 72 L364 76 L360 71Z" fill="url(#mSnow)" opacity=".75"/>
    <path d="M0 146 L44 116 L84 130 L136 88 L168 106 L204 74 L246 108 L292 90 L340 120 L400 104 V200 H0Z" fill="url(#mMid)"/>
    <path d="M136 88 L147 100 L141 99 L136 104 L131 97 L125 101Z M204 74 L216 88 L209 86 L203 92 L197 84 L191 89Z M292 90 L301 99 L295 98 L290 102 L286 97Z" fill="url(#mSnow)" opacity=".55"/>
    <path d="M0 178 L52 152 L104 166 L150 150 L196 158 L240 140 L290 162 L344 146 L400 160 V200 H0Z" fill="url(#mNear)"/>
    <g fill="#0d0a26"><path d="M236 141 h8 v-3 h-8z"/><path d="M234 141 q6 -10 12 0z"/><rect x="239" y="128" width="2" height="5"/><path d="M237.5 131 h5 l-2.5 -4z"/></g>
    <path d="M240 128 Q262 134 286 150" stroke="#2a2255" stroke-width=".6" fill="none"/>
    ${[0, 1, 2, 3, 4, 5, 6, 7].map(i => { const x = 244 + i * 5.2, y = 129.6 + i * 2.4 + i * i * .1; return `<path d="M${x} ${y} l3 .6 l-.6 3.2 l-3 -.6z" fill="${['#3d7bd9', '#f4f4f4', '#d9473d', '#3dae5a', '#f2c230'][i % 5]}" opacity=".85"/>`; }).join('')}
  </svg>`;
}

const ORNAMENT = `<svg viewBox="0 0 26 26"><path d="M13 1 L25 13 L13 25 L1 13Z" fill="#e6a73c" stroke="#3a1806" stroke-width="1.5"/><path d="M13 6 L20 13 L13 20 L6 13Z" fill="#7d1e0c" stroke="#fff1b8" stroke-width="1"/><circle cx="13" cy="13" r="2.6" fill="#fff1b8"/></svg>`;

function flagsSvg() {
  const colors = ['#3d7bd9', '#f4f4f4', '#d9473d', '#3dae5a', '#f2c230'];
  const n = 15;
  let flags = '';
  for (let i = 0; i < n; i++) {
    const x = 6 + (i * 288) / (n - 1);
    const y = 4 + Math.sin((i / (n - 1)) * Math.PI) * 9;
    flags += `<path class="f" style="animation-delay:${(-i * 0.37).toFixed(2)}s" d="M${x - 7} ${y} L${x + 7} ${y + 1} L${x + 6} ${y + 14} L${x - 8} ${y + 13}Z" fill="${colors[i % 5]}" stroke="rgba(0,0,0,.35)" stroke-width=".6"/>`;
  }
  return `<svg viewBox="0 0 300 26" preserveAspectRatio="none" aria-hidden="true"><path d="M-2 3 Q150 26 302 3" stroke="#e6c08a" stroke-width="1" fill="none"/>${flags}</svg>`;
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
  <div class="sky"><div class="stars"></div><div class="stars s2"></div><div class="moon"></div><div class="aurora"></div>${mountainsSvg()}<div class="mist m1"></div><div class="mist m2"></div><div class="floaters">${floaters()}</div></div>
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
    <div class="board-area" id="boardArea"><div class="board-frame" id="frame"><div class="flags">${flagsSvg()}</div>${['tl', 'tr', 'bl', 'br'].map(k => `<span class="orn ${k}">${ORNAMENT}</span>`).join('')}<div class="board" id="board"></div><div class="board-fx" id="fx"></div></div></div>
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
  <div class="bigwin hidden" id="bigwin"><div class="rays"></div><div class="confettis" id="confetti"></div><div class="inner"><div class="halo"></div><div class="title" id="bwTitle">BIG WIN</div><div class="amount" id="bwAmount">0.00</div><div class="hint">TAP TO CONTINUE</div></div></div>
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
  return el.animate(kf, { duration: duration * s, delay: delay * s, easing, fill: 'both' }).finished.catch(() => undefined);
}

// ------------------------------------------------------------------ layout
function layout() {
  const area = $('boardArea');
  const availH = area.clientHeight - 30; // frame padding + flag garland
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
  d.innerHTML = symbolUse(s);
  if (s === SYM.LANTERN) {
    const tag = document.createElement('span');
    tag.className = 'mult';
    tag.textContent = `x${m ?? ''}`;
    d.appendChild(tag);
  }
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

// ------------------------------------------------------------------ reels
// A spin is shown in two halves so the outcome is never on screen before the reels stop:
//   startReels(): the old symbols kick up and drop away, and every column turns into a
//                 fast, motion-blurred strip of random filler symbols (purely cosmetic).
//   stop(grid):   once the result is known, columns stop left to right and the result
//                 symbols slide in from above with a small bounce.
const REEL_STEP_MS = 42; // ms per symbol while a reel runs at full speed
const LOOP_ROWS = 8; // length of the repeating filler pattern
const LAND_MS = 620;
const FILLER_POOL = [0, 0, 1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 8, SYM.SCATTER];

const ty = (rows: number) => `translateY(${rows * cell}px)`;

function ghostCell(s: number, row: number): HTMLDivElement {
  const d = document.createElement('div');
  d.className = 'cell ghost';
  d.innerHTML = symbolUse(s);
  d.style.transform = ty(row);
  return d;
}
const randomFiller = () => FILLER_POOL[Math.floor(Math.random() * FILLER_POOL.length)];

interface ReelSpin { stop(grid: Grid): Promise<void> }

function startReels(): ReelSpin {
  const t0 = performance.now();
  const L = LOOP_ROWS + ROWS;
  const old = elems;
  elems = [];
  currentGrid = null;
  $('frame').classList.add('spinning');
  const strips: HTMLDivElement[] = [];
  const running: Animation[][] = [];
  for (let c = 0; c < COLS; c++) {
    const strip = document.createElement('div');
    strip.className = 'strip';
    strip.style.left = c * cell + 'px';
    const pattern = Array.from({ length: LOOP_ROWS }, randomFiller);
    for (let i = 0; i < L; i++) strip.appendChild(ghostCell(pattern[i % LOOP_ROWS], i));
    (old[c] ?? []).forEach((el, r) => {
      el.getAnimations().forEach(a => a.cancel());
      el.classList.remove('hit', 'scat', 'lit');
      el.style.transform = ty(L + r);
      strip.appendChild(el);
    });
    board.appendChild(strip);
    strips.push(strip);
    const s = speed();
    // spin-up: a small lift, then accelerate down to full reel speed
    const up = strip.animate([{ transform: ty(-L) }, { transform: ty(-L + ROWS) }],
      { duration: 380 * s, delay: c * 55 * s, easing: 'cubic-bezier(.4,-0.3,.7,.45)', fill: 'both' });
    running.push([up]);
    up.finished.then(() => {
      if (!strip.isConnected) return;
      strip.classList.add('blur');
      running[c].push(strip.animate([{ transform: ty(-L + ROWS) }, { transform: ty(-L + ROWS + LOOP_ROWS) }],
        { duration: LOOP_ROWS * REEL_STEP_MS * Math.max(0.6, s), iterations: Infinity }));
    }).catch(() => undefined);
  }

  function landColumn(c: number, col: Cell[], tease: boolean): Promise<void> {
    running[c].forEach(a => a.cancel());
    strips[c].remove();
    const K = ROWS;
    // fillers that are on screen when the result arrives, plus one riding above the result
    const fill = document.createElement('div');
    fill.className = 'strip blur';
    fill.style.left = c * cell + 'px';
    for (let r = 0; r < ROWS; r++) fill.appendChild(ghostCell(randomFiller(), r));
    fill.appendChild(ghostCell(randomFiller(), -K - 1));
    board.appendChild(fill);
    const kf = (at: (d: number) => string): Keyframe[] => [
      { transform: at(-K), easing: 'cubic-bezier(.25,.6,.5,1)' },
      { transform: at(0.22), offset: 0.78, easing: 'cubic-bezier(.4,0,.5,1)' },
      { transform: at(0) },
    ];
    const dur = (tease ? LAND_MS * 1.5 : LAND_MS) * speed();
    const opts: KeyframeAnimationOptions = { duration: dur, fill: 'both' };
    const anims: Promise<unknown>[] = [fill.animate(kf(d => ty(K + d)), opts).finished];
    const cells: HTMLDivElement[] = [];
    col.forEach((cd, r) => {
      const el = makeCell(cd.s, cd.m);
      el.style.transform = pos(c, r);
      board.appendChild(el);
      cells.push(el);
      anims.push(el.animate(kf(d => pos(c, r + d)), opts).finished);
    });
    elems[c] = cells;
    setTimeout(() => {
      sound.land(c);
      cells.forEach(el => { if (el.dataset.s === String(SYM.SCATTER) || el.dataset.s === String(SYM.LANTERN)) el.classList.add('thud'); });
    }, dur * 0.72);
    return Promise.all(anims).catch(() => undefined).then(() => { fill.remove(); });
  }

  return {
    async stop(grid: Grid) {
      const minSpin = 520 * speed();
      const elapsed = performance.now() - t0;
      if (elapsed < minSpin) await new Promise(r => setTimeout(r, minSpin - elapsed));
      const landings: Promise<void>[] = [];
      let scatters = 0;
      for (let c = 0; c < COLS; c++) {
        const tease = scatters >= 3 && !hurry;
        if (tease) {
          $('frame').classList.add('tease');
          strips[c].classList.add('tease');
          sound.tease();
        }
        if (c > 0) await wait(tease ? 750 : 130);
        landings.push(landColumn(c, grid[c], tease));
        scatters += grid[c].filter(x => x.s === SYM.SCATTER).length;
      }
      await Promise.all(landings);
      $('frame').classList.remove('spinning', 'tease');
      currentGrid = grid;
    },
  };
}

// ------------------------------------------------------------------ board animation
function sparks(c: number, r: number, n = 5) {
  const cx = (c + 0.5) * cell, cy = (r + 0.5) * cell;
  const ring = document.createElement('div');
  ring.className = 'burst';
  ring.style.left = cx + 'px'; ring.style.top = cy + 'px';
  fx.appendChild(ring);
  anim(ring, [{ transform: 'scale(.3)', opacity: 1 }, { transform: 'scale(1.5)', opacity: 0 }], 420, 0, 'ease-out').then(() => ring.remove());
  for (let i = 0; i < n; i++) {
    const s = document.createElement('div');
    s.className = i % 2 ? 'spark star' : 'spark';
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
  b.textContent = title;
  if (sub) { const small = document.createElement('small'); small.textContent = sub; b.appendChild(small); }
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
    if (step.stepWin >= 5) { const f = $('frame'); f.classList.remove('shake'); void f.offsetWidth; f.classList.add('shake'); }
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

/** Falling coins and little lanterns behind the big-win counter (CSS animated, transform only). */
function fillConfetti(n: number) {
  let h = '';
  for (let i = 0; i < n; i++) {
    const lantern = i % 3 === 0;
    const size = lantern ? 22 + Math.random() * 16 : 12 + Math.random() * 10;
    const style = `left:${(Math.random() * 100).toFixed(1)}%;width:${size.toFixed(0)}px;height:${size.toFixed(0)}px;--d:${(2.2 + Math.random() * 2.4).toFixed(2)}s;--delay:${(-Math.random() * 4).toFixed(2)}s;--x:${((Math.random() - .5) * 120).toFixed(0)}px;--r:${((Math.random() - .5) * 720).toFixed(0)}deg`;
    h += lantern ? `<div class="confetti" style="${style}">${symbolUse(SYM.LANTERN)}</div>` : `<div class="confetti coin" style="${style}"></div>`;
  }
  $('confetti').innerHTML = h;
}

function showBigWin(amount: number, xBet: number): Promise<void> {
  const tier = bigWinTier(xBet);
  if (!tier) return Promise.resolve();
  return new Promise(res => {
    const box = $('bigwin');
    $('bwTitle').textContent = tier;
    $('bwTitle').className = 'title ' + (xBet >= 100 ? 'tier-3' : xBet >= 50 ? 'tier-2' : '');
    fillConfetti(xBet >= 100 ? 34 : xBet >= 50 ? 26 : 18);
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
    const close = () => { if (done) return; done = true; box.classList.add('hidden'); $('confetti').innerHTML = ''; box.removeEventListener('click', close); res(); };
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
  const prevGrid = currentGrid;
  const reels = startReels();
  setBalance(balance - bet()); // show the stake leaving; real balance arrives after animation
  let res: BaseSpinResult;
  try {
    res = await backend.spin(bet());
  } catch (e) {
    if (prevGrid) await reels.stop(prevGrid);
    setBalance(balance + bet());
    busy = false; refreshButtons(); toast((e as Error).message); return;
  }
  spinsPlayed++; totalBet += bet();
  await reels.stop(res.seq.grid);
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
  let fs = await withRetry(() => backend.chooseClimb(option));
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
    const prevGrid = currentGrid;
    const reels = startReels();
    let r: FreeSpinResult;
    try {
      r = await withRetry(() => backend.freeSpin());
    } catch (e) {
      if (prevGrid) void reels.stop(prevGrid);
      throw e;
    }
    last = r;
    setFs(r.remaining + 1, r.multBefore, r.roundTotal - triggerWin - r.win);
    $('fsLeft').textContent = String(r.remaining - (r.retriggered ? 5 : 0));
    setWin(0);
    setLine(`Free spin ${r.played}`);
    await reels.stop(r.seq.grid);
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

/**
 * Retries a feature call a few times (e.g. a dropped connection in server mode) so a free-spin
 * round is not silently abandoned. After that it stops and tells the player to reload; the
 * server keeps the round, so nothing is lost.
 */
async function withRetry<T>(fn: () => Promise<T>, tries = 3): Promise<T> {
  for (let i = 1; ; i++) {
    try { return await fn(); } catch (e) {
      if (i >= tries) {
        autoLeft = 0;
        openModal(`<h2>Connection problem</h2><p class="sub">${esc((e as Error).message)}. Reload the page to continue.</p>`, false);
        throw e;
      }
      toast(`${(e as Error).message}. Retrying...`);
      await new Promise(r => setTimeout(r, 1000 * i));
    }
  }
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
      ? `<table class="hist"><tr><th>TIME</th><th>TYPE</th><th>BET</th><th>WIN</th><th></th></tr>${history.slice(0, 50).map(h => `<tr><td>${h.t.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</td><td>${esc(h.kind)}</td><td>${h.bet ? fmt(h.bet) : '-'}</td><td class="w">${fmt(h.win)}</td><td>${esc(h.note)}</td></tr>`).join('')}</table>`
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
    $('topUp').onclick = async () => {
      if (busy || document.body.classList.contains('fs-mode')) { toast('Finish the current spin first'); return; }
      try { const s = await backend.topUp(); setBalance(s.balance); toast('Demo credits reset'); closeModal(); }
      catch (e) { toast((e as Error).message); }
    };
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

// expose a tiny read-only hook for automated UI tests (dev builds only)
if (import.meta.env.DEV) {
  (window as unknown as { __ls: object }).__ls = { get busy() { return busy; }, get balance() { return balance; } };
}

async function start() {
  if (picked.rejectedServer) toast('That game server is not allowed. Playing the built-in demo instead.', 4000);
  let s;
  try {
    s = await backend.init();
  } catch (e) {
    openModal(`<h2>Game unavailable</h2><p class="sub">${esc((e as Error).message)}. Reload the page to try again.</p>`, false);
    return;
  }
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
    void startReels().stop(demo);
  });
}
void start();
